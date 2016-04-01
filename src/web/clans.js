var _ = require('lodash');
var Promise = require("bluebird");
var moment = require('moment');

var web = require('../util/web');
var cache = require('../util/cache');
var util = require("../util/util");
var db = require("../util/database");
var vars = require("../../vars.json");

cache.set("clans", 60*60*1000, function() {
	return db.db("games").where({ gametype: "clanwar" }).select("meta").then(rows => {
		var clans = {};
		_.each(rows, function (row) {
			try {
				if (row.meta) row.meta = JSON.parse(row.meta);
				if (!row.meta) {
					row.meta = null;
					return;
				}
				clans[row.meta[0]] = clans[row.meta[0]]&&clans[row.meta[0]]+1||1;
				clans[row.meta[2]] = clans[row.meta[2]]&&clans[row.meta[2]]+1||1;
			} catch (e) {
				row.meta = null;
				util.debug(e);
			}
		});
		var wins = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[2]: "";
		});
		var losses = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[0]: "";
		});
		var clns = _.orderBy(_.map(vars.clans, function (clan) {
			if (!wins[clan.tag]) wins[clan.tag] = 0;
			if (!losses[clan.tag]) losses[clan.tag] = 0;
			var draws_2 = ((clans[clan.tag]||0)-((wins[clan.tag]||0)+(losses[clan.tag]||0)))/2;
			var rate = (clans[clan.tag]? (wins[clan.tag]+draws_2)/clans[clan.tag]: 0);
			return { "name": clan.tag, "wins": wins[clan.tag], "losses": losses[clan.tag], "rate": rate, "points": (wins[clan.tag]+draws_2)*rate };
		}), "points", "desc");
		var rank = 1;
		_.each(clns, function (clan) {
			clan.rank = rank++;
		});
		return clns;
	});
});

function clanwarsSince(date) {
	return db.db("games").where({ gametype: "clanwar" }).where("timestamp", ">=", date).select("meta").then(rows => {
		var clans = {};
		_.each(rows, function (row) {
			try {
				if (row.meta) row.meta = JSON.parse(row.meta);
				if (!row.meta) {
					row.meta = null;
					return;
				}
				clans[row.meta[0]] = clans[row.meta[0]]&&clans[row.meta[0]]+1||1;
				clans[row.meta[2]] = clans[row.meta[2]]&&clans[row.meta[2]]+1||1;
			} catch (e) {
				row.meta = null;
				util.debug(e);
			}
		});
		var wins = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[2]: "";
		});
		var losses = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[0]: "";
		});
		return _.take(_.orderBy(_.map(clans, (games, clan) => {
			let draws_2 = (games-((wins[clan]||0)+(losses[clan]||0)))/2;
			return {
				name: clan,
				wins: wins[clan]||0,
				rate: games? ((wins[clan]||0)+draws_2)/games: 0
			};
		}), ["wins", "rate"], ["desc", "desc"]), 10);
	});
}

cache.set("clans-weekly", 60*60*1000, function() {
	return clanwarsSince(moment().utc().subtract(7, "days").format("YYYY-MM-DD"));
});

cache.set("clans-monthly", 60*60*1000, function() {
	return clanwarsSince(moment().utc().subtract(30, "days").format("YYYY-MM-DD"));
});

web.app.get("/clans", function(req, res) {
	Promise.all([cache.get("clans"), cache.get("clans-weekly"), cache.get("clans-monthly")]).then().spread((clans, weekly, monthly) => {
		res.render("clans", { clans: clans, weeklyClans: weekly, monthlyClans: monthly });
	}).catch(error => {
		util.error(error);
		res.status(500).render("error", { status: 500, error: error });
	});
});

web.app.get("/api/clans", function(req, res) {
	cache.get("clans").then(clans => {
		res.send({ clans: clans });
	}).catch(error => {
		util.error(error);
		res.status(500).send("clans", { error: error });
	});
});
