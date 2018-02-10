import _ from 'lodash';
import Promise from 'bluebird';

import config from '../../tracker.json';
import vars from '../../vars.json';

import { round2, debug, error, getClan } from '../util/util';
import database from '../util/database';
import redis from '../util/redis';

function saveTeamStats(gameID, team, score) {
	return database('scores').insert({ game: gameID, team, score });
}

function savePlayerStats(gameID, player) {
	return database('stats').insert(_.assign(_.pick(player, ['cn', 'name', 'team', 'frags', 'flags', 'deaths', 'tks', 'acc', 'ip', 'country', 'state']), { game: gameID, kpd: round2((player.frags) / Math.max(player.deaths, 1)) }));
}

function saveGame(server, type) {
	const data = {
		host: server.host,
		port: server.port,
		serverdesc:
		server.description,
		map: server.game.mapName,
		gamemode: server.game.gameMode,
		numplayers: server.game.clients,
		gametype: type[0],
		meta: type[1],
		players: ` ${_.map(_.reject(server.game.players, { state: 5 }), 'name').join(' ')} `,
		specs: ` ${_.map(_.filter(server.game.players, { state: 5 }), 'name').join(' ')} `,
	};

	return database('games').insert(data).returning('id').then((gameID) => {
		const promises = [];
		if (server.game.teams) {
			if (server.game.gameMode.indexOf('team') >= 0 &&
					server.game.teams.length === 2 &&
					server.game.teams.good === 0 &&
					server.game.teams.evil === 0) {
				_.each(server.game.players, (player) => {
					if (player.state !== 5) server.game.teams[player.team] += player.frags;
				});
			}
			_.each(server.game.teams, (score, team) => {
				promises.push(saveTeamStats(gameID[0], team, score));
			});
		}
		if (server.game.players) {
			_.each(server.game.players, (player) => {
				promises.push(savePlayerStats(gameID[0], player));
			});
		}
		return Promise.all(promises).then();
	});
}

function getPlayersElo(players) {
	return database('players').whereIn('name', players).select('name', 'elo').then(rows => _.keyBy(rows, 'name'));
}

function setPlayersElo(players, elos) {
	return Promise.all(_.map(players, (plr, i) => database('players').where({ name: plr }).update({ elo: elos[i] }).then()));
}

function calcEloChange(eloSelf, eloOther, fragsSelf, fragsOther) {
	if (fragsSelf < 1 || fragsOther < 1) return 0;
	return Math.round(10 * (Math.log(fragsSelf / fragsOther)
			+ Math.log(eloOther / eloSelf)) * (eloSelf / config.tracker.baseElo));
}

/**
 *  Get type of the game.
 *	@param {object} game - The game to detect.
 *	Should have properties 'gameMode', 'masterMode', 'players', and 'teams'.
 *	@param {number} threshold - Override minimum number of frags to count as a duel.
 *	@returns {array} An array, the first element of which is one of
 *	'duel', 'public', 'other', 'clanwar', 'mix', 'intern'.
 *	If the first element if one of 'duel' and 'clanwar',
 *	the second element is a string representing the participants and the result.
 *	If the first element is 'intern', the second element is a string representing the clan.
 */
export function getGameType(game, threshold) {
	const self = game;
	let pls = _.reject(self.players, { state: 5 });
	if (typeof threshold === 'undefined') threshold = vars.duelThresholds[self.gameMode];

	if (pls.length === 2
			&& vars.duelModes.indexOf(self.gameMode) >= 0
			&& vars.lockedMModes.indexOf(self.masterMode) >= 0
			&& !(vars.gameModes[self.gameMode].teamMode
					&& pls[0].team === pls[1].team)
			&& (pls[0].frags > threshold && pls[1].frags > threshold)) {
		pls = _.sortBy(pls, 'frags');
		return ['duel', JSON.stringify([pls[0].name, pls[0].frags, pls[1].name, pls[1].frags])];
	}

	if (vars.lockedMModes.indexOf(self.masterMode) < 0) return ['public'];

	const playerTeams = _.groupBy(pls, 'team');
	const teamNames = _.keys(playerTeams);
	if (vars.mixModes.indexOf(self.gameMode) < 0 || teamNames.length !== 2 || !vars.gameModes[self.gameMode].teamMode || pls.length < 4 || pls.length > 10) return ['other'];

	const playerClans = _.countBy(pls, pl => getClan(pl.name) || 'random');
	const clanNames = _.keys(playerClans);
	if (clanNames.length === 1 && clanNames[0] !== 'random') return ['intern', JSON.stringify([clanNames[0]])];

	if (pls.length >= 4) {
		let isCW = true;
		const clans = [];
		let result = [];
		if (playerTeams[teamNames[0]].length !== playerTeams[teamNames[1]].length) isCW = false;
		else {
			_.each(playerTeams, (playerTeam) => {
				const teamClans = _.countBy(playerTeam, pl => getClan(pl.name) || 'random');
				const dominantClan = _.findKey(teamClans, (clan, clanname) => (clan === playerTeam.length || (playerTeam.length > 2 && clan === playerTeam.length) && clanname !== 'random'));
				if (!dominantClan) {
					isCW = false;
					return false;
				}
				clans.push(dominantClan);
				let teamScore;
				if (self.teams) teamScore = self.teams[playerTeam[0].team];
				if (vars.gameModes[self.gameMode].teamMode && !vars.gameModes[self.gameMode].flagMode) {
					// Workaround for Remod reporting wrong scores in team modes
					teamScore = _.sumBy(playerTeam, 'frags');
				}
				result.push({ clan: dominantClan, score: (self.teams && teamScore) ? teamScore : 0 });
				return undefined;
			});
		}
		if (isCW && result.length === 2 && clans[0] !== clans[1] && clans[0] !== 'random' && clans[1] !== 'random') {
			result = _.sortBy(result, 'score');
			return ['clanwar', JSON.stringify([result[0].clan, result[0].score, result[1].clan, result[1].score])];
		}
	}

	return ['mix'];
}

