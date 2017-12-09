import _ from 'lodash';

/**
 *  @private
 *  @class ServerMetric
 *  Provides simple stats on server pings.
 */
class ServerMetric {
	constructor() {
		this.totalPolls = 0;
		this.totalPollTime = 0;
		this.lastPollTime = -1;

		this.totalReplies = 0;
		this.totalReplyTime = 0;
		this.lastReplyTime = -1;
	}

	/**
	 *  The server has been polled.
	 */
	polled() {
		this.totalPolls++;
		var now = new Date().getTime();
		if (this.lastPollTime > -1) {
			this.totalPollTime += now-this.lastPollTime;
		}
		this.lastPollTime = now;
	}

	/**
	 *  The server has replied.
	 */
	replied() {
		this.totalReplies++;
		var now = new Date().getTime();
		if (this.lastReplyTime > -1) {
			this.totalReplyTime += now-this.lastReplyTime;
		}
		this.lastReplyTime = now;
	}

	/**
	 *  Get server stats.
	 *  @returns {object} Contains prperties averagePollTime, averageReplyTime, and loss.
	 */
	get() {
		return {
			averagePollTime: (this.totalPollTime/(this.totalPolls-1))/1000,
			averageReplyTime: (this.totalReplyTime/(this.totalReplies-1))/1000,
			loss: 100-((this.totalReplies/this.totalPolls)*100)
		};
	}
}

class MetricsManager {
	constructor() {
		this.servers = {};
	}

	/**
	 *  Server has been polled.
	 *  @param {string} host - Host IP of the server.
	 *  @param {number} port - Port of the server.
	 */
	polled(host, port) {
		if (!this.servers[host+':'+port]) this.servers[host+':'+port] = new ServerMetric();
		this.servers[host+':'+port].polled();
	}

	/**
	 *  Server has been replied.
	 *  @param {string} host - Host IP of the server.
	 *  @param {number} port - Port of the server.
	 */
	replied(host, port) {
		if (!this.servers[host+':'+port]) this.servers[host+':'+port] = new ServerMetric();
		this.servers[host+':'+port].replied();
	}

	/**
	 *  Get all stats.
	 *  @returns {array} An array containing object that have properties name and stats, where stats is an object with properties averagePollTime, averageReplyTime, and loss.
	 */
	getAll() {
		var res = [];
		_.each(this.servers, (metric, name) => {
			res.push({
				name: name,
				stats: metric.get()
			});
		});
		return res;
	}
}

var metrics = new MetricsManager();
export default metrics;
