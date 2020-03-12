exports.up = function(knex) {
  return Promise.all([
    knex.schema.createTable('players', function(table) {
      table.increments();
      table.string('name').index();
      table.integer('frags');
      table.integer('flags');
      table.integer('deaths');
      table.integer('tks');
      table.float('kpd');
      table.float('acc');
      table.text('instastats');
      table.text('efficstats');
      table.integer('elo');
      table.string('country');
      table.string('countryName');
    }),

    knex.schema.createTable('games', function(table) {
      table.increments();
      table.string('host');
      table.integer('port');
      table.dateTime('timestamp').defaultTo(knex.fn.now());
      table.string('serverdesc');
      table.string('map');
      table.string('gamemode');
      table.integer('numplayers');
      table.string('gametype');
      table.string('meta');
      table.text('players');
      table.text('specs');
      table.index('id');
      table.index(['host', 'port']);
    }),

    knex.schema.createTable('scores', function(table) {
      table.increments();
      table.integer('game').index();
      table.string('team');
      table.integer('score');
    }),

    knex.schema.createTable('stats', function(table) {
      table.increments();
      table.integer('game').index();
      table.integer('cn');
      table.string('name');
      table.string('team');
      table.integer('frags');
      table.integer('flags');
      table.integer('deaths');
      table.integer('tks');
      table.float('kpd');
      table.float('acc');
      table.string('ip');
      table.string('country');
      table.integer('state');
    }),

    knex.schema.createTable('servers', function(table) {
      table.increments();
      table.string('host');
      table.integer('port');
      table.string('website');
      table.string('demourl');
      table.string('banned');
      table.boolean('keep');
    }),

    knex.schema.createTable('bans', function(table) {
      table.increments();
      table.string('ip');
      table.string('name');
    }),

    knex.schema.createTableIfNotExists('spy', function(table) {
      table.increments();
      table.string('name').index();
      table.string('ip').index();
      table.string('country');
      table.dateTime('lastseen');
      table.string('lshost');
      table.integer('lsport');
    }),

    knex.schema.createTableIfNotExists('requests', function(table) {
      table.increments();
      table.string('method');
      table.string('ip');
      table.text('url');
      table.float('time');
      table.dateTime('timestamp').defaultTo(knex.fn.now());
    }),
  ]);
};

exports.down = function(knex) {};
