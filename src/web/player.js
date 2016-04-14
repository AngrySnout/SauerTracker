var _ = require('lodash');
var Promise = require("bluebird");
var moment = require('moment');

var web = require('../util/web');
var db = require("../util/database");
var util = require("../util/util");
var player = require("../tracker/player");
var config = require('../../tracker.json');
var vars = require('../../vars.json');

function getTotalGames(name) {
	return db.db.count("* as count").from("stats").join("games", "games.id", "stats.game").where("stats.name", name).whereNot("stats.state", 5).then(rows => {
		return rows[0].count;
	});
}

function getLastGames(name) {
	return db.db.select("games.id", "games.host", "games.port", "games.serverdesc", "games.gamemode", "games.map", "games.gametype", "games.timestamp").from("stats").join("games", "games.id", "stats.game").where("stats.name", name).whereNot("stats.state", 5).orderBy("games.id", "desc").limit(10);
}

function getPlayer(name, callback) {
	if (player.banNames[name]) callback({ error: "This name is banned." });
	else {
		db.db("players").where({ name: name }).then(rows => {
			if (!rows.length) {
				callback({ error: "No player found with this name." });
			} else {
				let row = rows[0];
				try {
					row.efficstats = (row.efficstats)? JSON.parse(row.efficstats): [0, 0, 0, 0, 0, 0];
					row.instastats = (row.instastats)? JSON.parse(row.instastats): [0, 0, 0, 0, 0, 0];
				} catch (e) {
					util.error(e);
					row.efficstats = [0, 0, 0, 0, 0, 0];
					row.instastats = [0, 0, 0, 0, 0, 0];
				}
				if (!row.efficstats) row.efficstats = [0, 0, 0, 0, 0, 0];
				if (!row.instastats) row.instastats = [0, 0, 0, 0, 0, 0];
				let pclan = _.find(vars.clans, { "tag": util.getClan(row.name) });
				if (pclan) {
					row.clan = pclan.title;
					row.clanTag = pclan.tag;
				}
				Promise.all([getTotalGames(name), getLastGames(name)])
					.then(results => {
						callback({ player: row, totalGames: results[0], games: results[1] });
					})
					.catch(error => {
						util.error(error);
						callback({ player: row });
					});
			}
		});
	}
}

web.app.get("/player/:name", function(req, res) {
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

web.app.get("/api/player/:name", function(req, res) {
	getPlayer(req.params.name, result => {
		if (result.error) res.status(result.error=="No player found with this name."? 404: 500);
		res.send(result);
	});
});

web.app.get("/api/player/activity/:name", function(req, res) {
	var thisMonth = moment().subtract(14, "days").format("YYYY-MM-DD");
	db.db.select(db.db.raw("date_trunc('day', timestamp) as date")).count("* as count").from("games").where("timestamp", ">=", thisMonth).whereIn("id", db.db("stats").select("game").whereNot("stats.state", 5).where("name", req.params.name).whereNot("frags", 0)).groupBy("date").orderBy("date").then(rows => {
		res.send({ activity: rows });
	}).catch(error => {
		util.error(error);
		res.status(500).render("error", { status: status, error: error });
	});
});
