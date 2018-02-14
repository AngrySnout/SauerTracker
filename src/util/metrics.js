import _ from 'lodash';
import Promise from 'bluebird';

import redis from './redis';

/**
 *  Server has been polled.
 *  @param {string} host - Server's IP address.
 *  @param {number} port - Server's port number.
 */
export function serverPolled(host, port) {
	return redis.hincrbyAsync('servers-polled', `${host}:${port}`, 1);
}

/**
 *  Server has replied.
 *  @param {string} host - Server's IP address.
 *  @param {number} port - Server's port number.
 */
export function serverReplied(host, port) {
	return redis.hincrbyAsync('servers-replied', `${host}:${port}`, 1);
}

/**
 *  Get all stats.
 *  @returns {object} An object whose keys correspond to `host:port` values of servers,
 *  and whose values are objects containing the properties `polls` and `replies`,
 *  representing the total number of times the server was polled and the total number of
 *  times it replied, respectively.
 */
export function getAllMetrics() {
	return Promise.join(
		redis.hgetallAsync('servers-polled'), redis.hgetallAsync('servers-replied'),
		(serversPolled, serversReplied) => _.merge(
			{},
			_.mapValues(serversPolled, polls => ({ polls: Number(polls) })),
			_.mapValues(serversReplied, replies => ({ replies: Number(replies) })),
		),
	);
}
