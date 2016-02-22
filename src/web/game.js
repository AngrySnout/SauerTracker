var _ = require('lodash');
var Promise = require("bluebird");
var geoip = require('geoip-lite');
var countries = require("i18n-iso-countries");

var web = require('../util/web');
var util = require('../util/util');
var vars = require("../../vars.json");
var db = require("../util/database");
import {servers} from '../tracker/server-list';

function getGameScores(id) {
	return db.db("scores").where({ game: id }).select("team", "score");
}

function getGameStats(id) {
	return db.db("stats").where({ game: id }).select("name", "team", "frags", "flags", "deaths", "tks", "acc", "country", "state", "kpd").then(rows => {
		_.each(rows, function(plr) {
			if (!plr.country || plr.country == "unknown") {
				plr.country = "";
				plr.countryName = "Unknown";
			}
			else plr.countryName = countries.getName(plr.country, "en");
			if (!plr.kpd) plr.kpd = util.round2(plr.frags/Math.max(plr.deaths, 1));
		});
		return rows;
	});
}

function getGameRow(id) {
	return db.db("games").where({ id: id }).then(rows => rows[0]);
}

function getGame(id, callback) {
	Promise.all([ getGameRow(id), getGameScores(id), getGameStats(id) ]).then(results => {
		if (!results[0]) {
			callback({ error: "Game not found." });
			return;
		}

		let locals = {};
		locals.description = results[0].serverdesc;
		locals.clients = results[0].numplayers;
		locals.gameMode =  results[0].gamemode;
		locals.gameType =  results[0].gametype;
		locals.mapName =  results[0].map;
		locals.time = results[0].timestamp;
		locals.host =  results[0].host;
		locals.port =  results[0].port;

		let server = servers.find(results[0].host, results[0].port);

		if (server) {
			locals.descriptionStyled = server.descriptionStyled||results[0].serverdesc;
			locals.info = server.info;
		} else {
			locals.descriptionStyled = results[0].serverdesc;
			locals.info = {};
		}

		if (server && server.country) {
			locals.country = server.country;
			locals.countryName =  server.countryName;
		} else {
			let gipl = geoip.lookup(results[0].host);
			locals.country = gipl? gipl.country: "";
			locals.countryName = gipl? countries.getName(locals.country, "en"): "Unknown";
		}

		locals.teams = _.mapValues(_.keyBy(results[1], "team"), "score");
		locals.players = results[2];

		callback(locals);
	}).catch(error => {
		callback({ error: error });
	});
}

web.app.get('/game/:id', function(req, res) {
	getGame(req.params.id, result => {
		if (result.error) {
			let status = (result.error=="Game not found."? 404: 500);
			res.status(status).render("error", { status: status, error: result.error });
		} else {
			res.render("game", { id: req.params.id, server: result, _: _, vars: vars });
		}
	});
});

web.app.get('/api/game/:id', function(req, res) {
	getGame(req.params.id, result => {
		if (result.error) res.status(result.error=="Game not found."? 404: 500);
		res.send(result);
	});
});
