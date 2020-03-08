import NProgress from 'nprogress';
import $ from 'jquery';
import _ from 'lodash';

import searchResultsTemplate from 'pug-loader!../views/_partials/player-search-results.pug';

const originalURL =
  window.location.pathname + window.location.search + window.location.hash;

function loadPage(url, name) {
  NProgress.start();
  $.get(`/api${url}`)
    .success(result => {
      $('#search-result-container').html(
        searchResultsTemplate({ results: result.results, _ })
      );
    })
    .fail(() => {
      $('#search-result-container').html('Error loading search results.');
    })
    .always(() => {
      $('#name').val(name);
      NProgress.done();
    });
}

$('#search-form').on('submit', function(event) {
  event.preventDefault();
  const url = `/players/find?${$(this).serialize()}`;
  const name = $('#name').val();
  loadPage(url, name);
  window.history.pushState({ url, name }, window.title, url);
});

$(window).bind('popstate', event => {
  const { state } = event.originalEvent;
  if (!state) {
    if (originalURL === '/players') window.location.reload();
    else loadPage(originalURL);
  } else loadPage(state.url, state.name);
});

window.selectCategory = function(category) {
  $('.category-body').hide();
  $(`#top-${category}`).show();
  $('.category-title').removeClass('inverted');
  $(`#ct-${category}`).addClass('inverted');
};

window.selectCategory('monthly');
