import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import { ObjectNotFoundError, ObjectBannedError } from '../util/util';
import { getPlayer } from '../api/v1/player';

app.get('/player/:name', (req, res) => {
  getPlayer(req.params.name)
    .then((result) => { res.render('player', _.assign(result, { _, vars })); })
    .catch(ObjectNotFoundError, () => { res.status(404).render('error', { status: 404, error: 'No player found with this name.' }); })
    .catch(ObjectBannedError, () => { res.status(400).render('error', { status: 400, error: 'This player name is banned.' }); })
    .catch((err) => { res.status(500).render('error', { status: 500, error: err.message }); });
});
