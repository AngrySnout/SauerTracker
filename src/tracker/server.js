/* eslint-disable no-buffer-constructor */
import dgram from 'dgram';
import _ from 'lodash';
import geoip from 'geoip-lite';
import countries from 'i18n-iso-countries';
import moment from 'moment';

import config from '../../tracker.json';

import { isValidIP, isValidPort, log, debug, round2 } from '../util/util';
import { getGameMode, getMasterMode } from '../util/protocol';
import Packet, { filterString, cube2colorHTML } from '../util/packet';
import Game from './game';
import playerManager from '../tracker/player-manager';
import metrics from '../util/metrics';

const typeBuffers = [
	new Buffer('8001', 'hex'),
	new Buffer('0001ff', 'hex'), // EXT_PLAYERSTATS -1
	new Buffer('0002', 'hex'), // EXT_TEAMSCORE
];

export default class Server {
	constructor(host, port, info) {
		if (!isValidIP(host)) throw new Error(`Invalid host ${host} provided to Server().`);
		port = parseInt(port, 10);
		if (!isValidPort(port)) throw new Error(`Invalid port ${port} provided to Server().`);

		this.host = host;
		this.port = port;
		this.lastReply = new Date().getTime() - 1;
		this.lastPoll = 0;
		this.lastExtInfoPoll = 0;
		this.game = new Game(this);
		this.info = {};

		const gipl = geoip.lookup(this.host);
		this.country = gipl ? gipl.country : '';
		this.countryName = gipl ? countries.getName(this.country, 'en') : 'Unknown';

		if (info) {
			this.info.website = info.website;
			this.info.demourl = info.demourl;
			this.info.banned = info.banned;
		}
	}

	setInfo(key, value) {
		this.info[key] = value;
	}

	poll(type, time) {
		const self = this;
		let socket = dgram.createSocket('udp4');
		if (type === 0) metrics.polled(this.host, this.port);
		try {
			const buf = typeBuffers[type || 0];

			socket.on('message', (data) => {
				self.parseReply(data, type, time);
			});

			socket.on('error', () => {
				socket.close();
				socket = null;
			});

			socket.send(buf, 0, buf.length, this.port + 1, this.host);

			setTimeout(() => {
				if (socket !== null) {
					socket.close();
					socket = null;
				}
			}, 2000);
		} catch (err) {
			debug(`Error: Server query failed with uncaught error: ${err}`);
			debug(err.stack);
			if (socket !== null) {
				socket.close();
				socket = null;
			}
		}
	}

	// eslint-disable-next-line consistent-return
	shouldPoll(type, time) {
		// eslint-disable-next-line default-case
		switch (type) {
		case 'ping': {
			return (time - this.lastPoll > config.tracker.pingInterval * 1000 || this.shouldPoll('extInfo', time));
		}
		case 'extInfo': {
			return ((time - this.lastExtInfoPoll > config.tracker.extInfoPingInterval * 1000 && this.game.clients > 0) || this.shouldPoll('endGame', time));
		}
		case 'endGame': {
			return (!this.info.banned && this.game.timeLeft < 5
					&& !this.game.paused
					&& time - this.lastPoll > config.tracker.endGamePingInterval * 1000
					&& this.game.clients > 0);
		}
		}
	}

	tryPoll(time) {
		const pollExtInfo = this.shouldPoll('extInfo', time);

		if (this.shouldPoll('ping', time)) {
			this.lastPoll = time;
			this.poll(0, time);
		}

		if (this.game.saved || this.game.clients === 0) return;

		if (pollExtInfo) {
			this.lastExtInfoPoll = time;
			this.poll(1, time);
			this.poll(2, time);
		}

		if (!this.info.banned &&
				this.game.timeLeft <= 0 &&
				!this.game.intermission &&
				this.game.gameMode !== 'coop_edit' &&
				_.countBy(this.game.players, pl => pl.state !== 5).true > 1) {
			this.game.intermission = true;
			const self = this;
			setTimeout(() => {
				if (self.game.timeLeft > 0) self.game.intermission = false;
				else self.game.save();
			}, 1500);
		}
	}

	shouldClean(time) {
		// only keep the server if it had replied in the last 2 minutes
		return (time - this.lastReply > 120000);
	}

