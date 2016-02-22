var fs = require('fs');
var _ = require('lodash');
var Promise = require("bluebird");

var config = require('../../tracker.json');
var util = require('./util');

var knex = require('knex');

export var db;

export function start() {
	db = knex(config.database);
}

// Add/remove/modify servers

export var servers = {};

servers.add = function(host, port, keep) {
	let server = { host: host, port: parseInt(port) };
	if (keep) server.keep = true;
	db("servers").insert(server).then();
};

servers.remove = function(host, port, noKeep) {
	let query = db("servers").where({ host: host, port: parseInt(port) });
	if (!noKeep) query = query.where("keep", "!=", true);
	query.del().then();
};

var infos = ["website", "demourl", "banned", "keep"];
servers.setInfo = function(host, port, infoKey, infoValue) {
	if (infos.indexOf(infoKey) < 0) throw new Error("Invalid info param '" + infoKey + "'.");
	db("servers").where({ host: host, port: port }).update("keep", infoKey=="keep"? infoValue: true).update(infoKey, infoValue).then();
};

servers.getServers = function() {
	return db.select().table('servers');
};

servers.getBans = function() {
	return db.select().table('bans');
};
