var _ = require('lodash');
var Promise = require("bluebird");
var countries = require("i18n-iso-countries");

var web = require('../util/web');
var cache = require('../util/cache');
var util = require('../util/util');
var db = require('../util/database');

cache.set("top-players", 60*60*1000, function() {
	return db.db("players").select("name", "frags").orderBy("frags", "desc").limit(10);
});

cache.set("top-countries", 60*60*1000, function() {
	return db.db("players").whereNot("country", "unknown").whereNot("country", "").select("country").sum("frags as frags").groupBy("country").orderBy("frags", "desc").limit(10).then(rows => {
		_.each(rows, function (country) { country.name = countries.getName(country.country, "en"); });
		return rows;
	});
});

cache.set("top-servers", 60*60*1000, function() {
	return db.db("games").select("host", "port", "serverdesc").count("* as count").groupBy("host", "port", "serverdesc").orderBy("count", "desc").limit(10);
});

web.app.get('/about', function (req, res) {
	Promise.all([ cache.get("top-players"), cache.get("top-countries"), cache.get("top-servers") ]).then(results => {
		res.render('about', { topPlayers: results[0], topCountries: results[1], topServers: results[2] });
	}).catch(error => {
		util.error(error);
		res.render('about');
	});
});
