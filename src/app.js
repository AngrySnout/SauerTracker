require('source-map-support').install();

import database from './util/database';
import serverManager from './tracker/server-manager';
import cache from './util/cache';
import playerManager from './tracker/player-manager';
import {startTeamBalanceServer} from './api/v1/players.js';
import redis from './util/redis';

serverManager.start();
cache.start();
playerManager.start();
startTeamBalanceServer();

require('./util/admin');
require('./web/main');

process.on('SIGINT', () => {
	playerManager.flushplayers().finally(process.exit);
});
