import _ from 'lodash';
import Promise from 'bluebird';

import app from '../../util/web';
import { round2, ObjectNotFoundError } from '../../util/util';
import database from '../../util/database';
import serverManager from '../../tracker/server-manager';
import getCountry, { getCountryName } from '../../util/country';

export function getGameScores(id) {
  return database('scores')
    .where({ game: id })
    .select('team', 'score');
}

export function getGameStats(id) {
  return database('stats')
    .where({ game: id })
    .select(
      'name',
      'team',
      'frags',
      'flags',
      'deaths',
      'tks',
      'acc',
      'country',
      'state',
      'kpd'
    )
    .then(rows => {
      _.each(rows, plr => {
        if (!plr.country || plr.country === 'unknown') {
          plr.country = '';
          plr.countryName = 'Unknown';
        } else plr.countryName = getCountryName(plr.country);
        if (!plr.kpd) plr.kpd = round2(plr.frags / Math.max(plr.deaths, 1));
      });
      return rows;
    });
}

export function getGameRow(id) {
  return database('games')
    .where({ id })
    .then(rows => rows[0]);
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
    locals.description = results[0].serverdesc;
    locals.clients = results[0].numplayers;
    locals.gameMode = results[0].gamemode;
    locals.gameType = results[0].gametype;
    locals.mapName = results[0].map;
    locals.time = results[0].timestamp;
    locals.host = results[0].host;
    locals.port = results[0].port;

    try {
      if (results[0].meta) locals.meta = JSON.parse(results[0].meta);
    } catch (e) {} // eslint-disable-line no-empty

    const server = serverManager.find(results[0].host, results[0].port);

    if (server) {
      locals.descriptionStyled =
        server.descriptionStyled || results[0].serverdesc;
      locals.info = server.info;
    } else {
      locals.descriptionStyled = results[0].serverdesc;
      locals.info = {};
    }

    if (server && server.country) {
      locals.country = server.country;
      locals.countryName = server.countryName;
    } else {
      locals.country = getCountry(results[0].host);
      locals.countryName = locals.country
        ? getCountryName(locals.country)
        : 'Unknown';
    }

    locals.teams = _.mapValues(_.keyBy(results[1], 'team'), 'score');
    // eslint-disable-next-line prefer-destructuring
    locals.players = results[2];

    return locals;
  });
}

app.get('/api/game/:id', (req, res) => {
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
