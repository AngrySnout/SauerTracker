/*global module*/

var config = require('./tracker.json');

var database = {
	'client': 'pg',
	'connection': config.postgresURL,
	'searchPath': 'knex,public'
};

module.exports = {
	development: database,
	production: database
};
