import knex from 'knex';

import { getDatabaseURL } from '../util/config';

const database = knex({
  client: 'pg',
  connection: getDatabaseURL(),
  searchPath: ['knex', 'public'],
});
export default database;
