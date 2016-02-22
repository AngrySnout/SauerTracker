var _ = require('lodash');
var Promise = require("bluebird");

var web = require('../util/web');
var cache = require('../util/cache');
var util = require('../util/util');
var db = require("../util/database");
var vars = require("../../vars.json");
var config = require('../../tracker.json');

function getLatestGames(clan) {
	return db.db("games").where("meta", "like", "%"+clan.replace(/\"/g, '\\"')+"%").where({ gametype: "clanwar" }).orderBy("id", "desc").limit(10).then(rows => {
		_.each(rows, function (game) {
			if (game.meta) {
				try {
					game.meta = JSON.parse(game.meta);
				} catch (e) {
					game.meta = [];
				}
				if (game.meta[1] == game.meta[3]) game.draw = true;
			} else game.meta = [];
		});
		return rows;
	});
}

function getLatestMembers(clan) {
	return db.db("spy").where("name", "ilike", "%"+clan+"%").max("lastseen as lastseen").select("name").groupBy("name").orderBy("lastseen", "desc").limit(10);
}

web.app.get("/clan/:name", function(req, res) {
	Promise.all([ cache.get("clans"), getLatestGames(req.params.name), getLatestMembers(req.params.name) ])
	.spread((clans, latestGames, latestMembers) => {
		let clan = _.find(clans, { name: req.params.name });
		let info = _.find(vars.clans, { tag: req.params.name });
		if (clan && info) res.render("clan", { clan: clan, info: info, games: latestGames, members: latestMembers });
		else res.status(404).render("error", { status: 404 });
	}).catch(error => {
		util.error(error);
		res.status(500).render("error", { status: 500, error: error });
	});
});

web.app.get("/api/clan/:name", function(req, res) {
	Promise.all([ cache.get("clans"), getLatestGames(req.params.name), getLatestMembers(req.params.name) ])
	.spread((clans, latestGames, latestMembers) => {
		let clan = _.find(clans, { name: req.params.name });
		if (clan) res.send({ clan: clan, games: latestGames, members: latestMembers });
		else res.status(404).send({ error: "Clan not found." });
	}).catch(error => {
		util.error(error);
		res.status(500).send({ error: error });
	});
});
