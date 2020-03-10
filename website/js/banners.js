import NProgress from 'nprogress';
import CodeMirror from 'codemirror/lib/codemirror';
import Handlebars from 'handlebars';

const $ = window.jQuery;

Handlebars.registerHelper('ifeq', function(v1, v2, options) {
  if (v1 === v2) return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('iflt', function(v1, v2, options) {
  if (v1 < v2) return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('iflte', function(v1, v2, options) {
  if (v1 <= v2) return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('ifgt', function(v1, v2, options) {
  if (v1 > v2) return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('ifgte', function(v1, v2, options) {
  if (v1 >= v2) return options.fn(this);
  return options.inverse(this);
});

Handlebars.registerHelper('size', () => {});

Handlebars.registerHelper('cache', url => url);

Handlebars.registerHelper('flag', country => `/images/flags/${country}.png`);

Handlebars.registerHelper('mapshot', map => `/images/mapshots/${map}.jpg`);

const codeMirrorOptions = {
  theme: 'mbo',
  lineNumbers: true,
  mode: 'htmlmixed',
};

let codeMirrorPlayer;
let codeMirrorServer;
let codeMirrorClan;

const { bannerURL } = require('../../vars.json');

// Copied from http://output.jsbin.com/ihunin/385/
function selectableGutters(codeMirror) {
  codeMirror.on('gutterClick', (cm, line, gutter, e) => {
    const others = e.ctrlKey || e.metaKey ? cm.listSelections() : [];
    const from = line;
    let to = line + 1;
    function update() {
      const ours = {
        anchor: CodeMirror.Pos(to < from ? from + 1 : from, 0),
        head: CodeMirror.Pos(to === from ? from + 1 : to, 0),
      };
      cm.setSelections(others.concat([ours]), others.length, {
        origin: '*mouse',
      });
    }
    update();

    const move = function(event) {
      const curLine = cm.lineAtHeight(event.clientY, 'client');
      if (curLine !== to) {
        to = curLine;
        update();
      }
    };
    const up = function() {
      codeMirror.focus();
      removeEventListener('mouseup', up);
      removeEventListener('mousemove', move);
    };
    addEventListener('mousemove', move);
    addEventListener('mouseup', up);
  });
}

const defaultTemplate = `<?xml version="1.0"?>
<svg width="512" height="64"
     viewBox="0 0 512 64"
     xmlns="http://www.w3.org/2000/svg"
     xmlns:xlink="http://www.w3.org/1999/xlink">

	<!-- Read more about custom templates on https://github.com/AngrySnout/SauerTracker-Banners -->

</svg>
`;

function showType(type) {
  $('.banner-options').removeClass('current');
  $(`.banner-options-${type}`).addClass('current');
}

showType($('#banner-type').val());

$('#banner-type').change(function() {
  showType($(this).val());
});

$('#banner-theme-player').change(function() {
  if ($(this).val() === 'custom') {
    $('.banner-template-player').addClass('current');
    if (!codeMirrorPlayer) {
      codeMirrorPlayer = CodeMirror.fromTextArea(
        $('#banner-template-player').get(0),
        codeMirrorOptions
      );
      selectableGutters(codeMirrorPlayer);
      codeMirrorPlayer.setValue(defaultTemplate);
    }
  } else $('.banner-template-player').removeClass('current');
});

$('#banner-theme-server').change(function() {
  if ($(this).val() === 'custom') {
    $('.banner-template-server').addClass('current');
    if (!codeMirrorServer) {
      codeMirrorServer = CodeMirror.fromTextArea(
        $('#banner-template-server').get(0),
        codeMirrorOptions
      );
      selectableGutters(codeMirrorServer);
      codeMirrorServer.setValue(defaultTemplate);
    }
  } else $('.banner-template-server').removeClass('current');
});

$('#banner-theme-clan').change(function() {
  if ($(this).val() === 'custom') {
    $('.banner-template-clan').addClass('current');
    if (!codeMirrorClan) {
      codeMirrorClan = CodeMirror.fromTextArea(
        $('#banner-template-clan').get(0),
        codeMirrorOptions
      );
      selectableGutters(codeMirrorClan);
      codeMirrorClan.setValue(defaultTemplate);
    }
  } else $('.banner-template-clan').removeClass('current');
});

function bannerPreviewHandler(type, getAPIURL, getPreview, getIMGURL) {
  return function() {
    NProgress.start();
    if ($(`#banner-theme-${type}`).val() === 'custom') {
      $.get(getAPIURL())
        .then(res => {
          try {
            $(`#svg-target-${type}`).html(getPreview(res));
          } catch (err) {
            $(`#svg-target-${type}`).html(
              `<span style="background-color: white">Error: ${err.message}</span>`
            );
          }
        })
        .fail(err => {
          $(`#svg-target-${type}`).html(
            `<span style="background-color: white; color: black;">Error: ${
              (err.responseJSON ? err.responseJSON.error : null) || err.status
                ? `${err.status} ${err.textStatus}`
                : 'No response from server. Check internet connection.'
            }</span>`
          );
        })
        .always(() => {
          NProgress.done();
        });
    } else {
      $(`#svg-target-${type}`).html(`<img src="${bannerURL}${getIMGURL()}"/>`);
      NProgress.done();
    }
  };
}

$('#banner-preview-player').click(
  bannerPreviewHandler(
    'player',
    () => `/api/player/${$('#banner-name').val()}`,
    res => {
      if (res.totalGames) res.player.totalGames = res.totalGames;
      if (res.games) res.player.games = res.games;
      if (res.rank) res.player.rank = res.rank;
      return Handlebars.compile(codeMirrorPlayer.getValue())(res);
    },
    () =>
      `player?name=${encodeURIComponent($('#banner-name').val())}&theme=${$(
        '#banner-theme-player'
      ).val()}`
  )
);

$('#banner-preview-server').click(
  bannerPreviewHandler(
    'server',
    () => `/api/server/${$('#banner-host').val()}/${$('#banner-port').val()}`,
    res => Handlebars.compile(codeMirrorServer.getValue())({ server: res }),
    () =>
      `server?host=${$('#banner-host').val()}&port=${$(
        '#banner-port'
      ).val()}&theme=${$('#banner-theme-server').val()}`
  )
);

$('#banner-preview-clan').click(
  bannerPreviewHandler(
    'clan',
    () => `/api/clan/${encodeURIComponent($('#banner-clantag').val())}`,
    res => {
      if (res.info) res.clan.info = res.info;
      if (res.games) res.clan.games = res.games;
      if (res.members) res.clan.members = res.members;
      res.clan.points = Math.round(res.clan.points * 100) / 100;
      res.clan.rate = Math.round(res.clan.rate * 100);
      return Handlebars.compile(codeMirrorClan.getValue())(res);
    },
    () =>
      `clan?clantag=${encodeURIComponent($('#banner-clantag').val())}&theme=${$(
        '#banner-theme-clan'
      ).val()}`
  )
);

function showHTMLCode(url) {
  $('#banner-url').val(url);
  $('#banner-html').val(`<img src='${url}' alt=''/>`);
  $('#banner-code').foundation('open');
}

function bannerGenerateHandler(type, getTemplate, getIMGURL) {
  return function() {
    const theme = $(`#banner-theme-${type}`).val();
    if (theme === 'custom') {
      $.post(`${bannerURL}register`, { type, template: getTemplate() })
        .then(res => {
          showHTMLCode(`${bannerURL}${getIMGURL(res)}`);
        })
        .fail(err => {
          showHTMLCode(
            (err.responseJSON ? err.responseJSON.error : null) ||
              `${err.status} ${err.textStatus}`
          );
        });
    } else {
      showHTMLCode(`${bannerURL}${getIMGURL(theme)}`);
    }
  };
}

$('#banner-generate-player').click(
  bannerGenerateHandler(
    'player',
    () => codeMirrorPlayer.getValue(),
    theme =>
      `player?name=${encodeURIComponent(
        $('#banner-name').val()
      )}&theme=${theme}`
  )
);

$('#banner-generate-server').click(
  bannerGenerateHandler(
    'server',
    () => codeMirrorServer.getValue(),
    theme =>
      `server?host=${$('#banner-host').val()}&port=${$(
        '#banner-port'
      ).val()}&theme=${theme}`
  )
);

$('#banner-generate-clan').click(
  bannerGenerateHandler(
    'clan',
    () => codeMirrorClan.getValue(),
    theme =>
      `clan?clantag=${encodeURIComponent(
        $('#banner-clantag').val()
      )}&theme=${theme}`
  )
);
