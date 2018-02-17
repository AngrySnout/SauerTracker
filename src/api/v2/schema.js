import Ajv from 'ajv';

import { logWarn } from '../../util/util';
import config from '../../../tracker.json';

const defsSchema = require('../../../assets/api/v2/schemas/defs.json');

const ajv = new Ajv();

ajv.addSchema(defsSchema);

const serversSchema = require('../../../assets/api/v2/schemas/servers.json');

const validateServersAjv = ajv.compile(serversSchema);
export function validateServers(servers) {
	if (!config.website.validateAPISchema) return;
	if (!validateServersAjv(servers)) logWarn(validateServersAjv.errors);
}


const serverSchema = require('../../../assets/api/v2/schemas/server.json');

const validateServerAjv = ajv.compile(serverSchema);
export function validateServer(server) {
	if (!config.website.validateAPISchema) return;
	if (!validateServerAjv(server)) logWarn(validateServerAjv.errors);
}


const gameSchema = require('../../../assets/api/v2/schemas/game.json');

const validateGameAjv = ajv.compile(gameSchema);
export function validateGame(game) {
	if (!config.website.validateAPISchema) return;
	if (!validateGameAjv(game)) logWarn(validateGameAjv.errors);
}


const playersSchema = require('../../../assets/api/v2/schemas/players.json');

const validatePlayersAjv = ajv.compile(playersSchema);
export function validatePlayers(players) {
	if (!config.website.validateAPISchema) return;
	if (!validatePlayersAjv(players)) logWarn(validatePlayersAjv.errors);
}


const playerSchema = require('../../../assets/api/v2/schemas/player.json');

const validatePlayerAjv = ajv.compile(playerSchema);
export function validatePlayer(player) {
	if (!config.website.validateAPISchema) return;
	if (!validatePlayerAjv(player)) logWarn(validatePlayerAjv.errors);
}


const clansSchema = require('../../../assets/api/v2/schemas/clans.json');

const validateClansAjv = ajv.compile(clansSchema);
export function validateClans(clans) {
	if (!config.website.validateAPISchema) return;
	if (!validateClansAjv(clans)) logWarn(validateClansAjv.errors);
}


const gamesSchema = require('../../../assets/api/v2/schemas/games.json');

const validateGamesAjv = ajv.compile(gamesSchema);
export function validateGames(games) {
	if (!config.website.validateAPISchema) return;
	if (!validateGamesAjv(games)) logWarn(validateGamesAjv.errors);
}
