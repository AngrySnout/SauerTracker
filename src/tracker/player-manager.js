import _ from 'lodash';
import Promise from 'bluebird';

import { logInfo, logError } from '../util/util';
import database from '../util/database';
import Player from './player';
import { saveSpy } from './spy';

class PlayerManager {
  constructor() {
    this.players = {};
    this.oldPlayers = {};
    this.bans = {};
    this.banNames = {};
  }

  updatePlayer(gameMode, newState, oldState) {
    const { name } = newState;
    if (this.banNames[name] || this.bans[newState.ip]) return;
    if (!this.players[name]) this.players[name] = new Player(name);
    this.players[name].updateState(gameMode, newState, oldState);
  }

  flushPlayers() {
    const self = this;
    return database('players')
      .whereIn('name', _.map(self.players, 'name'))
      .then(rows => {
        rows = _.keyBy(rows, 'name');
        const players = _.values(self.players);
        const numPlayers = players.length;
        return database
          .transaction(trx =>
            Promise.all(
              _.map(players, player => player.saveStats(rows[player.name], trx))
            )
          )
          .then(() => {
            self.oldPlayers = self.players;
            self.players = {};
            return numPlayers;
          });
      })
      .then(numPlayers => {
        logInfo(`Players flushed, ${numPlayers} players updated`);
      })
      .then(saveSpy)
      .catch(error => {
        logError(`${error}`);
      });
  }

  isOnline(name) {
    return !!(this.players[name] || this.oldPlayers[name]);
  }

  start() {
    const self = this;
    database
      .select()
      .table('bans')
      .then(bans => {
        _.each(bans, ban => {
          if (ban.ip) self.bans[ban.ip] = true;
          if (ban.name) self.banNames[ban.name] = true;
        });
      });

    setInterval(() => {
      this.flushPlayers();
    }, 600000);

    process.on('SIGINT', () => {
      self.flushPlayers().finally(process.exit);
    });
  }
}

const playerManager = new PlayerManager();
export default playerManager;
