exports.up = function(knex) {
  return Promise.all([
    knex.raw(
      'DELETE FROM spy a USING spy b WHERE a.id < b.id AND a.name = b.name AND a.ip = b.ip'
    ),
    knex.raw(
      'DELETE FROM bans a USING bans b WHERE a.id < b.id AND a.name = b.name AND a.ip = b.ip'
    ),
    knex.raw(
      'DELETE FROM servers a USING servers b WHERE a.id < b.id AND a.host = b.host AND a.port = b.port'
    ),
  ]).then(() =>
    Promise.all([
      knex.schema.table('spy', function(table) {
        table.unique(['name', 'ip']);
      }),
      knex.schema.table('bans', function(table) {
        table.unique(['name', 'ip']);
      }),
      knex.schema.table('servers', function(table) {
        table.unique(['host', 'port']);
      }),
    ])
  );
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.table('spy', function(table) {
      table.dropUnique(['name', 'ip']);
    }),
    knex.schema.table('bans', function(table) {
      table.dropUnique(['name', 'ip']);
    }),
    knex.schema.table('servers', function(table) {
      table.dropUnique(['host', 'port']);
    }),
  ]);
};
