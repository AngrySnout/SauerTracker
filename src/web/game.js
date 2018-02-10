import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import { ObjectNotFoundError } from '../util/util';
import { getGame } from '../api/v1/game';

app.get('/game/:id', (req, res) => {
  getGame(req.params.id)
    .then((result) => {
      res.render('game', {
        id: req.params.id, server: result, _, vars,
      });
    })
    .catch(ObjectNotFoundError, () => { res.status(404).render('error', { status: 404, error: 'Game not found.' }); })
    .catch((err) => { res.status(500).render('error', { status: 500, error: result.error }); });
});
