import _ from 'lodash';
import Promise from "bluebird";

import vars from "../../../vars.json";

import app from '../../util/web';
import cache from '../../util/cache';
import {error, ObjectNotFoundError, escapePostgresLike} from '../../util/util';
import database from '../../util/database';

function getLatestGames(clan) {
	return database("games").where("meta", "like", "%"+escapePostgresLike(clan.replace(/\"/g, '\\"'))+"%").where({ gametype: "clanwar" }).orderBy("id", "desc").limit(10).then(rows => {
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
	return database("spy").where("name", "ilike", "%"+escapePostgresLike(clan)+"%").max("lastseen as lastseen").select("name").groupBy("name").orderBy("lastseen", "desc").limit(9);
}

export function getClan(name) {
	return Promise.all([ cache.get("clans"), getLatestGames(name), getLatestMembers(name) ])
		.spread((clans, latestGames, latestMembers) => {
			let clan = _.find(clans, { name: name });
			if (!clan) throw new ObjectNotFoundError();

			let info = _.find(vars.clans, { tag: name });
			return { clan: clan, info: info, games: latestGames, members: latestMembers };
		});
}

app.get("/api/clan/:name", function(req, res) {
	getClan(req.params.name)
		.then(result => { res.send(result); })
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: "Clan not found." }); })
		.catch(err => {
			error(err);
			res.status(500).send({ error: err.message });
		});
});
