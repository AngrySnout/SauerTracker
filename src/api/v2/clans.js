/* eslint-disable guard-for-in,no-restricted-syntax */
import _ from 'lodash';
import Promise from 'bluebird';

import vars from '../../../vars.json';

import app from '../../util/web';
import cache from '../../util/cache';
import { logError, round2 } from '../../util/util';
import redis from '../../util/redis';

cache.set('clans-v2', 10 * 60 * 1000, () => Promise.join(
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
				tag: clan.tag,
				title: clan.title,
				website: clan.website,
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
	return cache.get('clans-v2');
}

app.get('/api/v2/clans', (req, res) => {
	getClans().then((clans) => {
		res.send({ clans });
	}).catch((err) => {
		logError(err);
		res.status(500).send({ error: err.message });
	});
});
