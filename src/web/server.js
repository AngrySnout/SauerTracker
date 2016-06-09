import _ from 'lodash';
import Promise from "bluebird";
import moment from 'moment';

import vars from "../../vars.json";

import app from '../util/web';
import cache from '../util/cache';
import {error} from '../util/util';

import database from '../util/database';
import serverManager from '../tracker/server-manager';

function populateRanks() {
	database.raw("DROP TABLE IF EXISTS serverranks").then(() => {
		database.raw("CREATE TABLE serverranks AS SELECT ranked.*, rank() OVER (ORDER BY count DESC) AS rank FROM (SELECT host, port, count(*) FROM games GROUP BY host, port) AS ranked ORDER BY rank ASC").then();
	}).catch(err => {
		error(err);
	});
}
populateRanks();
setInterval(populateRanks, 10*60*1000);

app.get('/api/server/:host/:port', function (req, res) {
    let host = req.params.host;
    let port = parseInt(req.params.port);
    let server = serverManager.find(host, port);
    if (server) {
        server = server.game.serialize();
        database("serverranks").where({ host: host, port: port }).select("count", "rank").then(result => {
			if (result.length) {
	            server.totalGames = result[0].count;
	            server.rank = result[0].rank;
			}
        }).finally(() => {
            res.send(server);
        });
    } else res.status(404).send({ error: "Server not found." });
});

app.get('/server/:host/:port', function (req, res) {
    let host = req.params.host;
    let port = parseInt(req.params.port);
    let server = serverManager.find(host, port);
    if (server) {
        server = server.game.serialize();
        database("serverranks").where({ host: host, port: port }).select("count", "rank").then(result => {
			if (result.length) {
	            server.totalGames = result[0].count;
	            server.rank = result[0].rank;
			}
        }).finally(() => {
            res.render('server', { server: server, vars: vars, _: _, bannerURL: vars.bannerURL });
        });
    } else res.status(404).render("error", { status: 404 });
});

function getActivityDay(host, port) {
	let today = moment().utc().startOf("day").format("YYYY-MM-DD");
    return database("games").where({ host: host, port: port }).where("timestamp", ">=", today).select("numplayers", "timestamp");
}

function getActivityMonth(host, port) {
    let thisMonth = moment().subtract(14, "days").format("YYYY-MM-DD");
    return database("games").where({ host: host, port: port }).where("timestamp", ">=", thisMonth).select(database.raw("date_trunc('day', timestamp) as date")).count("* as count").groupBy("date").orderBy("date");
}

app.get('/api/server/activity/:host/:port', function(req, res) {
	Promise.all([getActivityDay(req.params.host, req.params.port), getActivityMonth(req.params.host, req.params.port)]).then(results => {
		res.send({ day: results[0], month: results[1] });
	}).catch(error => {
		util.error(error);
		res.status(500).send({ error: error });
	});
});
