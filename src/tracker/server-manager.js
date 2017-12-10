import _ from 'lodash';

import {log, error} from '../util/util';
import database from '../util/database';
import redis from '../util/redis';
import Server from './server';

class ServerManager {
	constructor() {
		this.list = [];
		this.pollNum = 0;
	}

	add(host, port, row) {
		if (!_.find(this.list, {host: host, port: Number(port)})) {
			let newServ = new Server(host, port, row);
			this.list.push(newServ);
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
		if (this.list.length > newList.length) log(`Clean up removed ${this.list.length - newList.length} server(s)`);
		this.list = newList;
	}

	update() {
		let self = this;
		redis.getAsync('servers')
			.then(servers => {
				servers = JSON.parse(servers);
				for (let server of servers) {
					self.add(server.host, server.port);
				}
			});
	}

	serialize() {
		let list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), sv => {
			list.push(sv.serialize(true));
		});
		return list;
	}
	
	updateServerListJSON() {
		redis.setAsync('server-list', JSON.stringify(this.serialize()));
	}

	start() {
		let self = this;
		database.select().table('servers').then(servers => {
			_.each(servers, server => {
				self.add(server.host, server.port, server);
			});
		}).catch(err => {
			error(err);
		}).then(() => {
			setInterval(() => {
				this.pollAll();
			}, 1000);
			this.pollAll();
			
			setInterval(() => {
				this.update();
			}, 60000);
			this.update();

			setInterval(() => {
				this.cleanUp();
			}, 60000);

			setInterval(() => {
				this.updateServerListJSON();
			}, 5000);
		});
	}
}

var serverManager = new ServerManager();
export default serverManager;
