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
require('./help');
require('./stats');
require('./banners');

try {
  // compat.js provides backwards compatibily for certain routes, and is not necessary for the Tracker
  require('./compat');
} catch (e) {}
