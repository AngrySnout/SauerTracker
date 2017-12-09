import moment from 'moment';

import app from '../../util/web';
import {error, ObjectNotFoundError} from '../../util/util';

import database from '../../util/database';
import serverManager from '../../tracker/server-manager';

function populateRanks() {
	database.raw('BEGIN; CREATE TABLE serverranks2 AS SELECT ranked.*, rank() OVER (ORDER BY count DESC) AS rank FROM (SELECT host, port, count(*) FROM games GROUP BY host, port) AS ranked ORDER BY rank ASC; CREATE INDEX ON serverranks2 (host, port); DROP TABLE IF EXISTS serverranks; ALTER TABLE serverranks2 RENAME TO serverranks; COMMIT;').catch(err => {
		error(err);
	});
}
populateRanks();
setInterval(populateRanks, 10*60*1000);

export function findServer(host, port) {
	port = parseInt(port);
	let server = serverManager.find(host, port);
	if (server) {
		server = server.game.serialize();
		return database('serverranks').where({ host: host, port: port }).select('count', 'rank').then(result => {
			if (result.length) {
				server.totalGames = result[0].count;
				server.rank = result[0].rank;
			}
			return server;
		}).finally(() => {
			return Promise.resolve(server);
		});
	} else return Promise.reject(new ObjectNotFoundError());
}

app.get('/api/server/:host/:port', function (req, res) {
	findServer(req.params.host, req.params.port)
		.then(server => { res.send(server); })
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'Server not found.' }); })
		.catch(err => { res.status(500).send({ error: err }); });
});

function getActivityDay(host, port) {
	let today = moment().utc().startOf('day').format('YYYY-MM-DD');
	return database('games').where({ host: host, port: port }).where('timestamp', '>=', today).select('numplayers', 'timestamp');
}

function getActivityMonth(host, port) {
	let thisMonth = moment().subtract(14, 'days').format('YYYY-MM-DD');
	return database('games').where({ host: host, port: port }).where('timestamp', '>=', thisMonth).select(database.raw('date_trunc(\'day\', timestamp) as date')).count('* as count').groupBy('date').orderBy('date');
}

app.get('/api/server/activity/:host/:port', function(req, res) {
	Promise.all([getActivityDay(req.params.host, req.params.port), getActivityMonth(req.params.host, req.params.port)])
		.then(results => {
			res.send({ day: results[0], month: results[1] });
		})
		.catch(err => {
			error(err);
			res.status(500).send({ error: err.message });
		});
});
