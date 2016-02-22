var _ = require('lodash');
var moment = require('moment');
var Promise = require('bluebird');

var db = require("../util/database");
var web = require('../util/web');
var config = require('../../tracker.json');

web.app.get("/stats", function(req, res) {
	var weekAgo = moment().endOf("day").subtract(7, "days").format("YYYY-MM-DD");
	let queries;
	if (config.database.client == "pg") {
		queries = [
			db.db.raw("SELECT to_char(timestamp, 'MM-DD') AS date, COUNT(DISTINCT trim(trailing '0123456789' from ip)) AS visitors, COUNT(url) AS requests FROM requests WHERE timestamp > '"+weekAgo+"' GROUP BY date ORDER BY date DESC").then(result => result.rows),
			db.db.raw("SELECT to_char(timestamp, 'MM-DD') AS date, COUNT(*) AS games FROM games WHERE timestamp > '"+weekAgo+"' GROUP BY date ORDER BY date DESC").then(result => result.rows)
		];
	} else {
		queries = [
			db.db.raw("SELECT strftime('%m-%d', timestamp) AS date, count(DISTINCT rtrim(ip, '0123456789')) AS visitors, count(url) AS requests FROM requests WHERE timestamp > '"+weekAgo+"' GROUP BY strftime('%m-%d', timestamp) ORDER BY strftime('%Y-%m-%d', timestamp) DESC"),
			db.db.raw("SELECT strftime('%m-%d', timestamp) AS date, count(*) AS games FROM games WHERE timestamp > '"+weekAgo+"' GROUP BY strftime('%m-%d', timestamp) ORDER BY strftime('%Y-%m-%d', timestamp) DESC")
		];
	}
	Promise.all(queries).spread((visits, games) => {
			let stats = _.keyBy(visits, "date");
			_.each(games, game => {
				if (!stats[game.date]) stats[game.date] = game;
				else stats[game.date].games = game.games;
			});
			stats = _.orderBy(_.values(stats), "date", "desc");
			res.render("stats", { stats: stats, today: moment().format("MM-DD"), yesterday: moment().subtract(1, "days").format("MM-DD") });
		}
	);
});

function reapRequests() {
	var weekAgo = moment().endOf("day").subtract(8, "days").format("YYYY-MM-DD");
	db.db("requests").where("timestamp", "<", weekAgo).del().then();
}
setInterval(reapRequests, 5*60*60*1000);
reapRequests();
