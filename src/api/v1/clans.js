/* eslint-disable guard-for-in,no-restricted-syntax */
import _ from 'lodash';
import Promise from 'bluebird';

import vars from '../../../vars.json';

import app from '../../util/web';
import cache from '../../util/cache';
import { logWarn, logError, round2 } from '../../util/util';
import database from '../../util/database';
import redis from '../../util/redis';

export function initialize() {
	return database('games').where({ gametype: 'clanwar' }).select('meta').then((rows) => {
		const clans = {};
		_.each(rows, (row) => {
			try {
				if (row.meta) row.meta = JSON.parse(row.meta);
				if (!row.meta) {
					row.meta = null;
					return;
				}
				clans[row.meta[0]] = clans[row.meta[0]] && clans[row.meta[0]] + 1 || 1;
				clans[row.meta[2]] = clans[row.meta[2]] && clans[row.meta[2]] + 1 || 1;
			} catch (e) {
				row.meta = null;
				logWarn(e);
			}
		});
		const wins = _.countBy(rows, row => ((row.meta && row.meta[1] !== row.meta[3]) ? row.meta[2] : ''));
		const losses = _.countBy(rows, row => ((row.meta && row.meta[1] !== row.meta[3]) ? row.meta[0] : ''));
		Promise.all([redis.delAsync('clan-games'), redis.delAsync('clan-wins'), redis.delAsync('clan-losses')])
			.then(() => {
				for (const clan in clans) {
					redis.hset('clan-games', clan, clans[clan] || 0);
				}
				for (const clan in wins) {
					redis.hset('clan-wins', clan, wins[clan] || 0);
				}
				for (const clan in losses) {
					redis.hset('clan-losses', clan, losses[clan] || 0);
				}
			});
	});
}
initialize();

cache.set('clans', 10 * 60 * 1000, () => Promise.join(
	redis.hgetallAsync('clan-games'), redis.hgetallAsync('clan-wins'), redis.hgetallAsync('clan-losses'),
	(games, wins, losses) => {
		games = _.mapValues(games, Number);
		wins = _.mapValues(wins, Number);
		losses = _.mapValues(losses, Number);
		const clns = _.orderBy(_.map(vars.clans, (clan) => {
			if (!wins[clan.tag]) wins[clan.tag] = 0;
			if (!losses[clan.tag]) losses[clan.tag] = 0;
			const draws = ((games[clan.tag] || 0) - ((wins[clan.tag] || 0) + (losses[clan.tag] || 0)));
			const rate = (games[clan.tag] ? (wins[clan.tag] + draws / 2) / games[clan.tag] : 0);
			return {
				name: clan.tag,
				wins: wins[clan.tag],
				losses: losses[clan.tag],
				ties: draws,
				rate: round2(rate),
				points: round2((wins[clan.tag] + draws / 2) * rate),
			};
		}), 'points', 'desc');
		let rank = 1;
		_.each(clns, (clan) => {
			clan.rank = rank++;
		});
		return clns;
	},
));

export function getClans() {
	return cache.get('clans');
}

app.get('/api/clans', (req, res) => {
	getClans().then((clans) => {
		res.send({ clans });
	}).catch((err) => {
		logError(err);
		res.status(500).send({ error: err.message });
	});
});
