var config = require("./tracker.json");

module.exports = {
	development: config.database,
	production: config.database
};
