import _ from 'lodash';
import Promise from 'bluebird';
import moment from 'moment';

import {escapePostgresLike} from '../../util/util';
import app from '../../util/web';
import database from '../../util/database';

var pageLimit = 20;
var maxPageLimit = 1000;

export function findGames(params) {
	let query = database('games');

	if (params.serverdesc) query.where('serverdesc', 'ilike', '%'+escapePostgresLike(params.serverdesc)+'%');
	let paramCrit = _.omitBy(_.pick(params, [ 'host', 'port', 'gamemode', 'gametype', 'map' ]), _.isEmpty);
	if (paramCrit) query.where(paramCrit);

	if (params.fromdate) query.where('timestamp', '>=', params.fromdate);
	if (params.todate) query.where('timestamp', '<=', moment(params.todate, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD'));

	if (params.players) {
		let pls = _.trim(params.players).split(' ');
		if (pls.length > 1 || pls[0] !== '') {
			_.each(pls, pl => {
				query.where(function() {
					if (params.exact) this.where('players', 'like', '% '+escapePostgresLike(pl)+' %');
					else this.where('players', 'ilike', '%'+escapePostgresLike(pl)+'%');
					if (params.specs) {
						if (params.exact) this.orWhere('specs', 'like', '% '+escapePostgresLike(pl)+' %');
						else this.orWhere('specs', 'ilike', '%'+escapePostgresLike(pl)+'%');
					}
				});
			});
		}
	}

	let pagiQuery = query.clone().count('* as count').max('id as max').min('id as min');

	if (params.beforeid) query.where('id', '<', params.beforeid);
	if (params.afterid) query.where('id', '>', params.afterid);

	query.orderBy('id', params.afterid? 'asc': 'desc')
		.limit(params.limit? Math.min(params.limit, maxPageLimit): pageLimit);

	return Promise.all([ query, pagiQuery ]).then(results => {
		let games = results[0];
		if (params.afterid) games = games.reverse();
		_.each(games, function (gm) {
			if (gm.gametype == 'intern') gm['isintern'] = true;
			else if (gm.gametype == 'duel' || gm.gametype == 'clanwar') gm['iswar'] = true;
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

app.get('/api/games/find', function(req, res) {
	findGames(req.query).then(result => {
		res.send(result);
	});
});

app.get('/api/games/players', function(req, res) {
	if (!req.query.players) {
		res.status(400).send({ error: 'You must provide a \'players\' parameter in the query string.' });
		return;
	}
	let promises = _.map(req.query.players.split(' '), name => findGames(_.assign({}, req.query, { players: name })));
	Promise.all(promises).then(results => {
		res.send(results);
	});
});
