var _ = require('lodash');
var moment = require('moment');
var util_ = require('util');
var Promise = require('bluebird');

var util = require('../util/util');
var servers = require('./server-list');
var config = require('../../tracker.json');
var vars = require('../../vars.json');
var db = require('../util/database');

export var players = {};
export var bans = {};
export var banNames = {};

class Player {
	constructor(name) {
		this.name = name;
		this.ips = {};
		this.modes = {};
	}

	updateState(server, newState, oldState, curTime) {
		this.ips[newState.ip] = { lastSeen: curTime, onServer: server };
		this.lastSeen = curTime;
		this.ip = newState.ip;

		if (server.game.zombie || newState.cn >= 128 || banNames[this.name] || bans[newState.ip] || server.game.gameMode == 'coop' || server.banned || newState.banned) return;

		let modetype = "any";
		if (vars.gameModes[server.game.gameMode]) {
			if (vars.gameModes[server.game.gameMode].efficMode) modetype = "effic";
			else if (vars.gameModes[server.game.gameMode].instaMode) modetype = "insta";
		}

		if (!this.modes[modetype]) this.modes[modetype] = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };

		if (newState.frags > 0)
		{
			let newfrags = Math.max(newState.frags-oldState.frags, 0);
			this.modes[modetype].acc = ((this.modes[modetype].acc * this.modes[modetype].frags) + (newState.acc * newfrags)) / Math.max(this.modes[modetype].frags + newfrags, 1);
			this.modes[modetype].frags += newfrags;
		}
		this.modes[modetype].flags += Math.max(newState.flags-oldState.flags, 0);
		this.modes[modetype].deaths += Math.max(newState.deaths-oldState.deaths, 0);
		this.modes[modetype].tks += Math.max(newState.tks-oldState.tks, 0);

		if (!this.country || this.countryName == "Unknown") {
			this.country = newState.country;
			this.countryName = newState.countryName;
		}
	}

	saveSpy() {
		let self = this;
		return _.map(this.ips, function (info, ip) {
			return db.db("spy").where({ name: self.name, ip: ip }).then(rows => {
				if (!rows.length) return db.db("spy").insert({ name: self.name, ip: self.ip, country: self.country, lastseen: info.lastSeen, lshost: info.onServer.host, lsport: info.onServer.port }).then();
				else return db.db("spy").where({ name: self.name, ip: ip }).update({ country: self.country, lastseen: info.lastSeen, lshost: info.onServer.host, lsport: info.onServer.port }).then();
			});
		});
	}

	sumStats() {
		let self = this;
		let res = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };
		_.each(_.keys(this.modes), function (key) {
			if (res.frags + self.modes[key].frags !== 0) res.acc = ((res.acc * res.frags) + (self.modes[key].acc * self.modes[key].frags)) / (res.frags + self.modes[key].frags);
			res.frags += self.modes[key].frags;
			res.flags += self.modes[key].flags;
			res.deaths += self.modes[key].deaths;
			res.tks += self.modes[key].tks;
		});
		return res;
	}

	getModeStats(mode) {
		if (!this.modes[mode]) return;
		return [this.modes[mode].frags, this.modes[mode].flags, this.modes[mode].deaths, this.modes[mode].tks, util.round2(this.modes[mode].frags/Math.max(this.modes[mode].deaths, 1)), this.modes[mode].acc];
	}

	saveStats(row, trx) {
		row = row||{};

		let newStats = this.sumStats();
		let stats = {	name: row.name||this.name,
						frags: row.frags||0,
						flags: row.flags||0,
						deaths: row.deaths||0,
						tks: row.tks||0,
						kpd: 0,
						acc: row.acc||0,
						elo: row.elo||config.baseElo,
						country: row.country||"",
						countryName: row.countryName||"Unknown",
					 	instastats: row.instastats||"[0,0,0,0,0,0]",
					 	efficstats: row.efficstats||"[0,0,0,0,0,0]" };

		// accuracy must be done first
		if (newStats.frags+stats.frags === 0) stats.acc = 0;
		else stats.acc = util.round2(((newStats.frags*newStats.acc)+(stats.frags*stats.acc))/(newStats.frags+stats.frags));
		stats.frags += newStats.frags;
		stats.flags += newStats.flags;
		stats.deaths += newStats.deaths;
		stats.tks += newStats.tks;
		// and kpd last
		stats.kpd = util.round2(stats.frags/Math.max(stats.deaths, 1));

		if (this.country && this.countryName != "Unknwon") {
			stats.country = this.country;
			stats.countryName = this.countryName;
		}

		function calcModeStats(self, mode) {
			let newModeStats = self.getModeStats(mode);
			let modeStats = JSON.parse(mode==="insta"? stats.instastats: stats.efficstats);
			if (modeStats[0]+newModeStats[0] === 0) modeStats[5] = 0;
			else modeStats[5] = util.round2((modeStats[0]*modeStats[5]+newModeStats[0]*newModeStats[5])/(modeStats[0]+newModeStats[0]));
			modeStats[0] += newModeStats[0]; //frags
			modeStats[1] += newModeStats[1]; //flags
			modeStats[2] += newModeStats[2]; //deaths
			modeStats[3] += newModeStats[3]; //tks
			modeStats[4] = util.round2(modeStats[0]/Math.max(modeStats[2], 1)); //kpd
			return modeStats;
		}

		if (this.modes.insta) stats.instastats = JSON.stringify(calcModeStats(this, "insta"));
		if (this.modes.effic) stats.efficstats = JSON.stringify(calcModeStats(this, "effic"));

		if (row.name) return db.db("players").where("name", this.name).update(stats).transacting(trx).then();
		else return db.db("players").insert(stats).transacting(trx).then();
	}
}

