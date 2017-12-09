import Promise from 'bluebird';

import redis from '../util/redis';
import {error} from '../util/util';

class CacheManager {
	constructor() {
		this.entries = {};
	}

	/**
	 *	Add a cache function.
	 *	@param {string} id - A unique name for the function.
	 *	@param {string} maxage - Approximately, how often, in milliseconds, should the stored value be purged.
	 *	@param {function} func - A function that returns a promise which resolves to the value that should be stored.
	 */
	set(id, maxage, func) {
		this.entries[id] = { 'maxage': maxage/1000, 'func': func };
	}

	/**
	 *	Get a value from cache. If the value stored has expired the generator function will be called again.
	 *	@param id - {string} The name of the function to call.
	 *	@returns {Promise} Rejects if the function is not set. Resolves with the value returned by the generator function.
	 */
	get(id) {
		let self = this;
		return new Promise((resolve, reject) => {
			if (!self.entries[id]) {
				reject('Cache entry not set');
				return;
			}
			let key = `cache-${id}`;
			redis.getAsync(key)
				.then(reply => {
					if (!reply) {
						self.entries[id].func().then(function(res) {
							redis.setAsync(key, JSON.stringify(res), 'EX', self.entries[id].maxage);
							resolve(res);
						}).catch(err => {
							error(err);
							resolve();
						});
					} else resolve(JSON.parse(reply.toString()));
				});
		});
	}
}

var cache = new CacheManager();
export default cache;
