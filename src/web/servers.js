import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import redis from '../util/redis';

app.get('/', (req, res) => {
	redis.getAsync('server-list').then((list) => {
		res.render('servers', {
			servers: _.orderBy(list ? JSON.parse(list) : [], 'clients', 'desc'), sortedBy: 'clients', sortOrder: 'desc', vars, noBanner: (req.query.banner === 'no'),
		});
	}).catch((err) => {
		res.status(500).send({ error: err.message });
	});
});

app.get('/servers', (req, res) => {
	res.redirect('/');
});
