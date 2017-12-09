import knex from 'knex';

import config from '../../tracker.json';

var database = knex({
	client: 'pg',
	connection: config.postgresURL,
	searchPath: 'knex,public'
});
export default database;
