import _ from 'lodash';
import Promise from "bluebird";
import moment from 'moment';

import vars from "../../vars.json";

import app from '../util/web';
import {getClan, error} from "../util/util";
import playerManager from "../tracker/player-manager";
import database from '../util/database';

function getTotalGames(name) {
	return database.count("* as count").from("stats").join("games", "games.id", "stats.game").where("stats.name", name).whereNot("stats.state", 5).then(rows => {
		return rows[0].count;
	});
}

function getLastGames(name) {
	return database.select("games.id", "games.host", "games.port", "games.serverdesc", "games.gamemode", "games.map", "games.gametype", "games.timestamp").from("stats").join("games", "games.id", "stats.game").where("stats.name", name).whereNot("stats.state", 5).orderBy("games.id", "desc").limit(10);
}

function getPlayer(name, callback) {
	if (playerManager.banNames[name]) callback({ error: "This name is banned." });
	else {
		database("players").where({ name: name }).then(rows => {
			if (!rows.length) {
				callback({ error: "No player found with this name." });
			} else {
				let row = rows[0];
				try {
					row.efficstats = (row.efficstats)? JSON.parse(row.efficstats): [0, 0, 0, 0, 0, 0];
					row.instastats = (row.instastats)? JSON.parse(row.instastats): [0, 0, 0, 0, 0, 0];
				} catch (e) {
					error(e);
					row.efficstats = [0, 0, 0, 0, 0, 0];
					row.instastats = [0, 0, 0, 0, 0, 0];
				}
				if (!row.efficstats) row.efficstats = [0, 0, 0, 0, 0, 0];
				if (!row.instastats) row.instastats = [0, 0, 0, 0, 0, 0];
				let pclan = _.find(vars.clans, { "tag": getClan(row.name) });
				if (pclan) {
					row.clan = pclan.title;
					row.clanTag = pclan.tag;
				}
				if (playerManager.isOnline(row.name)) row.online = true;
				Promise.all([getTotalGames(name), getLastGames(name)])
					.then(results => {
						callback({ player: row, totalGames: results[0], games: results[1] });
					})
					.catch(err => {
						error(err);
						callback({ player: row });
					});
			}
		});
	}
}

app.get("/player/:name", function(req, res) {
	getPlayer(req.params.name, result => {
		if (result.error) {
			if (result.error === "This name is banned.") res.render("player", { playerName: req.params.name, error: result.error });
			else {
				let status = (result.error=="No player found with this name."? 404: 500);
				res.status(status).render("error", { status: status, error: result.error });
			}
		} else {
			res.render("player", _.assign(result, { _: _ }) );
		}
	});
});

app.get("/api/player/:name", function(req, res) {
	getPlayer(req.params.name, result => {
		if (result.error) res.status(result.error=="No player found with this name."? 404: 500);
		res.send(result);
	});
});

app.get("/api/player/activity/:name", function(req, res) {
	var thisMonth = moment().subtract(14, "days").format("YYYY-MM-DD");
	database.select(database.raw("date_trunc('day', timestamp) as date")).count("* as count").from("games").where("timestamp", ">=", thisMonth).whereIn("id", database("stats").select("game").whereNot("stats.state", 5).where("name", req.params.name).whereNot("frags", 0)).groupBy("date").orderBy("date").then(rows => {
		res.send({ activity: rows });
	}).catch(err => {
		error(err);
		res.status(500).render("error", { status: status, error: error });
	});
});
