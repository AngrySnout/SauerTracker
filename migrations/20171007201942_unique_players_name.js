exports.up = function(knex) {
  return knex.schema.table('players', function(table) {
    table.unique('name');
  });
};

exports.down = function(knex) {
  return knex.schema.table('players', function(table) {
    table.dropUnique('name');
  });
};
