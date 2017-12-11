/* eslint-disable no-unused-vars */

require('source-map-support').install();

import config from '../tracker.json';
import database from './util/database';
import cache from './util/cache';

if (config.tracker.enable) {
	require('./tracker/server-manager').default.start();
	require('./tracker/player-manager').default.start();
}

if (config.master.enable) {
	require('./tracker/master').start(config.master.updateInterval * 1000);
}

if (config.irc.enable) {
	require('./util/admin');
}

if (config.website.enable) {
	require('./web/main');
	require('./api/v1/players.js').startTeamBalanceServer();
}
