import _ from 'lodash';
import Promise from "bluebird";
import url from 'url';
import countries from "i18n-iso-countries";
import moment from 'moment';

import config from '../../tracker.json';
import vars from "../../vars.json";

import {log} from '../util/util';
import app from '../util/web';
import cache from '../util/cache';
import database from '../util/database';

cache.set("latest-duels", 10*60*1000, function(callback) {
	return database("games").where({ gametype: "duel" }).orderBy("timestamp", "desc").limit(10).then(rows => {
		_.each(rows, function(row) {
			try {
				row.meta = JSON.parse(row.meta);
			} catch (error) {
				row.meta = [0, 0, 0, 0];
			}
			if (row.meta[1] == row.meta[3]) row.draw = true;
		});
		return rows;
	});
});

cache.set("latest-clanwars", 10*60*1000, function(callback) {
	return database("games").where({ gametype: "clanwar" }).orderBy("timestamp", "desc").limit(10).then(rows => {
		_.each(rows, function(row) {
			try {
				row.meta = JSON.parse(row.meta);
			} catch (error) {
				ow.meta = [0, 0, 0, 0];
			}
			if (row.meta[1] == row.meta[3]) row.draw = true;
		});
		return rows;
	});
});

// cache.set("latest-mixes", 10*60*1000, function(callback) {
//	database("games").where({ gametype: "mix" }).orderBy("timestamp", "desc").limit(10).then(rows => {
// 		callback(rows);
// 	}).catch(error => callback());
// });

app.get("/games", (req, res) => {
    Promise.all([ cache.get("latest-duels"), cache.get("latest-clanwars")/*, cache.get("latest-mixes")*/ ])
    .then(results => {
        res.render("games", {vars: vars, _: _, latestDuels: results[0], latestClanwars: results[1]/*, latestMixes: results[2]*/});
    })
	.catch(error => {
		res.status(500).render("error", { status: 500, error: error });
	});
});

var pageLimit = 20;
var maxPageLimit = 1000;

// TODO: make results consistent with /api/game/
function findGames(params) {
	let query = database("games");

	if (params.serverdesc) query.where("serverdesc", "ilike", "%"+params.serverdesc+"%");
	let paramCrit = _.omitBy(_.pick(params, [ "host", "port", "gamemode", "gametype", "map" ]), _.isEmpty);
	if (paramCrit) query.where(paramCrit);

	if (params.fromdate) query.where("timestamp", ">=", params.fromdate);
	if (params.todate) query.where("timestamp", "<=", moment(params.todate, "YYYY-MM-DD").add(1, 'days').format("YYYY-MM-DD"));

	if (params.players) {
		let pls = _.trim(params.players).split(" ");
		if (pls.length > 1 || pls[0] !== "") {
			_.each(pls, pl => {
				query.where(function() {
					if (params.exact) this.where("players", "like", "% "+pl+" %");
					else this.where("players", "ilike", "%"+pl+"%");
					if (params.specs) {
						if (params.exact) this.orWhere("specs", "like", "% "+pl+" %");
						else this.orWhere("specs", "ilike", "%"+pl+"%");
					}
				});
			});
		}
	}

	let pagiQuery = query.clone().count("* as count").max("id as max").min("id as min");

	if (params.beforeid) query.where("id", "<", params.beforeid);
	if (params.afterid) query.where("id", ">", params.afterid);

	query.orderBy("id", params.afterid? "asc": "desc")
			.limit(params.limit? Math.min(params.limit, maxPageLimit): pageLimit);

	return Promise.all([ query, pagiQuery ]).then(results => {
		let games = results[0];
		if (params.afterid) games = games.reverse();
		_.each(games, function (gm) {
			if (gm.gametype == "intern") gm["isintern"] = true;
			else if (gm.gametype == "duel" || gm.gametype == "clanwar") gm["iswar"] = true;
			if (gm.meta) {
				try {
					gm.meta = JSON.parse(gm.meta);
				} catch (error) {
					gm.meta = [0, 0, 0, 0];
				}
				if (gm.meta[1] == gm.meta[3]) gm.draw = true;
			}
		});
		return { results: games, stats: results[1][0] };
	});
}

function prevPageURL(req, firstID) {
	let curURL = url.parse(req.url, true);
	curURL.query.afterid = firstID;
	delete curURL.query.beforeid;
    delete curURL.search;
    return url.format(curURL);
}

function nextPageURL(req, lastID) {
	let curURL = url.parse(req.url, true);
	curURL.query.beforeid = lastID;
	delete curURL.query.afterid;
    delete curURL.search;
    return url.format(curURL);
}

app.get('/games/find', function(req, res) {
	findGames(req.query).then(result => {
		let prevPage;
		let nextPage;
		if (result.results.length) {
			prevPage = (result.results[0].id < result.stats.max);
			nextPage = (result.results[result.results.length-1].id > result.stats.min);
		}
		res.render("games", _.assign( {
				vars: vars,
				_: _,
				query: req.query,
				prevPageURL: prevPage? prevPageURL(req, result.results[0].id): null,
				nextPageURL: nextPage? nextPageURL(req, result.results[result.results.length-1].id): null
			}, result));
	});
});

app.get('/api/games/find', function(req, res) {
	findGames(req.query).then(result => {
		res.send(result);
	});
});

app.get('/api/games/players', function(req, res) {
	if (!req.query.players) {
		res.status(400).send({ error: "You must provide a 'players' parameter in the query string." });
		return;
	}
	let promises = _.map(req.query.players.split(" "), name => findGames(_.assign({}, req.query, { players: name })));
	Promise.all(promises).then(results => {
		res.send(results);
	});
});
