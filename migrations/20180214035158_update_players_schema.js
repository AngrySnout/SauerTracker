exports.up = function(knex) {
  return knex
    .raw(
      'ALTER TABLE players ADD COLUMN "accFrags" double precision; UPDATE players SET "accFrags" = players.acc * players.frags'
    )
    .then(() =>
      knex.schema.table('players', function(table) {
        table.dropColumn('countryName');
        table.dropColumn('acc');
        table.dropColumn('kpd');
      })
    );
};

exports.down = function(knex) {
  return knex.schema.table('players', function(table) {
    table.dropColumn('accFrags');
    table.text('countryName');
    table.float('acc');
    table.float('kpd');
  });
};
