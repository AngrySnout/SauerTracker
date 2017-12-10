import _ from 'lodash';
import Promise from 'bluebird';

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
			else redis.sremAsync('servers', `${server.host}:${server.port}`).then();
		});
		if (this.list.length > newList.length) log(`Clean up removed ${this.list.length - newList.length} server(s)`);
		this.list = newList;
	}

	update() {
		let self = this;
		redis.smembersAsync('servers')
			.then(servers => {
				for (let server of servers) {
					let sa = server.split(':');
					let host = sa[0],
						port = sa[1];
					self.add(host, port);
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
	
	updateServerList() {
		redis.setAsync('server-list', JSON.stringify(this.serialize()));
	}

	start() {
		let self = this;
		database.select().table('servers').then(servers => {
			return Promise.all(servers.map(server => {
				self.add(server.host, server.port, server);
				return redis.sadd('servers', `${server.host}:${server.port}`);
			}));
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
				this.updateServerList();
			}, 5000);
		});
	}
}

var serverManager = new ServerManager();
export default serverManager;
