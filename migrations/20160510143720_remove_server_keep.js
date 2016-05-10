
exports.up = function(knex, Promise) {
	return knex.schema.table('servers', function (table) {
		table.dropColumn('keep');
	});
};

exports.down = function(knex, Promise) {
	return knex.schema.table('servers', function (table) {
		table.boolean('keep');
	});
};
