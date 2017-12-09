import _ from 'lodash';
import Promise from 'bluebird';
import countries from 'i18n-iso-countries';

import app from '../util/web';
import cache from '../util/cache';
import {error} from '../util/util';
import database from '../util/database';

cache.set('top-10-players', 60*60*1000, function() {
	return database('players').select('name', 'frags').orderBy('frags', 'desc').limit(10);
});

cache.set('top-10-countries', 60*60*1000, function() {
	return database('players').whereNot('country', 'unknown').whereNot('country', '').select('country').sum('frags as frags').groupBy('country').orderBy('frags', 'desc').limit(10).then(rows => {
		_.each(rows, function (country) { country.name = countries.getName(country.country, 'en'); });
		return rows;
	});
});

cache.set('top-10-servers', 60*60*1000, function() {
	return database('games').select('host', 'port', 'serverdesc').count('* as count').groupBy('host', 'port', 'serverdesc').orderBy('count', 'desc').limit(10);
});

app.get('/about', function (req, res) {
	Promise.all([ cache.get('top-10-players'), cache.get('top-10-countries'), cache.get('top-10-servers') ]).then(results => {
		res.render('about', { topPlayers: results[0], topCountries: results[1], topServers: results[2] });
	}).catch(err => {
		error(err);
		res.render('about');
	});
});
