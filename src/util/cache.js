import _ from 'lodash';
import Promise from 'bluebird';

import config from '../../tracker.json';

import {error} from '../util/util';

class CacheManager {
	constructor() {
		this.entries = {};
		this.cached = {};
	}

	/**
	 *	Add a cache function.
	 *	@param {string} id - A unique name for the function.
	 *	@param {string} maxage - How often, in milliseconds, should the stored value be purged.
	 *	@param {function} func - A function that returns a promise which resolves to the value that should be stored.
	 */
	set(id, maxage, func) {
		this.entries[id] = { 'maxage': maxage, 'func': func };
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
				reject("Cache entry not set");
				return;
			}
			if (!self.cached[id] || (new Date().getTime() - self.cached[id].time) > self.entries[id].maxage) {
				self.entries[id].func().then(function(res) {
					self.cached[id] = { 'value': res, 'time': new Date().getTime() };
					resolve(res);
				}).catch(err => {
					error(err);
					resolve();
				});
			} else resolve(self.cached[id].value);
		});
	}

	/**
	 *	Purge expired cache entries.
	 */
	purge() {
		var time = new Date().getTime();
		_.each(this.cached, function(cache, id) {
			if ((time - cache.time) > this.entries[id].maxage) delete this.cached[id];
		});
	}

	/**
	 *	Purge cache every config.cachePurgeInt seconds.
	 */
	start() {
		setInterval(this.purge, config.cachePurgeInt*1000);
	}
}

var cache = new CacheManager();
export default cache;
