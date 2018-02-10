import net from 'net';
import Promise from 'bluebird';
import _ from 'lodash';

import config from '../../tracker.json';
import redis from '../util/redis';
import { log } from '../util/util';

function pollMasterServer() {
	return new Promise((resolve, reject) => {
		let agg = '';
		const socket = net.connect(config.master.port, config.master.name, () => {
			socket.write('list\n');
		});
		socket.on('data', (data) => {
			agg += data.toString();
		});
		socket.on('end', () => {
			if (!agg) reject('Masterserver connection failed.');
			resolve(agg);
		});
		socket.on('error', (err) => {
			reject(['Can\'t poll masterserver:', err]);
		});
	});
}

/**
 *	Poll the master server.
 *	@param {function} resolve - Called with the new list.
 *	The list is an array of objects containing members 'host' and 'port'.
 *	@param {function} reject - Called with either an error message,
 *	or an array of errors, in case of an error.
 */
export function getServerList() {
	return pollMasterServer().then((result) => {
		const servers = [];
		_.each(result.split('\n'), (line) => {
			const ts = line.split(' ');
			if (ts.length === 3 && ts[0] === 'addserver') servers.push({ host: ts[1], port: parseInt(ts[2], 10) });
		});
		return servers;
	});
}

/**
 *	Get the server list from the master server and save it in cache.
 */
export function updateServerList() {
	return getServerList().then(results => redis.setAsync('servers', JSON.stringify(results))).catch((err) => {
		log(err);
		return err;
	});
}

/**
 *	Run updateServerList every interval milliseconds.
 */
export function start(interval) {
	setInterval(updateServerList, interval);
	updateServerList();
}
