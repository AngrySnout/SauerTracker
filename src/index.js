import startTeamBalanceServer from './api/team-balance';

require('./tracker/server-manager').default.start();
require('./tracker/player-manager').default.start();

require('./tracker/master').start();

require('./web');
startTeamBalanceServer();
