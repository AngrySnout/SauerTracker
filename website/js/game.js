const $ = window.jQuery;

import similarGamesTemplate from 'pug-loader!../views/_partials/similar-games.pug';

const mapName = $('#map-name').text();
const gameType = $('#game-type').text();

window.tryLoadBackground(mapName);

function loadSimilarGames() {
  if (gameType === 'duel' || gameType === 'clanwar') {
    const meta = JSON.parse($('#game-meta').text());
    const query = `/games/find?gametype=${gameType}&limit=10&players=${meta[0]} ${meta[2]}`;
    $.get(`/api${query}`, result => {
      $('#similar-games').html(
        similarGamesTemplate({
          similarGames: result.results,
          viewAllLink: query,
        })
      );
      $('#similar-games-parent').css('display', 'block');
      disableDefault();
    });
  }
}
loadSimilarGames();
