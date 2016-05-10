import _ from 'lodash';
import Promise from "bluebird";
import geoip from 'geoip-lite';
import countries from "i18n-iso-countries";

import vars from "../../vars.json";

import app from '../util/web';
import {round2} from '../util/util';
import database from '../util/database';
import serverManager from '../tracker/server-manager';

function getGameScores(id) {
	return database("scores").where({ game: id }).select("team", "score");
}

function getGameStats(id) {
	return database("stats").where({ game: id }).select("name", "team", "frags", "flags", "deaths", "tks", "acc", "country", "state", "kpd").then(rows => {
		_.each(rows, function(plr) {
			if (!plr.country || plr.country == "unknown") {
				plr.country = "";
				plr.countryName = "Unknown";
			}
			else plr.countryName = countries.getName(plr.country, "en");
			if (!plr.kpd) plr.kpd = round2(plr.frags/Math.max(plr.deaths, 1));
		});
		return rows;
	});
}

function getGameRow(id) {
	return database("games").where({ id: id }).then(rows => rows[0]);
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

		let server = serverManager.find(results[0].host, results[0].port);

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

app.get('/game/:id', function(req, res) {
	getGame(req.params.id, result => {
		if (result.error) {
			let status = (result.error=="Game not found."? 404: 500);
			res.status(status).render("error", { status: status, error: result.error });
		} else {
			res.render("game", { id: req.params.id, server: result, _: _, vars: vars });
		}
	});
});

app.get('/api/game/:id', function(req, res) {
	getGame(req.params.id, result => {
		if (result.error) res.status(result.error=="Game not found."? 404: 500);
		res.send(result);
	});
});
