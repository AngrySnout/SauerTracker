import _ from 'lodash';
import Promise from 'bluebird';
import countries from 'i18n-iso-countries';

import app from '../util/web';
import cache from '../util/cache';
import {error} from '../util/util';
import database from '../util/database';
import redis from '../util/redis';

cache.set('top-10-players', 60*60*1000, function() {
	return database('players').select('name', 'frags').orderBy('frags', 'desc').limit(10);
});

function initialize() {
	database('players')
		.whereNot('country', 'unknown')
		.whereNot('country', '')
		.select('country')
		.sum('frags as frags')
		.groupBy('country')
		.orderBy('frags', 'desc')
		.then(rows => {
			_.each(rows, function (country) {
				redis.zaddAsync('top-countries', country.frags, country.country);
			});
		});
	database('games')
		.select('host', 'port', 'serverdesc')
		.groupBy('host', 'port', 'serverdesc')
		.then(rows => {
			_.each(rows, function (server) {
				redis.hsetAsync('server-descriptions', `${server.host}:${server.port}`, server.serverdesc);
			});
		});
}
initialize();

app.get('/about', function (req, res) {
	Promise.all([ cache.get('top-10-players'), redis.zrevrangeAsync('top-countries', 0, 9, 'WITHSCORES'), redis.zrevrangeAsync('server-ranks', 0, 9, 'WITHSCORES') ]).then(results => {
		let servers = [];
		for (let i = 0; i < results[2].length; i += 2) {
			servers.push(results[2][i]);
		}
		return redis.hmgetAsync('server-descriptions', servers).then(serverNames => {
			results.push(_.zipObject(servers, serverNames));
			return results;
		});
	}).then(results => {
		res.render('about', { topPlayers: results[0], topCountries: results[1], topServers: results[2], serverNames: results[3], countryName: countries.getName });
	}).catch(err => {
		error(err);
		res.render('about');
	});
});
