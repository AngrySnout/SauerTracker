import app from '../../util/web';

import {getPlayer} from '../v1/player';

app.get('/api/v2/player/:name', function(req, res) {
	getPlayer(req.params.name)
		.then(result => {
			res.send(result);
		})
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: "No player found with this name." }) })
		.catch(ObjectBannedError, () => { res.status(400).send({ error: "This player name is banned." }) })
		.catch(err => { res.status(500).send({ error: err.message }) });
});

app.get('/api/v2/player/activity/:name', function(req, res) {
	var thisMonth = moment().subtract(14, 'days').format('YYYY-MM-DD');
	database.select(database.raw("date_trunc('day', timestamp) as date")).count('* as count').from('games').where('timestamp', '>=', thisMonth).whereIn('id', database('stats').select('game').whereNot('stats.state', 5).where('name', req.params.name).whereNot('frags', 0)).groupBy('date').orderBy("date").then(rows => {
		res.send({ activity: rows });
	}).catch(err => {
		error(err);
		res.status(500).send({ error: err.message });
	});
});
