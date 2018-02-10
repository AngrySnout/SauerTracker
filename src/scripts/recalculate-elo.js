/* eslint-disable import/first */
require('source-map-support').install();

import Promise from 'bluebird';
import _ from 'lodash';

import database from '../util/database';
import config from '../../tracker.json';
import { log } from '../util/util';

function calcEloChange(eloSelf, eloOther, fragsSelf, fragsOther) {
	if (fragsSelf < 1 || fragsOther < 1) return 0;
	return Math.round(10 * (Math.log(fragsSelf / fragsOther)
			+ Math.log(eloOther / eloSelf)) * (eloSelf / config.baseElo));
}

database('players').update({ elo: config.baseElo }).then(() => {
	database('games').where({ gametype: 'duel' }).orderBy('id', 'asc').then((rows) => {
		const newElos = {};
		_.each(rows, (row) => {
			try {
				const meta = JSON.parse(row.meta);

				if (!(meta[0] in newElos)) newElos[meta[0]] = config.baseElo;
				if (!(meta[2] in newElos)) newElos[meta[2]] = config.baseElo;

				const elod1 = calcEloChange(newElos[meta[0]], newElos[meta[2]], meta[1], meta[3]);
				const elod2 = calcEloChange(newElos[meta[2]], newElos[meta[0]], meta[3], meta[1]);

				newElos[meta[0]] += elod1;
				newElos[meta[2]] += elod2;
			} catch (e) { log(`Error parsing JSON: ${row.meta}`); }
		});
		return newElos;
	})
		.then(newElos => Promise.all(_.keys(newElos).map(player => database('players').where({ name: player }).update({ elo: newElos[player] }).then()
			.catch(() => log(`Error updating player Elo: ${player}`)))))
		.finally(process.exit);
});
