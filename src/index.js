import config from '../config.json';
// import database from './util/database';
// import cache from './util/cache';
import startTeamBalanceServer from './api/team-balance';

if (config.tracker.enable) {
  require('./tracker/server-manager').default.start();
  require('./tracker/player-manager').default.start();
}

if (config.master.enable) {
  require('./tracker/master').start();
}

if (config.website.enable) {
  require('./web');
  startTeamBalanceServer();
}
