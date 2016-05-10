import _ from 'lodash';
import Promise from "bluebird";
import moment from 'moment';

import config from '../../tracker.json';

import app from '../util/web';
import database from '../util/database';

app.get("/stats", function(req, res) {
	var weekAgo = moment().endOf("day").subtract(7, "days").format("YYYY-MM-DD");
	let queries = [
		database.raw("SELECT to_char(timestamp, 'MM-DD') AS date, COUNT(DISTINCT trim(trailing '0123456789' from ip)) AS visitors, COUNT(url) AS requests FROM requests WHERE timestamp > '"+weekAgo+"' GROUP BY date ORDER BY date DESC").then(result => result.rows),
		database.raw("SELECT to_char(timestamp, 'MM-DD') AS date, COUNT(*) AS games FROM games WHERE timestamp > '"+weekAgo+"' GROUP BY date ORDER BY date DESC").then(result => result.rows)
	];
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
	database("requests").where("timestamp", "<", weekAgo).del().then();
}
setInterval(reapRequests, 5*60*60*1000);
reapRequests();
