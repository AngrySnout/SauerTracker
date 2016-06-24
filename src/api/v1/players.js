import _ from 'lodash';

import app from '../../util/web';
import database from '../../util/database';
import playerManager from '../../tracker/player-manager';

export function findPlayers(name, country) {
	if (typeof name == 'undefined') name = '';
	let query = database('players').where('name', 'ilike', '%'+name+'%');
	if (country) {
		query.where(function() {
			if (country == '__') this.where({ country: '' }).orWhereNull('country');
			else this.where({ country: country });
		});
	}
	return query.orderBy('frags', 'desc').limit(200).then(rows => {
		_.each(rows, row => {
			if (playerManager.isOnline(row.name)) row.online = true;
		});
		return rows;
	});
}

app.get('/api/players/find', function(req, res) {
	findPlayers(req.query['name'], req.query['country'])
		.then(results => { res.send({ results: results }); })
		.catch(err => { res.status(500).send({ error: err.message }); });
});
