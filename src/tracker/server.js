var dgram = require('dgram');
var _ = require('lodash');
var geoip = require('geoip-lite');
var countries = require("i18n-iso-countries");
var moment = require('moment');

var protocol = require('../util/protocol');
var stream = require('../util/stream');
import Game from './game';
var util = require('../util/util');
var player_ = require('./player');
var config = require('../../tracker.json');
var db = require('../util/database');
var metrics = require('../util/metrics');

var typeBuffers = [];
{
	let st = new Buffer(2);
	st.writeUInt8(0x80, 0);
	st.writeUInt8(0x01, 1);
	typeBuffers.push(st);

	st = new stream.Stream(new Buffer(10));
	st.putInt(0);
	st.putInt(1);
	st.putInt(-1);
	typeBuffers.push(st.finalize());

	st = new stream.Stream(new Buffer(10));
	st.putInt(0);
	st.putInt(2);
	typeBuffers.push(st.finalize());
}

export default class Server {
	constructor(host, port, fromDB, info, keep) {
		if (!util.isValidIP(host)) throw new Error("Invalid host ("+host+") provided to Server().");
		port = parseInt(port);
		if (!util.isValidPort(port)) throw new Error("Invalid port ("+port+") provided to Server().");

		this.host = host;
		this.port = port;
		this.lastReply = new Date().getTime()-1;
		this.lastPoll = 0;
		this.lastExtInfoPoll = 0;
		this.game = new Game(this);
		this.info = {};

		let gipl = geoip.lookup(this.host);
		this.country = gipl? gipl.country: "";
		this.countryName = gipl? countries.getName(this.country, "en"): "Unknown";

		if (info) {
			this.info.website = info.website;
			this.info.demourl = info.demourl;
			this.info.banned = info.banned;
			this.info.keep = info.keep;
		}

		if (!fromDB) db.servers.add(host, port, keep);
	}

	setInfo(key, value) {
		try {
			db.servers.setInfo(this.host, this.port, key, value);
			this.info[key] = value;
		} catch(e) { throw e; }
	}

	poll(type, time) {
		var self = this;
		var socket = dgram.createSocket('udp4');
		if (type === 0) metrics.polled(this.host, this.port);
		try {
			let buf = typeBuffers[type||0];

			socket.on('message', function (data) {
				self.parseReply(data, type, time);
			});

			socket.on('error', function (err) {
				socket.close();
				socket = null;
			});

			socket.send(buf, 0, buf.length, this.port+1, this.host);

			setTimeout(function() {
				if (socket !== null) {
					socket.close();
					socket = null;
				}
			}, 2000);
		} catch(err) {
			util.debug('Error: Server query failed with uncaught error: ', err);
			util.debug(err.stack);
			if (socket !== null) {
				socket.close();
				socket = null;
			}
		}
	}

	shouldPoll(type, time) {
		switch (type) {
			case "ping": {
				return (time-this.lastPoll > config.pollingInterval*1000 || this.shouldPoll("extInfo", time));
			}
			case "extInfo": {
				return ((time-this.lastExtInfoPoll > config.extInfoPollingInt*1000 && this.game.clients > 0) || this.shouldPoll("endGame", time));
			}
			case "endGame": {
				return (!this.info.banned && this.game.timeLeft < 5 && !this.game.paused && time-this.lastPoll > config.endGamePollingInt*1000 && this.game.clients > 0);
			}
		}
	}

	tryPoll(time) {
		let pollExtInfo = this.shouldPoll("extInfo", time);

		if (this.shouldPoll("ping", time)) {
			this.lastPoll = time;
			this.poll(0, time);
		}

		if (this.game.saved || this.game.clients === 0) return;

		if (pollExtInfo) {
			this.lastExtInfoPoll = time;
			this.poll(1, time);
			this.poll(2, time);
		}

		if (!this.info.banned && this.game.timeLeft <= 0 && !this.game.intermission && this.game.gameMode != "coop" && _.countBy(this.game.players, pl => pl.state!=5)[true] > 1) {
			this.game.intermission = true;
			let self = this;
			setTimeout(function () {
				if (self.game.timeLeft > 0) self.game.intermission = false;
				else self.game.save();
			}, 1500);
		}
	}

	shouldClean(time) {
		// only keep the server if it had replied in the last 2 minutes or if it's sticky
		return (time-this.lastReply>120000 && !this.keep);
	}

