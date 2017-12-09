import _ from 'lodash';
import url from 'url';

import vars from '../../vars.json';

import app from '../util/web';
import cache from '../util/cache';
import database from '../util/database';
import {findGames} from '../api/v1/games';

cache.set('latest-duels', 10*60*1000, function() {
	return database('games').where({ gametype: 'duel' }).orderBy('timestamp', 'desc').limit(10).then(rows => {
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

cache.set('latest-clanwars', 10*60*1000, function() {
	return database('games').where({ gametype: 'clanwar' }).orderBy('timestamp', 'desc').limit(10).then(rows => {
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

app.get('/games', (req, res) => {
	Promise.all([ cache.get('latest-duels'), cache.get('latest-clanwars') ])
		.then(results => {
			res.render('games', { vars: vars, _: _, latestDuels: results[0], latestClanwars: results[1] });
		})
		.catch(err => {
			res.status(500).render('error', { status: 500, error: err.message });
		});
});

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
		res.render('games', _.assign( {
			vars: vars,
			_: _,
			query: req.query,
			prevPageURL: prevPage? prevPageURL(req, result.results[0].id): null,
			nextPageURL: nextPage? nextPageURL(req, result.results[result.results.length-1].id): null
		}, result));
	});
});
