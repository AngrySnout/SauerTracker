import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import {getServerList} from '../api/v1/servers';

app.get('/', function (req, res) {
	getServerList().then(list => {
		res.render('servers', {servers: _.orderBy(list, 'clients', 'desc'), sortedBy: 'clients', sortOrder: 'desc', vars: vars, noBanner: (req.query.banner==='no')});
	}).catch(err => {
		res.status(500).send({ error: err.message });
	});
});

app.get('/servers', function (req, res) {
	res.redirect('/');
});
