import _ from 'lodash';
import countries from 'i18n-iso-countries';

import vars from '../../../vars.json';
import app from '../../util/web';
import playerManager from '../../tracker/player-manager';
import database from '../../util/database';
import { getTotalGames, getDuels } from '../v1/player';
import { round2, getClan, ObjectNotFoundError, ObjectBannedError } from '../../util/util';

export function getLastGames(name) {
	return database.select('games.id', 'games.host', 'games.port', 'games.serverdesc as description', 'games.gamemode as gameMode', 'games.map as mapName', 'games.gametype as gameTypea', 'games.meta', 'games.timestamp as time', 'stats.flags', 'stats.frags', 'stats.deaths', 'stats.tks', 'stats.kpd', 'stats.acc').from('stats').join('games', 'games.id', 'stats.game').where('stats.name', name)
		.whereNot('stats.state', 5)
		.orderBy('games.id', 'desc')
		.limit(10)
		.then((results) => {
			_.each(results, (r, i) => {
				results[i].time = results[i].time.toISOString();
				try {
					results[i].meta = JSON.parse(results[i].meta);
				} catch (e) {
					results[i].meta = null;
				}
			});
			return results;
		});
}

export function getPlayer(name) {
	if (playerManager.banNames[name]) return Promise.reject(new ObjectBannedError());

	return database('players').where({ name }).then((rows) => {
		if (!rows.length) {
			throw new ObjectNotFoundError();
		} else {
			const row = rows[0];

			row.online = playerManager.isOnline(row.name);
			row.country = row.country || '';
			row.countryName = countries.getName(row.country, 'en');
			row.kpd = round2(row.frags / row.deaths);
			row.acc = round2(row.accFrags / row.frags);
			delete row.accFrags;

			row.instaStats = {
				frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0,
			};
			try {
				const stats = JSON.parse(row.instastats);
				const [frags, flags, deaths, tks, accFrags] = stats;
				row.instaStats = {
					frags,
					flags,
					deaths,
					tks,
					kpd: round2(frags / deaths) || 0,
					acc: round2(accFrags / frags) || 0,
				};
			} catch (e) {} // eslint-disable-line no-empty
			delete row.instastats;

			row.efficStats = {
				frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0,
			};
			try {
				const stats = JSON.parse(row.efficstats);
				const [frags, flags, deaths, tks, accFrags] = stats;
				row.efficStats = {
					frags,
					flags,
					deaths,
					tks,
					kpd: round2(frags / deaths) || 0,
					acc: round2(accFrags / frags) || 0,
				};
			} catch (e) {} // eslint-disable-line no-empty
			delete row.efficstats;

			const pclan = _.find(vars.clans, { tag: getClan(row.name) });
			if (pclan) {
				row.clan = pclan.title;
				row.clanTag = pclan.tag;
			}
			if (playerManager.isOnline(row.name)) row.online = true;
			return Promise.all([getTotalGames(name), getLastGames(name), database('playerranks').where({ name }), getDuels(name)])
				.then(results => Object.assign(row, {
					totalGames: parseInt(results[0], 10),
					latestGames: results[1],
					rank: results[2].length ? parseInt(results[2][0].rank, 10) : NaN,
					duelCount: results[3].total,
					duelWins: results[3].wins,
					duelLosses: results[3].losses,
					duelTies: results[3].ties,
				}));
		}
	});
}

app.get('/api/v2/player/:name', (req, res) => {
	getPlayer(req.params.name)
		.then((result) => {
			res.send(result);
		})
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'No player found with this name.' }); })
		.catch(ObjectBannedError, () => { res.status(400).send({ error: 'This player name is banned.' }); })
		.catch((err) => { res.status(500).send({ error: err.message }); });
});