export function updatePlayer(server, newState, oldState, curTime) {
	let name = newState.name;
	if (!players[name]) players[name] = new Player(name);
	players[name].updateState(server, newState, oldState, curTime);
}

export function flushplayers() {
	return db.db("players").whereIn("name", _.map(players, "name")).then(rows => {
		rows = _.keyBy(rows, "name");
		return db.db.transaction(function(trx) {
			let promises = [];
			_.each(players, player => {
				promises.push(player.saveStats(rows[player.name], trx));
				promises.push(player.saveSpy());
			});
			players = {};
			return Promise.all(promises).finally(trx.commit);
		}).then();
	}).then(() => {
		util.debug("Players flushed");
	}).catch(util.error);
}

export function start() {
	setInterval(flushplayers, config.savePlayersInt*1000);
}

export function isOnline(name) {
	return !!players[name];
}

// Query functions, accessed via IRC

export function nameIPs(name, callback) {
	let ips = [];
	if (players[name] && players[name].ips) ips = _.keys(players[name].ips);
	db.db("spy").where({ name: name }).select("ip").orderBy("lastseen", "desc").limit(5).then(rows => {
		ips = _.filter(_.union(ips, _.map(rows, "ip")), function (ip) { return ip != "0.0.0.0"; });
		if (ips.length) callback("Most recent IP(s) for \x02\x0303" + name + "\x0F are: \x02\x0302" + _.reduce(ips.slice(0, 5), function (memo, ip) { return memo + "\x0F, \x02\x0302" + ip; }));
		else callback("No IPs found for \x02\x0303" + name);
	});
}

export function ipNames(ip, callback) {
	if (!ip) return;
	ip = util.ipRepLB(ip, "0");
	let names = _.filter(_.map(_.reject(players, function (pl) { return _.isUndefined(pl.ips[ip]); }), "name"), function (name) { return name; });
	db.db("spy").where({ ip: ip }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
		names = _.union(names, _.map(rows, "name"));
		if (names.length) callback("Most recent name(s) for \x02\x0302" + ip + "\x0F are: \x02\x0303" + _.reduce(names.slice(0, 5), function (memo, name) { return memo + "\x0F, \x02\x0303" + name; }));
		else callback("No names found for \x02\x0302" + ip);
	});
}

export function ipNamesL(ip, callback) {
	if (!ip) return;
	ip = util.ipRepLB(ip, "0");
	let names = _.filter(_.map(_.reject(players, function (pl) { return _.isUndefined(pl.ips[ip]); }), "name"), function (name) { return name; });
	db.db("spy").where({ ip: ip }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
		names = _.union(names, _.map(rows, "name"));
		callback(names);
	});
}

// TODO: use the names in memory
export function namesFor(str, callback) {
	let name = str.toLowerCase();
	db.db("spy").where("name", "ilike", "%"+name+"%").whereNot({ ip: "0.0.0.0" }).select("ip").orderBy("lastseen", "desc").limit(1).then(iprows => {
		if (iprows.length) {
			db.db("spy").where({ ip: iprows[0].ip }).select("name").orderBy("lastseen", "desc").limit(10).then(rows => {
				let names = _.map(rows, "name");
				callback("Most recent name(s) for \x02\x0303" + str + "\x0F are: \x02\x0302" + _.reduce(names, function (memo, name) { return memo + "\x0F, \x02\x0302" + name; }));
			});
		} else callback("No names found for \x02\x0303" + name);
	});
}

