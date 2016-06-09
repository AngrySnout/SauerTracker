import _ from 'lodash';
import Promise from "bluebird";

import vars from "../../vars.json";

import app from '../util/web';
import cache from '../util/cache';
import {error} from '../util/util';
import database from '../util/database';

function getLatestGames(clan) {
	return database("games").where("meta", "like", "%"+clan.replace(/\"/g, '\\"')+"%").where({ gametype: "clanwar" }).orderBy("id", "desc").limit(10).then(rows => {
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
	return database("spy").where("name", "ilike", "%"+clan+"%").max("lastseen as lastseen").select("name").groupBy("name").orderBy("lastseen", "desc").limit(10);
}

app.get("/clan/:name", function(req, res) {
	Promise.all([ cache.get("clans"), getLatestGames(req.params.name), getLatestMembers(req.params.name) ])
	.spread((clans, latestGames, latestMembers) => {
		let clan = _.find(clans, { name: req.params.name });
		let info = _.find(vars.clans, { tag: req.params.name });
		if (clan && info) res.render("clan", { clan: clan, info: info, games: latestGames, members: latestMembers, bannerURL: vars.bannerURL });
		else res.status(404).render("error", { status: 404 });
	}).catch(err => {
		error(err);
		res.status(500).render("error", { status: 500, error: error });
	});
});

app.get("/api/clan/:name", function(req, res) {
	Promise.all([ cache.get("clans"), getLatestGames(req.params.name), getLatestMembers(req.params.name) ])
	.spread((clans, latestGames, latestMembers) => {
		let clan = _.find(clans, { name: req.params.name });
		let info = _.find(vars.clans, { tag: req.params.name });
		if (clan) res.send({ clan: clan, info: info, games: latestGames, members: latestMembers });
		else res.status(404).send({ error: "Clan not found." });
	}).catch(err => {
		error(err);
		res.status(500).send({ error: error });
	});
});
