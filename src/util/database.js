import knex from 'knex';

import config from '../../config.json';

const database = knex({
  client: 'pg',
  connection: config.postgresURL,
  searchPath: ['knex', 'public'],
});
export default database;
