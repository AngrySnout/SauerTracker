import _ from 'lodash';
import Promise from 'bluebird';
import moment from 'moment';

import { escapePostgresLike } from '../../util/util';
import app from '../../util/web';
import database from '../../util/database';
import serverManager from '../../tracker/server-manager';
import getCountry, { getCountryName } from '../../util/country';

const pageLimit = 20;
const maxPageLimit = 1000;

export function findGames(params) {
  let query = database('games');

  if (params.description)
    query.where(
      'serverdesc',
      'ilike',
      `%${escapePostgresLike(params.description)}%`
    );
  const paramCrit = _.omitBy(
    _.pick(params, ['host', 'port', 'mode', 'type', 'map']),
    _.isEmpty
  );
  if (paramCrit.mode) {
    paramCrit.gamemode = paramCrit.mode;
    delete paramCrit.mode;
  }
  if (paramCrit.type) {
    paramCrit.gametype = paramCrit.type;
    delete paramCrit.type;
  }
  if (paramCrit) query.where(paramCrit);

  if (params.from) query.where('timestamp', '>=', params.from);
  if (params.to)
    query.where(
      'timestamp',
      '<=',
      moment(params.to, 'YYYY-MM-DD')
        .add(1, 'days')
        .format('YYYY-MM-DD')
    );

  if (params.players) {
    const pls = _.trim(params.players).split(' ');
    if (pls.length > 1 || pls[0] !== '') {
      _.each(pls, pl => {
        query.where(function() {
          if (params.exact)
            this.where('players', 'like', `% ${escapePostgresLike(pl)} %`);
          else this.where('players', 'ilike', `%${escapePostgresLike(pl)}%`);
          if (params.specs) {
            if (params.exact)
              this.orWhere('specs', 'like', `% ${escapePostgresLike(pl)} %`);
            else this.orWhere('specs', 'ilike', `%${escapePostgresLike(pl)}%`);
          }
        });
      });
    }
  }

  const pagiQuery = query
    .clone()
    .count('* as count')
    .max('id as last')
    .min('id as first');

  query = query.select(
    'id',
    'host',
    'port',
    'timestamp as time',
    'map as mapName',
    'gamemode as gameMode',
    'gametype as gameType',
    'numplayers as clients',
    'meta',
    'serverdesc as description'
  );

  if (params.before) query.where('id', '<', params.before);
  if (params.after) query.where('id', '>', params.after);

  query
    .orderBy('id', params.after ? 'asc' : 'desc')
    .limit(params.limit ? Math.min(params.limit, maxPageLimit) : pageLimit);

  return Promise.all([query, pagiQuery]).then(results => {
    let games = results[0];
    if (params.after) games = games.reverse();
    _.each(games, gm => {
      gm.time = gm.time.toISOString();

      if (gm.meta) {
        try {
          gm.meta = JSON.parse(gm.meta);
        } catch (error) {
          gm.meta = [0, 0, 0, 0];
        }
        if (gm.meta[1] === gm.meta[3]) gm.draw = true;
      }

      const server = serverManager.find(gm.host, gm.port);
      if (server) {
        gm = Object.assign(
          gm,
          _.pick(server, [
            'descriptionStyled',
            'description',
            'country',
            'countryName',
            'host',
            'port',
            'info',
          ])
        );
      } else {
        gm.descriptionStyled = gm.description;
      }
      gm.country = getCountry(gm.host);
      gm.countryName = gm.country
        ? getCountryName(gm.country)
        : 'Unknown';
    });
    results[1][0].count = parseInt(results[1][0].count, 10);
    return { results: games, stats: results[1][0] };
  });
}

app.get('/api/v2/games/find', (req, res) => {
  findGames(req.query).then(result => {
    res.send(result);
  });
});