/**
 *	Represents a game.
 *	@class Game
 */
export default class Game {
	/**
	 *  @constructor
	 *  @param {server} server - the server object to which this game belongs.
	 */
	constructor(server) {
		this.server = server;
		this.reset();
	}

	/**
	 *  Reset the game.
	 *  @memberof Game
	 */
	reset() {
		this.players = {};
		this.teams = {};
		this.clients = -1;
		this.mapName = '';
		this.gameMode = '';
		this.maxClients = -1;
		this.mmColor = '';
		this.isFull = false;
		this.paused = false;
		this.gameSpeed = -1;
		this.timeLeft = 1000;
		this.intermission = false;
		this.saved = false;
	}

	/**
	 *  Save the game in the database.
	 *  @returns {Promise} Resolves when the game is saved or rejects with an error.
	 *  @memberof Game
	 */
	save() {
		if (!this || this.saved || this.zombie) return;
		this.saved = true;
		const gameType = getGameType(this);
		// eslint-disable-next-line consistent-return
		return saveGame(this.server, gameType).then(() => {
			debug(`Game saved at '${this.server.description}' (${gameType}).`);
			redis.zincrbyAsync('top-servers', 1, `${this.server.host}:${this.server.port}:${this.server.description}`);
			if (gameType[0] === 'duel') {
				const pls = _.reject(this.players, { state: 5 });
				const plNames = _.map(pls, 'name');
				return getPlayersElo(plNames).then((elos) => {
					const elo = [(elos[plNames[0]] && elos[plNames[0]].elo) || config.tracker.baseElo,
						(elos[plNames[1]] && elos[plNames[1]].elo) || config.tracker.baseElo];
					const elod1 = calcEloChange(elo[0], elo[1], pls[0].frags, pls[1].frags);
					const elod2 = calcEloChange(elo[1], elo[0], pls[1].frags, pls[0].frags);
					elo[0] += elod1;
					elo[1] += elod2;
					return setPlayersElo(plNames, elo).then();
				});
			} else if (gameType[0] === 'clanwar') {
				redis.hincrbyAsync('clan-games', gameType[1][0], 1);
				redis.hincrbyAsync('clan-games', gameType[1][2], 1);
				if (gameType[1][3] > gameType[1][1]) {
					redis.hincrbyAsync('clan-losses', gameType[1][0], 1);
					redis.hincrbyAsync('clan-wins', gameType[1][2], 1);
				}
			}
		}).catch(error);
	}

	/**
	 *  Get a serialized object to send to clients.
	 *  @returns {object} An object representing the game.
	 *  @memberof Game
	 */
	serialize() {
		const res = this.server.serialize(false);
		res.zombie = this.zombie;
		res.info = this.server.info;
		res.players = _.map(this.players, pl => _.pick(pl, ['name', 'frags', 'team', 'flags', 'deaths', 'kpd', 'acc', 'tks', 'state', 'country', 'countryName', 'ping']));
		res.teams = this.teams;
		const gameType = getGameType(this, -1000);
		// eslint-disable-next-line prefer-destructuring
		res.gameType = gameType[0];
		try {
			if (gameType[1]) res.meta = JSON.parse(gameType[1]);
		} catch (e) {} // eslint-disable-line no-empty
		return res;
	}
}
