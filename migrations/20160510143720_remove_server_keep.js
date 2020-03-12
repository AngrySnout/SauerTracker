exports.up = function(knex) {
  return knex.schema.table('servers', function(table) {
    table.dropColumn('keep');
  });
};

exports.down = function(knex) {
  return knex.schema.table('servers', function(table) {
    table.boolean('keep');
  });
};
