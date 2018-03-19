import _ from 'lodash';

import { logError, logInfo } from '../util/util';
import database from '../util/database';
import redis from '../util/redis';
import Server from './server';

class ServerManager {
	constructor() {
		this.list = [];
		this.pollNum = 0;
	}

	add(host, port, info) {
		if (!_.find(this.list, { host, port: Number(port) })) {
			const newServ = new Server(host, port, info);
			this.list.push(newServ);
			return true;
		}
		return false;
	}

	find(host, port) {
		return _.find(this.list, { host, port });
	}

	pollAll() {
		this.pollNum++;
		const time = new Date().getTime();
		_.each(this.list, (server) => {
			server.tryPoll(time, this.pollNum);
		});
	}

	cleanUp() {
		const newList = [];
		const now = new Date().getTime();
		_.each(this.list, (server) => {
			if (!server.shouldClean(now)) newList.push(server);
		});
		const cleaned = this.list.length - newList.length;
		if (cleaned > 0) logInfo(`${cleaned} servers removed`);
		this.list = newList;
		return cleaned;
	}

	update() {
		const self = this;
		return redis.getAsync('servers')
			.then((servers) => {
				servers = JSON.parse(servers);
				let count = 0;
				// eslint-disable-next-line no-restricted-syntax
				for (const server of servers) {
					if (self.add(server.host, server.port)) count++;
				}
				return count;
			})
			.then((count) => {
				logInfo(`${count} servers added`);
				return count;
			})
			.catch(err => logError(err.toString()));
	}

	serialize() {
		const list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), (sv) => {
			list.push(sv.serialize(false));
		});
		return list;
	}

	updateServerListJSON() {
		return redis.setAsync('server-list', JSON.stringify(this.serialize()));
	}

	start() {
		const self = this;
		database.select().table('servers').then((servers) => {
			_.each(servers, (server) => {
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

const serverManager = new ServerManager();
export default serverManager;