export function findName(str, callback) {
	let strLC = str.toLowerCase();
	let names = _.filter(_.keys(players), function (name) { return (name.toLowerCase().indexOf(strLC) != -1); });
	db.db("spy").where("name", "ilike", "%"+str+"%").whereNot({ ip: "0.0.0.0" }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
		names = _.union(names, _.map(rows, "name"));
		if (names.length) callback("Most recent name(s) containing \x02\x0303" + str + "\x0F are: \x02\x0302" + _.reduce(names.slice(0, 5), function (memo, name) { return memo + "\x0F, \x02\x0302" + name; }));
		else callback("No names found with \x02\x0302" + str);
	});
}

export function lastSeen(name, callback) {
	function returnCB(pl) {
		var res = "\x02\x0303" + name + "\x0F was last seen \x02" + moment(pl.lastSeen||pl.lastseen).from() + "\x0F connected from IP \x02\x0302" + pl.ip + "\x0F (" + pl.country + ")";
		if (pl.ips && pl.ips[pl.ip] && pl.ips[pl.ip].onServer && pl.ips[pl.ip].onServer.description) res += " on \x02\x0304" + pl.ips[pl.ip].onServer.description;
		else if (pl.onServer && pl.onServer.description) res += " on \x02\x0304" + pl.onServer.description;
		callback(res);
	}
	if (players[name]) returnCB(players[name]);
	else {
		db.db("spy").where({ name: name }).select().orderBy("lastseen", "desc").limit(1).then(rows => {
			if (rows.length) {
				let pl = rows[0];
				pl.onServer = servers.findServer(pl.lshost, pl.lsport);
				returnCB(pl);
			} else callback("No players with name \x0303" + name + "\x0F found.");
		});
	}
}

export function lastSeenIP(ip, callback) {
	if (!ip) return;
	ip = util.ipRepLB(ip, "0");
	function returnCB(pl) {
		var res = "\x02\x0302" + ip + "\x0F (" + pl.country + ") was last seen \x02" + moment(pl.lastSeen||pl.lastseen).from() + "\x0F playing as \x02\x0303" + pl.name;
		if (pl.ips && pl.ips[pl.ip] && pl.ips[pl.ip].onServer && pl.ips[pl.ip].onServer.description) res += "\x0F on \x02\x0304" + pl.ips[pl.ip].onServer.description;
		else if (pl.onServer && pl.onServer.description) res += "\x0F on \x02\x0304" + pl.onServer.description;
		callback(res);
	}
	var plr = _.find(players, function (pl) { return !_.isUndefined(pl.ips[ip]); });
	if (plr) returnCB(plr);
	else {
		db.db("spy").where({ ip: ip }).select().orderBy("lastseen", "desc").limit(1).then(rows => {
			if (rows.length) {
				let pl = rows[0];
				pl.onServer = servers.findServer(pl.lshost, pl.lsport);
				returnCB(pl);
			} else callback("No players with IP \x0302" + ip + "\x0F found.");
		});
	}
}

export function banIP(ip, callback) {
	if (!ip) return;
	ip = util.ipRepLB(ip, "0");
	if (_.isUndefined(bans[ip])) {
		db.db("bans").insert({ ip: ip });
		bans[ip] = true;
		callback("Done!");
	} else {
		callback("IP \x0302" + ip + "\x0F is already banned.");
	}
}

export function unbanIP(ip, callback) {
	if (!ip) return;
	ip = util.ipRepLB(ip, "0");
	if (bans[ip]) {
		db.db("bans").where({ ip: ip }).del();
		delete bans[ip];
		callback("Done!");
	} else {
		callback("IP \x0302" + ip + "\x0F was not banned.");
	}
}

export function banName(name, callback) {
	if (_.isUndefined(banNames[name])) {
		db.db("bans").insert({ name: name });
		db.db("players").where({ name: name }).del();
		banNames[name] = true;
		callback("Done!");
	} else {
		callback("Player \x0303" + name + "\x0F is already banned.");
	}
}

export function unbanName(name, callback) {
	if (banNames[name]) {
		db.db.run("DELETE FROM bans WHERE ip = ?", name);
		db.db("bans").where({ name: name }).del();
		delete banNames[name];
		callback("Done!");
	} else {
		callback("Player \x0303" + name + "\x0F was not banned.");
	}
}
