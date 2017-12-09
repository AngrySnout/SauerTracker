var $ = window.$;
var NProgress = window.NProgress;
var CodeMirror = require('codemirror/lib/codemirror');
var Handlebars = require('handlebars');

Handlebars.registerHelper('ifeq', function(v1, v2, options) {
	if(v1 === v2) return options.fn(this);
	return options.inverse(this);
});

Handlebars.registerHelper('iflt', function(v1, v2, options) {
	if(v1 < v2) return options.fn(this);
	return options.inverse(this);
});

Handlebars.registerHelper('iflte', function(v1, v2, options) {
	if(v1 <= v2) return options.fn(this);
	return options.inverse(this);
});

Handlebars.registerHelper('ifgt', function(v1, v2, options) {
	if(v1 > v2)return options.fn(this);
	return options.inverse(this);
});

Handlebars.registerHelper('ifgte', function(v1, v2, options) {
	if(v1 >= v2) return options.fn(this);
	return options.inverse(this);
});

Handlebars.registerHelper('size', function() {});

Handlebars.registerHelper('cache', function(url) {
	return url;
});

Handlebars.registerHelper('flag', function(country) {
	return `/images/flags/${country}.png`;
});

Handlebars.registerHelper('mapshot', function(map) {
	return `/images/mapshots/${map}.jpg`;
});

var codeMirrorOptions = {
	theme: 'mbo',
	lineNumbers: true,
	mode: 'htmlmixed'
};

var codeMirrorPlayer,
	codeMirrorServer,
	codeMirrorClan;

var bannerURL = require('../../vars.json').bannerURL;

// Copied from http://output.jsbin.com/ihunin/385/
function selectableGutters(codeMirror) {
	codeMirror.on('gutterClick', function(cm, line, gutter, e) {
		let others = e.ctrlKey || e.metaKey ? cm.listSelections() : [];
		let from = line, to = line + 1;
		function update() {
			let ours = {
				anchor: CodeMirror.Pos(to < from? from+1: from, 0),
				head: CodeMirror.Pos(to == from? from+1: to, 0)
			};
			cm.setSelections(others.concat([ours]), others.length, { origin: '*mouse' });
		}
		update();

		let move = function(e) {
			let curLine = cm.lineAtHeight(e.clientY, 'client');
			if (curLine != to) {
				to = curLine;
				update();
			}
		};
		let up = function() {
			codeMirror.focus();
			removeEventListener('mouseup', up);
			removeEventListener('mousemove', move);
		};
		addEventListener('mousemove', move);
		addEventListener('mouseup', up);
	});
}

var defaultTemplate = `<?xml version="1.0"?>
<svg width="512" height="64"
     viewBox="0 0 512 64"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">

	<!-- Read more about custom templates on https://github.com/AngrySnout/SauerTracker-Banners -->

</svg>
`;

function showType(type) {
	$('.banner-options').removeClass('current');
	$('.banner-options-'+type).addClass('current');
}

showType($('#banner-type').val());

$('#banner-type').change(function () { showType($(this).val()); });

$('#banner-theme-player').change(function () {
	if ($(this).val() == 'custom') {
		$('.banner-template-player').addClass('current');
		if (!codeMirrorPlayer) {
			codeMirrorPlayer = CodeMirror.fromTextArea($('#banner-template-player').get(0), codeMirrorOptions);
			selectableGutters(codeMirrorPlayer);
			codeMirrorPlayer.setValue(defaultTemplate);
		}
	} else $('.banner-template-player').removeClass('current');
});

$('#banner-theme-server').change(function () {
	if ($(this).val() == 'custom') {
		$('.banner-template-server').addClass('current');
		if (!codeMirrorServer) {
			codeMirrorServer = CodeMirror.fromTextArea($('#banner-template-server').get(0), codeMirrorOptions);
			selectableGutters(codeMirrorServer);
			codeMirrorServer.setValue(defaultTemplate);
		}
	} else $('.banner-template-server').removeClass('current');
});

$('#banner-theme-clan').change(function () {
	if ($(this).val() == 'custom') {
		$('.banner-template-clan').addClass('current');
		if (!codeMirrorClan) {
			codeMirrorClan = CodeMirror.fromTextArea($('#banner-template-clan').get(0), codeMirrorOptions);
			selectableGutters(codeMirrorClan);
			codeMirrorClan.setValue(defaultTemplate);
		}
	} else $('.banner-template-clan').removeClass('current');
});

