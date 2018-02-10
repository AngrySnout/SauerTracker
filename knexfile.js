/* global module */

const config = require('./tracker.json');

const database = {
	client: 'pg',
	connection: config.databaseConnection,
	searchPath: 'knex,public',
};

module.exports = {
	development: database,
	production: database,
};
