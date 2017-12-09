import _ from 'lodash';
import Promise from 'bluebird';
import moment from 'moment';

import app from '../util/web';
import cache from '../util/cache';
import {debug, error} from '../util/util';
import database from '../util/database';
import {getClans} from '../api/v1/clans';

function clanwarsSince(date) {
	return database('games').where({ gametype: 'clanwar' }).where('timestamp', '>=', date).select('meta').then(rows => {
		var clans = {};
		_.each(rows, function (row) {
			try {
				if (row.meta) row.meta = JSON.parse(row.meta);
				if (!row.meta) {
					row.meta = null;
					return;
				}
				clans[row.meta[0]] = clans[row.meta[0]]&&clans[row.meta[0]]+1||1;
				clans[row.meta[2]] = clans[row.meta[2]]&&clans[row.meta[2]]+1||1;
			} catch (e) {
				row.meta = null;
				debug(e);
			}
		});
		var wins = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[2]: '';
		});
		var losses = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[0]: '';
		});
		return _.take(_.orderBy(_.map(clans, (games, clan) => {
			let draws_2 = (games-((wins[clan]||0)+(losses[clan]||0)))/2;
			return {
				name: clan,
				wins: wins[clan]||0,
				rate: games? ((wins[clan]||0)+draws_2)/games: 0
			};
		}), ['wins', 'rate'], ['desc', 'desc']), 10);
	});
}

cache.set('clans-weekly', 60*60*1000, function() {
	return clanwarsSince(moment().utc().subtract(7, 'days').format('YYYY-MM-DD'));
});

cache.set('clans-monthly', 60*60*1000, function() {
	return clanwarsSince(moment().utc().subtract(30, 'days').format('YYYY-MM-DD'));
});

app.get('/clans', function(req, res) {
	Promise.all([getClans(), cache.get('clans-weekly'), cache.get('clans-monthly')]).then().spread((clans, weekly, monthly) => {
		res.render('clans', { clans: clans, weeklyClans: weekly, monthlyClans: monthly });
	}).catch(err => {
		error(err);
		res.status(500).render('error', { status: 500, error: err.message });
	});
});