function bannerPreviewHandler(type, getAPIURL, getPreview, getIMGURL) {
	return function () {
		NProgress.start();
		if ($('#banner-theme-'+type).val() == 'custom') {
			$.get(getAPIURL()).then(res => {
				try {
					$('#svg-target-'+type).html(getPreview(res));
				} catch (err) {
					$('#svg-target-'+type).html(`<span style="background-color: white">Error: ${err.message}</span>`);
				}
			}).fail(err => {
				$('#svg-target-'+type).html(`<span style="background-color: white; color: black;">Error: ${(err.responseJSON? err.responseJSON.error: null) || err.status? (err.status+' '+err.textStatus): 'No response from server. Check internet connection.'}</span>`);
			}).always(() => {
				NProgress.done();
			});
		} else {
			$('#svg-target-'+type).html(`<img src="${bannerURL}${getIMGURL()}"/>`);
			NProgress.done();
		}
	};
}

$('#banner-preview-player').click(bannerPreviewHandler('player',
	() => {
		return `/api/player/${$('#banner-name').val()}`;
	}, (res) => {
		if (res.totalGames) res.player.totalGames = res.totalGames;
		if (res.games) res.player.games = res.games;
		if (res.rank) res.player.rank = res.rank;
		return Handlebars.compile(codeMirrorPlayer.getValue())(res);
	}, () => {
		return `player?name=${encodeURIComponent($('#banner-name').val())}&theme=${$('#banner-theme-player').val()}`;
	}));

$('#banner-preview-server').click(bannerPreviewHandler('server',
	() => {
		return `/api/server/${$('#banner-host').val()}/${$('#banner-port').val()}`;
	}, (res) => {
		return Handlebars.compile(codeMirrorServer.getValue())({ server: res });
	}, () => {
		return `server?host=${$('#banner-host').val()}&port=${$('#banner-port').val()}&theme=${$('#banner-theme-server').val()}`;
	}));

$('#banner-preview-clan').click(bannerPreviewHandler('clan',
	() => {
		return `/api/clan/${encodeURIComponent($('#banner-clantag').val())}`;
	}, (res) => {
		if (res.info) res.clan.info = res.info;
		if (res.games) res.clan.games = res.games;
		if (res.members) res.clan.members = res.members;
		res.clan.points = Math.round(res.clan.points*100)/100;
		res.clan.rate = Math.round(res.clan.rate*100);
		return Handlebars.compile(codeMirrorClan.getValue())(res);
	}, () => {
		return `clan?clantag=${encodeURIComponent($('#banner-clantag').val())}&theme=${$('#banner-theme-clan').val()}`;
	}));

function showHTMLCode(url) {
	$('#banner-url').val(url);
	$('#banner-html').val(`<img src='${url}' alt=''/>`);
	$('#banner-code').foundation('open');
}

function bannerGenerateHandler(type, getTemplate, getIMGURL) {
	return function () {
		let theme = $('#banner-theme-'+type).val();
		if (theme == 'custom') {
			$.post(`${bannerURL}register`, { type: type, template: getTemplate() }).then(res => {
				showHTMLCode(`${bannerURL}${getIMGURL(res)}`);
			}).fail(err => {
				showHTMLCode((err.responseJSON? err.responseJSON.error: null) || err.status+' '+err.textStatus);
			});
		} else {
			showHTMLCode(`${bannerURL}${getIMGURL(theme)}`);
		}
	};
}

$('#banner-generate-player').click(bannerGenerateHandler('player',
	() => {
		return codeMirrorPlayer.getValue();
	}, (theme) => {
		return `player?name=${encodeURIComponent($('#banner-name').val())}&theme=${theme}`;
	}));

$('#banner-generate-server').click(bannerGenerateHandler('server',
	() => {
		return codeMirrorServer.getValue();
	}, (theme) => {
		return `server?host=${$('#banner-host').val()}&port=${$('#banner-port').val()}&theme=${theme}`;
	}));

$('#banner-generate-clan').click(bannerGenerateHandler('clan',
	() => {
		return codeMirrorClan.getValue();
	}, (theme) => {
		return `clan?clantag=${encodeURIComponent($('#banner-clantag').val())}&theme=${theme}`;
	}));
