import { loadCharts } from './_server-charts';
import url from 'url';
import _ from 'lodash';
import vars from '../../vars.json';
import gameTemplate from 'pug-loader!../views/_partials/game.pug';

const $ = window.jQuery;

const urlPath = url.parse(window.location.href).pathname.split('/');
const host = urlPath[2];
const port = parseInt(urlPath[3], 10);

const $banner = $('#banner');
const bannerURL = $banner.length ? $banner.attr('src') : null;

function updateGame() {
  $.get(`/api/server/${host}/${port}`, result => {
    render(result);
  });
}
setInterval(updateGame, 5000);

function updateBanner() {
  $banner.attr('src', `${bannerURL}#${new Date().getTime()}`);
}
if (bannerURL) setInterval(updateBanner, 10000);

window.tryLoadBackground($('#map-name').text());

loadCharts(host, port);

function render(game) {
  window.tryLoadBackground(game.mapName);
  $('#game').html(gameTemplate({ server: game, vars, _ }));
}
