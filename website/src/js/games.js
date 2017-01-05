var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var NProgress = window.NProgress;
var dateReflow = window.dateReflow;
var disableDefault = window.disableDefault;
var url = window.url;

var vars = require("../../../vars.json");

var gameTemplate = require('../views/_partials/game-mini.pug');
var gameSearchResultsTemplate = require('../views/_partials/game-search-results.pug');

var originalURL = window.location.pathname + window.location.search + window.location.hash;
var openGameID = null;

function prevPageURL(pageUrl, firstID) {
	let curURL = url.parse(pageUrl, true);
	curURL.query.afterid = firstID;
	delete curURL.query.beforeid;
    delete curURL.search;
    return url.format(curURL);
}

function nextPageURL(pageUrl, lastID) {
	let curURL = url.parse(pageUrl, true);
	curURL.query.beforeid = lastID;
	delete curURL.query.afterid;
    delete curURL.search;
    return url.format(curURL);
}

function loadResults(pageURL, append) {
	NProgress.start();
	$.get("/api"+pageURL)
	.done(data => {
		let $body = $("#search-results tbody");
		let $scrollTarget = null;

		let nextURL = data.results&&data.results.length&&(data.results[data.results.length-1].id>data.stats.min)? nextPageURL(pageURL, data.results[data.results.length-1].id): undefined;
		if (append) {
			$body.append(gameSearchResultsTemplate(_.assign(data, { vars: vars, _: _, noHead: true })));
			$("#next-page-button").attr("href", nextURL).attr("onclick", "return loadMore('"+nextURL+"');");
			$scrollTarget = $(".scroll-to").last();
		} else {
			let prevURL = data.results&&data.results.length&&(data.results[0].id<data.stats.max)? prevPageURL(pageURL, data.results[0].id): undefined;
			$("#search-result-container").html(gameSearchResultsTemplate(_.assign(data, { vars: vars, _: _, prevPageURL: prevURL, nextPageURL: nextURL })));
			$scrollTarget = $("#search-results");
		}
		if ($scrollTarget && $scrollTarget.length) $("html, body").animate({
			scrollTop: $scrollTarget.offset().top
		}, 500);
	}).fail((xhr, textStatus) => {
		if (pageURL.indexOf("/find") < 0) $("#search-result-container").html("");
		else $("#search-result-container").html(`Error loading page: ${xhr.status} ${textStatus}`);
	}).always(() => {
		NProgress.done();
		dateReflow();
		disableDefault();
	});
}

window.loadPage = function(pageURL) {
	loadResults(pageURL);
	history.pushState({ url: pageURL }, window.title, pageURL);
	return false;
};

window.loadMore = function(pageURL) {
	loadResults(pageURL, true);
	return false;
};

$(window).bind("popstate", function(event) {
	let state = event.originalEvent.state;
	if (!state) loadResults(originalURL);
	else loadResults(state.url);
});

$("#search-form").on("submit", function(event) {
	event.preventDefault();
	window.loadPage("/games/find?"+$(this).serialize());
});

function tryLoadBackground(name) {
	var bg = new Image();
	bg.onload = function () {
		$("#game-info").css("background", "linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/mapshots/"+name+".jpg) no-repeat center center fixed");
		$("#game-info").css("background-size", "cover");
	};
	bg.src = "/images/mapshots/"+name+".jpg";
}

function loadGame(id) {
	$.get("/api/game/"+id, function(result) {
		if (!openGameID) return;
		$("#game-info div").html(gameTemplate({ id: id, server: result, vars: vars, _: _ }));
		$("#game-info .reveal").foundation();
		$("#game-info").foundation("open");
		tryLoadBackground(result.mapName);
		dateReflow();
	});
}

window.showGame = function(id) {
	$("#game-info div").html('<div style="text-align: center"><i class="fa fa-spinner fa-pulse fa-4x"></i></div>');
	$("#game-info").css("background", "rgba(27, 27, 27, 0.89)");
	loadGame(id);
	$("#game-info").foundation("open");
	openGameID = id;
};

window.expandGame = function() {
	if (!openGameID) return;
	window.location.href = "/game/"+openGameID;
};

$("#game-info").on("closed.zf.reveal", () => { openGameID = null; });

$(".fdate").fdatepicker({
	format: 'yyyy-mm-dd',
	disableDblClickSelection: true
});

window.onunload = function() {
	$("#game-info").foundation("close");
	openGameID = null;
};
