import moment from 'moment';
import Promise from 'bluebird';

import app from '../../util/web';
import { error, ObjectNotFoundError } from '../../util/util';

import database from '../../util/database';
import redis from '../../util/redis';
import serverManager from '../../tracker/server-manager';

function populateRanks() {
	database('games')
		.select('host', 'port')
		.count('*')
		.groupBy('host', 'port')
		.then((rows) => {
			// eslint-disable-next-line no-restricted-syntax
			for (const row of rows) {
				redis.zaddAsync('server-ranks', row.count, `${row.host}:${row.port}`);
			}
		});
}
populateRanks();

export function findServer(host, port) {
	port = parseInt(port, 10);
	let server = serverManager.find(host, port);
	if (server) {
		server = server.game.serialize();
		return Promise.join(
			redis.zrevrankAsync('server-ranks', `${host}:${port}`), redis.zscoreAsync('server-ranks', `${host}:${port}`),
			(rank, score) => {
				if (rank) server.rank = rank;
				if (score) server.totalGames = score;
				return server;
			},
		).finally(() => server);
	} return Promise.reject(new ObjectNotFoundError());
}

app.get('/api/server/:host/:port', (req, res) => {
	findServer(req.params.host, req.params.port)
		.then((server) => { res.send(server); })
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'Server not found.' }); })
		.catch((err) => { res.status(500).send({ error: err }); });
});

function getActivityDay(host, port) {
	const today = moment().utc().startOf('day').format('YYYY-MM-DD');
	return database('games').where({ host, port }).where('timestamp', '>=', today).select('numplayers', 'timestamp');
}

function getActivityMonth(host, port) {
	const thisMonth = moment().subtract(14, 'days').format('YYYY-MM-DD');
	return database('games').where({ host, port }).where('timestamp', '>=', thisMonth).select(database.raw('date_trunc(\'day\', timestamp) as date'))
		.count('* as count')
		.groupBy('date')
		.orderBy('date');
}

app.get('/api/server/activity/:host/:port', (req, res) => {
	Promise.all([getActivityDay(req.params.host, req.params.port),
		getActivityMonth(req.params.host, req.params.port)])
		.then((results) => {
			res.send({ day: results[0], month: results[1] });
		})
		.catch((err) => {
			error(err);
			res.status(500).send({ error: err.message });
		});
});
