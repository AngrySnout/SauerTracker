import _ from 'lodash';
import Promise from 'bluebird';
import dgram from 'dgram';

import config from '../../../tracker.json';

import {log, escapePostgresLike} from '../../util/util';
import app from '../../util/web';
import database from '../../util/database';
import playerManager from '../../tracker/player-manager';
import Packet from '../../util/packet';

export function findPlayers(name, country) {
	if (typeof name == 'undefined') name = '';
	let query = database('players').where('name', 'ilike', '%'+escapePostgresLike(name)+'%');
	if (country) {
		query.where(function() {
			if (country == '__') this.where({ country: '' }).orWhereNull('country');
			else this.where({ country: country });
		});
	}
	return query.orderBy('frags', 'desc').limit(200).then(rows => {
		_.each(rows, row => {
			if (playerManager.isOnline(row.name)) row.online = true;
		});
		return rows;
	});
}

app.get('/api/players/find', function(req, res) {
	findPlayers(req.query['name'], req.query['country'])
		.then(results => { res.send({ results: results }); })
		.catch(err => { res.status(500).send({ error: err.message }); });
});

export function makeTeams(names, mode, map) {
	if (names.length > 64) names = names.slice(0, 64);

	// Get average number of frags and of flags per game for each player for selected map and mode
	let query1 = database.avg('frags as avgFrags').avg('flags as avgFlags').select('stats.name').from('stats').join('games', 'games.id', 'stats.game').where('gametype', 'mix');
	if (mode) query1 = query1.where('gamemode', mode);
	// if (map) query1 = query1.where('map', map);
	query1 = query1.whereRaw('games.timestamp > CURRENT_DATE - INTERVAL \'3 months\'').whereIn('stats.name', names).whereNot('stats.state', 5).groupBy('stats.name');

	// Get average number of frags and of flags per game for selected mode and map
	let query2 = database.avg('frags as avgFrags').avg('flags as avgFlags').from('stats').join('games', 'games.id', 'stats.game');
	if (mode) query2 = query2.where('gamemode', mode);
	if (map) query2 = query2.where('map', map);

	return Promise.join(query1, query2, (players, avgStats) => {
		players = _.keyBy(players, 'name');

		// 16 and 0.5 are roughly the global averages of frags and flags per game,
		// respectively, as of December 2nd, 2016
		let avgFrags = avgStats[0].avgFrags || 16;
		let avgFlags = avgStats[0].avgFlags || 0.5;

		let stats = _.map(players, player => {
			// Normalize fragginess and flagginess for selected mode and map and give
			// fragginess a higher weight

			var fragginess = (player.avgFrags || avgFrags)*(1.5 / avgFrags);
			var flagginess = (player.avgFlags || avgFlags)*(1   / avgFlags);

			return { name: player.name, fragginess: fragginess, flagginess: flagginess, score: fragginess+flagginess };
		});

		// Give players which have no data for selected mode and map (average stats - 10%)
		let missing = _.difference(names, _.keys(players));
		if (missing.length) {
			let meanFragginess = _.meanBy(stats, 'fragginess');
			let meanFlagginess = _.meanBy(stats, 'flagginess');
			meanFragginess *= 0.9;
			meanFlagginess *= 0.9;

			_.each(missing, player => {
				stats.push({ name: player, fragginess: meanFragginess, flagginess: meanFlagginess, score: meanFragginess+meanFlagginess });
			});
		}

		stats = _.orderBy(stats, ['score'], ['desc']);

		let teams = [{ fragginess: 0, flagginess: 0, players: [] }, { fragginess: 0, flagginess: 0, players: [] }];

		// Split players in the following order:
		// TeamA  TeamB
		//  _0______1_
		//          |
		//  _3______2_
		//   |
		//  _4______5_
		for (let i = 0; i < stats.length; i++) {
			teams[Math.floor((i+1)/2)%2].players.push(stats[i]);
		}

		// Make sure the second team has more players if there is an odd number of them
		if (teams[0].length > teams[1].length) {
			let temp = teams[1];
			teams[1] = teams[0];
			teams[0] = temp;
		}

		function recalclScore() {
			for (let j = 0; j < teams.length; j++) {
				teams[j].fragginess = 0;
				teams[j].flagginess = 0;
				for (let i = 0; i < teams[j].players.length; i++) {
					teams[j].fragginess += teams[j].players[i].fragginess;
					teams[j].flagginess += teams[j].players[i].flagginess;
				}
			}
		}

		recalclScore();

		function swapRandom() {
			let a = Math.floor(Math.random() * teams[0].players.length);
			let b = Math.floor(Math.random() * teams[1].players.length);

			let tmp = teams[0].players[a];
			teams[0].players[a] = teams[1].players[b];
			teams[1].players[b] = tmp;
			recalclScore();
		}

		function compareTeamPairs(a, b) {
			// Try to minimize delta fragginess and delta flaggniness between
			// teams and to minimize the gap between fragginess and flagginess
			// in the same team

			let aDeltaFrag = Math.abs(a[0].fragginess - a[1].fragginess);
			let bDeltaFrag = Math.abs(b[0].fragginess - b[1].fragginess);
			let aDeltaFlag = Math.abs(a[0].flagginess - a[1].flagginess);
			let bDeltaFlag = Math.abs(b[0].flagginess - b[1].flagginess);

			return	aDeltaFrag + aDeltaFlag + Math.abs(aDeltaFrag - aDeltaFlag) <
					bDeltaFrag + bDeltaFlag + Math.abs(bDeltaFrag - bDeltaFlag);
		}

		if (names.length > 1) {
			let totalIter = 0;
			let stagnantIter = 0;
			let maxIter = Math.min(names.length * 3, 32);

			while (stagnantIter < 6 && totalIter < maxIter) {
				let old = _.cloneDeep(teams);
				swapRandom();

				if (compareTeamPairs(teams, old) == 0) {
					stagnantIter++;
					teams = old;
				} else {
					stagnantIter = 0;
				}
				totalIter++;
			}
		}

		return { good: _.map(teams[0].players, 'name'), evil: _.map(teams[1].players, 'name') };
	});
}

app.get('/api/players/teams', function(req, res) {
	makeTeams(req.query['names'].split(' '), req.query['mode'], req.query['map'])
		.then(teams => { res.send(teams); })
		.catch(err => { res.status(500).send({ error: err.message }); });
});

export function startTeamBalanceServer() {
	const server = dgram.createSocket('udp4');

	server.on('error', (err) => {
		log(`server error:\n${err.stack}`);
		server.close();
	});

	server.on('message', (data, rinfo) => {
		let st = new Packet(data, 0);
		let s = st.getString();
		let names = [];
		let mode;
		let map;
		while (s) {
			names.push(s);
			s = st.getString();
		}
		s = st.getString();
		if (s) mode = s;
		s = st.getString();
		if (s) map = s;

		makeTeams(names, mode, map)
			.then(teams => {
				let buf = new Buffer.alloc(1024);
				let p = new Packet(buf);

				_.each(teams, team => {
					_.each(team, player => {
						p.putInt(names.indexOf(player));
					});
				});

				server.send(buf, 0, p.offset, rinfo.port, rinfo.address);
			});
	});

	server.on('listening', () => {
		var address = server.address();
		log(`Team balance server listening on port ${address.port}`);
	});

	server.bind(config.teamBalanceServerPort);
}
