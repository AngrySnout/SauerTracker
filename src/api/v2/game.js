import Promise from 'bluebird';
import countries from 'i18n-iso-countries';

import app from '../../util/web';
import { ObjectNotFoundError } from '../../util/util';
import serverManager from '../../tracker/server-manager';
import { getGameRow, getGameStats } from '../v1/game';
import database from '../../util/database';
import getCountry from '../../util/country';

export function getGameScores(id) {
  return database('scores')
    .where({ game: id })
    .select('team AS name', 'score');
}

export function getGame(id) {
  id = parseInt(id, 10);
  return Promise.all([
    getGameRow(id),
    getGameScores(id),
    getGameStats(id),
  ]).then(results => {
    if (!results[0]) {
      throw new ObjectNotFoundError();
    }

    const locals = {};
    locals.id = results[0].id;
    locals.clients = results[0].numplayers;
    locals.gameMode = results[0].gamemode;
    locals.gameType = results[0].gametype;
    locals.mapName = results[0].map;
    locals.time = results[0].timestamp.toISOString();

    locals.descriptionStyled = results[0].serverdesc;
    locals.description = results[0].serverdesc;
    locals.host = results[0].host;
    locals.port = results[0].port;
    locals.info = { website: '', demourl: '', banned: '' };

    const server = serverManager.find(results[0].host, results[0].port);
    if (server) locals.info = server.info;

    locals.country = getCountry(results[0].host);
    locals.countryName = locals.country
      ? countries.getName(locals.country, 'en')
      : 'Unknown';

    locals.meta = [];

    try {
      if (results[0].meta) locals.meta = JSON.parse(results[0].meta);
    } catch (e) {} // eslint-disable-line no-empty

    // eslint-disable-next-line prefer-destructuring
    locals.teams = results[1];
    // eslint-disable-next-line prefer-destructuring
    locals.players = results[2];

    return locals;
  });
}

app.get('/api/v2/game/:id', (req, res) => {
  getGame(req.params.id)
    .then(result => {
      res.send(result);
    })
    .catch(ObjectNotFoundError, () => {
      res.status(404).send({ error: 'Game not found.' });
    })
    .catch(err => {
      res.status(500).send({ error: err.message });
    });
});
