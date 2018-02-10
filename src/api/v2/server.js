import moment from 'moment';

import app from '../../util/web';
import { error, ObjectNotFoundError } from '../../util/util';

import database from '../../util/database';
import serverManager from '../../tracker/server-manager';

export function findServer(host, port) {
	port = parseInt(port, 10);
	let server = serverManager.find(host, port);
	if (server) {
		server = server.serialize(true);

		server.website = null;
		server.banned = null;

		if (server.info) {
			server.website = server.info.website || null;
			server.banned = server.info.banned || null;
		}
		delete server.info;

		if (server.zombie) {
			delete server.zombie;
		}

		return database('serverranks').where({ host, port }).select('count', 'rank').then((result) => {
			if (result.length) {
				server.totalGames = result[0].count;
				server.rank = result[0].rank;
			}

			return server;
		});
	}
	return Promise.reject(new ObjectNotFoundError());
}

app.get('/api/v2/server/:host/:port', (req, res) => {
	findServer(req.params.host, req.params.port)
		.then((server) => { res.send(server); })
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'Server not found.' }); })
		.catch((err) => { res.status(500).send({ error: err }); });
});

function getActivityDay(host, port) {
	const today = moment().utc().startOf('day').format('YYYY-MM-DD');
	return database('games').where({ host, port }).where('timestamp', '>=', today).select('numplayers as clients', 'timestamp as time');
}

function getActivityMonth(host, port) {
	const thisMonth = moment().subtract(14, 'days').format('YYYY-MM-DD');
	return database('games').where({ host, port }).where('timestamp', '>=', thisMonth).select(database.raw('date_trunc(\'day\', timestamp) as date'))
		.count('* as games')
		.groupBy('date')
		.orderBy('date');
}

app.get('/api/v2/server/activity/:host/:port', (req, res) => {
	Promise.all([getActivityDay(req.params.host, req.params.port),
		getActivityMonth(req.params.host, req.params.port)])
		.then((results) => {
			res.send({ day: results[0], bimonth: results[1] });
		})
		.catch((err) => {
			error(err);
			res.status(500).send({ error: err });
		});
});
