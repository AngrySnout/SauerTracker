import _ from 'lodash';

import { log, error } from '../util/util';
import database from '../util/database';
import redis from '../util/redis';
import Server from './server';

class ServerManager {
	constructor() {
		this.list = [];
		this.pollNum = 0;
	}

	add(host, port, row) {
		if (!_.find(this.list, { host, port: Number(port) })) {
			const newServ = new Server(host, port, row);
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
		if (this.list.length > newList.length) log(`Clean up removed ${this.list.length - newList.length} server(s)`);
		this.list = newList;
	}

	update() {
		const self = this;
		redis.getAsync('servers')
			.then((servers) => {
				servers = JSON.parse(servers);
				// eslint-disable-next-line no-restricted-syntax
				for (const server of servers) {
					self.add(server.host, server.port);
				}
			});
	}

	serialize() {
		const list = [];
		_.each(_.filter(this.list, sv => (sv.game && sv.game.masterMode)), (sv) => {
			list.push(sv.serialize(true));
		});
		return list;
	}

	updateServerListJSON() {
		redis.setAsync('server-list', JSON.stringify(this.serialize()));
	}

	start() {
		const self = this;
		database.select().table('servers').then((servers) => {
			_.each(servers, (server) => {
				self.add(server.host, server.port, server);
			});
		}).catch((err) => {
			error(err);
		})
			.then(() => {
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

const serverManager = new ServerManager();
export default serverManager;
