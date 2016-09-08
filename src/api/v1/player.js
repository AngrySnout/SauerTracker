import _ from 'lodash';
import Promise from "bluebird";
import moment from 'moment';

import vars from "../../../vars.json";

import app from '../../util/web';
import {getClan, error, ObjectNotFoundError, ObjectBannedError} from "../../util/util";
import playerManager from "../../tracker/player-manager";
import database from '../../util/database';

function populateRanks() {
	database.raw("BEGIN; CREATE TABLE playerranks2 AS SELECT ranked.*, rank() OVER (ORDER BY frags DESC) AS rank FROM (SELECT name, frags FROM players) AS ranked ORDER BY rank ASC; CREATE INDEX ON playerranks2 (name); DROP TABLE IF EXISTS playerranks; ALTER TABLE playerranks2 RENAME TO playerranks; COMMIT;").catch(err => {
		error(err);
	});
}
populateRanks();
setInterval(populateRanks, 10*60*1000);

function getTotalGames(name) {
	return database.count('* as count').from('stats').join('games', 'games.id', 'stats.game').where('stats.name', name).whereNot('stats.state', 5).then(rows => {
		return rows[0].count;
	});
}

function getDuels(name) {
	return database.select('meta').from('games').where('gametype', 'duel').where('meta', 'LIKE', `%${name}%`)
		.then(rows => {
			let res = { total: rows.length, wins: 0, losses: 0, ties: 0 };
			_.each(rows, row => {
				try {
					let meta = JSON.parse(row.meta);
					if (meta[1] == meta[3]) res.ties++;
					else if (meta[0] == name) res.losses++;
					else res.wins++;
				} catch (err) {}
			});
			return res;
		});
}

function getLastGames(name) {
	return database.select('games.id', 'games.host', 'games.port', 'games.serverdesc', 'games.gamemode', 'games.map', 'games.gametype', 'games.timestamp').from('stats').join('games', 'games.id', 'stats.game').where('stats.name', name).whereNot('stats.state', 5).orderBy('games.id', 'desc').limit(10);
}

export function getPlayer(name) {
	if (playerManager.banNames[name]) return Promise.reject(new ObjectBannedError());
	else {
		return database("players").where({ name: name }).then(rows => {
			if (!rows.length) {
				throw new ObjectNotFoundError();
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
				return Promise.all([getTotalGames(name), getLastGames(name), database('playerranks').where({ name: name }), getDuels(name)])
					.then(results => {
						return { player: row, totalGames: results[0], games: results[1], rank: results[2].length? results[2][0].rank: undefined, duelStats: results[3] };
					});
			}
		});
	}
}

app.get('/api/player/:name', function(req, res) {
	getPlayer(req.params.name)
		.then(result => { res.send(result); })
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: "No player found with this name." }) })
		.catch(ObjectBannedError, () => { res.status(400).send({ error: "This player name is banned." }) })
		.catch(err => { res.status(500).send({ error: err.message }) });
});

app.get('/api/player/activity/:name', function(req, res) {
	var thisMonth = moment().subtract(14, 'days').format('YYYY-MM-DD');
	database.select(database.raw("date_trunc('day', timestamp) as date")).count('* as count').from('games').where('timestamp', '>=', thisMonth).whereIn('id', database('stats').select('game').whereNot('stats.state', 5).where('name', req.params.name).whereNot('frags', 0)).groupBy('date').orderBy('date').then(rows => {
		res.send({ activity: rows });
	}).catch(err => {
		error(err);
		res.status(500).send({ error: err.message });
	});
});
