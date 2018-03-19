import { filter } from 'fuzzaldrin';

const { $, _ } = window;

const vars = require('../../vars.json');

const serverListTemplate = require('../views/_partials/server-list.pug');
const clansOnlineTemplate = require('../views/_partials/clans-online.pug');
const gameTemplate = require('../views/_partials/game-mini.pug');

let servers = [];
let hideEmpty = $('#hide-empty').is(':checked');
let pauseUpdate = $('#pause-update').is(':checked');
let lookingForPlayer = $('#find-player').val();
let lookingForServer = $('#find-server').val();
let sortedBy = 'clients';
let sortOrder = 'desc';
let openServerHost = '';
let openServerPort = 0;
let openGame = null;
let allPlayers = [];

try {
	servers = JSON.parse($('#servers-json').text()) || [];
	_.each(servers, (server) => {
		server.fullText = (`${_.values(_.pick(server, ['gameMode', 'mapName', 'masterMode', 'country', 'countryName', 'host'])).join(' ')}:${server.port}`).toLowerCase();
	});
} catch (e) {
	servers = [];
}

window.showConnect = function (host, port) {
	$('#connect-command').val(`/connect ${host} ${port}`);
	$('#connect-info').foundation('open');
	$('#connect-command').focus();
};

window.hideEmptyChanged = function () {
	hideEmpty = $('#hide-empty').is(':checked');
	renderServers();
};

window.pauseUpdateChanged = function () {
	pauseUpdate = $('#pause-update').is(':checked');
};

const playerSuggestions = function (q, cb) {
	cb(filter(allPlayers, q));
};

window.findPlayer = _.debounce((name) => {
	if (name) $('#find-player').typeahead('val', name);
	lookingForPlayer = $('#find-player').val();
	renderServers();
	renderGame();
}, 150);

window.findServer = _.debounce(() => {
	lookingForServer = $('#find-server').val();
	renderServers();
}, 150);

window.sortBy = function (prop) {
	if (prop === sortedBy && sortOrder === 'asc') sortOrder = 'desc';
	else {
		sortedBy = prop;
		sortOrder = 'asc';
	}
	renderServers();
};

function getClan(name) {
	const clan = _.find(vars.clans, c => (name.indexOf(c.tag) >= 0));
	return clan && clan.tag;
}

function renderServers() {
	$('#total-servers').text(servers.length);

	const lookFor = lookingForPlayer.toLowerCase();
	_.each(servers, (server) => {
		if (lookFor && _.find(server.players, pl => (pl.toLowerCase().indexOf(lookFor) >= 0))) {
			server.highlight = true;
		} else server.highlight = false;
	});

	allPlayers = [];
	_.each(servers, (sv) => {
		allPlayers.push(...sv.players);
	});
	allPlayers = _.uniq(allPlayers);

	$('#total-players').text(allPlayers.length);

	let clans = _.map(_.groupBy(allPlayers, getClan), (group, key) =>
		({ name: key, count: group.length, players: group }));
	clans = _.reject(_.orderBy(clans, 'count', 'desc'), { name: 'undefined' });

	let servs = servers;
	if (lookingForServer) {
		const lookingForLower = lookingForServer.toLowerCase();
		servs = _.union(filter(servers, lookingForServer, { key: 'description' }), _.filter(servers, serv => serv.fullText.indexOf(lookingForLower) >= 0));
	}
	servs = _.orderBy(servs, sortedBy, sortOrder);

	$('#server-list').html(serverListTemplate({
		servers: servs,
		hideEmpty: hideEmpty && !lookingForServer,
		sortedBy,
		sortOrder,
		lookingForPlayer,
		vars,
	}));

	$('#clans-online').html(clansOnlineTemplate({
		clansOnline: clans,
	}));

	window.disableDefault();
}
renderServers();

function tryLoadBackground(name) {
	const bg = new Image();
	bg.onload = function () {
		$('#server-info').css('background', `linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/mapshots/${name}.jpg) no-repeat center center fixed`);
		$('#server-info').css('background-size', 'cover');
	};
	bg.src = `/images/mapshots/${name}.jpg`;
}

function renderGame() {
	if (!openServerHost) return;
	const lookFor = lookingForPlayer.toLowerCase();
	_.each(openGame.players, (player) => {
		if (lookFor && player.name.toLowerCase().indexOf(lookFor) >= 0) player.highlight = true;
		else player.highlight = false;
	});
	$('#server-info-content').html(gameTemplate({ server: openGame, vars, _ }));
	tryLoadBackground(openGame.mapName);
}

function loadServer(host, port) {
	$.get(`/api/server/${host}/${port}`, (result) => {
		if (!openServerHost || openServerHost !== host || openServerPort !== port) return;
		openGame = result;
		renderGame();
	});
}

window.showServer = function (host, port) {
	$('#server-info-content').html('<div style="text-align: center; margin-top: 4em;"><i class="fa fa-spinner fa-pulse fa-4x"></i></div>');
	$('#server-info').css('background', 'rgba(27, 27, 27, 0.89)');
	loadServer(host, port);
	$('#server-info').css('display', 'block');
	$('#server-info').animate({ height: '300px', scrollTop: 0 }, 350, 'linear');
	openServerHost = host;
	openServerPort = port;
	return false;
};

window.hideServer = function () {
	$('#server-info').animate({ height: '0px' }, 350, 'linear', () => {
		$('#server-info').css('display', 'none');
	});
	openServerHost = '';
};

window.expandServer = function () {
	if (!openServerHost) return;
	window.location.href = `/server/${openServerHost}/${openServerPort}`;
};

function updateAll() {
	if (openServerHost) loadServer(openServerHost, openServerPort);
	if (pauseUpdate) return;
	$.get('/api/servers', (result) => {
		servers = result;
		_.each(servers, (server) => {
			server.fullText = (`${_.values(_.pick(server, ['gameMode', 'mapName', 'masterMode', 'country', 'countryName', 'host'])).join(' ')}:${server.port}`).toLowerCase();
		});
		renderServers();
	});
}
setInterval(updateAll, 5000);

$('.typeahead').typeahead({}, {
	name: 'players',
	source: playerSuggestions,
});

window.onunload = function () {
	$('#server-info').css('display', 'none');
	openServerHost = '';
};

$('.banner .x-button').click((e) => {
	$('.banner').css('display', 'none');
	e.stopPropagation();
	sessionStorage.setItem('hideBanner', 'true');
});

if (sessionStorage.getItem('hideBanner') === 'true') $('.banner').css('display', 'none');
