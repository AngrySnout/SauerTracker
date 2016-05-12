var config = require("./tracker.json");

var database = {
	"client": "pg",
	"connection": config.databaseConnection,
	"searchPath": "knex,public"
};

module.exports = {
	development: database,
	production: database
};
