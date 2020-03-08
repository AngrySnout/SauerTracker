const config = require('./config.json');

const database = {
  client: 'pg',
  connection: config.postgresURL,
  searchPath: ['knex', 'public'],
};

module.exports = {
  development: database,
  production: database,
};
