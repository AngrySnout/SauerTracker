require('../api/v1/main');
require('../api/v2/main');

require('./about');
require('./servers');
require('./server');
require('./metrics');
require('./games');
require('./game');
require('./players');
require('./player');
require('./clans');
require('./clan');
require('./profile');
require('./stats');
require('./banners');

try {
	// compat.js provides backwards compatibily for certain routes,
	// and is not necessary for the Tracker
// eslint-disable-next-line import/no-unresolved,global-require
	require('./compat');
} catch (e) {} // eslint-disable-line no-empty
