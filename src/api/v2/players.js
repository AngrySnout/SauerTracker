import _ from 'lodash';

import app from '../../util/web';
import { round2, escapePostgresLike } from '../../util/util';
import database from '../../util/database';
import playerManager from '../../tracker/player-manager';
import { getCountryName } from '../../util/country';

export function findPlayers(name, country) {
	if (typeof name === 'undefined') name = '';
	const query = database('players').where('name', 'ilike', `%${escapePostgresLike(name)}%`);
	if (country) {
		query.where(function () {
			if (country === '__') this.where({ country: '' }).orWhereNull('country');
			else this.where({ country });
		});
	}
	return query.orderBy('frags', 'desc').limit(200).then((rows) => {
		_.each(rows, (row) => {
			row.online = playerManager.isOnline(row.name);
			row.country = row.country || '';
			row.countryName = getCountryName(row.country);
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
		});
		return rows;
	});
}

app.get('/api/v2/players/find', (req, res) => {
	findPlayers(req.query.name, req.query.country)
		.then((results) => { res.send(results); })
		.catch((err) => { res.status(500).send({ error: err.message }); });
});
