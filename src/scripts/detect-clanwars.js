/* eslint-disable import/first */
require('source-map-support').install();

import _ from 'lodash';

import database from '../util/database';
import { getGameType } from '../tracker/game';
import { log } from '../util/util';

let count = 0;

database.raw(`
	SELECT  games.id,
			games.gamemode,
			games.gametype,
			(SELECT array_to_json(array_agg(row(scores.team, scores.score))) FROM scores WHERE scores.game = games.id) teams,
			(SELECT array_to_json(array_agg(row(stats.name, stats.team, stats.frags)))app FROM stats WHERE stats.game = games.id AND stats.state != 5) players

	FROM    games

	WHERE   games.gametype = 'mix' OR
			games.gametype = 'clanwar'
	`)
// eslint-disable-next-line array-callback-return,consistent-return
	.then(result => result.rows).map((row) => {
		const players = _.map(row.players, player => ({
			name: player.f1,
			team: player.f2,
			frags: player.f3,
		}));
		const teams = {};
		_.each(row.teams, (team) => {
			teams[team.f1] = team.f2;
		});
		const g = {
			masterMode: 'locked', teams, players, gameMode: row.gamemode,
		};
		const gameType = getGameType(g);
		database.raw();
		if (gameType[0] !== row.gametype) {
			count++;
			return database('games').where('id', row.id).update({ gametype: gameType[0], meta: JSON.stringify(gameType[1]) }).then();
		}
	}).then(() => {
		log(`Updated ${count} games`);
		process.exit();
	});
