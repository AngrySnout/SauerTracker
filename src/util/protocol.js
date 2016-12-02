export var gameModes = [
	'ffa',
	'coop_edit',
	'teamplay',
	'instagib',
	'insta_team',
	'efficiency',
	'effic_team',
	'tactics',
	'tac_team',
	'capture',
	'regen_capture',
	'ctf',
	'insta_ctf',
	'protect',
	'insta_protect',
	'hold',
	'insta_hold',
	'effic_ctf',
	'effic_protect',
	'effic_hold',
	'collect',
	'insta_collect',
	'effic_collect'
];

export var masterModes = [
  'auth',      		// -1
  'open',         	// 0
  'veto',         	// 1
  'locked',       	// 2
  'private',      	// 3
  'password'	    // 4
];

/**
 *	Maps game mode number to name, according to protocol 259.
 *	@param {number} code - The mode number.
 *	@returns {string} name - Name of the mode.
 */
export function getGameMode(code) {
	return gameModes[code]||'unknown';
}

/**
 *	Maps mastermode number to name, according to protocol 259.
 *	@param {number} code - The mastermode number.
 *	@returns {string} name - Name of the mastermode.
 */
export function getMasterMode(code) {
	return masterModes[code+1]||'unknown';
}
