var $ = window.$;

var similarGamesTemplate = require('../views/_partials/similar-games.pug');

var mapName = $("#map-name").text();
var gameType = $("#game-type").text();

window.tryLoadBackground(mapName);

function loadSimilarGames() {
    if (gameType === "duel" || gameType === "clanwar") {
        var meta = JSON.parse($("#game-meta").text());
        var query = "/games/find?gametype="+gameType+"&limit=10&players="+meta[0]+" "+meta[2];
        $.get("/api"+query, function(result) {
            $("#similar-games").html(similarGamesTemplate({ similarGames: result.results, viewAllLink: query }));
            $("#similar-games-parent").css("display", "block");
            disableDefault();
        });
    }
}
loadSimilarGames();
