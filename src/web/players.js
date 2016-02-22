var _ = require('lodash');
var Promise = require("bluebird");
var geoip = require('geoip-lite');
var countries = require("i18n-iso-countries");
var moment = require("moment");

var web = require('../util/web');
var cache = require('../util/cache');
var util = require('../util/util');
var db = require("../util/database");
import {servers} from '../tracker/server-list';
var player = require("../tracker/player");
var config = require('../../tracker.json');

cache.set("top-players-daily", 60*60*1000, function() {
	let start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-players-weekly", 2*60*60*1000, function() {
	var start = moment().startOf('week').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-players-monthly", 2*60*60*1000, function() {
	var start = moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-runners-daily", 60*60*1000, function() {
	var start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

cache.set("top-runners-weekly", 2*60*60*1000, function() {
	var start = moment().startOf('week').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

cache.set("top-runners-monthly", 2*60*60*1000, function() {
	var start = moment().startOf('month').format("YYYY-MM-DD HH:mm:ss");
	return db.db.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(player.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

function duelsSince(date) {
	let query = db.db("games").where({ gametype: "duel" }).whereNotNull("meta");
	if (date) query = query.where("timestamp", ">=", date);
	query = query.select("meta").then(rows => {
		var duelists = {};
		_.each(rows, function (row) {
			if (row.meta) {
				try {
					row.meta = JSON.parse(row.meta);
					duelists[row.meta[0]] = duelists[row.meta[0]]&&duelists[row.meta[0]]+1||1;
					duelists[row.meta[2]] = duelists[row.meta[2]]&&duelists[row.meta[2]]+1||1;
				} catch (e) {
					row.meta = null;
					util.debug(e, row);
				}
			}
		});
		var wins = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[2]: "";
		});
		return _.take(_.orderBy(_.map(duelists, (games, player) => { return { name: player, wins: wins[player]||0, games: games }; }), ["wins", "games"], ["desc", "asc"]), 10);
	});
	return query;
}

cache.set("top-duelists", 60*60*1000, function() {
	return duelsSince();
});

cache.set("top-duelists-weekly", 2*60*60*1000, function() {
	return duelsSince(moment().startOf('week').format("YYYY-MM-DD"));
});

cache.set("top-duelists-monthly", 2*60*60*1000, function() {
	return duelsSince(moment().startOf('month').format("YYYY-MM-DD"));
});

cache.set("player-countries", 2*60*60*1000, function() {
	return db.db("players").select("country").count("* as count").groupBy("country").then(rows => {
		let sumUnknown = 0;
		let newList = [];
		_.each(rows, function (country, ind) {
			if (!country.country) sumUnknown += parseInt(country.count);
			else {
				country.name = countries.getName(country.country, "en")||country.country||"Unknown";
				newList.push(country);
			}
		});
		newList.push({ country: "__", name: "Unknown", count: sumUnknown });
		return _.orderBy(newList, "name");
	});
});

function findPlayers(name, country, callback) {
	let query = db.db("players").where("name", "ilike", "%"+name+"%");
	if (country) {
		query.where(function() {
			if (country == "__") this.where({ country: "" }).orWhereNull("country");
			else this.where({ country: country });
		});
	}
	query.orderBy("frags", "desc").limit(200).then(rows => {
		_.each(rows, row => {
			if (player.isOnline(row.name)) row.online = true;
		});
		callback({ results: rows });
	}).catch(error => {
		callback({ error: error });
	});
}

web.app.get("/players", function(req, res) {
	Promise.all([ cache.get("top-players-daily"), cache.get("top-players-weekly"), cache.get("top-players-monthly"),
			cache.get("top-runners-daily"), cache.get("top-runners-weekly"), cache.get("top-runners-monthly"),
			cache.get("top-duelists"), cache.get("top-duelists-weekly"), cache.get("top-duelists-monthly"),
			cache.get("player-countries") ])
		.then(results => {
			res.render("players", {
				topFraggers: {
					"Today": results[0],
					"This week": results[1],
					"This month": results[2]
				},
				topRunners: {
					"Today": results[3],
					"This week": results[4],
					"This month": results[5]
				},
				topDuelists: {
					"Of all time": results[6],
					"This week": results[7],
					"This month": results[8]
				},
				countries: results[9]
			});
		}).catch(error => {
			res.status(500).render("error", { status: 500, error: error });
		});
});

web.app.get("/players/find", function(req, res) {
	findPlayers(req.query["name"], req.query["country"], results => {
		if (results.error) {
			res.status(500).render("error", { status: 500, error: results.error });
		} else {
			cache.get("player-countries").then(countries => {
		        res.render("players", _.assign(results, { name: req.query["name"], _: _, countries: countries }));
			});
		}
    });
});

web.app.get("/api/players/find", function(req, res) {
	findPlayers(req.query["name"], req.query["country"], results => {
		if (results.error) res.status(500);
        res.send(results);
    });
});
