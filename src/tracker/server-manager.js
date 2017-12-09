import _ from 'lodash';

import config from '../../tracker.json';

import {debug, error} from '../util/util';
import database from '../util/database';
import getServerList from './master-server';
import Server from './server';

class ServerManager {
	constructor() {
		this.list = [];
		this.pollNum = 0;
		this.keep = false;
	}

	add(host, port, row) {
		if (!_.find(this.list, {host: host, port: port})) {
			let newServ = new Server(host, port, row);
			this.list.push(newServ);
			return true;
		}
		return false;
	}

	remove(host, port) {
		let serverIndex = _.findIndex(this.list, {host: host, port: port});
		if (serverIndex >= 0) {
			this.list.splice(serverIndex, 1);
			return true;
		}
		return false;
	}

	removeAt(index) {
		if (index >= 0 && index < this.list.length) {
			this.list.splice(index, 1);
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
		let newList = [];
		let now = new Date().getTime();
		_.each(this.list, server => {
			if (!server.shouldClean(now)) newList.push(server);
		});
		if (this.list.length > newList.length) debug(`Clean up removed ${this.list.length - newList.length} server(s)`);
		this.list = newList;
	}

	update() {
		let self = this;
		debug('Polling masterserver...');
		getServerList(res => {
			var count = 0;
			_.each(res, sv => {
				if (self.add(sv.host, sv.port)) count++;
			});
			debug(`Updated server list, ${count} server(s) added.`);
		}, (...err) => {
			debug(...err);
		});
	}

	serialize() {
		let list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), sv => {
			list.push(sv.serialize(true));
		});
		return list;
	}

	start() {
		database.select().table('servers').then(servers => {
			_.each(servers, (row) => {
				this.add(row.host, row.port, row);
			});
		}).catch(err => {
			error(err);
		}).then(() => {
			setInterval(() => {
				this.pollAll();
			}, 1000);
			this.pollAll();

			if (config.master.update) {
				setInterval(() => {
					this.update();
				}, config.master.updateInterval*1000);
				this.update();
			}

			setInterval(() => {
				this.cleanUp();
			}, 60000);
		});
	}
}

var serverManager = new ServerManager();
export default serverManager;
