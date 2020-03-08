import _ from 'lodash';

import app from '../../util/web';
import { ObjectNotFoundError } from '../../util/util';

import database from '../../util/database';
import serverManager from '../../tracker/server-manager';

export function findServer(host, port) {
	port = parseInt(port, 10);
	let server = serverManager.find(host, port);
	if (server) {
		server = server.serialize(true);

		if (server.teams) server.teams = _.map(server.teams, (score, name) => ({ name, score }));

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
