import _ from 'lodash';

import {log} from '../util/util';
import database from '../util/database';
import redis from '../util/redis';
import Server from './server';

class ServerManager {
	constructor() {
		this.list = [];
		this.pollNum = 0;
	}

	add(host, port, info) {
		if (!_.find(this.list, {host: host, port: Number(port)})) {
			let newServ = new Server(host, port, info);
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
		let cleaned = this.list.length - newList.length;
		if (cleaned > 0) log(`Clean up removed ${cleaned} server(s)`);
		this.list = newList;
		return cleaned;
	}

	update() {
		let self = this;
		return redis.getAsync('servers')
			.then(servers => {
				servers = JSON.parse(servers);
				let count = 0;
				for (let server of servers) {
					if (self.add(server.host, server.port)) count++;
				}
				return count;
			});
	}

	serialize() {
		let list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), sv => {
			list.push(sv.serialize(false));
		});
		return list;
	}
	
	updateServerListJSON() {
		return redis.setAsync('server-list', JSON.stringify(this.serialize()));
	}

	start() {
		let self = this;
		database.select().table('servers').then(servers => {
			_.each(servers, server => {
				self.add(server.host, server.port, server);
			});
		}).then(() => {
			setInterval(() => {
				this.pollAll();
			}, 1000);
			
			setInterval(() => {
				this.cleanUp();
				this.update();
			}, 60000);
			this.update();

			setInterval(() => {
				this.updateServerListJSON();
			}, 5000);
		});
	}
}

var serverManager = new ServerManager();
export default serverManager;
