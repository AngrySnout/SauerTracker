import _ from 'lodash';
import Promise from 'bluebird';
import countries from 'i18n-iso-countries';
import moment from 'moment';
import geoip from 'geoip-lite';

import {escapePostgresLike} from '../../util/util';
import app from '../../util/web';
import database from '../../util/database';
import serverManager from '../../tracker/server-manager';

var pageLimit = 20;
var maxPageLimit = 1000;

export function findGames(params) {
	let query = database('games');

	if (params.description) query.where('serverdesc', 'ilike', '%'+escapePostgresLike(params.description)+'%');
	let paramCrit = _.omitBy(_.pick(params, [ 'host', 'port', 'mode', 'type', 'map' ]), _.isEmpty);
	if (paramCrit.mode) {
		paramCrit.gamemode = paramCrit.mode;
		delete paramCrit.mode;
	}
	if (paramCrit.type) {
		paramCrit.gametype = paramCrit.type;
		delete paramCrit.type;
	}
	if (paramCrit) query.where(paramCrit);

	if (params.from) query.where('timestamp', '>=', params.from);
	if (params.to) query.where('timestamp', '<=', moment(params.to, 'YYYY-MM-DD').add(1, 'days').format('YYYY-MM-DD'));

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

	query = query.select('id', 'host', 'port', 'timestamp as time', 'map', 'gamemode as mode', 'gametype as type', 'numplayers as clients', 'meta', 'serverdesc as description');

	if (params.before) query.where('id', '<', params.before);
	if (params.after) query.where('id', '>', params.after);

	query.orderBy('id', params.after? 'asc': 'desc')
		.limit(params.limit? Math.min(params.limit, maxPageLimit): pageLimit);

	return Promise.all([ query, pagiQuery ]).then(results => {
		let games = results[0];
		if (params.after) games = games.reverse();
		_.each(games, function (gm) {
			if (gm.meta) {
				try {
					gm.meta = JSON.parse(gm.meta);
				} catch (error) {
					gm.meta = [0, 0, 0, 0];
				}
				if (gm.meta[1] == gm.meta[3]) gm.draw = true;
			}

			let server = serverManager.find(gm.host, gm.port);
			if (server) {
				gm.server = _.pick(server, [ 'descriptionStyled', 'description', 'country', 'countryName', 'host', 'port' ]);
			} else {
				gm.server = {
					descriptionStyle: gm.description,
					description: gm.description,
					host: gm.host,
					port: gm.port
				};
				let gipl = geoip.lookup(gm.host);
				gm.server.country = gipl? gipl.country: '';
				gm.server.countryName = gipl? countries.getName(gm.server.country, 'en'): 'Unknown';
			}
			delete gm.host;
			delete gm.port;
			delete gm.description;
		});
		return { results: games, stats: results[1][0] };
	});
}

app.get('/api/v2/games/find', function(req, res) {
	findGames(req.query).then(result => {
		res.send(result);
	});
});

app.get('/api/v2/games/players', function(req, res) {
	if (!req.query.players) {
		res.status(400).send({ error: 'You must provide a \'players\' parameter in the query string.' });
		return;
	}
	let promises = _.map(req.query.players.split(' '), name => findGames(_.assign({}, req.query, { players: name })));
	Promise.all(promises).then(results => {
		res.send(results);
	});
});
