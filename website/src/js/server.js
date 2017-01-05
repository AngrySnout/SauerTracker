var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var NProgress = window.NProgress;
var url = window.url;
import {loadCharts} from "./_server-charts.js";
var vars = require("../../../vars.json");

var gameTemplate = require('../views/_partials/game.pug');

var urlPath = url.parse(window.location.href).pathname.split("/");
var host = urlPath[2];
var port = parseInt(urlPath[3]);

var $banner = $("#banner");
var bannerURL = $banner.length? $banner.attr("src"): null;

function updateGame() {
	$.get("/api/server/"+host+"/"+port, function(result) {
		render(result);
	});
}
setInterval(updateGame, 5000);

function updateBanner() {
	$banner.attr("src", bannerURL+"#"+(new Date().getTime()));
}
if (bannerURL) setInterval(updateBanner, 10000);

window.tryLoadBackground($("#map-name").text());

loadCharts(host, port);

function render(game) {
	window.tryLoadBackground(game.mapName);
	$("#game").html(gameTemplate({ server: game, vars: vars, _: _ }));
}
