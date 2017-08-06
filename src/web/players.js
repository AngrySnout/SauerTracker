import _ from 'lodash';
import Promise from "bluebird";
import geoip from 'geoip-lite';
import countries from "i18n-iso-countries";
import moment from 'moment';

import app from '../util/web';
import cache from '../util/cache';
import database from '../util/database';
import playerManager from '../tracker/player-manager';
import {findPlayers} from '../api/v1/players';

cache.set("top-players-daily", 60*60*1000, function() {
	let start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").count("*").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNot('stats.state', 5).whereNot('frags', 0).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("count", "desc").limit(10);
});

cache.set("top-players-weekly", 2*60*60*1000, function() {
	var start = moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").count("*").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNot('stats.state', 5).whereNot('frags', 0).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("count", "desc").limit(10);
});

cache.set("top-players-monthly", 2*60*60*1000, function() {
	var start = moment().subtract(30, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").count("*").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNot('stats.state', 5).whereNot('frags', 0).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("count", "desc").limit(10);
});

cache.set("top-fraggers-daily", 60*60*1000, function() {
	let start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-fraggers-weekly", 2*60*60*1000, function() {
	var start = moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-fraggers-monthly", 2*60*60*1000, function() {
	var start = moment().subtract(30, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.frags as frags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("frags", "desc").limit(10);
});

cache.set("top-runners-daily", 60*60*1000, function() {
	var start = moment().startOf('day').format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

cache.set("top-runners-weekly", 2*60*60*1000, function() {
	var start = moment().subtract(7, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

cache.set("top-runners-monthly", 2*60*60*1000, function() {
	var start = moment().subtract(30, "days").format("YYYY-MM-DD HH:mm:ss");
	return database.select("stats.name as name").sum("stats.flags as flags").from("stats").join("games", "games.id", "stats.game").where("games.timestamp", ">", start).whereNotIn("name", _.keys(playerManager.banNames)).groupBy("name").orderBy("flags", "desc").limit(10);
});

function duelsSince(date) {
	let query = database("games").where({ gametype: "duel" }).whereNotNull("meta");
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
	return duelsSince(moment().subtract(7, "days").format("YYYY-MM-DD"));
});

cache.set("top-duelists-monthly", 2*60*60*1000, function() {
	return duelsSince(moment().subtract(30, "days").format("YYYY-MM-DD"));
});

cache.set("player-countries", 2*60*60*1000, function() {
	return database("players").select("country").count("* as count").groupBy("country").then(rows => {
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

app.get("/players", function(req, res) {
	Promise.all([ cache.get("top-fraggers-daily"), cache.get("top-fraggers-weekly"), cache.get("top-fraggers-monthly"),
			cache.get("top-runners-daily"), cache.get("top-runners-weekly"), cache.get("top-runners-monthly"),
			cache.get("top-duelists"), cache.get("top-duelists-weekly"), cache.get("top-duelists-monthly"),
			cache.get("top-players-daily"), cache.get("top-players-weekly"), cache.get("top-players-monthly"),
			cache.get("player-countries") ])
		.then(results => {
			res.render("players", {
				topFraggers: {
					"Today": results[0],
					"Last 7 days": results[1],
					"Last 30 days": results[2]
				},
				topRunners: {
					"Today": results[3],
					"Last 7 days": results[4],
					"Last 30 days": results[5]
				},
				topDuelists: {
					"Of all time": results[6],
					"Last 7 days": results[7],
					"Last 30 days": results[8]
				},
				topPlayers: {
					"Today": results[9],
					"Last 7 days": results[10],
					"Last 30 days": results[11]
				},
				countries: results[12]
			});
		}).catch(error => {
			res.status(500).render("error", { status: 500, error: error });
		});
});

app.get("/players/find", function(req, res) {
	findPlayers(req.query["name"], req.query["country"])
		.then(results => {
			cache.get("player-countries").then(countries => {
		        res.render("players", { results: results, name: req.query["name"], _: _, countries: countries });
			});
		})
		.catch(err => { res.status(500).render("error", { status: 500, error: results.error })});
});
