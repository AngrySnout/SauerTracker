/* eslint-disable no-unused-vars */
import Promise from 'bluebird';

import app from '../../util/web';
import cache from '../../util/cache';
import serverManager from '../../tracker/server-manager';
import redis from '../../util/redis';

app.get('/api/v2/servers', (req, res) => {
	redis.getAsync('server-list')
		.then((list) => {
			const servers = JSON.parse(list);
			res.send(servers);
		})
		.catch((err) => { res.status(500).send({ error: err }); });
});
