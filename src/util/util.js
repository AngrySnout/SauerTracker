/* eslint-disable no-console */

import _ from 'lodash';

import config from '../../tracker.json';
import vars from '../../vars.json';

/**
 *  Replace the last octet in an IP address.
 *  @param {string} ip - The IP address.
 *  @param {string} to - The new last octet.
 *  @returns {string}
 */
export function ipRepLB(ip, to) {
	return ip.replace(/\.[\d*]+$/, `.${to}`);
}

/**
 *  Round number to 2 decimals.
 *  @param {number} val
 *  @returns {number}
 */
export function round2(val) {
	return Math.round(val * 100) / 100;
}

/**
 *  Check whether ip is a valid IP.
 *  @param {string} ip
 *  @returns {boolean}
 */
export function isValidIP(ip) {
	const parts = ip.split('.');
	if (parts.length !== 4) return false;
	for (let i = 0; i < 4; i++) {
		// eslint-disable-next-line no-restricted-globals
		if (isNaN(parts[i])) return false;
		const n = Number(parts[i]);
		if (n < 0 || n > 255) return false;
	}
	return true;
}

/**
 *  Check whether port is a valid port number.
 *  @param {number} port
 *  @returns {boolean}
 */
export function isValidPort(port) {
	return port > 0 && port < 65535;
}

/**
 *  Prints log message.
 *  @param {any} msg
 */
export function log(...msg) {
	console.log(...msg);
}

/**
 *  If in debug mode print stack stace and exits. Otherwise print error message.
 *  @param {any} msg
 */
export function error(msg) {
	log('Error:', msg);
	if (config.debug) {
		throw new Error(msg);
	}
}

/**
 *  If in debug mode prints msg.
 *  @param {any} msg
 */
export function debug(...msg) {
	if (config.debug) log(...msg);
}

/**
 *  If condition is not truthful, if in debug mode; print stack trace and exits,
 *  otherwise; print error message.
 *  @param {any} condition
 *  @param {string} msg
 */
export function assert(condition, msg) {
	if (config.debug) throw new Error(`Assert failed: ${msg}`);
	else log(`Assert failed: ${msg}`);
}

/**
 *  Replace all occurrences of '%' with '\%' and '_' with '\_' for use in an [I]LIKE query.
 *  @param {string} text - String to escape.
 *  @returns {string}
 */
export function escapePostgresLike(text) {
	return String(text).replace(/[_%]/g, s => `\\${s}`);
}

/**
 *  Extract the clantag from a player name. If no clantag is found, return undefined.
 *  @param {string} name
 */
export function getClan(name) {
	const clan = _.find(vars.clans, c => (name.indexOf(c.tag) >= 0));
	return clan && clan.tag;
}

/**
 *  Object not found error type.
 */
export function ObjectNotFoundError() {}
ObjectNotFoundError.prototype = Object.create(Error.prototype);

/**
 *  Object banned error type.
 */
export function ObjectBannedError() {}
ObjectBannedError.prototype = Object.create(Error.prototype);