	parseReply(data, type, time) {
		try {
			const st = new Packet(data, (type === 1) ? 3 : 2);

			// eslint-disable-next-line default-case
			switch (type) {
			case 0: { // game info
				metrics.replied(this.host, this.port);
				if (st.remaining() < 5) return;

				this.game.clients = st.getInt();
				if (this.game.clients === 0 || !this.game.players) {
					this.game.players = {};
				}

				const nattr = st.getInt();
				const gameVersion = st.getInt();

				if (gameVersion !== 259) {
					this.game.clients = -1;
					return;
				}

				this.lastReply = time;

				this.game.gameMode = getGameMode(st.getInt());
				this.game.timeLeft = st.getInt();
				if (this.game.gameMode === 'coop_edit' && this.game.timeLeft <= 0) this.game.timeLeftS = '';
				else if (this.game.timeLeft <= 0) this.game.timeLeftS = 'intermission';
				else this.game.timeLeftS = `${_.padStart(Math.floor(this.game.timeLeft / 60), 2, '0')}:${_.padStart(this.game.timeLeft % 60, 2, '0')}`;
				this.game.maxClients = st.getInt();
				this.game.masterMode = getMasterMode(st.getInt());

				if (nattr === 7) {
					this.game.paused = st.getInt();
					this.game.gameSpeed = st.getInt();
				} else {
					this.game.paused = 0;
					this.game.gameSpeed = 100;
				}

				this.game.mapName = st.getString() || '[new map]';
				if (this.game.mapName.length > 20) this.game.mapName = `${this.game.mapName.slice(0, 20)}...`;

				const description = st.getString();
				this.description = filterString(description);
				this.descriptionStyled = cube2colorHTML(description);

				if (this.game.timeLeft > 0) {
					this.game.intermission = false;
					this.game.saved = false;
				}
				break;
			}
			case 1: { // player extinfo
				if (st.remaining() <= 3) return;

				const ack = st.getInt();
				const ver = st.getInt();
				const iserr = st.getInt();
				if (ack !== -1 || ver !== 105 || iserr !== 0) return;

				const respType = st.getInt();

				if (respType === -11) { // EXT_PLAYERSTATS_RESP_STATS
					const player = {};
					player.cn = st.getInt();
					player.ping = st.getInt();
					player.name = st.getString();
					if (player.name.length > 15) {
						log(`Warning: player name longer than 15 characters. Truncating. name: ${player.name} server: ${this.host} ${this.port}`);
						player.name = player.name.substring(0, 15);
					}
					if (!player.name) player.name = 'unnamed';
					player.team = st.getString();
					if (player.team.length > 4) {
						log(`Warning: team name longer than 4 characters. Truncating. name: ${player.team} server: ${this.host} ${this.port}`);
						player.team = player.team.substring(0, 15);
					}
					player.frags = st.getInt();
					player.flags = st.getInt();
					player.deaths = st.getInt();
					player.kpd = round2(player.frags / Math.max(player.deaths, 1));
					player.tks = st.getInt();
					player.acc = st.getInt();
					st.getInt(); st.getInt(); st.getInt();
					player.privilege = st.getInt();
					player.state = st.getInt();

					if (player.name.toLowerCase() === 'zombie' && player.cn >= 128) {
						this.game.zombie = true;
					}

					const ipbuf = new Buffer(4);
					st.buffer.copy(ipbuf, 0, st.offset, st.offset + 3);
					ipbuf[3] = 0;
					const ip = ipbuf.readUInt32BE(0);
					player.ip = geoip.pretty(ip);
					const gipl = geoip.lookup(ip);

					// work-around for spaghettimod falsely giving US player's an IP from Singapore
					if (gipl) {
						player.country = (player.ip === '220.232.59.0') ? 'US' : gipl.country;
					} else {
						player.country = '';
					}
					player.countryName = gipl ? countries.getName(player.country, 'en') : 'Unknown';

					const oldPlayer = this.game.players[player.cn];
					this.game.players[player.cn] = player;

					// save player info and stats
					const curtime = moment().format('YYYY-MM-DD HH:mm:ss');
					if (oldPlayer && oldPlayer.name === player.name && oldPlayer.ip === player.ip) {
						playerManager.updatePlayer(this, player, oldPlayer, curtime);
					}
				} else if (respType === -10) { // EXT_PLAYERSTATS_RESP_IDS
					const newCNs = [];
					while (st.remaining() > 0) newCNs.push(st.getInt());

					const oldCNs = _.pullAll(_.map(_.keys(this.game.players), Number), newCNs);
					_.each(oldCNs, (cn) => { delete this.game.players[cn]; });
				}

				break;
			}
			case 2: { // game scores
				if (st.remaining() <= 3) return;

				const ack = st.getInt();
				const ver = st.getInt();
				const iserr = st.getInt();
				if (ack !== -1 || ver !== 105 || iserr !== 0) return;

				st.getInt(); st.getInt();
				this.game.teams = {};

				while (st.remaining() > 0) {
					let name = st.getString();
					if (name.length > 4) {
						log(`Warning: team name longer than 4 characters. Truncating. name: ${name} server: ${this.host} ${this.port}`);
						name = name.substring(0, 15);
					}
					const score = st.getInt();
					const bases = st.getInt();
					for (let i = 0; i < bases; i++) st.getInt();
					this.game.teams[name] = score;
				}
				break;
			}
			}
		} catch (err) {
			debug(`Error: Server response parsing failed: ${err} ${this.description} ${this.host} ${this.port} ${type} ${data}`);
			debug(err.stack);
		}
	}

	serialize(withPlayers) {
		const ret = {
			lastSeen: this.lastSeen,
			descriptionStyled: this.descriptionStyled,
			description: this.description,
			clients: this.game.clients,
			maxClients: this.game.maxClients,
			gameMode: this.game.gameMode,
			mapName: this.game.mapName,
			masterMode: this.game.masterMode,
			isFull: (this.game.clients >= this.game.maxClients),
			country: this.country,
			countryName: this.countryName,
			host: this.host,
			port: this.port,
			timeLeft: this.game.timeLeft,
			timeLeftS: this.game.timeLeftS,
		};

		if (withPlayers && this.game.players && _.keys(this.game.players).length) {
			ret.players = _.map(this.game.players, pl => pl.name);
		}
		return ret;
	}
}
