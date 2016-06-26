import _ from 'lodash';
import Promise from 'bluebird';
import moment from 'moment';

import config from '../../tracker.json';
import vars from '../../vars.json';

import {ipRepLB} from '../util/util';
import database from '../util/database';
import serverManager from '../tracker/server-manager';
import playerManager from '../tracker/player-manager';

export function nameIPs(name, callback) {
	let ips = [];
	if (playerManager.players[name] && playerManager.players[name].ips) ips = _.keys(playerManager.players[name].ips);
	database("spy").where({ name: name }).select("ip").orderBy("lastseen", "desc").limit(5).then(rows => {
		ips = _.filter(_.union(ips, _.map(rows, "ip")), function (ip) { return ip != "0.0.0.0"; });
		if (ips.length) callback("Most recent IP(s) for \x02\x0303" + name + "\x0F are: \x02\x0302" + _.reduce(ips.slice(0, 5), function (memo, ip) { return memo + "\x0F, \x02\x0302" + ip; }));
		else callback("No IPs found for \x02\x0303" + name);
	});
}

export function ipNames(ip, callback) {
	if (!ip) return;
	ip = ipRepLB(ip, "0");
	let names = _.filter(_.map(_.reject(playerManager.players, function (pl) { return _.isUndefined(pl.ips[ip]); }), "name"), function (name) { return name; });
	database("spy").where({ ip: ip }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
		names = _.union(names, _.map(rows, "name"));
		if (names.length) callback("Most recent name(s) for \x02\x0302" + ip + "\x0F are: \x02\x0303" + _.reduce(names.slice(0, 5), function (memo, name) { return memo + "\x0F, \x02\x0303" + name; }));
		else callback("No names found for \x02\x0302" + ip);
	});
}

export function ipNamesL(ip, callback) {
	if (!ip) return;
	ip = ipRepLB(ip, "0");
	let names = _.filter(_.map(_.reject(playerManager.players, function (pl) { return _.isUndefined(pl.ips[ip]); }), "name"), function (name) { return name; });
	database("spy").where({ ip: ip }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
		names = _.union(names, _.map(rows, "name"));
		callback(names);
	});
}

// TODO: use the names in memory
export function namesFor(str, callback) {
	let name = str.toLowerCase();
	database("spy").where("name", "ilike", "%"+name+"%").whereNot({ ip: "0.0.0.0" }).select("ip").orderBy("lastseen", "desc").limit(1).then(iprows => {
		if (iprows.length) {
			database("spy").where({ ip: iprows[0].ip }).select("name").orderBy("lastseen", "desc").limit(10).then(rows => {
				let names = _.map(rows, "name");
				callback("Most recent name(s) for \x02\x0303" + str + "\x0F are: \x02\x0302" + _.reduce(names, function (memo, name) { return memo + "\x0F, \x02\x0302" + name; }));
			});
		} else callback("No names found for \x02\x0303" + name);
	});
}

export function findName(str, callback) {
	let strLC = str.toLowerCase();
	let names = _.filter(_.keys(playerManager.players), function (name) { return (name.toLowerCase().indexOf(strLC) != -1); });
	database("spy").where("name", "ilike", "%"+str+"%").whereNot({ ip: "0.0.0.0" }).select("name").orderBy("lastseen", "desc").limit(5).then(rows => {
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
	if (playerManager.players[name]) returnCB(playerManager.players[name]);
	else {
		database("spy").where({ name: name }).select().orderBy("lastseen", "desc").limit(1).then(rows => {
			if (rows.length) {
				let pl = rows[0];
				pl.onServer = serverManager.find(pl.lshost, pl.lsport);
				returnCB(pl);
			} else callback("No players with name \x0303" + name + "\x0F found.");
		});
	}
}

export function lastSeenIP(ip, callback) {
	if (!ip) return;
	ip = ipRepLB(ip, "0");
	function returnCB(pl) {
		var res = "\x02\x0302" + ip + "\x0F (" + pl.country + ") was last seen \x02" + moment(pl.lastSeen||pl.lastseen).from() + "\x0F playing as \x02\x0303" + pl.name;
		if (pl.ips && pl.ips[pl.ip] && pl.ips[pl.ip].onServer && pl.ips[pl.ip].onServer.description) res += "\x0F on \x02\x0304" + pl.ips[pl.ip].onServer.description;
		else if (pl.onServer && pl.onServer.description) res += "\x0F on \x02\x0304" + pl.onServer.description;
		callback(res);
	}
	var plr = _.find(playerManager.players, function (pl) { return !_.isUndefined(pl.ips[ip]); });
	if (plr) returnCB(plr);
	else {
		database("spy").where({ ip: ip }).select().orderBy("lastseen", "desc").limit(1).then(rows => {
			if (rows.length) {
				let pl = rows[0];
				pl.onServer = serverManager.find(pl.lshost, pl.lsport);
				returnCB(pl);
			} else callback("No players with IP \x0302" + ip + "\x0F found.");
		});
	}
}

export function banIP(ip, callback) {
	if (!ip) return;
	ip = ipRepLB(ip, "0");
	if (_.isUndefined(playerManager.bans[ip])) {
		database("bans").insert({ ip: ip });
		playerManager.bans[ip] = true;
		callback("Done!");
	} else {
		callback("IP \x0302" + ip + "\x0F is already banned.");
	}
}

export function unbanIP(ip, callback) {
	if (!ip) return;
	ip = ipRepLB(ip, "0");
	if (playerManager.bans[ip]) {
		database("bans").where({ ip: ip }).del();
		delete playerManager.bans[ip];
		callback("Done!");
	} else {
		callback("IP \x0302" + ip + "\x0F was not banned.");
	}
}

export function banName(name, callback) {
	if (_.isUndefined(playerManager.banNames[name])) {
		database("bans").insert({ name: name });
		database("players").where({ name: name }).del();
		playerManager.banNames[name] = true;
		callback("Done!");
	} else {
		callback("Player \x0303" + name + "\x0F is already banned.");
	}
}

export function unbanName(name, callback) {
	if (playerManager.banNames[name]) {
		database.run("DELETE FROM bans WHERE ip = ?", name);
		database("bans").where({ name: name }).del();
		delete playerManager.banNames[name];
		callback("Done!");
	} else {
		callback("Player \x0303" + name + "\x0F was not banned.");
	}
}

export function getBans() {
	return playerManager.bans;
}

export function getBanNames() {
	return playerManager.banNames;
}
