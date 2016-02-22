require('source-map-support').install();
require('./util/database').start();
require('./tracker/server-list').start();
require('./util/admin');
require('./web/main');
require('./util/cache').start();
var player = require('./tracker/player');
player.start();

process.on('SIGINT', () => {
	player.flushplayers().finally(process.exit);
});
