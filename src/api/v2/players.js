import app from '../../util/web';

import {findPlayers} from '../v1/players';

app.get('/api/v2/players/find', function(req, res) {
	findPlayers(req.query['name'], req.query['country'])
		.then(results => { res.send(results); })
		.catch(err => { res.status(500).send({ error: err.message }); });
});
