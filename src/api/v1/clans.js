import _ from 'lodash';

import vars from '../../../vars.json';

import app from '../../util/web';
import cache from '../../util/cache';
import { debug, error, round2 } from '../../util/util';
import database from '../../util/database';

cache.set('clans', 60 * 60 * 1000, () => database('games')
  .where({ gametype: 'clanwar' })
  .select('meta')
  .then((rows) => {
    const clans = {};
    _.each(rows, (row) => {
      try {
        if (row.meta) row.meta = JSON.parse(row.meta);
        if (!row.meta) {
          row.meta = null;
          return;
        }
        clans[row.meta[0]] = clans[row.meta[0]] && clans[row.meta[0]] + 1 || 1;
        clans[row.meta[2]] = clans[row.meta[2]] && clans[row.meta[2]] + 1 || 1;
      } catch (e) {
        row.meta = null;
        debug(e);
      }
    });
    const wins = _.countBy(rows,
      row => ((row.meta && row.meta[1] !== row.meta[3]) ? row.meta[2] : ''));
    const losses = _.countBy(rows,
      row => ((row.meta && row.meta[1] !== row.meta[3]) ? row.meta[0] : ''));
    const clns = _.orderBy(_.map(vars.clans, (clan) => {
      if (!wins[clan.tag]) wins[clan.tag] = 0;
      if (!losses[clan.tag]) losses[clan.tag] = 0;
      const draws = ((clans[clan.tag] || 0) -
        ((wins[clan.tag] || 0) + (losses[clan.tag] || 0)));
      const rate = (clans[clan.tag] ? (wins[clan.tag] + draws / 2) /
        clans[clan.tag] : 0);
      return {
        name: clan.tag,
        wins: wins[clan.tag],
        losses: losses[clan.tag],
        ties: draws,
        rate: round2(rate),
        points: round2((wins[clan.tag] + (draws / 2)) * rate),
      };
    }), 'points', 'desc');
    let rank = 1;
    _.each(clns, (clan) => {
      clan.rank = rank++;
    });
    return clns;
  }));

export function getClans() {
  return cache.get('clans');
}

app.get('/api/clans', (req, res) => {
  getClans().then((clans) => {
    res.send({ clans });
  }).catch((err) => {
    error(err);
    res.status(500).send({ error: err.message });
  });
});
