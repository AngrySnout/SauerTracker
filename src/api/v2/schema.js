import Ajv from 'ajv';

import { log } from '../../util/util';

const defsSchema = require('../../../assets/api/v2/schemas/defs.json');

const ajv = new Ajv();

ajv.addSchema(defsSchema);

const serversSchema = require('../../../assets/api/v2/schemas/servers.json');

const validateServersAjv = ajv.compile(serversSchema);
export function validateServers(servers) {
	if (!validateServersAjv(servers)) log(validateServersAjv.errors);
}


const serverSchema = require('../../../assets/api/v2/schemas/server.json');

const validateServerAjv = ajv.compile(serverSchema);
export function validateServer(server) {
	if (!validateServerAjv(server)) log(validateServerAjv.errors);
}


const gameSchema = require('../../../assets/api/v2/schemas/game.json');

const validateGameAjv = ajv.compile(gameSchema);
export function validateGame(game) {
	if (!validateGameAjv(game)) log(validateGameAjv.errors);
}


const playersSchema = require('../../../assets/api/v2/schemas/players.json');

const validatePlayersAjv = ajv.compile(playersSchema);
export function validatePlayers(players) {
	if (!validatePlayersAjv(players)) log(validatePlayersAjv.errors);
}
