import _ from 'lodash';
import Promise from 'bluebird';
import dgram from 'dgram';

import config from '../../../tracker.json';

import app from '../../util/web';
import database from '../../util/database';
import playerManager from '../../tracker/player-manager';
import Packet from '../../util/packet';

export function findPlayers(name, country) {
	if (typeof name == 'undefined') name = '';
	let query = database('players').where('name', 'ilike', '%'+name+'%');
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

export function makeTeams(names) {
	if (names.length > 64) names = names.slice(0, 64);

	return database.count('* as games').sum('frags as frags').sum('flags as flags').select('stats.name').from('stats').join('games', 'games.id', 'stats.game').whereIn('gametype', ['mix', 'clanwar']).whereRaw("games.timestamp > CURRENT_DATE - INTERVAL '3 months'").whereIn('stats.name', names).whereNot('stats.state', 5).groupBy('stats.name')
	.then(players => {
		players = _.keyBy(players, 'name');

		let stats = _.map(names, name => {
			if (!players[name]) return { name: name, fragginess: 0.5, flagginess: 0.5 };

			var fragginess = players[name].frags*(2/15.96)/players[name].games; // 16 is the average deaths/game
			var flagginess = players[name].flags/players[name].games;

			return { name: name, fragginess: fragginess, flagginess: players[name].flags/players[name].games, score: fragginess+flagginess };
		});

		stats = _.orderBy(stats, ['score'], ['desc']);

		let teams = [{ fragginess: 0, flagginess: 0, players: [] }, { fragginess: 0, flagginess: 0, players: [] }];

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

		// Split player in the following order:
		// _0_ _1_
		//      |
		// _3_ _2_
		//  |
		// _4_ _5_
		for (let i = 0; i < stats.length; i++) {
			teams[Math.floor((i+1)/2)%2].players.push(stats[i]);
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
			let aDeltaFrag = Math.abs(a[0].fragginess - a[1].fragginess);
			let bDeltaFrag = Math.abs(b[0].fragginess - b[1].fragginess);
			let aDeltaFlag = Math.abs(a[0].flagginess - a[1].flagginess);
			let bDeltaFlag = Math.abs(b[0].flagginess - b[1].flagginess);

			return	aDeltaFrag + aDeltaFlag + Math.abs(aDeltaFrag - aDeltaFlag) <
					bDeltaFrag + bDeltaFlag + Math.abs(bDeltaFrag - bDeltaFlag);
		}

		if (names > 1) {
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
	makeTeams(req.query['names'].split(' '))
		.then(teams => { res.send(teams); })
		.catch(err => { res.status(500).send({ error: err.message }); });
});

export function startTeamBalanceServer() {
	const server = dgram.createSocket('udp4');

	server.on('error', (err) => {
		console.log(`server error:\n${err.stack}`);
		server.close();
	});

	server.on('message', (data, rinfo) => {
		let st = new Packet(data, 0);
		let s;
		let names = [];
		while (s = st.getString()) {
			names.push(s);
		}

		makeTeams(names)
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
		console.log(`Team balance server listening on port ${address.port}`);
	});

	server.bind(config.teamBalanceServerPort);
}
