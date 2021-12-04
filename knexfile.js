const database = {
  client: 'pg',
  connection: process.env.DATABASE_URL,
  searchPath: ['knex', 'public'],
};

module.exports = {
  development: database,
  production: database,
};
