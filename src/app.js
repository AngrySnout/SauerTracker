require('source-map-support').install();

import database from './util/database';
import serverManager from './tracker/server-manager';
import cache from './util/cache';
import playerManager from './tracker/player-manager';

serverManager.start();
cache.start();
playerManager.start();

require('./util/admin');
require('./web/main');

process.on('SIGINT', () => {
	playerManager.flushplayers().finally(process.exit);
});
