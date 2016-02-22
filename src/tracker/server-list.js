var _ = require('lodash');
var Promise = require("bluebird");

var util = require('../util/util');
var player = require('./player');
var config = require('../../tracker.json');
var db = require('../util/database');
var masterServer = require('./master-server');

import Server from './server';

export class ServerList {
	constructor() {
		this.list = [];
		this.pollNum = 0;
		this.keep = false;
	}

	add(host, port, fromDB, row, keeps) {
		if (!_.find(this.list, {host: host, port: port})) {
			let newServ = new Server(host, port, fromDB, row, keeps);
			this.list.push(newServ);
			return true;
		}
		return false;
	}

	remove(host, port, noKeep) {
		let serverIndex = _.findIndex(this.list, {host: host, port: port});
		if (serverIndex >= 0) {
			let oldServ = this.list.splice(serverIndex, 1);
			oldServ[0].dispose(true, noKeep);
			return true;
		}
		return false;
	}

	removeAt(index) {
		if (index >= 0 && index < this.list.length) {
			let oldServ = this.list.splice(index, 1);
			oldServ[0].dispose(true);
			return true;
		}
		return false;
	}

	find(host, port) {
		return _.find(this.list, {host: host, port: port});
	}

	pollAll() {
		this.pollNum++;
		let time = new Date().getTime();
		_.each(this.list, server => {
			server.tryPoll(time, this.pollNum);
		});
	}

	cleanUp() {
		let self = this;
		let newList = [];
		let now = new Date().getTime();
		_.each(this.list, server => {
			if (!server.shouldClean(now)) newList.push(server);
			else server.dispose(true);
		});
		if (this.list.length > newList.length) util.debug('Clean up removed ' + (this.list.length - newList.length) + ' server(s)');
		this.list = newList;
	}

	update() {
		let self = this;
		util.debug('Polling masterserver...');
		masterServer.getList(res => {
			var count = 0;
			_.each(res, sv => {
				if (self.add(sv.host, sv.port)) count++;
			});
			util.debug('Updated server list,', count, "server(s) added.");
		}, (...error) => {
			util.debug(...error);
		});
	}

	serialize() {
		let list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), sv => {
			list.push(sv.serialize(true));
		});
		return list;
	}
}
export var servers = new ServerList();

// Server management functions (accessed via IRC)

export function addServer(host, port) {
	try {
		let added = servers.add(host, port||28785, null, null, true);
		return added? "Done!": "Error: server already exists.";
	} catch(e) {
		return e;
	}
}

export function delServer(host, port) {
	try {
		let added = servers.remove(host, port, true);
		return added? "Done!": "Error: server not found.";
	} catch(e) {
		return e;
	}
}

export function findServer(host, port) {
	return servers.find(host, port);
}

export function setInfo(host, port, key, value) {
	var server = servers.find(host, port);
	if (!server) return "Error: server not found.";
	try {
		server.setInfo(key, value);
		return "Done!";
	} catch(e) {
		return e;
	}
}

export function start() {
	Promise.all([db.servers.getServers(), db.servers.getBans()])
		.then(results => {
			_.each(results[0], (row) => {
				servers.add(row.host, row.port, true, row);
			});
			_.each(results[1], function (ban) {
				if (ban.ip) player.bans[ban.ip] = true;
				else if (ban.name) player.banNames[ban.name] = true;
			});
		}).catch(error => {
			util.error(error);
		}).then(() => {
			setInterval(() => {
				servers.pollAll();
			}, 1000);
			servers.pollAll();

			if (config.master.update) {
				setInterval(() => {
					servers.update();
				}, config.masterPollingInt*1000);
				servers.update();
			}

			setInterval(() => {
				servers.cleanUp();
			}, 60000);
		});
}
