import _ from 'lodash';
import Promise from 'bluebird';
import geoip from 'geoip-lite';
import countries from 'i18n-iso-countries';

import app from '../../util/web';
import { ObjectNotFoundError } from '../../util/util';
import serverManager from '../../tracker/server-manager';
import { getGameRow, getGameScores, getGameStats } from '../v1/game';

export function getGame(id) {
  id = parseInt(id);
  return Promise.all([getGameRow(id), getGameScores(id), getGameStats(id)]).then((results) => {
    if (!results[0]) {
      throw new ObjectNotFoundError();
    }

    const locals = {};
    locals.id = results[0].id;
    locals.clients = results[0].numplayers;
    locals.mode = results[0].gamemode;
    locals.type = results[0].gametype;
    locals.map = results[0].map;
    locals.time = results[0].timestamp;

    const server = serverManager.find(results[0].host, results[0].port);
    if (server) {
      locals.server = _.pick(server, ['descriptionStyled', 'description', 'country', 'countryName', 'host', 'port']);
      locals.server.website = server.info.website || null;
      locals.server.banned = server.info.banned || null;
    } else {
      locals.server = {
        descriptionStyle: results[0].serverdesc,
        description: results[0].serverdesc,
        host: results[0].host,
        port: results[0].port,
        website: null,
        banned: null,
      };
      const gipl = geoip.lookup(results[0].host);
      locals.server.country = gipl ? gipl.country : '';
      locals.server.countryName = gipl ? countries.getName(locals.server.country, 'en') : 'Unknown';
    }

    locals.meta = [];

    try {
      if (results[0].meta) locals.meta = JSON.parse(results[0].meta);
    } catch (e) {}

    locals.teams = _.mapValues(_.keyBy(results[1], 'team'), 'score');
    locals.players = results[2];

    return locals;
  });
}

app.get('/api/v2/game/:id', (req, res) => {
  getGame(req.params.id)
    .then((result) => { res.send(result); })
    .catch(ObjectNotFoundError, () => { res.status(404).send({ error: 'Game not found.' }); })
    .catch((err) => { res.status(500).send({ error: err.message }); });
});