	parseReply(data, type, time) {
		try {
			let st = new stream.Stream(data, (type==1)? 3: 2);

			switch (type) {
				case 0: { // game info
					metrics.replied(this.host, this.port);
					if (st.remaining() < 5) return;

					let date = new Date();
					this.game.clients = st.getInt();
					if (this.game.clients === 0 || !this.game.players) {
						this.game.players = {};
					}

					let nattr = st.getInt();
					let gameVersion = st.getInt();

					if (gameVersion != 259) {
						this.game.clients = -1;
						return;
					}

					this.lastReply = time;

					this.game.gameMode = protocol.getGameMode(st.getInt());
					this.game.timeLeft = st.getInt();
					if (this.game.gameMode == "coop" && this.game.timeLeft <= 0) this.game.timeLeftS = "";
					else if (this.game.timeLeft <= 0) this.game.timeLeftS = "intermission";
					else this.game.timeLeftS = _.padStart(Math.floor(this.game.timeLeft/60), 2, "0")+":"+_.padStart(this.game.timeLeft%60, 2, "0");
					this.game.maxClients = st.getInt();
					this.game.masterMode = protocol.getMasterMode(st.getInt());

					if (nattr == 7) {
						this.game.paused = st.getInt();
						this.game.gameSpeed = st.getInt();
					} else {
						this.game.paused = 0;
						this.game.gameSpeed = 100;
					}

					this.game.mapName = st.getString()||"[new map]";
					if (this.game.mapName.length > 20) this.game.mapName = this.game.mapName.slice(0, 20)+"...";

					let description = st.getString();
					this.description = stream.filterString(description);
					this.descriptionStyled = stream.cube2colorHTML(description);

					if (this.game.timeLeft > 0) {
						this.game.intermission = false;
						this.game.saved = false;
					}
					break;
				}
				case 1: { // player extinfo
					if (st.remaining() <= 3) return;

					let ack = st.getInt();
					let ver = st.getInt();
					let iserr = st.getInt();
					if (ack != -1 || ver != 105 || iserr !== 0) return;

					let respType = st.getInt();

					if (respType == -11) { // EXT_PLAYERSTATS_RESP_STATS
						let player = {};
						player.cn = st.getInt();
						player.ping = st.getInt();
						player.name = st.getString();
						if (player.name.length > 15) {
							console.log("Warning: player name longer than 15 characters. Truncating. name:", player.name, "server:", this.host, this.port);
							player.name = player.name.substring(0, 15);
						}
						player.team = st.getString();
						if (player.team.length > 4) {
							console.log("Warning: team name longer than 4 characters. Truncating. name:", player.team, "server:", this.host, this.port);
							player.team = player.team.substring(0, 15);
						}
						player.frags = st.getInt();
						player.flags = st.getInt();
						player.deaths = st.getInt();
						player.kpd = util.round2(player.frags/Math.max(player.deaths, 1));
						player.tks = st.getInt();
						player.acc = st.getInt();
						st.getInt(); st.getInt(); st.getInt();
						player.privilege = st.getInt();
						player.state = st.getInt();

						if (player.name.toLowerCase() == "zombie" && player.cn >= 128) {
							this.game.zombie = true;
						}

						let ipbuf = new Buffer(4);
						st.buffer.copy(ipbuf, 0, st.offset, st.offset+3);
						ipbuf[3] = 0;
						let ip = ipbuf.readUInt32BE(0);
						player.ip = geoip.pretty(ip);
						let gipl = geoip.lookup(ip);

						// work around for pisto's servers falsely giving US player's an IP from Singapore
						player.country = gipl? ((player.ip == "220.232.59.0")? "US": gipl.country): "";
						player.countryName = gipl? countries.getName(player.country, "en"): "Unknown";

						let oldPlayer = this.game.players[player.cn];
						this.game.players[player.cn] = player;

						// save player info and stats
						let curtime = moment().format("YYYY-MM-DD HH:mm:ss");
						if (oldPlayer && oldPlayer.name == player.name && oldPlayer.ip == player.ip) {
							player_.updatePlayer(this, player, oldPlayer, curtime);
						}
					} else if (respType == -10) { // EXT_PLAYERSTATS_RESP_IDS
						let newCNs = [];
						while (st.remaining() > 0) newCNs.push(st.getInt());

						let oldCNs = _.pullAll(_.map(_.keys(this.game.players), Number), newCNs);
						_.each(oldCNs, cn => { delete this.game.players[cn]; });
					}

					break;
				}
				case 2: { // game scores
					if (st.remaining() <= 3) return;

					let ack = st.getInt();
					let ver = st.getInt();
					let iserr = st.getInt();
					if (ack != -1 || ver != 105 || iserr !== 0) return;

					st.getInt(); st.getInt();
					this.game.teams = {};

					while (st.remaining() > 0) {
						let name = st.getString();
						if (name.length > 4) {
							console.log("Warning: team name longer than 4 characters. Truncating. name:", name, "server:", this.host, this.port);
							name = name.substring(0, 15);
						}
						let score = st.getInt();
						let bases = st.getInt();
						for (let i = 0; i < bases; i++) st.getInt();
						this.game.teams[name] = score;
					}
					break;
				}
			}
		} catch(err) {
			util.debug('Error: Server response parsing failed:', err, this.description, this.host, this.port, type, data);
			util.debug(err.stack);
		}
	}

	serialize(withPlayers) {
		let ret = {
			lastSeen: this.lastSeen,
			descriptionStyled: this.descriptionStyled,
			description: this.description,
			clients: this.game.clients,
			maxClients: this.game.maxClients,
			gameMode: this.game.gameMode,
			mapName: this.game.mapName,
			masterMode: this.game.masterMode,
			isFull: (this.game.clients == this.game.maxClients),
			country: this.country,
			countryName: this.countryName,
			host: this.host,
			port: this.port,
			timeLeft: this.game.timeLeft,
			timeLeftS: this.game.timeLeftS
		};
		// TODO: replace _.keys(...).length with something faster
		if (withPlayers && this.game.players && _.keys(this.game.players).length) {
			ret.players = _.map(this.game.players, pl => pl.name);
		}
		return ret;
	}

	dispose(permanently, noKeep) {
		if (permanently) db.servers.remove(this.host, this.port, noKeep);
	}
}
