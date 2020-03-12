/* eslint-disable import/first */
require('source-map-support').install();

import Promise from 'bluebird';
import _ from 'lodash';

import database from '../util/database';
import { calcEloChange } from '../tracker/game';
import { getBaseElo } from '../util/config';

database('players')
  .update({ elo: getBaseElo() })
  .then(() => {
    database('games')
      .where({ gametype: 'duel' })
      .orderBy('id', 'asc')
      .then(rows => {
        const newElos = {};
        _.each(rows, row => {
          try {
            const meta = JSON.parse(row.meta);

            if (!(meta[0] in newElos)) newElos[meta[0]] = getBaseElo();
            if (!(meta[2] in newElos)) newElos[meta[2]] = getBaseElo();

            const elod1 = calcEloChange(
              newElos[meta[0]],
              newElos[meta[2]],
              meta[1],
              meta[3]
            );
            const elod2 = calcEloChange(
              newElos[meta[2]],
              newElos[meta[0]],
              meta[3],
              meta[1]
            );

            newElos[meta[0]] += elod1;
            newElos[meta[2]] += elod2;
          } catch (e) {
            console.log(`Error parsing JSON: ${row.meta}`);
          } // eslint-disable-line no-console
        });
        return newElos;
      })
      .then(newElos =>
        Promise.all(
          _.keys(newElos).map(player =>
            database('players')
              .where({ name: player })
              .update({ elo: newElos[player] })
              .then()
              .catch(() => console.log(`Error updating player Elo: ${player}`))
          )
        )
      ) // eslint-disable-line no-console
      .finally(process.exit);
  });
