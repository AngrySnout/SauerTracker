var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var NProgress = window.NProgress;
var url = window.url;

var searchResultsTemplate = require('../views/_partials/player-search-results.jade');

var originalURL = window.location.href;

function loadPage(url, name) {
	NProgress.start();
	$.get("/api"+url)
	 	.success(result => {
			$("#search-result-container").html(searchResultsTemplate({ results: result.results, _: _ }));
		})
		.fail(() => {
			$("#search-result-container").html("Error loading search results.");
		})
		.always(() => {
			$("#name").val(name);
			NProgress.done();
		});
}

$("#search-form").on("submit", function(event) {
	event.preventDefault();
	var url = "/players/find?"+$(this).serialize();
	var name = $("#name").val();
	loadPage(url, name);
	history.pushState({ url: url, name: name }, window.title, url);
});

$(window).bind("popstate", function(event) {
	let state = event.originalEvent.state;
	if (!state) loadPage(originalURL);
	else loadPage(state.url, state.name);
});
