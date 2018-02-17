import app from '../../util/web';

import { getPlayer } from '../v1/player';
import { ObjectNotFoundError, ObjectBannedError } from '../../util/util';

app.get('/api/v2/player/:name', (req, res) => {
	getPlayer(req.params.name)
		.then((result) => {
			res.send(result);
		})
		.catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'No player found with this name.' }); })
		.catch(ObjectBannedError, () => { res.status(400).send({ error: 'This player name is banned.' }); })
		.catch((err) => { res.status(500).send({ error: err.message }); });
});
