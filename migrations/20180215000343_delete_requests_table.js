exports.up = function(knex) {
  return knex.schema.dropTable('requests');
};

exports.down = function(knex) {
  return knex.schema.createTableIfNotExists('requests', function(table) {
    table.increments();
    table.string('method');
    table.string('ip');
    table.text('url');
    table.float('time');
    table.dateTime('timestamp').defaultTo(knex.fn.now());
  });
};
