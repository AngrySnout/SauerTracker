var _ = require('lodash');
var config = require('../../tracker.json');
var Promise = require("bluebird");

var entries = {};
var cached = {};

/**
 *	Add a cache function.
 *	@param {string} id - A unique name for the function.
 *	@param {string} maxage - How often, in milliseconds, should the stored value be purged.
 *	@param {function} func - A function that returns a promise which resolves to the value that should be stored.
 */
export function set(id, maxage, func) {
	entries[id] = { 'maxage': maxage, 'func': func };
}

/**
 *	Get a value from cache. If the value stored has expired the generator function will be called again.
 *	@param id - {string} The name of the function to call.
 *	@returns {Promise} Rejects if the function is not set. Resolves with the value returned by the generator function.
 */
export function get(id) {
	return new Promise((resolve, reject) => {
		if (!entries[id]) {
			reject("Cache entry not set");
			return;
		}
		if (!cached[id] || (new Date().getTime() - cached[id].time) > entries[id].maxage) {
			entries[id].func().then(function(res) {
				cached[id] = { 'value': res, 'time': new Date().getTime() };
				resolve(res);
			}).catch(error => {
				console.log(error);
				resolve();
			});
		} else resolve(cached[id].value);
	});
}

/**
 *	Purge expired cahe entries.
 */
export function purge() {
	var time = new Date().getTime();
	_.each(cached, function(cache, id) {
		if ((time - cache.time) > entries[id].maxage) delete cached[id];
	});
}

/**
 *	Purge cache every config.cachePurgeInt seconds.
 */
export function start() {
	setInterval(purge, config.cachePurgeInt*1000);
}
