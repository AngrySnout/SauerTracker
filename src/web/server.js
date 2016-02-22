var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');

var web = require('../util/web');
var cache = require('../util/cache');
var util = require('../util/util');
var db = require('../util/database');
var vars = require("../../vars.json");
import {findServer} from '../tracker/server-list';
var config = require('../../tracker.json');

web.app.get('/api/server/:host/:port', function (req, res) {
    let server = findServer(req.params.host, parseInt(req.params.port));
    if (server) res.send(server.game.serialize());
    else res.status(404).send({ error: "Server not found." });
});

web.app.get('/server/:host/:port', function (req, res) {
    let server = findServer(req.params.host, parseInt(req.params.port));
    if (server) res.render('server', { server: server.game.serialize(), vars: vars, _: _ });
    else res.status(404).render("error", { status: 404 });
});

function getActivityDay(host, port) {
	let today = moment().utc().startOf("day").format("YYYY-MM-DD");
    return db.db("games").where({ host: host, port: port }).where("timestamp", ">=", today).select("numplayers", "timestamp");
}

function getActivityMonth(host, port) {
    let thisMonth = moment().subtract(14, "days").format("YYYY-MM-DD");
    return db.db("games").where({ host: host, port: port }).where("timestamp", ">=", thisMonth).select(db.db.raw("date_trunc('day', timestamp) as date")).count("* as count").groupBy("date").orderBy("date");
}

web.app.get('/api/server/activity/:host/:port', function(req, res) {
	Promise.all([getActivityDay(req.params.host, req.params.port), getActivityMonth(req.params.host, req.params.port)]).then(results => {
		res.send({ day: results[0], month: results[1] });
	}).catch(error => {
		util.error(error);
		res.status(500).send({ error: error });
	});
});
