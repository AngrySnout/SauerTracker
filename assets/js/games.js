(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
'use strict';

var pug_has_own_property = Object.prototype.hasOwnProperty;

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = pug_merge;
function pug_merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = pug_merge(attrs, a[i]);
    }
    return attrs;
  }

  for (var key in b) {
    if (key === 'class') {
      var valA = a[key] || [];
      a[key] = (Array.isArray(valA) ? valA : [valA]).concat(b[key] || []);
    } else if (key === 'style') {
      var valA = pug_style(a[key]);
      var valB = pug_style(b[key]);
      a[key] = valA + (valA && valB && ';') + valB;
    } else {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Process array, object, or string as a string of classes delimited by a space.
 *
 * If `val` is an array, all members of it and its subarrays are counted as
 * classes. If `escaping` is an array, then whether or not the item in `val` is
 * escaped depends on the corresponding item in `escaping`. If `escaping` is
 * not an array, no escaping is done.
 *
 * If `val` is an object, all the keys whose value is truthy are counted as
 * classes. No escaping is done.
 *
 * If `val` is a string, it is counted as a class. No escaping is done.
 *
 * @param {(Array.<string>|Object.<string, boolean>|string)} val
 * @param {?Array.<string>} escaping
 * @return {String}
 */
exports.classes = pug_classes;
function pug_classes_array(val, escaping) {
  var classString = '', className, padding = '', escapeEnabled = Array.isArray(escaping);
  for (var i = 0; i < val.length; i++) {
    className = pug_classes(val[i]);
    if (!className) continue;
    escapeEnabled && escaping[i] && (className = pug_escape(className));
    classString = classString + padding + className;
    padding = ' ';
  }
  return classString;
}
function pug_classes_object(val) {
  var classString = '', padding = '';
  for (var key in val) {
    if (key && val[key] && pug_has_own_property.call(val, key)) {
      classString = classString + padding + key;
      padding = ' ';
    }
  }
  return classString;
}
function pug_classes(val, escaping) {
  if (Array.isArray(val)) {
    return pug_classes_array(val, escaping);
  } else if (val && typeof val === 'object') {
    return pug_classes_object(val);
  } else {
    return val || '';
  }
}

/**
 * Convert object or string to a string of CSS styles delimited by a semicolon.
 *
 * @param {(Object.<string, string>|string)} val
 * @return {String}
 */

exports.style = pug_style;
function pug_style(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    var out = '', delim = '';
    for (var style in val) {
      /* istanbul ignore else */
      if (pug_has_own_property.call(val, style)) {
        out = out + delim + style + ':' + val[style];
        delim = ';';
      }
    }
    return out;
  } else {
    val = '' + val;
    if (val[val.length - 1] === ';') return val.slice(0, -1);
    return val;
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = pug_attr;
function pug_attr(key, val, escaped, terse) {
  if (val === false || val == null || !val && (key === 'class' || key === 'style')) {
    return '';
  }
  if (val === true) {
    return ' ' + (terse ? key : key + '="' + key + '"');
  }
  if (typeof val.toJSON === 'function') {
    val = val.toJSON();
  }
  if (typeof val !== 'string') {
    val = JSON.stringify(val);
    if (!escaped && val.indexOf('"') !== -1) {
      return ' ' + key + '=\'' + val.replace(/'/g, '&#39;') + '\'';
    }
  }
  if (escaped) val = pug_escape(val);
  return ' ' + key + '="' + val + '"';
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} terse whether to use HTML5 terse boolean attributes
 * @return {String}
 */
exports.attrs = pug_attrs;
function pug_attrs(obj, terse){
  var attrs = '';

  for (var key in obj) {
    if (pug_has_own_property.call(obj, key)) {
      var val = obj[key];

      if ('class' === key) {
        val = pug_classes(val);
        attrs = pug_attr(key, val, false, terse) + attrs;
        continue;
      }
      if ('style' === key) {
        val = pug_style(val);
      }
      attrs += pug_attr(key, val, false, terse);
    }
  }

  return attrs;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

var pug_match_html = /["&<>]/;
exports.escape = pug_escape;
function pug_escape(_html){
  var html = '' + _html;
  var regexResult = pug_match_html.exec(html);
  if (!regexResult) return _html;

  var result = '';
  var i, lastIndex, escape;
  for (i = regexResult.index, lastIndex = 0; i < html.length; i++) {
    switch (html.charCodeAt(i)) {
      case 34: escape = '&quot;'; break;
      case 38: escape = '&amp;'; break;
      case 60: escape = '&lt;'; break;
      case 62: escape = '&gt;'; break;
      default: continue;
    }
    if (lastIndex !== i) result += html.substring(lastIndex, i);
    lastIndex = i + 1;
    result += escape;
  }
  if (lastIndex !== i) return result + html.substring(lastIndex, i);
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the pug in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @param {String} str original source
 * @api private
 */

exports.rethrow = pug_rethrow;
function pug_rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    pug_rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Pug') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":1}],3:[function(require,module,exports){
module.exports={
	"clans": [
		{ "tag": "!s]", "title": "!mpressive Squad", "website": "http://impressivesquad.eu" },
		{ "tag": "|RB|", "title": "Red Butchers", "website": "http://butchers.su" },
		{ "tag": ".cS|", "title": "Cube Strikers" },
		{ "tag": ".rC|", "title": "Rising Cubers", "website": "http://rising-cubers.eu" },
		{ "tag": "GC1/", "title": "Gamer Class 1"},
		{ "tag": "vaQ'", "title": "Vulture Attack Squad", "website": "http://vaq-clan.de" },
		{ "tag": "sp4nk", "title": "sp4nk", "website": "http://sp4nk.net" },
		{ "tag": "[tBMC]", "title": "The Blue Monkey Cult", "website": "http://thebluemonkeycult.webs.com" },
		{ "tag": "oo|", "title": "Ogros", "website": "http://ogros.org" },
		{ "tag": "w00p|", "title": "w00p", "website": "http://woop.us" },
		{ "tag": "|DM|", "title": "Dangerous Monkeys", "website": "http://dangerousmonkeys.forumcommunity.net" },
		{ "tag": "|noVI:", "title": "No Violence", "website": "http://noviteam.de" },
		{ "tag": "[FD]", "title": "Forgotten Dream", "website": "http://forgottendream.org" },
		{ "tag": "=DK=", "title": "Dark Keepers", "website": "http://darkkeepers.dk" },
		{ "tag": "eXc|", "title": "Excellence" },
		{ "tag": "Crowd>", "title": "Crowd", "website": "http://crowd.gg" },
		{ "tag": "|HD|", "title": "High Definition" },
		{ "tag": "<sAs/", "title": "sAs" },
		{ "tag": "cm|", "title": "Cubic Matter", "website": "http://cubicmatter.net" },
		{ "tag": "glory|", "title": "Glory" },
		{ "tag": "|ORK|", "title": "ORK" },
		{ "tag": "[GLX]", "title": "GLX" },
		{ "tag": "eC.", "title": "Enigmatic Crew", "website": "http://enicrew.tk" },
		{ "tag": "<pWn>", "title": "pWn" },
		{ "tag": ".c2|", "title": "C2", "website": "http://c2clan.tk" },
		{ "tag": "(ESP)", "title": "Especial Super Paragons", "website": "http://espteam.org" },
		{ "tag": "[RUSS]", "title": "RUSS", "website": "http://russauerclan.boards.net" },
		{ "tag": "RED|", "title": "RED" },
		{ "tag": "#TJS.", "title": "TJS" },
		{ "tag": "va|", "title": "VoxelArmy", "website": "http://www.voxelarmy.com" },
		{ "tag": "vE'", "title": "vE'ctor", "website": "http://vector.enjin.com" },
		{ "tag": "|EK|", "title": "Eternal Killers", "website": "http://tekclansauer.createaforum.com" },
		{ "tag": "MyS", "title": "Makes you Sick", "website": "http://myys.bplaced.net" },
		{ "tag": "|ONI|", "title": "ONI", "website": "http://www.oniclan.enjin.com" },
		{ "tag": "ww|", "title": "War Wolves", "website": "http://ww-warwolves.enjin.com" },
		{ "tag": "|SM|", "title": "Superior Mappers", "website": "http://superiormappers.forumotion.eu" },
		{ "tag": "'eS|", "title": "Essential Smileys" },
		{ "tag": "s3xy|", "title": "Sexiest Clan", "website": "http://sexysauer.com" },
		{ "tag": "xS'", "title": "eXperimental Squad", "website": "http://impressivesquad.eu" },
		{ "tag": "aCe|", "title": "Amazing Cube Events" },
		{ "tag": "cH'", "title": "Coop Hopes", "website": "https://ch-clan.com" },
		{ "tag": "|GM|", "title": "German Masters", "website": "http://germanmasters.clanwebsite.com/" }
	],
	"materModeColors": {
	  "auth": "lightgray",
	  "open": "lightgreen",
	  "veto": "yellow",
	  "locked": "yellow",
	  "private": "red",
	  "password": "red"
	},
	"gameModes": {
		"ffa": {},
		"coop_edit": {},
		"teamplay": { "teamMode": true },
		"instagib": { "instaMode": true },
		"insta_team": { "teamMode": true, "instaMode": true },
		"efficiency": { "efficMode": true },
		"effic_team": { "teamMode": true, "efficMode": true },
		"tactics": {},
		"tac_team": { "teamMode": true },
		"capture": { "teamMode": true, "flagMode": true },
		"regen_capture": { "teamMode": true, "flagMode": true },
		"ctf": { "teamMode": true, "flagMode": true },
		"insta_ctf": { "teamMode": true, "instaMode": true, "flagMode": true },
		"protect": { "teamMode": true, "flagMode": true },
		"insta_protect": { "teamMode": true, "instaMode": true, "flagMode": true },
		"hold": { "teamMode": true, "flagMode": true },
		"insta_hold": { "teamMode": true, "instaMode": true, "flagMode": true },
		"effic_ctf": { "teamMode": true, "efficMode": true, "flagMode": true },
		"effic_protect": { "teamMode": true, "efficMode": true, "flagMode": true },
		"effic_hold": { "teamMode": true, "efficMode": true, "flagMode": true },
		"collect": { "teamMode": true, "flagMode": true },
		"insta_collect": { "teamMode": true, "instaMode": true, "flagMode": true },
		"effic_collect": { "teamMode": true, "efficMode": true, "flagMode": true }
	},
	"gameModeGroups": [
		{ "name": "Classic", "modes": [
				{ "name": "coop_edit" },
				{ "name": "ffa" },
				{ "name": "instagib" },
				{ "name": "efficiency" },
				{ "name": "tactics" }
			] },
		{ "name": "Team", "modes": [
				{ "name": "teamplay" },
				{ "name": "insta_team" },
				{ "name": "effic_team" },
				{ "name": "tac_team" }
			] },
		{ "name": "Capture The Flag", "modes": [
				{ "name": "ctf" },
				{ "name": "insta_ctf" },
				{ "name": "effic_ctf" }
			] },
		{ "name": "Hold", "modes": [
				{ "name": "hold" },
				{ "name": "insta_hold" },
				{ "name": "effic_hold" }
			] },
		{ "name": "Protect", "modes": [
				{ "name": "protect" },
				{ "name": "insta_protect" },
				{ "name": "effic_protect" }
			] },
		{ "name": "Capture", "modes": [
				{ "name": "capture" },
				{ "name": "regen_capture" }
			] },
		{ "name": "Collect", "modes": [
				{ "name": "collect" },
				{ "name": "insta_collect" },
				{ "name": "effic_collect" }
			] }
	],
	"duelModes": [ "instagib", "insta_team", "efficiency", "effic_team", "tactics", "tac_team", "ffa", "teamplay" ],
	"mixModes": [ "teamplay", "insta_team", "effic_team", "capture", "regen_capture", "ctf", "insta_ctf", "protect", "insta_protect", "hold", "insta_hold", "effic_ctf", "effic_protect", "effic_hold", "collect", "insta_collect", "effic_collect" ],
	"lockedMModes": [ "locked", "private", "password" ],
	"duelThresholds": { "instagib": 8, "insta_team": 8, "efficiency": 8, "effic_team": 8, "tactics": 0, "tac_team": 0, "ffa": 0, "teamplay": 0 },
	"bannerURL": "https://banners.sauertracker.net/"
}

},{}],4:[function(require,module,exports){
'use strict';

var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var NProgress = window.NProgress;
var dateReflow = window.dateReflow;
var disableDefault = window.disableDefault;
var url = window.url;

var vars = require("../../vars.json");

var gameTemplate = require('../views/_partials/game-mini.pug');
var gameSearchResultsTemplate = require('../views/_partials/game-search-results.pug');

var originalURL = window.location.pathname + window.location.search + window.location.hash;
var openGameID = null;

function prevPageURL(pageUrl, firstID) {
	var curURL = url.parse(pageUrl, true);
	curURL.query.afterid = firstID;
	delete curURL.query.beforeid;
	delete curURL.search;
	return url.format(curURL);
}

function nextPageURL(pageUrl, lastID) {
	var curURL = url.parse(pageUrl, true);
	curURL.query.beforeid = lastID;
	delete curURL.query.afterid;
	delete curURL.search;
	return url.format(curURL);
}

function loadResults(pageURL, append) {
	NProgress.start();
	$.get("/api" + pageURL).done(function (data) {
		var $body = $("#search-results tbody");
		var $scrollTarget = null;

		var nextURL = data.results && data.results.length && data.results[data.results.length - 1].id > data.stats.min ? nextPageURL(pageURL, data.results[data.results.length - 1].id) : undefined;
		if (append) {
			$body.append(gameSearchResultsTemplate(_.assign(data, { vars: vars, _: _, noHead: true })));
			$("#next-page-button").attr("href", nextURL).attr("onclick", "return loadMore('" + nextURL + "');");
			$scrollTarget = $(".scroll-to").last();
		} else {
			var prevURL = data.results && data.results.length && data.results[0].id < data.stats.max ? prevPageURL(pageURL, data.results[0].id) : undefined;
			$("#search-result-container").html(gameSearchResultsTemplate(_.assign(data, { vars: vars, _: _, prevPageURL: prevURL, nextPageURL: nextURL })));
			$scrollTarget = $("#search-results");
		}
		if ($scrollTarget && $scrollTarget.length) $("html, body").animate({
			scrollTop: $scrollTarget.offset().top
		}, 500);
	}).fail(function (xhr, textStatus) {
		if (pageURL.indexOf("/find") < 0) $("#search-result-container").html("");else $("#search-result-container").html('Error loading page: ' + xhr.status + ' ' + textStatus);
	}).always(function () {
		NProgress.done();
		dateReflow();
		disableDefault();
	});
}

window.loadPage = function (pageURL) {
	loadResults(pageURL);
	history.pushState({ url: pageURL }, window.title, pageURL);
	return false;
};

window.loadMore = function (pageURL) {
	loadResults(pageURL, true);
	return false;
};

$(window).bind("popstate", function (event) {
	var state = event.originalEvent.state;
	if (!state) {
		if (originalURL === "/games") window.location.reload();else loadResults(originalURL);
	} else loadResults(state.url);
});

$("#search-form").on("submit", function (event) {
	event.preventDefault();
	window.loadPage("/games/find?" + $(this).serialize());
});

function tryLoadBackground(name) {
	var bg = new Image();
	bg.onload = function () {
		$("#game-info").css("background", "linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/mapshots/" + name + ".jpg) no-repeat center center fixed");
		$("#game-info").css("background-size", "cover");
	};
	bg.src = "/images/mapshots/" + name + ".jpg";
}

function loadGame(id) {
	$.get("/api/game/" + id, function (result) {
		if (!openGameID) return;
		$("#game-info div").html(gameTemplate({ id: id, server: result, vars: vars, _: _ }));
		$("#game-info .reveal").foundation();
		$("#game-info").foundation("open");
		tryLoadBackground(result.mapName);
		dateReflow();
	});
}

window.showGame = function (id) {
	$("#game-info div").html('<div style="text-align: center"><i class="fa fa-spinner fa-pulse fa-4x"></i></div>');
	$("#game-info").css("background", "rgba(27, 27, 27, 0.89)");
	loadGame(id);
	$("#game-info").foundation("open");
	openGameID = id;
};

window.expandGame = function () {
	if (!openGameID) return;
	window.location.href = "/game/" + openGameID;
};

$("#game-info").on("closed.zf.reveal", function () {
	openGameID = null;
});

$(".fdate").fdatepicker({
	format: 'yyyy-mm-dd',
	disableDblClickSelection: true
});

window.onunload = function () {
	$("#game-info").foundation("close");
	openGameID = null;
};

},{"../../vars.json":3,"../views/_partials/game-mini.pug":5,"../views/_partials/game-search-results.pug":6}],5:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;
function pug_style(r){if(!r)return"";if("object"==typeof r){var e="",t="";for(var n in r)pug_has_own_property.call(r,n)&&(e=e+t+n+":"+r[n],t=";");return e}return r=""+r,";"===r[r.length-1]?r.slice(0,-1):r}function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (Date, _, encodeURIComponent, server, vars) {if (!server || !server.gameMode) {
pug_html = pug_html + "Server not found.";
}
else {
pug_html = pug_html + "\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"large-4 columns\"\u003E\u003Ch2\u003E\u003Ca" + (pug_attr("href", ("/server/"+server.host+"/"+server.port), true, false)) + "\u003E" + (null == (pug_interp = server.descriptionStyled) ? "" : pug_interp) + "\u003C\u002Fa\u003E\u003C\u002Fh2\u003E\u003Ca" + (" id=\"server-address\""+pug_attr("onclick", "showConnect('"+server.host+"', "+server.port+")", true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.host) ? "" : pug_interp)) + ":" + (pug_escape(null == (pug_interp = server.port) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003Cspan\u003E |  ";
if ((server.country && server.country != "unknown")) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", "/images/flags/"+server.country+".png", true, false)) + "\u002F\u003E";
}
pug_html = pug_html + " " + (pug_escape(null == (pug_interp = server.countryName) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"large-6 columns end\" style=\"margin-top: 10px\"\u003E";
if (server.info.banned) {
pug_html = pug_html + "\u003Cspan style=\"color: red\"\u003EThis server is banned. Reason: " + (pug_escape(null == (pug_interp = server.info.banned) ? "" : pug_interp)) + ".\u003C\u002Fspan\u003E";
}
else {
pug_html = pug_html + "\u003Ca" + (pug_attr("href", ("/games/find?host="+server.host+"&port="+server.port), true, false)) + "\u003EView other games from this server...\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003Cbr\u002F\u003E";
if (server.zombie) {
pug_html = pug_html + "\u003Cspan style=\"color: red\"\u003EZombie games are not recorded.\u003C\u002Fspan\u003E\u003Cbr\u002F\u003E";
}
if (server.gameMode == "coop_edit") {
pug_html = pug_html + "\u003Cspan style=\"color: red\"\u003ECoop-edit games are not recorded.\u003C\u002Fspan\u003E\u003Cbr\u002F\u003E";
}
pug_html = pug_html + "\u003Ch5 style=\"margin-top: 10px\"\u003E" + (pug_escape(null == (pug_interp = server.gameMode) ? "" : pug_interp)) + "\u003Cspan id=\"map-name\"\u003E " + (pug_escape(null == (pug_interp = server.mapName) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
if (server.masterMode) {
pug_html = pug_html + " |\u003Cspan" + (pug_attr("style", pug_style(("color: "+vars.materModeColors[server.masterMode])), true, false)) + "\u003E " + (pug_escape(null == (pug_interp = server.masterMode) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
if (server.gameType) {
pug_html = pug_html + (" | " + (pug_escape(null == (pug_interp = server.gameType) ? "" : pug_interp)));
}
if (server.timeLeftS) {
pug_html = pug_html + (" | " + (pug_escape(null == (pug_interp = server.timeLeftS) ? "" : pug_interp)));
if (server.timeLeftS != "intermission") {
pug_html = pug_html + " left";
}
}
pug_html = pug_html + (" |\u003Cspan" + (pug_attr("style", pug_style((server.clients==server.maxClients? "color: yellow": "")), true, false)) + "\u003E " + (pug_escape(null == (pug_interp = server.clients) ? "" : pug_interp)));
if (server.maxClients) {
pug_html = pug_html + ("\u002F" + (pug_escape(null == (pug_interp = server.maxClients) ? "" : pug_interp)));
}
pug_html = pug_html + "\u003C\u002Fspan\u003E players";
if (server.time) {
pug_html = pug_html + " |  \u003Cspan class=\"date\"\u003E" + (pug_escape(null == (pug_interp = (server.time instanceof Date)? server.time.toJSON(): server.time) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fh5\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
var players = _.groupBy(server.players, function (pl) { return pl.state==5; });
var specs = players[true];
players = players[false];
var teamMode = vars.gameModes[server.gameMode].teamMode;
var flagMode = vars.gameModes[server.gameMode].flagMode;
if (!teamMode) {
teams = [{players: players}];
} else {
var teams = _.groupBy(players, "team");
teams = _.orderBy(_.map(server.teams, function (val, key) {
if (teamMode && !flagMode) val = _.sumBy(teams[key], "frags");
return {name: key, score: val, players: teams[key]};
}), "score", "desc");
}
_.each(teams, function (team) { team.players = _.orderBy(team.players, ["flags", "frags", "deaths"], ["desc", "desc", "asc"]); })
pug_html = pug_html + "\u003Cdiv class=\"row\" style=\"margin-top: 10px\"\u003E";
// iterate teams
;(function(){
  var $$obj = teams;
  if ('number' == typeof $$obj.length) {
      for (var i = 0, $$l = $$obj.length; i < $$l; i++) {
        var team = $$obj[i];
pug_html = pug_html + "\u003Cdiv" + (pug_attr("class", pug_classes(["medium-6","large-4","columns",(i==teams.length-1? "end": undefined)], [false,false,false,true]), false, false)) + "\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-12 columns\"\u003E";
if (!teamMode && team.players.length) {
pug_html = pug_html + "\u003Clabel class=\"big\"\u003EPlayers\u003C\u002Flabel\u003E";
}
else {
pug_html = pug_html + "\u003Clabel class=\"big\"\u003E\u003Cspan" + (pug_attr("class", pug_classes([(team.name=="good"? "primary": "alert")], [true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = team.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E " + (pug_escape(null == (pug_interp = team.score) ? "" : pug_interp)) + "\u003C\u002Flabel\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
// iterate team.players
;(function(){
  var $$obj = team.players;
  if ('number' == typeof $$obj.length) {
      for (var pug_index1 = 0, $$l = $$obj.length; pug_index1 < $$l; pug_index1++) {
        var player = $$obj[pug_index1];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-1 columns\"\u003E";
if (flagMode) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(player.flags? "success": "secondary")], [false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(player.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-2 columns\"\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.country) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index1 in $$obj) {
      $$l++;
      var player = $$obj[pug_index1];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-1 columns\"\u003E";
if (flagMode) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(player.flags? "success": "secondary")], [false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(player.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-2 columns\"\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.country) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var i in $$obj) {
      $$l++;
      var team = $$obj[i];
pug_html = pug_html + "\u003Cdiv" + (pug_attr("class", pug_classes(["medium-6","large-4","columns",(i==teams.length-1? "end": undefined)], [false,false,false,true]), false, false)) + "\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-12 columns\"\u003E";
if (!teamMode && team.players.length) {
pug_html = pug_html + "\u003Clabel class=\"big\"\u003EPlayers\u003C\u002Flabel\u003E";
}
else {
pug_html = pug_html + "\u003Clabel class=\"big\"\u003E\u003Cspan" + (pug_attr("class", pug_classes([(team.name=="good"? "primary": "alert")], [true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = team.name) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E " + (pug_escape(null == (pug_interp = team.score) ? "" : pug_interp)) + "\u003C\u002Flabel\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
// iterate team.players
;(function(){
  var $$obj = team.players;
  if ('number' == typeof $$obj.length) {
      for (var pug_index2 = 0, $$l = $$obj.length; pug_index2 < $$l; pug_index2++) {
        var player = $$obj[pug_index2];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-1 columns\"\u003E";
if (flagMode) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(player.flags? "success": "secondary")], [false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(player.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-2 columns\"\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.country) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index2 in $$obj) {
      $$l++;
      var player = $$obj[pug_index2];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-1 columns\"\u003E";
if (flagMode) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(player.flags? "success": "secondary")], [false,true]), false, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(player.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-2 columns\"\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.country) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

if (specs) {
pug_html = pug_html + "\u003Cdiv class=\"medium-6 large-4 columns end\"\u003E\u003Clabel class=\"big\"\u003ESpectators\u003C\u002Flabel\u003E";
// iterate specs
;(function(){
  var $$obj = specs;
  if ('number' == typeof $$obj.length) {
      for (var pug_index3 = 0, $$l = $$obj.length; pug_index3 < $$l; pug_index3++) {
        var spec = $$obj[pug_index3];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(spec.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+spec.name), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = spec.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (spec.country) {
pug_html = pug_html + ("\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+spec.country+".png"), true, false)) + "\u002F\u003E " + (pug_escape(null == (pug_interp = spec.country) ? "" : pug_interp)));
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index3 in $$obj) {
      $$l++;
      var spec = $$obj[pug_index3];
pug_html = pug_html + "\u003Cdiv class=\"row bordered-left\"\u003E\u003Cdiv class=\"small-4 columns\"\u003E\u003Ca" + (pug_attr("class", pug_classes([(spec.highlight? "highlighted": null)], [true]), false, false)+pug_attr("href", ("/player/"+spec.name), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = spec.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-5 columns end\"\u003E";
if (spec.country) {
pug_html = pug_html + ("\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+spec.country+".png"), true, false)) + "\u002F\u003E " + (pug_escape(null == (pug_interp = spec.country) ? "" : pug_interp)));
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}}.call(this,"Date" in locals_for_with?locals_for_with.Date:typeof Date!=="undefined"?Date:undefined,"_" in locals_for_with?locals_for_with._:typeof _!=="undefined"?_:undefined,"encodeURIComponent" in locals_for_with?locals_for_with.encodeURIComponent:typeof encodeURIComponent!=="undefined"?encodeURIComponent:undefined,"server" in locals_for_with?locals_for_with.server:typeof server!=="undefined"?server:undefined,"vars" in locals_for_with?locals_for_with.vars:typeof vars!=="undefined"?vars:undefined));;return pug_html;};
},{"pug-runtime":2}],6:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (Date, nextPageURL, noHead, prevPageURL, results, stats) {pug_mixins["results"] = pug_interp = function(){
var block = (this && this.block), attributes = (this && this.attributes) || {};
// iterate results
;(function(){
  var $$obj = results;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var game = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr class=\"clickable\"\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", ("/game/"+game.id), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.serverdesc||(game.host+":"+game.port)) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gamemode) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.map) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gametype) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E";
if (game.isintern) {
pug_html = pug_html + "\u003Cdiv class=\"text-center\"\u003E" + (pug_escape(null == (pug_interp = game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
else
if (game.iswar) {
pug_html = pug_html + "\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: right; padding-right: 10\"\u003E" + (pug_escape(null == (pug_interp = game.meta[2]+" ") ? "" : pug_interp)) + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "success")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[3]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: left; padding-right: 10\"\u003E\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "alert")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[1]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E" + (pug_escape(null == (pug_interp = " "+game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.numplayers) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E\u003Cspan class=\"date\"\u003E" + (pug_escape(null == (pug_interp = (game.timestamp instanceof Date)? game.timestamp.toJSON(): game.timestamp) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var game = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr class=\"clickable\"\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", ("/game/"+game.id), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.serverdesc||(game.host+":"+game.port)) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gamemode) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.map) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gametype) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E";
if (game.isintern) {
pug_html = pug_html + "\u003Cdiv class=\"text-center\"\u003E" + (pug_escape(null == (pug_interp = game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E";
}
else
if (game.iswar) {
pug_html = pug_html + "\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: right; padding-right: 10\"\u003E" + (pug_escape(null == (pug_interp = game.meta[2]+" ") ? "" : pug_interp)) + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "success")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[3]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: left; padding-right: 10\"\u003E\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "alert")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[1]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E" + (pug_escape(null == (pug_interp = " "+game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd" + (pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.numplayers) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap\""+pug_attr("onclick", ("showGame("+game.id+")"), true, false)) + "\u003E\u003Cspan class=\"date\"\u003E" + (pug_escape(null == (pug_interp = (game.timestamp instanceof Date)? game.timestamp.toJSON(): game.timestamp) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

};
if ((!noHead)) {
pug_html = pug_html + "\u003Cdiv class=\"medium-12 columns\"\u003E";
if (results.length == 0) {
pug_html = pug_html + "\u003Ch3\u003ENo results!\u003C\u002Fh3\u003E";
}
else {
pug_html = pug_html + "\u003Ctable class=\"scroll\" id=\"search-results\" width=\"100%\"\u003E\u003Cthead\u003E\u003Ctr\u003E\u003Ctd width=\"16%\"\u003EServer\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EMode\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EMap\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EType\u003C\u002Ftd\u003E\u003Ctd class=\"text-center\" width=\"26%\"\u003EResults\u003C\u002Ftd\u003E\u003Ctd width=\"8%\"\u003EClients\u003C\u002Ftd\u003E\u003Ctd width=\"20%\"\u003EEnd time\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
pug_mixins["results"]();
pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"columns medium-8 large-6 medium-centered\"\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-4 columns text-center\"\u003E";
if (prevPageURL) {
pug_html = pug_html + "\u003Ca" + (" class=\"hollow button secondary\""+pug_attr("href", (prevPageURL), true, false)+pug_attr("onclick", "return loadPage('"+prevPageURL+"');", true, false)) + "\u003E\u003Ci class=\"fa fa-angle-double-left\"\u003E\u003C\u002Fi\u003E Newer\u003C\u002Fa\u003E";
}
else {
pug_html = pug_html + "&nbsp;";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns text-center\"\u003E\u003Clabel class=\"big\"\u003E" + (pug_escape(null == (pug_interp = stats.count) ? "" : pug_interp)) + " results\u003C\u002Flabel\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-4 columns text-center\"\u003E";
if (nextPageURL) {
pug_html = pug_html + "\u003Ca" + (" class=\"hollow button secondary\""+" id=\"next-page-button\""+pug_attr("href", (nextPageURL), true, false)+pug_attr("onclick", ("return loadPage('"+nextPageURL+"');"), true, false)) + "\u003EOlder \u003Ci class=\"fa fa-angle-double-right\"\u003E\u003C\u002Fi\u003E\u003C\u002Fa\u003E";
}
else {
pug_html = pug_html + "&nbsp;";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E";
}
pug_html = pug_html + "\u003C\u002Fdiv\u003E";
}
else {
pug_html = pug_html + "\u003Ctr class=\"scroll-to\"\u003E\u003Ctd width=\"16%\"\u003EServer\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EMode\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EMap\u003C\u002Ftd\u003E\u003Ctd width=\"10%\"\u003EType\u003C\u002Ftd\u003E\u003Ctd class=\"text-center\" width=\"26%\"\u003EResults\u003C\u002Ftd\u003E\u003Ctd width=\"8%\"\u003EClients\u003C\u002Ftd\u003E\u003Ctd width=\"20%\"\u003EEnd time\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
pug_mixins["results"]();
}}.call(this,"Date" in locals_for_with?locals_for_with.Date:typeof Date!=="undefined"?Date:undefined,"nextPageURL" in locals_for_with?locals_for_with.nextPageURL:typeof nextPageURL!=="undefined"?nextPageURL:undefined,"noHead" in locals_for_with?locals_for_with.noHead:typeof noHead!=="undefined"?noHead:undefined,"prevPageURL" in locals_for_with?locals_for_with.prevPageURL:typeof prevPageURL!=="undefined"?prevPageURL:undefined,"results" in locals_for_with?locals_for_with.results:typeof results!=="undefined"?results:undefined,"stats" in locals_for_with?locals_for_with.stats:typeof stats!=="undefined"?stats:undefined));;return pug_html;};
},{"pug-runtime":2}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3B1Zy1ydW50aW1lL2luZGV4LmpzIiwidmFycy5qc29uIiwid2Vic2l0ZS9qcy9nYW1lcy5qcyIsIndlYnNpdGUvdmlld3MvX3BhcnRpYWxzL2dhbWUtbWluaS5wdWciLCJ3ZWJzaXRlL3ZpZXdzL19wYXJ0aWFscy9nYW1lLXNlYXJjaC1yZXN1bHRzLnB1ZyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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YSxJQUFiO0FBQ0EsQ0FIRDs7O0FDOUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIiLCIndXNlIHN0cmljdCc7XG5cbnZhciBwdWdfaGFzX293bl9wcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbi8qKlxuICogTWVyZ2UgdHdvIGF0dHJpYnV0ZSBvYmplY3RzIGdpdmluZyBwcmVjZWRlbmNlXG4gKiB0byB2YWx1ZXMgaW4gb2JqZWN0IGBiYC4gQ2xhc3NlcyBhcmUgc3BlY2lhbC1jYXNlZFxuICogYWxsb3dpbmcgZm9yIGFycmF5cyBhbmQgbWVyZ2luZy9qb2luaW5nIGFwcHJvcHJpYXRlbHlcbiAqIHJlc3VsdGluZyBpbiBhIHN0cmluZy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gYVxuICogQHBhcmFtIHtPYmplY3R9IGJcbiAqIEByZXR1cm4ge09iamVjdH0gYVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5tZXJnZSA9IHB1Z19tZXJnZTtcbmZ1bmN0aW9uIHB1Z19tZXJnZShhLCBiKSB7XG4gIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgdmFyIGF0dHJzID0gYVswXTtcbiAgICBmb3IgKHZhciBpID0gMTsgaSA8IGEubGVuZ3RoOyBpKyspIHtcbiAgICAgIGF0dHJzID0gcHVnX21lcmdlKGF0dHJzLCBhW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIGF0dHJzO1xuICB9XG5cbiAgZm9yICh2YXIga2V5IGluIGIpIHtcbiAgICBpZiAoa2V5ID09PSAnY2xhc3MnKSB7XG4gICAgICB2YXIgdmFsQSA9IGFba2V5XSB8fCBbXTtcbiAgICAgIGFba2V5XSA9IChBcnJheS5pc0FycmF5KHZhbEEpID8gdmFsQSA6IFt2YWxBXSkuY29uY2F0KGJba2V5XSB8fCBbXSk7XG4gICAgfSBlbHNlIGlmIChrZXkgPT09ICdzdHlsZScpIHtcbiAgICAgIHZhciB2YWxBID0gcHVnX3N0eWxlKGFba2V5XSk7XG4gICAgICB2YXIgdmFsQiA9IHB1Z19zdHlsZShiW2tleV0pO1xuICAgICAgYVtrZXldID0gdmFsQSArICh2YWxBICYmIHZhbEIgJiYgJzsnKSArIHZhbEI7XG4gICAgfSBlbHNlIHtcbiAgICAgIGFba2V5XSA9IGJba2V5XTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYTtcbn07XG5cbi8qKlxuICogUHJvY2VzcyBhcnJheSwgb2JqZWN0LCBvciBzdHJpbmcgYXMgYSBzdHJpbmcgb2YgY2xhc3NlcyBkZWxpbWl0ZWQgYnkgYSBzcGFjZS5cbiAqXG4gKiBJZiBgdmFsYCBpcyBhbiBhcnJheSwgYWxsIG1lbWJlcnMgb2YgaXQgYW5kIGl0cyBzdWJhcnJheXMgYXJlIGNvdW50ZWQgYXNcbiAqIGNsYXNzZXMuIElmIGBlc2NhcGluZ2AgaXMgYW4gYXJyYXksIHRoZW4gd2hldGhlciBvciBub3QgdGhlIGl0ZW0gaW4gYHZhbGAgaXNcbiAqIGVzY2FwZWQgZGVwZW5kcyBvbiB0aGUgY29ycmVzcG9uZGluZyBpdGVtIGluIGBlc2NhcGluZ2AuIElmIGBlc2NhcGluZ2AgaXNcbiAqIG5vdCBhbiBhcnJheSwgbm8gZXNjYXBpbmcgaXMgZG9uZS5cbiAqXG4gKiBJZiBgdmFsYCBpcyBhbiBvYmplY3QsIGFsbCB0aGUga2V5cyB3aG9zZSB2YWx1ZSBpcyB0cnV0aHkgYXJlIGNvdW50ZWQgYXNcbiAqIGNsYXNzZXMuIE5vIGVzY2FwaW5nIGlzIGRvbmUuXG4gKlxuICogSWYgYHZhbGAgaXMgYSBzdHJpbmcsIGl0IGlzIGNvdW50ZWQgYXMgYSBjbGFzcy4gTm8gZXNjYXBpbmcgaXMgZG9uZS5cbiAqXG4gKiBAcGFyYW0geyhBcnJheS48c3RyaW5nPnxPYmplY3QuPHN0cmluZywgYm9vbGVhbj58c3RyaW5nKX0gdmFsXG4gKiBAcGFyYW0gez9BcnJheS48c3RyaW5nPn0gZXNjYXBpbmdcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0cy5jbGFzc2VzID0gcHVnX2NsYXNzZXM7XG5mdW5jdGlvbiBwdWdfY2xhc3Nlc19hcnJheSh2YWwsIGVzY2FwaW5nKSB7XG4gIHZhciBjbGFzc1N0cmluZyA9ICcnLCBjbGFzc05hbWUsIHBhZGRpbmcgPSAnJywgZXNjYXBlRW5hYmxlZCA9IEFycmF5LmlzQXJyYXkoZXNjYXBpbmcpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IHZhbC5sZW5ndGg7IGkrKykge1xuICAgIGNsYXNzTmFtZSA9IHB1Z19jbGFzc2VzKHZhbFtpXSk7XG4gICAgaWYgKCFjbGFzc05hbWUpIGNvbnRpbnVlO1xuICAgIGVzY2FwZUVuYWJsZWQgJiYgZXNjYXBpbmdbaV0gJiYgKGNsYXNzTmFtZSA9IHB1Z19lc2NhcGUoY2xhc3NOYW1lKSk7XG4gICAgY2xhc3NTdHJpbmcgPSBjbGFzc1N0cmluZyArIHBhZGRpbmcgKyBjbGFzc05hbWU7XG4gICAgcGFkZGluZyA9ICcgJztcbiAgfVxuICByZXR1cm4gY2xhc3NTdHJpbmc7XG59XG5mdW5jdGlvbiBwdWdfY2xhc3Nlc19vYmplY3QodmFsKSB7XG4gIHZhciBjbGFzc1N0cmluZyA9ICcnLCBwYWRkaW5nID0gJyc7XG4gIGZvciAodmFyIGtleSBpbiB2YWwpIHtcbiAgICBpZiAoa2V5ICYmIHZhbFtrZXldICYmIHB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwodmFsLCBrZXkpKSB7XG4gICAgICBjbGFzc1N0cmluZyA9IGNsYXNzU3RyaW5nICsgcGFkZGluZyArIGtleTtcbiAgICAgIHBhZGRpbmcgPSAnICc7XG4gICAgfVxuICB9XG4gIHJldHVybiBjbGFzc1N0cmluZztcbn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzKHZhbCwgZXNjYXBpbmcpIHtcbiAgaWYgKEFycmF5LmlzQXJyYXkodmFsKSkge1xuICAgIHJldHVybiBwdWdfY2xhc3Nlc19hcnJheSh2YWwsIGVzY2FwaW5nKTtcbiAgfSBlbHNlIGlmICh2YWwgJiYgdHlwZW9mIHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICByZXR1cm4gcHVnX2NsYXNzZXNfb2JqZWN0KHZhbCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbCB8fCAnJztcbiAgfVxufVxuXG4vKipcbiAqIENvbnZlcnQgb2JqZWN0IG9yIHN0cmluZyB0byBhIHN0cmluZyBvZiBDU1Mgc3R5bGVzIGRlbGltaXRlZCBieSBhIHNlbWljb2xvbi5cbiAqXG4gKiBAcGFyYW0geyhPYmplY3QuPHN0cmluZywgc3RyaW5nPnxzdHJpbmcpfSB2YWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuXG5leHBvcnRzLnN0eWxlID0gcHVnX3N0eWxlO1xuZnVuY3Rpb24gcHVnX3N0eWxlKHZhbCkge1xuICBpZiAoIXZhbCkgcmV0dXJuICcnO1xuICBpZiAodHlwZW9mIHZhbCA9PT0gJ29iamVjdCcpIHtcbiAgICB2YXIgb3V0ID0gJycsIGRlbGltID0gJyc7XG4gICAgZm9yICh2YXIgc3R5bGUgaW4gdmFsKSB7XG4gICAgICAvKiBpc3RhbmJ1bCBpZ25vcmUgZWxzZSAqL1xuICAgICAgaWYgKHB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwodmFsLCBzdHlsZSkpIHtcbiAgICAgICAgb3V0ID0gb3V0ICsgZGVsaW0gKyBzdHlsZSArICc6JyArIHZhbFtzdHlsZV07XG4gICAgICAgIGRlbGltID0gJzsnO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gb3V0O1xuICB9IGVsc2Uge1xuICAgIHZhbCA9ICcnICsgdmFsO1xuICAgIGlmICh2YWxbdmFsLmxlbmd0aCAtIDFdID09PSAnOycpIHJldHVybiB2YWwuc2xpY2UoMCwgLTEpO1xuICAgIHJldHVybiB2YWw7XG4gIH1cbn07XG5cbi8qKlxuICogUmVuZGVyIHRoZSBnaXZlbiBhdHRyaWJ1dGUuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGtleVxuICogQHBhcmFtIHtTdHJpbmd9IHZhbFxuICogQHBhcmFtIHtCb29sZWFufSBlc2NhcGVkXG4gKiBAcGFyYW0ge0Jvb2xlYW59IHRlcnNlXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuYXR0ciA9IHB1Z19hdHRyO1xuZnVuY3Rpb24gcHVnX2F0dHIoa2V5LCB2YWwsIGVzY2FwZWQsIHRlcnNlKSB7XG4gIGlmICh2YWwgPT09IGZhbHNlIHx8IHZhbCA9PSBudWxsIHx8ICF2YWwgJiYgKGtleSA9PT0gJ2NsYXNzJyB8fCBrZXkgPT09ICdzdHlsZScpKSB7XG4gICAgcmV0dXJuICcnO1xuICB9XG4gIGlmICh2YWwgPT09IHRydWUpIHtcbiAgICByZXR1cm4gJyAnICsgKHRlcnNlID8ga2V5IDoga2V5ICsgJz1cIicgKyBrZXkgKyAnXCInKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbC50b0pTT04gPT09ICdmdW5jdGlvbicpIHtcbiAgICB2YWwgPSB2YWwudG9KU09OKCk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwgIT09ICdzdHJpbmcnKSB7XG4gICAgdmFsID0gSlNPTi5zdHJpbmdpZnkodmFsKTtcbiAgICBpZiAoIWVzY2FwZWQgJiYgdmFsLmluZGV4T2YoJ1wiJykgIT09IC0xKSB7XG4gICAgICByZXR1cm4gJyAnICsga2V5ICsgJz1cXCcnICsgdmFsLnJlcGxhY2UoLycvZywgJyYjMzk7JykgKyAnXFwnJztcbiAgICB9XG4gIH1cbiAgaWYgKGVzY2FwZWQpIHZhbCA9IHB1Z19lc2NhcGUodmFsKTtcbiAgcmV0dXJuICcgJyArIGtleSArICc9XCInICsgdmFsICsgJ1wiJztcbn07XG5cbi8qKlxuICogUmVuZGVyIHRoZSBnaXZlbiBhdHRyaWJ1dGVzIG9iamVjdC5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gb2JqXG4gKiBAcGFyYW0ge09iamVjdH0gdGVyc2Ugd2hldGhlciB0byB1c2UgSFRNTDUgdGVyc2UgYm9vbGVhbiBhdHRyaWJ1dGVzXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuYXR0cnMgPSBwdWdfYXR0cnM7XG5mdW5jdGlvbiBwdWdfYXR0cnMob2JqLCB0ZXJzZSl7XG4gIHZhciBhdHRycyA9ICcnO1xuXG4gIGZvciAodmFyIGtleSBpbiBvYmopIHtcbiAgICBpZiAocHVnX2hhc19vd25fcHJvcGVydHkuY2FsbChvYmosIGtleSkpIHtcbiAgICAgIHZhciB2YWwgPSBvYmpba2V5XTtcblxuICAgICAgaWYgKCdjbGFzcycgPT09IGtleSkge1xuICAgICAgICB2YWwgPSBwdWdfY2xhc3Nlcyh2YWwpO1xuICAgICAgICBhdHRycyA9IHB1Z19hdHRyKGtleSwgdmFsLCBmYWxzZSwgdGVyc2UpICsgYXR0cnM7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgICAgaWYgKCdzdHlsZScgPT09IGtleSkge1xuICAgICAgICB2YWwgPSBwdWdfc3R5bGUodmFsKTtcbiAgICAgIH1cbiAgICAgIGF0dHJzICs9IHB1Z19hdHRyKGtleSwgdmFsLCBmYWxzZSwgdGVyc2UpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhdHRycztcbn07XG5cbi8qKlxuICogRXNjYXBlIHRoZSBnaXZlbiBzdHJpbmcgb2YgYGh0bWxgLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG52YXIgcHVnX21hdGNoX2h0bWwgPSAvW1wiJjw+XS87XG5leHBvcnRzLmVzY2FwZSA9IHB1Z19lc2NhcGU7XG5mdW5jdGlvbiBwdWdfZXNjYXBlKF9odG1sKXtcbiAgdmFyIGh0bWwgPSAnJyArIF9odG1sO1xuICB2YXIgcmVnZXhSZXN1bHQgPSBwdWdfbWF0Y2hfaHRtbC5leGVjKGh0bWwpO1xuICBpZiAoIXJlZ2V4UmVzdWx0KSByZXR1cm4gX2h0bWw7XG5cbiAgdmFyIHJlc3VsdCA9ICcnO1xuICB2YXIgaSwgbGFzdEluZGV4LCBlc2NhcGU7XG4gIGZvciAoaSA9IHJlZ2V4UmVzdWx0LmluZGV4LCBsYXN0SW5kZXggPSAwOyBpIDwgaHRtbC5sZW5ndGg7IGkrKykge1xuICAgIHN3aXRjaCAoaHRtbC5jaGFyQ29kZUF0KGkpKSB7XG4gICAgICBjYXNlIDM0OiBlc2NhcGUgPSAnJnF1b3Q7JzsgYnJlYWs7XG4gICAgICBjYXNlIDM4OiBlc2NhcGUgPSAnJmFtcDsnOyBicmVhaztcbiAgICAgIGNhc2UgNjA6IGVzY2FwZSA9ICcmbHQ7JzsgYnJlYWs7XG4gICAgICBjYXNlIDYyOiBlc2NhcGUgPSAnJmd0Oyc7IGJyZWFrO1xuICAgICAgZGVmYXVsdDogY29udGludWU7XG4gICAgfVxuICAgIGlmIChsYXN0SW5kZXggIT09IGkpIHJlc3VsdCArPSBodG1sLnN1YnN0cmluZyhsYXN0SW5kZXgsIGkpO1xuICAgIGxhc3RJbmRleCA9IGkgKyAxO1xuICAgIHJlc3VsdCArPSBlc2NhcGU7XG4gIH1cbiAgaWYgKGxhc3RJbmRleCAhPT0gaSkgcmV0dXJuIHJlc3VsdCArIGh0bWwuc3Vic3RyaW5nKGxhc3RJbmRleCwgaSk7XG4gIGVsc2UgcmV0dXJuIHJlc3VsdDtcbn07XG5cbi8qKlxuICogUmUtdGhyb3cgdGhlIGdpdmVuIGBlcnJgIGluIGNvbnRleHQgdG8gdGhlXG4gKiB0aGUgcHVnIGluIGBmaWxlbmFtZWAgYXQgdGhlIGdpdmVuIGBsaW5lbm9gLlxuICpcbiAqIEBwYXJhbSB7RXJyb3J9IGVyclxuICogQHBhcmFtIHtTdHJpbmd9IGZpbGVuYW1lXG4gKiBAcGFyYW0ge1N0cmluZ30gbGluZW5vXG4gKiBAcGFyYW0ge1N0cmluZ30gc3RyIG9yaWdpbmFsIHNvdXJjZVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxuZXhwb3J0cy5yZXRocm93ID0gcHVnX3JldGhyb3c7XG5mdW5jdGlvbiBwdWdfcmV0aHJvdyhlcnIsIGZpbGVuYW1lLCBsaW5lbm8sIHN0cil7XG4gIGlmICghKGVyciBpbnN0YW5jZW9mIEVycm9yKSkgdGhyb3cgZXJyO1xuICBpZiAoKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgfHwgIWZpbGVuYW1lKSAmJiAhc3RyKSB7XG4gICAgZXJyLm1lc3NhZ2UgKz0gJyBvbiBsaW5lICcgKyBsaW5lbm87XG4gICAgdGhyb3cgZXJyO1xuICB9XG4gIHRyeSB7XG4gICAgc3RyID0gc3RyIHx8IHJlcXVpcmUoJ2ZzJykucmVhZEZpbGVTeW5jKGZpbGVuYW1lLCAndXRmOCcpXG4gIH0gY2F0Y2ggKGV4KSB7XG4gICAgcHVnX3JldGhyb3coZXJyLCBudWxsLCBsaW5lbm8pXG4gIH1cbiAgdmFyIGNvbnRleHQgPSAzXG4gICAgLCBsaW5lcyA9IHN0ci5zcGxpdCgnXFxuJylcbiAgICAsIHN0YXJ0ID0gTWF0aC5tYXgobGluZW5vIC0gY29udGV4dCwgMClcbiAgICAsIGVuZCA9IE1hdGgubWluKGxpbmVzLmxlbmd0aCwgbGluZW5vICsgY29udGV4dCk7XG5cbiAgLy8gRXJyb3IgY29udGV4dFxuICB2YXIgY29udGV4dCA9IGxpbmVzLnNsaWNlKHN0YXJ0LCBlbmQpLm1hcChmdW5jdGlvbihsaW5lLCBpKXtcbiAgICB2YXIgY3VyciA9IGkgKyBzdGFydCArIDE7XG4gICAgcmV0dXJuIChjdXJyID09IGxpbmVubyA/ICcgID4gJyA6ICcgICAgJylcbiAgICAgICsgY3VyclxuICAgICAgKyAnfCAnXG4gICAgICArIGxpbmU7XG4gIH0pLmpvaW4oJ1xcbicpO1xuXG4gIC8vIEFsdGVyIGV4Y2VwdGlvbiBtZXNzYWdlXG4gIGVyci5wYXRoID0gZmlsZW5hbWU7XG4gIGVyci5tZXNzYWdlID0gKGZpbGVuYW1lIHx8ICdQdWcnKSArICc6JyArIGxpbmVub1xuICAgICsgJ1xcbicgKyBjb250ZXh0ICsgJ1xcblxcbicgKyBlcnIubWVzc2FnZTtcbiAgdGhyb3cgZXJyO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzPXtcblx0XCJjbGFuc1wiOiBbXG5cdFx0eyBcInRhZ1wiOiBcIiFzXVwiLCBcInRpdGxlXCI6IFwiIW1wcmVzc2l2ZSBTcXVhZFwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vaW1wcmVzc2l2ZXNxdWFkLmV1XCIgfSxcblx0XHR7IFwidGFnXCI6IFwifFJCfFwiLCBcInRpdGxlXCI6IFwiUmVkIEJ1dGNoZXJzXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9idXRjaGVycy5zdVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIi5jU3xcIiwgXCJ0aXRsZVwiOiBcIkN1YmUgU3RyaWtlcnNcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCIuckN8XCIsIFwidGl0bGVcIjogXCJSaXNpbmcgQ3ViZXJzXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9yaXNpbmctY3ViZXJzLmV1XCIgfSxcblx0XHR7IFwidGFnXCI6IFwiR0MxL1wiLCBcInRpdGxlXCI6IFwiR2FtZXIgQ2xhc3MgMVwifSxcblx0XHR7IFwidGFnXCI6IFwidmFRJ1wiLCBcInRpdGxlXCI6IFwiVnVsdHVyZSBBdHRhY2sgU3F1YWRcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3ZhcS1jbGFuLmRlXCIgfSxcblx0XHR7IFwidGFnXCI6IFwic3A0bmtcIiwgXCJ0aXRsZVwiOiBcInNwNG5rXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9zcDRuay5uZXRcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJbdEJNQ11cIiwgXCJ0aXRsZVwiOiBcIlRoZSBCbHVlIE1vbmtleSBDdWx0XCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly90aGVibHVlbW9ua2V5Y3VsdC53ZWJzLmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIm9vfFwiLCBcInRpdGxlXCI6IFwiT2dyb3NcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL29ncm9zLm9yZ1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIncwMHB8XCIsIFwidGl0bGVcIjogXCJ3MDBwXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly93b29wLnVzXCIgfSxcblx0XHR7IFwidGFnXCI6IFwifERNfFwiLCBcInRpdGxlXCI6IFwiRGFuZ2Vyb3VzIE1vbmtleXNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2Rhbmdlcm91c21vbmtleXMuZm9ydW1jb21tdW5pdHkubmV0XCIgfSxcblx0XHR7IFwidGFnXCI6IFwifG5vVkk6XCIsIFwidGl0bGVcIjogXCJObyBWaW9sZW5jZVwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vbm92aXRlYW0uZGVcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJbRkRdXCIsIFwidGl0bGVcIjogXCJGb3Jnb3R0ZW4gRHJlYW1cIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2ZvcmdvdHRlbmRyZWFtLm9yZ1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIj1ESz1cIiwgXCJ0aXRsZVwiOiBcIkRhcmsgS2VlcGVyc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vZGFya2tlZXBlcnMuZGtcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJlWGN8XCIsIFwidGl0bGVcIjogXCJFeGNlbGxlbmNlXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiQ3Jvd2Q+XCIsIFwidGl0bGVcIjogXCJDcm93ZFwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vY3Jvd2QuZ2dcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ8SER8XCIsIFwidGl0bGVcIjogXCJIaWdoIERlZmluaXRpb25cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCI8c0FzL1wiLCBcInRpdGxlXCI6IFwic0FzXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiY218XCIsIFwidGl0bGVcIjogXCJDdWJpYyBNYXR0ZXJcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2N1YmljbWF0dGVyLm5ldFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcImdsb3J5fFwiLCBcInRpdGxlXCI6IFwiR2xvcnlcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ8T1JLfFwiLCBcInRpdGxlXCI6IFwiT1JLXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiW0dMWF1cIiwgXCJ0aXRsZVwiOiBcIkdMWFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcImVDLlwiLCBcInRpdGxlXCI6IFwiRW5pZ21hdGljIENyZXdcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2VuaWNyZXcudGtcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCI8cFduPlwiLCBcInRpdGxlXCI6IFwicFduXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiLmMyfFwiLCBcInRpdGxlXCI6IFwiQzJcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2MyY2xhbi50a1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIihFU1ApXCIsIFwidGl0bGVcIjogXCJFc3BlY2lhbCBTdXBlciBQYXJhZ29uc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vZXNwdGVhbS5vcmdcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJbUlVTU11cIiwgXCJ0aXRsZVwiOiBcIlJVU1NcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3J1c3NhdWVyY2xhbi5ib2FyZHMubmV0XCIgfSxcblx0XHR7IFwidGFnXCI6IFwiUkVEfFwiLCBcInRpdGxlXCI6IFwiUkVEXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiI1RKUy5cIiwgXCJ0aXRsZVwiOiBcIlRKU1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInZhfFwiLCBcInRpdGxlXCI6IFwiVm94ZWxBcm15XCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly93d3cudm94ZWxhcm15LmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInZFJ1wiLCBcInRpdGxlXCI6IFwidkUnY3RvclwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vdmVjdG9yLmVuamluLmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxFS3xcIiwgXCJ0aXRsZVwiOiBcIkV0ZXJuYWwgS2lsbGVyc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vdGVrY2xhbnNhdWVyLmNyZWF0ZWFmb3J1bS5jb21cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJNeVNcIiwgXCJ0aXRsZVwiOiBcIk1ha2VzIHlvdSBTaWNrXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9teXlzLmJwbGFjZWQubmV0XCIgfSxcblx0XHR7IFwidGFnXCI6IFwifE9OSXxcIiwgXCJ0aXRsZVwiOiBcIk9OSVwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vd3d3Lm9uaWNsYW4uZW5qaW4uY29tXCIgfSxcblx0XHR7IFwidGFnXCI6IFwid3d8XCIsIFwidGl0bGVcIjogXCJXYXIgV29sdmVzXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly93dy13YXJ3b2x2ZXMuZW5qaW4uY29tXCIgfSxcblx0XHR7IFwidGFnXCI6IFwifFNNfFwiLCBcInRpdGxlXCI6IFwiU3VwZXJpb3IgTWFwcGVyc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vc3VwZXJpb3JtYXBwZXJzLmZvcnVtb3Rpb24uZXVcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCInZVN8XCIsIFwidGl0bGVcIjogXCJFc3NlbnRpYWwgU21pbGV5c1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInMzeHl8XCIsIFwidGl0bGVcIjogXCJTZXhpZXN0IENsYW5cIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3NleHlzYXVlci5jb21cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ4UydcIiwgXCJ0aXRsZVwiOiBcImVYcGVyaW1lbnRhbCBTcXVhZFwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vaW1wcmVzc2l2ZXNxdWFkLmV1XCIgfSxcblx0XHR7IFwidGFnXCI6IFwiYUNlfFwiLCBcInRpdGxlXCI6IFwiQW1hemluZyBDdWJlIEV2ZW50c1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcImNIJ1wiLCBcInRpdGxlXCI6IFwiQ29vcCBIb3Blc1wiLCBcIndlYnNpdGVcIjogXCJodHRwczovL2NoLWNsYW4uY29tXCIgfSxcblx0XHR7IFwidGFnXCI6IFwifEdNfFwiLCBcInRpdGxlXCI6IFwiR2VybWFuIE1hc3RlcnNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2dlcm1hbm1hc3RlcnMuY2xhbndlYnNpdGUuY29tL1wiIH1cblx0XSxcblx0XCJtYXRlck1vZGVDb2xvcnNcIjoge1xuXHQgIFwiYXV0aFwiOiBcImxpZ2h0Z3JheVwiLFxuXHQgIFwib3BlblwiOiBcImxpZ2h0Z3JlZW5cIixcblx0ICBcInZldG9cIjogXCJ5ZWxsb3dcIixcblx0ICBcImxvY2tlZFwiOiBcInllbGxvd1wiLFxuXHQgIFwicHJpdmF0ZVwiOiBcInJlZFwiLFxuXHQgIFwicGFzc3dvcmRcIjogXCJyZWRcIlxuXHR9LFxuXHRcImdhbWVNb2Rlc1wiOiB7XG5cdFx0XCJmZmFcIjoge30sXG5cdFx0XCJjb29wX2VkaXRcIjoge30sXG5cdFx0XCJ0ZWFtcGxheVwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiaW5zdGFnaWJcIjogeyBcImluc3RhTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJpbnN0YV90ZWFtXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImluc3RhTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJlZmZpY2llbmN5XCI6IHsgXCJlZmZpY01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiZWZmaWNfdGVhbVwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJlZmZpY01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwidGFjdGljc1wiOiB7fSxcblx0XHRcInRhY190ZWFtXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJjYXB0dXJlXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcInJlZ2VuX2NhcHR1cmVcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiY3RmXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImluc3RhX2N0ZlwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJpbnN0YU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJwcm90ZWN0XCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImluc3RhX3Byb3RlY3RcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiaW5zdGFNb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiaG9sZFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJpbnN0YV9ob2xkXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImluc3RhTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImVmZmljX2N0ZlwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJlZmZpY01vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJlZmZpY19wcm90ZWN0XCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImVmZmljTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImVmZmljX2hvbGRcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZWZmaWNNb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiY29sbGVjdFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJpbnN0YV9jb2xsZWN0XCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImluc3RhTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImVmZmljX2NvbGxlY3RcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZWZmaWNNb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9XG5cdH0sXG5cdFwiZ2FtZU1vZGVHcm91cHNcIjogW1xuXHRcdHsgXCJuYW1lXCI6IFwiQ2xhc3NpY1wiLCBcIm1vZGVzXCI6IFtcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJjb29wX2VkaXRcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImZmYVwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFnaWJcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImVmZmljaWVuY3lcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcInRhY3RpY3NcIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJUZWFtXCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcInRlYW1wbGF5XCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJpbnN0YV90ZWFtXCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJlZmZpY190ZWFtXCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJ0YWNfdGVhbVwiIH1cblx0XHRcdF0gfSxcblx0XHR7IFwibmFtZVwiOiBcIkNhcHR1cmUgVGhlIEZsYWdcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiY3RmXCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJpbnN0YV9jdGZcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImVmZmljX2N0ZlwiIH1cblx0XHRcdF0gfSxcblx0XHR7IFwibmFtZVwiOiBcIkhvbGRcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaG9sZFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFfaG9sZFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiZWZmaWNfaG9sZFwiIH1cblx0XHRcdF0gfSxcblx0XHR7IFwibmFtZVwiOiBcIlByb3RlY3RcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwicHJvdGVjdFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFfcHJvdGVjdFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiZWZmaWNfcHJvdGVjdFwiIH1cblx0XHRcdF0gfSxcblx0XHR7IFwibmFtZVwiOiBcIkNhcHR1cmVcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiY2FwdHVyZVwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwicmVnZW5fY2FwdHVyZVwiIH1cblx0XHRcdF0gfSxcblx0XHR7IFwibmFtZVwiOiBcIkNvbGxlY3RcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiY29sbGVjdFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFfY29sbGVjdFwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiZWZmaWNfY29sbGVjdFwiIH1cblx0XHRcdF0gfVxuXHRdLFxuXHRcImR1ZWxNb2Rlc1wiOiBbIFwiaW5zdGFnaWJcIiwgXCJpbnN0YV90ZWFtXCIsIFwiZWZmaWNpZW5jeVwiLCBcImVmZmljX3RlYW1cIiwgXCJ0YWN0aWNzXCIsIFwidGFjX3RlYW1cIiwgXCJmZmFcIiwgXCJ0ZWFtcGxheVwiIF0sXG5cdFwibWl4TW9kZXNcIjogWyBcInRlYW1wbGF5XCIsIFwiaW5zdGFfdGVhbVwiLCBcImVmZmljX3RlYW1cIiwgXCJjYXB0dXJlXCIsIFwicmVnZW5fY2FwdHVyZVwiLCBcImN0ZlwiLCBcImluc3RhX2N0ZlwiLCBcInByb3RlY3RcIiwgXCJpbnN0YV9wcm90ZWN0XCIsIFwiaG9sZFwiLCBcImluc3RhX2hvbGRcIiwgXCJlZmZpY19jdGZcIiwgXCJlZmZpY19wcm90ZWN0XCIsIFwiZWZmaWNfaG9sZFwiLCBcImNvbGxlY3RcIiwgXCJpbnN0YV9jb2xsZWN0XCIsIFwiZWZmaWNfY29sbGVjdFwiIF0sXG5cdFwibG9ja2VkTU1vZGVzXCI6IFsgXCJsb2NrZWRcIiwgXCJwcml2YXRlXCIsIFwicGFzc3dvcmRcIiBdLFxuXHRcImR1ZWxUaHJlc2hvbGRzXCI6IHsgXCJpbnN0YWdpYlwiOiA4LCBcImluc3RhX3RlYW1cIjogOCwgXCJlZmZpY2llbmN5XCI6IDgsIFwiZWZmaWNfdGVhbVwiOiA4LCBcInRhY3RpY3NcIjogMCwgXCJ0YWNfdGVhbVwiOiAwLCBcImZmYVwiOiAwLCBcInRlYW1wbGF5XCI6IDAgfSxcblx0XCJiYW5uZXJVUkxcIjogXCJodHRwczovL2Jhbm5lcnMuc2F1ZXJ0cmFja2VyLm5ldC9cIlxufVxuIiwidmFyICQgPSB3aW5kb3cuJDtcbnZhciBfID0gd2luZG93Ll87XG52YXIgZm91bmRhdGlvbiA9IHdpbmRvdy5Gb3VuZGF0aW9uO1xudmFyIE5Qcm9ncmVzcyA9IHdpbmRvdy5OUHJvZ3Jlc3M7XG52YXIgZGF0ZVJlZmxvdyA9IHdpbmRvdy5kYXRlUmVmbG93O1xudmFyIGRpc2FibGVEZWZhdWx0ID0gd2luZG93LmRpc2FibGVEZWZhdWx0O1xudmFyIHVybCA9IHdpbmRvdy51cmw7XG5cbnZhciB2YXJzID0gcmVxdWlyZShcIi4uLy4uL3ZhcnMuanNvblwiKTtcblxudmFyIGdhbWVUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3ZpZXdzL19wYXJ0aWFscy9nYW1lLW1pbmkucHVnJyk7XG52YXIgZ2FtZVNlYXJjaFJlc3VsdHNUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3ZpZXdzL19wYXJ0aWFscy9nYW1lLXNlYXJjaC1yZXN1bHRzLnB1ZycpO1xuXG52YXIgb3JpZ2luYWxVUkwgPSB3aW5kb3cubG9jYXRpb24ucGF0aG5hbWUgKyB3aW5kb3cubG9jYXRpb24uc2VhcmNoICsgd2luZG93LmxvY2F0aW9uLmhhc2g7XG52YXIgb3BlbkdhbWVJRCA9IG51bGw7XG5cbmZ1bmN0aW9uIHByZXZQYWdlVVJMKHBhZ2VVcmwsIGZpcnN0SUQpIHtcblx0bGV0IGN1clVSTCA9IHVybC5wYXJzZShwYWdlVXJsLCB0cnVlKTtcblx0Y3VyVVJMLnF1ZXJ5LmFmdGVyaWQgPSBmaXJzdElEO1xuXHRkZWxldGUgY3VyVVJMLnF1ZXJ5LmJlZm9yZWlkO1xuICAgIGRlbGV0ZSBjdXJVUkwuc2VhcmNoO1xuICAgIHJldHVybiB1cmwuZm9ybWF0KGN1clVSTCk7XG59XG5cbmZ1bmN0aW9uIG5leHRQYWdlVVJMKHBhZ2VVcmwsIGxhc3RJRCkge1xuXHRsZXQgY3VyVVJMID0gdXJsLnBhcnNlKHBhZ2VVcmwsIHRydWUpO1xuXHRjdXJVUkwucXVlcnkuYmVmb3JlaWQgPSBsYXN0SUQ7XG5cdGRlbGV0ZSBjdXJVUkwucXVlcnkuYWZ0ZXJpZDtcbiAgICBkZWxldGUgY3VyVVJMLnNlYXJjaDtcbiAgICByZXR1cm4gdXJsLmZvcm1hdChjdXJVUkwpO1xufVxuXG5mdW5jdGlvbiBsb2FkUmVzdWx0cyhwYWdlVVJMLCBhcHBlbmQpIHtcblx0TlByb2dyZXNzLnN0YXJ0KCk7XG5cdCQuZ2V0KFwiL2FwaVwiK3BhZ2VVUkwpXG5cdC5kb25lKGRhdGEgPT4ge1xuXHRcdGxldCAkYm9keSA9ICQoXCIjc2VhcmNoLXJlc3VsdHMgdGJvZHlcIik7XG5cdFx0bGV0ICRzY3JvbGxUYXJnZXQgPSBudWxsO1xuXG5cdFx0bGV0IG5leHRVUkwgPSBkYXRhLnJlc3VsdHMmJmRhdGEucmVzdWx0cy5sZW5ndGgmJihkYXRhLnJlc3VsdHNbZGF0YS5yZXN1bHRzLmxlbmd0aC0xXS5pZD5kYXRhLnN0YXRzLm1pbik/IG5leHRQYWdlVVJMKHBhZ2VVUkwsIGRhdGEucmVzdWx0c1tkYXRhLnJlc3VsdHMubGVuZ3RoLTFdLmlkKTogdW5kZWZpbmVkO1xuXHRcdGlmIChhcHBlbmQpIHtcblx0XHRcdCRib2R5LmFwcGVuZChnYW1lU2VhcmNoUmVzdWx0c1RlbXBsYXRlKF8uYXNzaWduKGRhdGEsIHsgdmFyczogdmFycywgXzogXywgbm9IZWFkOiB0cnVlIH0pKSk7XG5cdFx0XHQkKFwiI25leHQtcGFnZS1idXR0b25cIikuYXR0cihcImhyZWZcIiwgbmV4dFVSTCkuYXR0cihcIm9uY2xpY2tcIiwgXCJyZXR1cm4gbG9hZE1vcmUoJ1wiK25leHRVUkwrXCInKTtcIik7XG5cdFx0XHQkc2Nyb2xsVGFyZ2V0ID0gJChcIi5zY3JvbGwtdG9cIikubGFzdCgpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgcHJldlVSTCA9IGRhdGEucmVzdWx0cyYmZGF0YS5yZXN1bHRzLmxlbmd0aCYmKGRhdGEucmVzdWx0c1swXS5pZDxkYXRhLnN0YXRzLm1heCk/IHByZXZQYWdlVVJMKHBhZ2VVUkwsIGRhdGEucmVzdWx0c1swXS5pZCk6IHVuZGVmaW5lZDtcblx0XHRcdCQoXCIjc2VhcmNoLXJlc3VsdC1jb250YWluZXJcIikuaHRtbChnYW1lU2VhcmNoUmVzdWx0c1RlbXBsYXRlKF8uYXNzaWduKGRhdGEsIHsgdmFyczogdmFycywgXzogXywgcHJldlBhZ2VVUkw6IHByZXZVUkwsIG5leHRQYWdlVVJMOiBuZXh0VVJMIH0pKSk7XG5cdFx0XHQkc2Nyb2xsVGFyZ2V0ID0gJChcIiNzZWFyY2gtcmVzdWx0c1wiKTtcblx0XHR9XG5cdFx0aWYgKCRzY3JvbGxUYXJnZXQgJiYgJHNjcm9sbFRhcmdldC5sZW5ndGgpICQoXCJodG1sLCBib2R5XCIpLmFuaW1hdGUoe1xuXHRcdFx0c2Nyb2xsVG9wOiAkc2Nyb2xsVGFyZ2V0Lm9mZnNldCgpLnRvcFxuXHRcdH0sIDUwMCk7XG5cdH0pLmZhaWwoKHhociwgdGV4dFN0YXR1cykgPT4ge1xuXHRcdGlmIChwYWdlVVJMLmluZGV4T2YoXCIvZmluZFwiKSA8IDApICQoXCIjc2VhcmNoLXJlc3VsdC1jb250YWluZXJcIikuaHRtbChcIlwiKTtcblx0XHRlbHNlICQoXCIjc2VhcmNoLXJlc3VsdC1jb250YWluZXJcIikuaHRtbChgRXJyb3IgbG9hZGluZyBwYWdlOiAke3hoci5zdGF0dXN9ICR7dGV4dFN0YXR1c31gKTtcblx0fSkuYWx3YXlzKCgpID0+IHtcblx0XHROUHJvZ3Jlc3MuZG9uZSgpO1xuXHRcdGRhdGVSZWZsb3coKTtcblx0XHRkaXNhYmxlRGVmYXVsdCgpO1xuXHR9KTtcbn1cblxud2luZG93LmxvYWRQYWdlID0gZnVuY3Rpb24ocGFnZVVSTCkge1xuXHRsb2FkUmVzdWx0cyhwYWdlVVJMKTtcblx0aGlzdG9yeS5wdXNoU3RhdGUoeyB1cmw6IHBhZ2VVUkwgfSwgd2luZG93LnRpdGxlLCBwYWdlVVJMKTtcblx0cmV0dXJuIGZhbHNlO1xufTtcblxud2luZG93LmxvYWRNb3JlID0gZnVuY3Rpb24ocGFnZVVSTCkge1xuXHRsb2FkUmVzdWx0cyhwYWdlVVJMLCB0cnVlKTtcblx0cmV0dXJuIGZhbHNlO1xufTtcblxuJCh3aW5kb3cpLmJpbmQoXCJwb3BzdGF0ZVwiLCBmdW5jdGlvbihldmVudCkge1xuXHRsZXQgc3RhdGUgPSBldmVudC5vcmlnaW5hbEV2ZW50LnN0YXRlO1xuXHRpZiAoIXN0YXRlKSB7XG5cdFx0aWYgKG9yaWdpbmFsVVJMID09PSBcIi9nYW1lc1wiKSB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0ZWxzZSBsb2FkUmVzdWx0cyhvcmlnaW5hbFVSTCk7XG5cdH0gZWxzZSBsb2FkUmVzdWx0cyhzdGF0ZS51cmwpO1xufSk7XG5cbiQoXCIjc2VhcmNoLWZvcm1cIikub24oXCJzdWJtaXRcIiwgZnVuY3Rpb24oZXZlbnQpIHtcblx0ZXZlbnQucHJldmVudERlZmF1bHQoKTtcblx0d2luZG93LmxvYWRQYWdlKFwiL2dhbWVzL2ZpbmQ/XCIrJCh0aGlzKS5zZXJpYWxpemUoKSk7XG59KTtcblxuZnVuY3Rpb24gdHJ5TG9hZEJhY2tncm91bmQobmFtZSkge1xuXHR2YXIgYmcgPSBuZXcgSW1hZ2UoKTtcblx0Ymcub25sb2FkID0gZnVuY3Rpb24gKCkge1xuXHRcdCQoXCIjZ2FtZS1pbmZvXCIpLmNzcyhcImJhY2tncm91bmRcIiwgXCJsaW5lYXItZ3JhZGllbnQoIHJnYmEoMCwgMCwgMCwgMC41KSwgcmdiYSgwLCAwLCAwLCAwLjUpICksIHVybCgvaW1hZ2VzL21hcHNob3RzL1wiK25hbWUrXCIuanBnKSBuby1yZXBlYXQgY2VudGVyIGNlbnRlciBmaXhlZFwiKTtcblx0XHQkKFwiI2dhbWUtaW5mb1wiKS5jc3MoXCJiYWNrZ3JvdW5kLXNpemVcIiwgXCJjb3ZlclwiKTtcblx0fTtcblx0Ymcuc3JjID0gXCIvaW1hZ2VzL21hcHNob3RzL1wiK25hbWUrXCIuanBnXCI7XG59XG5cbmZ1bmN0aW9uIGxvYWRHYW1lKGlkKSB7XG5cdCQuZ2V0KFwiL2FwaS9nYW1lL1wiK2lkLCBmdW5jdGlvbihyZXN1bHQpIHtcblx0XHRpZiAoIW9wZW5HYW1lSUQpIHJldHVybjtcblx0XHQkKFwiI2dhbWUtaW5mbyBkaXZcIikuaHRtbChnYW1lVGVtcGxhdGUoeyBpZDogaWQsIHNlcnZlcjogcmVzdWx0LCB2YXJzOiB2YXJzLCBfOiBfIH0pKTtcblx0XHQkKFwiI2dhbWUtaW5mbyAucmV2ZWFsXCIpLmZvdW5kYXRpb24oKTtcblx0XHQkKFwiI2dhbWUtaW5mb1wiKS5mb3VuZGF0aW9uKFwib3BlblwiKTtcblx0XHR0cnlMb2FkQmFja2dyb3VuZChyZXN1bHQubWFwTmFtZSk7XG5cdFx0ZGF0ZVJlZmxvdygpO1xuXHR9KTtcbn1cblxud2luZG93LnNob3dHYW1lID0gZnVuY3Rpb24oaWQpIHtcblx0JChcIiNnYW1lLWluZm8gZGl2XCIpLmh0bWwoJzxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXJcIj48aSBjbGFzcz1cImZhIGZhLXNwaW5uZXIgZmEtcHVsc2UgZmEtNHhcIj48L2k+PC9kaXY+Jyk7XG5cdCQoXCIjZ2FtZS1pbmZvXCIpLmNzcyhcImJhY2tncm91bmRcIiwgXCJyZ2JhKDI3LCAyNywgMjcsIDAuODkpXCIpO1xuXHRsb2FkR2FtZShpZCk7XG5cdCQoXCIjZ2FtZS1pbmZvXCIpLmZvdW5kYXRpb24oXCJvcGVuXCIpO1xuXHRvcGVuR2FtZUlEID0gaWQ7XG59O1xuXG53aW5kb3cuZXhwYW5kR2FtZSA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIW9wZW5HYW1lSUQpIHJldHVybjtcblx0d2luZG93LmxvY2F0aW9uLmhyZWYgPSBcIi9nYW1lL1wiK29wZW5HYW1lSUQ7XG59O1xuXG4kKFwiI2dhbWUtaW5mb1wiKS5vbihcImNsb3NlZC56Zi5yZXZlYWxcIiwgKCkgPT4geyBvcGVuR2FtZUlEID0gbnVsbDsgfSk7XG5cbiQoXCIuZmRhdGVcIikuZmRhdGVwaWNrZXIoe1xuXHRmb3JtYXQ6ICd5eXl5LW1tLWRkJyxcblx0ZGlzYWJsZURibENsaWNrU2VsZWN0aW9uOiB0cnVlXG59KTtcblxud2luZG93Lm9udW5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdCQoXCIjZ2FtZS1pbmZvXCIpLmZvdW5kYXRpb24oXCJjbG9zZVwiKTtcblx0b3BlbkdhbWVJRCA9IG51bGw7XG59O1xuIiwidmFyIHB1ZyA9IHJlcXVpcmUoXCJwdWctcnVudGltZVwiKTtcblxubW9kdWxlLmV4cG9ydHMgPSB0ZW1wbGF0ZTtmdW5jdGlvbiBwdWdfYXR0cih0LGUsbixmKXtyZXR1cm4gZSE9PSExJiZudWxsIT1lJiYoZXx8XCJjbGFzc1wiIT09dCYmXCJzdHlsZVwiIT09dCk/ZT09PSEwP1wiIFwiKyhmP3Q6dCsnPVwiJyt0KydcIicpOihcImZ1bmN0aW9uXCI9PXR5cGVvZiBlLnRvSlNPTiYmKGU9ZS50b0pTT04oKSksXCJzdHJpbmdcIj09dHlwZW9mIGV8fChlPUpTT04uc3RyaW5naWZ5KGUpLG58fGUuaW5kZXhPZignXCInKT09PS0xKT8obiYmKGU9cHVnX2VzY2FwZShlKSksXCIgXCIrdCsnPVwiJytlKydcIicpOlwiIFwiK3QrXCI9J1wiK2UucmVwbGFjZSgvJy9nLFwiJiMzOTtcIikrXCInXCIpOlwiXCJ9XG5mdW5jdGlvbiBwdWdfY2xhc3NlcyhzLHIpe3JldHVybiBBcnJheS5pc0FycmF5KHMpP3B1Z19jbGFzc2VzX2FycmF5KHMscik6cyYmXCJvYmplY3RcIj09dHlwZW9mIHM/cHVnX2NsYXNzZXNfb2JqZWN0KHMpOnN8fFwiXCJ9XG5mdW5jdGlvbiBwdWdfY2xhc3Nlc19hcnJheShyLGEpe2Zvcih2YXIgcyxlPVwiXCIsdT1cIlwiLGM9QXJyYXkuaXNBcnJheShhKSxnPTA7ZzxyLmxlbmd0aDtnKyspcz1wdWdfY2xhc3NlcyhyW2ddKSxzJiYoYyYmYVtnXSYmKHM9cHVnX2VzY2FwZShzKSksZT1lK3Urcyx1PVwiIFwiKTtyZXR1cm4gZX1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX29iamVjdChyKXt2YXIgYT1cIlwiLG49XCJcIjtmb3IodmFyIG8gaW4gcilvJiZyW29dJiZwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKHIsbykmJihhPWErbitvLG49XCIgXCIpO3JldHVybiBhfVxuZnVuY3Rpb24gcHVnX2VzY2FwZShlKXt2YXIgYT1cIlwiK2UsdD1wdWdfbWF0Y2hfaHRtbC5leGVjKGEpO2lmKCF0KXJldHVybiBlO3ZhciByLGMsbixzPVwiXCI7Zm9yKHI9dC5pbmRleCxjPTA7cjxhLmxlbmd0aDtyKyspe3N3aXRjaChhLmNoYXJDb2RlQXQocikpe2Nhc2UgMzQ6bj1cIiZxdW90O1wiO2JyZWFrO2Nhc2UgMzg6bj1cIiZhbXA7XCI7YnJlYWs7Y2FzZSA2MDpuPVwiJmx0O1wiO2JyZWFrO2Nhc2UgNjI6bj1cIiZndDtcIjticmVhaztkZWZhdWx0OmNvbnRpbnVlfWMhPT1yJiYocys9YS5zdWJzdHJpbmcoYyxyKSksYz1yKzEscys9bn1yZXR1cm4gYyE9PXI/cythLnN1YnN0cmluZyhjLHIpOnN9XG52YXIgcHVnX2hhc19vd25fcHJvcGVydHk9T2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbnZhciBwdWdfbWF0Y2hfaHRtbD0vW1wiJjw+XS87XG5mdW5jdGlvbiBwdWdfc3R5bGUocil7aWYoIXIpcmV0dXJuXCJcIjtpZihcIm9iamVjdFwiPT10eXBlb2Ygcil7dmFyIGU9XCJcIix0PVwiXCI7Zm9yKHZhciBuIGluIHIpcHVnX2hhc19vd25fcHJvcGVydHkuY2FsbChyLG4pJiYoZT1lK3QrbitcIjpcIityW25dLHQ9XCI7XCIpO3JldHVybiBlfXJldHVybiByPVwiXCIrcixcIjtcIj09PXJbci5sZW5ndGgtMV0/ci5zbGljZSgwLC0xKTpyfWZ1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge3ZhciBwdWdfaHRtbCA9IFwiXCIsIHB1Z19taXhpbnMgPSB7fSwgcHVnX2ludGVycDs7dmFyIGxvY2Fsc19mb3Jfd2l0aCA9IChsb2NhbHMgfHwge30pOyhmdW5jdGlvbiAoRGF0ZSwgXywgZW5jb2RlVVJJQ29tcG9uZW50LCBzZXJ2ZXIsIHZhcnMpIHtpZiAoIXNlcnZlciB8fCAhc2VydmVyLmdhbWVNb2RlKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJTZXJ2ZXIgbm90IGZvdW5kLlwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcImxhcmdlLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2gyXFx1MDAzRVxcdTAwM0NhXCIgKyAocHVnX2F0dHIoXCJocmVmXCIsIChcIi9zZXJ2ZXIvXCIrc2VydmVyLmhvc3QrXCIvXCIrc2VydmVyLnBvcnQpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5kZXNjcmlwdGlvblN0eWxlZCkgPyBcIlwiIDogcHVnX2ludGVycCkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRmgyXFx1MDAzRVxcdTAwM0NhXCIgKyAoXCIgaWQ9XFxcInNlcnZlci1hZGRyZXNzXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCBcInNob3dDb25uZWN0KCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmhvc3QpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiOlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5wb3J0KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDc3BhblxcdTAwM0UgfCAgXCI7XG5pZiAoKHNlcnZlci5jb3VudHJ5ICYmIHNlcnZlci5jb3VudHJ5ICE9IFwidW5rbm93blwiKSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIFwiL2ltYWdlcy9mbGFncy9cIitzZXJ2ZXIuY291bnRyeStcIi5wbmdcIiwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIiBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuY291bnRyeU5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcImxhcmdlLTYgY29sdW1ucyBlbmRcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiAxMHB4XFxcIlxcdTAwM0VcIjtcbmlmIChzZXJ2ZXIuaW5mby5iYW5uZWQpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuIHN0eWxlPVxcXCJjb2xvcjogcmVkXFxcIlxcdTAwM0VUaGlzIHNlcnZlciBpcyBiYW5uZWQuIFJlYXNvbjogXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmluZm8uYmFubmVkKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIi5cXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCI7XG59XG5lbHNlIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NhXCIgKyAocHVnX2F0dHIoXCJocmVmXCIsIChcIi9nYW1lcy9maW5kP2hvc3Q9XCIrc2VydmVyLmhvc3QrXCImcG9ydD1cIitzZXJ2ZXIucG9ydCksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VWaWV3IG90aGVyIGdhbWVzIGZyb20gdGhpcyBzZXJ2ZXIuLi5cXHUwMDNDXFx1MDAyRmFcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDYnJcXHUwMDJGXFx1MDAzRVwiO1xuaWYgKHNlcnZlci56b21iaWUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuIHN0eWxlPVxcXCJjb2xvcjogcmVkXFxcIlxcdTAwM0Vab21iaWUgZ2FtZXMgYXJlIG5vdCByZWNvcmRlZC5cXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXFx1MDAzQ2JyXFx1MDAyRlxcdTAwM0VcIjtcbn1cbmlmIChzZXJ2ZXIuZ2FtZU1vZGUgPT0gXCJjb29wX2VkaXRcIikge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3NwYW4gc3R5bGU9XFxcImNvbG9yOiByZWRcXFwiXFx1MDAzRUNvb3AtZWRpdCBnYW1lcyBhcmUgbm90IHJlY29yZGVkLlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcXHUwMDNDYnJcXHUwMDJGXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2g1IHN0eWxlPVxcXCJtYXJnaW4tdG9wOiAxMHB4XFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuZ2FtZU1vZGUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ3NwYW4gaWQ9XFxcIm1hcC1uYW1lXFxcIlxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLm1hcE5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVwiO1xuaWYgKHNlcnZlci5tYXN0ZXJNb2RlKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCIgfFxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJzdHlsZVwiLCBwdWdfc3R5bGUoKFwiY29sb3I6IFwiK3ZhcnMubWF0ZXJNb2RlQ29sb3JzW3NlcnZlci5tYXN0ZXJNb2RlXSkpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5tYXN0ZXJNb2RlKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbmlmIChzZXJ2ZXIuZ2FtZVR5cGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyAoXCIgfCBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuZ2FtZVR5cGUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSk7XG59XG5pZiAoc2VydmVyLnRpbWVMZWZ0Uykge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIChcIiB8IFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci50aW1lTGVmdFMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSk7XG5pZiAoc2VydmVyLnRpbWVMZWZ0UyAhPSBcImludGVybWlzc2lvblwiKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCIgbGVmdFwiO1xufVxufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIChcIiB8XFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcInN0eWxlXCIsIHB1Z19zdHlsZSgoc2VydmVyLmNsaWVudHM9PXNlcnZlci5tYXhDbGllbnRzPyBcImNvbG9yOiB5ZWxsb3dcIjogXCJcIikpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5jbGllbnRzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkpO1xuaWYgKHNlcnZlci5tYXhDbGllbnRzKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgKFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5tYXhDbGllbnRzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkpO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRSBwbGF5ZXJzXCI7XG5pZiAoc2VydmVyLnRpbWUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIiB8ICBcXHUwMDNDc3BhbiBjbGFzcz1cXFwiZGF0ZVxcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gKHNlcnZlci50aW1lIGluc3RhbmNlb2YgRGF0ZSk/IHNlcnZlci50aW1lLnRvSlNPTigpOiBzZXJ2ZXIudGltZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmg1XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xudmFyIHBsYXllcnMgPSBfLmdyb3VwQnkoc2VydmVyLnBsYXllcnMsIGZ1bmN0aW9uIChwbCkgeyByZXR1cm4gcGwuc3RhdGU9PTU7IH0pO1xudmFyIHNwZWNzID0gcGxheWVyc1t0cnVlXTtcbnBsYXllcnMgPSBwbGF5ZXJzW2ZhbHNlXTtcbnZhciB0ZWFtTW9kZSA9IHZhcnMuZ2FtZU1vZGVzW3NlcnZlci5nYW1lTW9kZV0udGVhbU1vZGU7XG52YXIgZmxhZ01vZGUgPSB2YXJzLmdhbWVNb2Rlc1tzZXJ2ZXIuZ2FtZU1vZGVdLmZsYWdNb2RlO1xuaWYgKCF0ZWFtTW9kZSkge1xudGVhbXMgPSBbe3BsYXllcnM6IHBsYXllcnN9XTtcbn0gZWxzZSB7XG52YXIgdGVhbXMgPSBfLmdyb3VwQnkocGxheWVycywgXCJ0ZWFtXCIpO1xudGVhbXMgPSBfLm9yZGVyQnkoXy5tYXAoc2VydmVyLnRlYW1zLCBmdW5jdGlvbiAodmFsLCBrZXkpIHtcbmlmICh0ZWFtTW9kZSAmJiAhZmxhZ01vZGUpIHZhbCA9IF8uc3VtQnkodGVhbXNba2V5XSwgXCJmcmFnc1wiKTtcbnJldHVybiB7bmFtZToga2V5LCBzY29yZTogdmFsLCBwbGF5ZXJzOiB0ZWFtc1trZXldfTtcbn0pLCBcInNjb3JlXCIsIFwiZGVzY1wiKTtcbn1cbl8uZWFjaCh0ZWFtcywgZnVuY3Rpb24gKHRlYW0pIHsgdGVhbS5wbGF5ZXJzID0gXy5vcmRlckJ5KHRlYW0ucGxheWVycywgW1wiZmxhZ3NcIiwgXCJmcmFnc1wiLCBcImRlYXRoc1wiXSwgW1wiZGVzY1wiLCBcImRlc2NcIiwgXCJhc2NcIl0pOyB9KVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93XFxcIiBzdHlsZT1cXFwibWFyZ2luLXRvcDogMTBweFxcXCJcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHRlYW1zXG47KGZ1bmN0aW9uKCl7XG4gIHZhciAkJG9iaiA9IHRlYW1zO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mICQkb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgaSA9IDAsICQkbCA9ICQkb2JqLmxlbmd0aDsgaSA8ICQkbDsgaSsrKSB7XG4gICAgICAgIHZhciB0ZWFtID0gJCRvYmpbaV07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2XCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJtZWRpdW0tNlwiLFwibGFyZ2UtNFwiLFwiY29sdW1uc1wiLChpPT10ZWFtcy5sZW5ndGgtMT8gXCJlbmRcIjogdW5kZWZpbmVkKV0sIFtmYWxzZSxmYWxzZSxmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0xMiBjb2x1bW5zXFxcIlxcdTAwM0VcIjtcbmlmICghdGVhbU1vZGUgJiYgdGVhbS5wbGF5ZXJzLmxlbmd0aCkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2xhYmVsIGNsYXNzPVxcXCJiaWdcXFwiXFx1MDAzRVBsYXllcnNcXHUwMDNDXFx1MDAyRmxhYmVsXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDbGFiZWwgY2xhc3M9XFxcImJpZ1xcXCJcXHUwMDNFXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsodGVhbS5uYW1lPT1cImdvb2RcIj8gXCJwcmltYXJ5XCI6IFwiYWxlcnRcIildLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHRlYW0ubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHRlYW0uc2NvcmUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZsYWJlbFxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuLy8gaXRlcmF0ZSB0ZWFtLnBsYXllcnNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gdGVhbS5wbGF5ZXJzO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mICQkb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgcHVnX2luZGV4MSA9IDAsICQkbCA9ICQkb2JqLmxlbmd0aDsgcHVnX2luZGV4MSA8ICQkbDsgcHVnX2luZGV4MSsrKSB7XG4gICAgICAgIHZhciBwbGF5ZXIgPSAkJG9ialtwdWdfaW5kZXgxXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcInJvdyBib3JkZXJlZC1sZWZ0XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0xIGNvbHVtbnNcXFwiXFx1MDAzRVwiO1xuaWYgKGZsYWdNb2RlKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoW1wibGFiZWxcIiwocGxheWVyLmZsYWdzPyBcInN1Y2Nlc3NcIjogXCJzZWNvbmRhcnlcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mbGFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC00IGNvbHVtbnNcXFwiXFx1MDAzRVxcdTAwM0NhXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbKHBsYXllci5oaWdobGlnaHQ/IFwiaGlnaGxpZ2h0ZWRcIjogbnVsbCldLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK3B1Z19hdHRyKFwiaHJlZlwiLCAoXCIvcGxheWVyL1wiK2VuY29kZVVSSUNvbXBvbmVudChwbGF5ZXIubmFtZSkpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLm5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTIgY29sdW1uc1xcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZyYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwMkZcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZGVhdGhzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTUgY29sdW1ucyBlbmRcXFwiXFx1MDAzRVwiO1xuaWYgKHBsYXllci5jb3VudHJ5KSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaW1nXCIgKyAoXCIgY2xhc3M9XFxcImZsYWdcXFwiXCIrcHVnX2F0dHIoXCJzcmNcIiwgKFwiL2ltYWdlcy9mbGFncy9cIitwbGF5ZXIuY291bnRyeStcIi5wbmdcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwMkZcXHUwMDNFIFxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcIm5vLWNvbG9yXFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCBcIi9wbGF5ZXJzL2ZpbmQ/Y291bnRyeT1cIitwbGF5ZXIuY291bnRyeSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5jb3VudHJ5KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciAkJGwgPSAwO1xuICAgIGZvciAodmFyIHB1Z19pbmRleDEgaW4gJCRvYmopIHtcbiAgICAgICQkbCsrO1xuICAgICAgdmFyIHBsYXllciA9ICQkb2JqW3B1Z19pbmRleDFdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEgY29sdW1uc1xcXCJcXHUwMDNFXCI7XG5pZiAoZmxhZ01vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChwbGF5ZXIuZmxhZ3M/IFwic3VjY2Vzc1wiOiBcInNlY29uZGFyeVwiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZsYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsocGxheWVyLmhpZ2hsaWdodD8gXCJoaWdobGlnaHRlZFwiOiBudWxsKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9wbGF5ZXIvXCIrZW5jb2RlVVJJQ29tcG9uZW50KHBsYXllci5uYW1lKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMiBjb2x1bW5zXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZnJhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5kZWF0aHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNSBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXCI7XG5pZiAocGxheWVyLmNvdW50cnkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3BsYXllci5jb3VudHJ5K1wiLnBuZ1wiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0UgXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwibm8tY29sb3JcXFwiXCIrcHVnX2F0dHIoXCJocmVmXCIsIFwiL3BsYXllcnMvZmluZD9jb3VudHJ5PVwiK3BsYXllci5jb3VudHJ5LCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmNvdW50cnkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4gICAgfVxuICB9XG59KS5jYWxsKHRoaXMpO1xuXG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbiAgICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgJCRsID0gMDtcbiAgICBmb3IgKHZhciBpIGluICQkb2JqKSB7XG4gICAgICAkJGwrKztcbiAgICAgIHZhciB0ZWFtID0gJCRvYmpbaV07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2XCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJtZWRpdW0tNlwiLFwibGFyZ2UtNFwiLFwiY29sdW1uc1wiLChpPT10ZWFtcy5sZW5ndGgtMT8gXCJlbmRcIjogdW5kZWZpbmVkKV0sIFtmYWxzZSxmYWxzZSxmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0xMiBjb2x1bW5zXFxcIlxcdTAwM0VcIjtcbmlmICghdGVhbU1vZGUgJiYgdGVhbS5wbGF5ZXJzLmxlbmd0aCkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2xhYmVsIGNsYXNzPVxcXCJiaWdcXFwiXFx1MDAzRVBsYXllcnNcXHUwMDNDXFx1MDAyRmxhYmVsXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDbGFiZWwgY2xhc3M9XFxcImJpZ1xcXCJcXHUwMDNFXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsodGVhbS5uYW1lPT1cImdvb2RcIj8gXCJwcmltYXJ5XCI6IFwiYWxlcnRcIildLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHRlYW0ubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHRlYW0uc2NvcmUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZsYWJlbFxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuLy8gaXRlcmF0ZSB0ZWFtLnBsYXllcnNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gdGVhbS5wbGF5ZXJzO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mICQkb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgcHVnX2luZGV4MiA9IDAsICQkbCA9ICQkb2JqLmxlbmd0aDsgcHVnX2luZGV4MiA8ICQkbDsgcHVnX2luZGV4MisrKSB7XG4gICAgICAgIHZhciBwbGF5ZXIgPSAkJG9ialtwdWdfaW5kZXgyXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcInJvdyBib3JkZXJlZC1sZWZ0XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0xIGNvbHVtbnNcXFwiXFx1MDAzRVwiO1xuaWYgKGZsYWdNb2RlKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoW1wibGFiZWxcIiwocGxheWVyLmZsYWdzPyBcInN1Y2Nlc3NcIjogXCJzZWNvbmRhcnlcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mbGFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC00IGNvbHVtbnNcXFwiXFx1MDAzRVxcdTAwM0NhXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbKHBsYXllci5oaWdobGlnaHQ/IFwiaGlnaGxpZ2h0ZWRcIjogbnVsbCldLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK3B1Z19hdHRyKFwiaHJlZlwiLCAoXCIvcGxheWVyL1wiK2VuY29kZVVSSUNvbXBvbmVudChwbGF5ZXIubmFtZSkpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLm5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTIgY29sdW1uc1xcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZyYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwMkZcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZGVhdGhzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTUgY29sdW1ucyBlbmRcXFwiXFx1MDAzRVwiO1xuaWYgKHBsYXllci5jb3VudHJ5KSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaW1nXCIgKyAoXCIgY2xhc3M9XFxcImZsYWdcXFwiXCIrcHVnX2F0dHIoXCJzcmNcIiwgKFwiL2ltYWdlcy9mbGFncy9cIitwbGF5ZXIuY291bnRyeStcIi5wbmdcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwMkZcXHUwMDNFIFxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcIm5vLWNvbG9yXFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCBcIi9wbGF5ZXJzL2ZpbmQ/Y291bnRyeT1cIitwbGF5ZXIuY291bnRyeSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5jb3VudHJ5KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciAkJGwgPSAwO1xuICAgIGZvciAodmFyIHB1Z19pbmRleDIgaW4gJCRvYmopIHtcbiAgICAgICQkbCsrO1xuICAgICAgdmFyIHBsYXllciA9ICQkb2JqW3B1Z19pbmRleDJdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEgY29sdW1uc1xcXCJcXHUwMDNFXCI7XG5pZiAoZmxhZ01vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChwbGF5ZXIuZmxhZ3M/IFwic3VjY2Vzc1wiOiBcInNlY29uZGFyeVwiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZsYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsocGxheWVyLmhpZ2hsaWdodD8gXCJoaWdobGlnaHRlZFwiOiBudWxsKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9wbGF5ZXIvXCIrZW5jb2RlVVJJQ29tcG9uZW50KHBsYXllci5uYW1lKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMiBjb2x1bW5zXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZnJhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5kZWF0aHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNSBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXCI7XG5pZiAocGxheWVyLmNvdW50cnkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3BsYXllci5jb3VudHJ5K1wiLnBuZ1wiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0UgXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwibm8tY29sb3JcXFwiXCIrcHVnX2F0dHIoXCJocmVmXCIsIFwiL3BsYXllcnMvZmluZD9jb3VudHJ5PVwiK3BsYXllci5jb3VudHJ5LCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmNvdW50cnkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4gICAgfVxuICB9XG59KS5jYWxsKHRoaXMpO1xuXG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbiAgICB9XG4gIH1cbn0pLmNhbGwodGhpcyk7XG5cbmlmIChzcGVjcykge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwibWVkaXVtLTYgbGFyZ2UtNCBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXFx1MDAzQ2xhYmVsIGNsYXNzPVxcXCJiaWdcXFwiXFx1MDAzRVNwZWN0YXRvcnNcXHUwMDNDXFx1MDAyRmxhYmVsXFx1MDAzRVwiO1xuLy8gaXRlcmF0ZSBzcGVjc1xuOyhmdW5jdGlvbigpe1xuICB2YXIgJCRvYmogPSBzcGVjcztcbiAgaWYgKCdudW1iZXInID09IHR5cGVvZiAkJG9iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIHB1Z19pbmRleDMgPSAwLCAkJGwgPSAkJG9iai5sZW5ndGg7IHB1Z19pbmRleDMgPCAkJGw7IHB1Z19pbmRleDMrKykge1xuICAgICAgICB2YXIgc3BlYyA9ICQkb2JqW3B1Z19pbmRleDNdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsoc3BlYy5oaWdobGlnaHQ/IFwiaGlnaGxpZ2h0ZWRcIjogbnVsbCldLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK3B1Z19hdHRyKFwiaHJlZlwiLCAoXCIvcGxheWVyL1wiK3NwZWMubmFtZSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzcGVjLm5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTUgY29sdW1ucyBlbmRcXFwiXFx1MDAzRVwiO1xuaWYgKHNwZWMuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIChcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3NwZWMuY291bnRyeStcIi5wbmdcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwMkZcXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNwZWMuY291bnRyeSkgPyBcIlwiIDogcHVnX2ludGVycCkpKTtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciAkJGwgPSAwO1xuICAgIGZvciAodmFyIHB1Z19pbmRleDMgaW4gJCRvYmopIHtcbiAgICAgICQkbCsrO1xuICAgICAgdmFyIHNwZWMgPSAkJG9ialtwdWdfaW5kZXgzXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcInJvdyBib3JkZXJlZC1sZWZ0XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC00IGNvbHVtbnNcXFwiXFx1MDAzRVxcdTAwM0NhXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbKHNwZWMuaGlnaGxpZ2h0PyBcImhpZ2hsaWdodGVkXCI6IG51bGwpXSwgW3RydWVdKSwgZmFsc2UsIGZhbHNlKStwdWdfYXR0cihcImhyZWZcIiwgKFwiL3BsYXllci9cIitzcGVjLm5hbWUpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc3BlYy5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC01IGNvbHVtbnMgZW5kXFxcIlxcdTAwM0VcIjtcbmlmIChzcGVjLmNvdW50cnkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyAoXCJcXHUwMDNDaW1nXCIgKyAoXCIgY2xhc3M9XFxcImZsYWdcXFwiXCIrcHVnX2F0dHIoXCJzcmNcIiwgKFwiL2ltYWdlcy9mbGFncy9cIitzcGVjLmNvdW50cnkrXCIucG5nXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRSBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzcGVjLmNvdW50cnkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSk7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbiAgICB9XG4gIH1cbn0pLmNhbGwodGhpcyk7XG5cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG59fS5jYWxsKHRoaXMsXCJEYXRlXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5EYXRlOnR5cGVvZiBEYXRlIT09XCJ1bmRlZmluZWRcIj9EYXRlOnVuZGVmaW5lZCxcIl9cIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLl86dHlwZW9mIF8hPT1cInVuZGVmaW5lZFwiP186dW5kZWZpbmVkLFwiZW5jb2RlVVJJQ29tcG9uZW50XCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5lbmNvZGVVUklDb21wb25lbnQ6dHlwZW9mIGVuY29kZVVSSUNvbXBvbmVudCE9PVwidW5kZWZpbmVkXCI/ZW5jb2RlVVJJQ29tcG9uZW50OnVuZGVmaW5lZCxcInNlcnZlclwiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGguc2VydmVyOnR5cGVvZiBzZXJ2ZXIhPT1cInVuZGVmaW5lZFwiP3NlcnZlcjp1bmRlZmluZWQsXCJ2YXJzXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC52YXJzOnR5cGVvZiB2YXJzIT09XCJ1bmRlZmluZWRcIj92YXJzOnVuZGVmaW5lZCkpOztyZXR1cm4gcHVnX2h0bWw7fTsiLCJ2YXIgcHVnID0gcmVxdWlyZShcInB1Zy1ydW50aW1lXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlO2Z1bmN0aW9uIHB1Z19hdHRyKHQsZSxuLGYpe3JldHVybiBlIT09ITEmJm51bGwhPWUmJihlfHxcImNsYXNzXCIhPT10JiZcInN0eWxlXCIhPT10KT9lPT09ITA/XCIgXCIrKGY/dDp0Kyc9XCInK3QrJ1wiJyk6KFwiZnVuY3Rpb25cIj09dHlwZW9mIGUudG9KU09OJiYoZT1lLnRvSlNPTigpKSxcInN0cmluZ1wiPT10eXBlb2YgZXx8KGU9SlNPTi5zdHJpbmdpZnkoZSksbnx8ZS5pbmRleE9mKCdcIicpPT09LTEpPyhuJiYoZT1wdWdfZXNjYXBlKGUpKSxcIiBcIit0Kyc9XCInK2UrJ1wiJyk6XCIgXCIrdCtcIj0nXCIrZS5yZXBsYWNlKC8nL2csXCImIzM5O1wiKStcIidcIik6XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzKHMscil7cmV0dXJuIEFycmF5LmlzQXJyYXkocyk/cHVnX2NsYXNzZXNfYXJyYXkocyxyKTpzJiZcIm9iamVjdFwiPT10eXBlb2Ygcz9wdWdfY2xhc3Nlc19vYmplY3Qocyk6c3x8XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX2FycmF5KHIsYSl7Zm9yKHZhciBzLGU9XCJcIix1PVwiXCIsYz1BcnJheS5pc0FycmF5KGEpLGc9MDtnPHIubGVuZ3RoO2crKylzPXB1Z19jbGFzc2VzKHJbZ10pLHMmJihjJiZhW2ddJiYocz1wdWdfZXNjYXBlKHMpKSxlPWUrdStzLHU9XCIgXCIpO3JldHVybiBlfVxuZnVuY3Rpb24gcHVnX2NsYXNzZXNfb2JqZWN0KHIpe3ZhciBhPVwiXCIsbj1cIlwiO2Zvcih2YXIgbyBpbiByKW8mJnJbb10mJnB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwocixvKSYmKGE9YStuK28sbj1cIiBcIik7cmV0dXJuIGF9XG5mdW5jdGlvbiBwdWdfZXNjYXBlKGUpe3ZhciBhPVwiXCIrZSx0PXB1Z19tYXRjaF9odG1sLmV4ZWMoYSk7aWYoIXQpcmV0dXJuIGU7dmFyIHIsYyxuLHM9XCJcIjtmb3Iocj10LmluZGV4LGM9MDtyPGEubGVuZ3RoO3IrKyl7c3dpdGNoKGEuY2hhckNvZGVBdChyKSl7Y2FzZSAzNDpuPVwiJnF1b3Q7XCI7YnJlYWs7Y2FzZSAzODpuPVwiJmFtcDtcIjticmVhaztjYXNlIDYwOm49XCImbHQ7XCI7YnJlYWs7Y2FzZSA2MjpuPVwiJmd0O1wiO2JyZWFrO2RlZmF1bHQ6Y29udGludWV9YyE9PXImJihzKz1hLnN1YnN0cmluZyhjLHIpKSxjPXIrMSxzKz1ufXJldHVybiBjIT09cj9zK2Euc3Vic3RyaW5nKGMscik6c31cbnZhciBwdWdfaGFzX293bl9wcm9wZXJ0eT1PYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHB1Z19tYXRjaF9odG1sPS9bXCImPD5dLztmdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHt2YXIgcHVnX2h0bWwgPSBcIlwiLCBwdWdfbWl4aW5zID0ge30sIHB1Z19pbnRlcnA7O3ZhciBsb2NhbHNfZm9yX3dpdGggPSAobG9jYWxzIHx8IHt9KTsoZnVuY3Rpb24gKERhdGUsIG5leHRQYWdlVVJMLCBub0hlYWQsIHByZXZQYWdlVVJMLCByZXN1bHRzLCBzdGF0cykge3B1Z19taXhpbnNbXCJyZXN1bHRzXCJdID0gcHVnX2ludGVycCA9IGZ1bmN0aW9uKCl7XG52YXIgYmxvY2sgPSAodGhpcyAmJiB0aGlzLmJsb2NrKSwgYXR0cmlidXRlcyA9ICh0aGlzICYmIHRoaXMuYXR0cmlidXRlcykgfHwge307XG4vLyBpdGVyYXRlIHJlc3VsdHNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gcmVzdWx0cztcbiAgaWYgKCdudW1iZXInID09IHR5cGVvZiAkJG9iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIHB1Z19pbmRleDAgPSAwLCAkJGwgPSAkJG9iai5sZW5ndGg7IHB1Z19pbmRleDAgPCAkJGw7IHB1Z19pbmRleDArKykge1xuICAgICAgICB2YXIgZ2FtZSA9ICQkb2JqW3B1Z19pbmRleDBdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3RyIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXBcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwiZGlzYWJsZS1kZWZhdWx0XFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCAoXCIvZ2FtZS9cIitnYW1lLmlkKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUuc2VydmVyZGVzY3x8KGdhbWUuaG9zdCtcIjpcIitnYW1lLnBvcnQpKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKHB1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93R2FtZShcIitnYW1lLmlkK1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUuZ2FtZW1vZGUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChcIiBjbGFzcz1cXFwibm93cmFwXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93R2FtZShcIitnYW1lLmlkK1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubWFwKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAocHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5nYW1ldHlwZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXBcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCI7XG5pZiAoZ2FtZS5pc2ludGVybikge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwidGV4dC1jZW50ZXJcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubWV0YVswXSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbn1cbmVsc2VcbmlmIChnYW1lLmlzd2FyKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTYgY29sdW1uc1xcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246IHJpZ2h0OyBwYWRkaW5nLXJpZ2h0OiAxMFxcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzJdK1wiIFwiKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChnYW1lLmRyYXc/IFwid2FybmluZ1wiOiBcInN1Y2Nlc3NcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK1wiIHN0eWxlPVxcXCJjdXJzb3I6IHBvaW50ZXJcXFwiXCIpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzNdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC02IGNvbHVtbnNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBsZWZ0OyBwYWRkaW5nLXJpZ2h0OiAxMFxcXCJcXHUwMDNFXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcImxhYmVsXCIsKGdhbWUuZHJhdz8gXCJ3YXJuaW5nXCI6IFwiYWxlcnRcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK1wiIHN0eWxlPVxcXCJjdXJzb3I6IHBvaW50ZXJcXFwiXCIpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzFdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBcIiBcIitnYW1lLm1ldGFbMF0pID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKHB1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93R2FtZShcIitnYW1lLmlkK1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubnVtcGxheWVycykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXBcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ3NwYW4gY2xhc3M9XFxcImRhdGVcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IChnYW1lLnRpbWVzdGFtcCBpbnN0YW5jZW9mIERhdGUpPyBnYW1lLnRpbWVzdGFtcC50b0pTT04oKTogZ2FtZS50aW1lc3RhbXApID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0clxcdTAwM0VcIjtcbiAgICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgJCRsID0gMDtcbiAgICBmb3IgKHZhciBwdWdfaW5kZXgwIGluICQkb2JqKSB7XG4gICAgICAkJGwrKztcbiAgICAgIHZhciBnYW1lID0gJCRvYmpbcHVnX2luZGV4MF07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdHIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcIm5vd3JhcFxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd0dhbWUoXCIrZ2FtZS5pZCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJkaXNhYmxlLWRlZmF1bHRcXFwiXCIrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9nYW1lL1wiK2dhbWUuaWQpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5zZXJ2ZXJkZXNjfHwoZ2FtZS5ob3N0K1wiOlwiK2dhbWUucG9ydCkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAocHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5nYW1lbW9kZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXBcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tYXApID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd0dhbWUoXCIrZ2FtZS5pZCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBnYW1lLmdhbWV0eXBlKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcIm5vd3JhcFxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd0dhbWUoXCIrZ2FtZS5pZCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIjtcbmlmIChnYW1lLmlzaW50ZXJuKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJ0ZXh0LWNlbnRlclxcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzBdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xufVxuZWxzZVxuaWYgKGdhbWUuaXN3YXIpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcInJvd1xcXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNiBjb2x1bW5zXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjogcmlnaHQ7IHBhZGRpbmctcmlnaHQ6IDEwXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBnYW1lLm1ldGFbMl0rXCIgXCIpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcImxhYmVsXCIsKGdhbWUuZHJhdz8gXCJ3YXJuaW5nXCI6IFwic3VjY2Vzc1wiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkrXCIgc3R5bGU9XFxcImN1cnNvcjogcG9pbnRlclxcXCJcIikgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBnYW1lLm1ldGFbM10pID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTYgY29sdW1uc1xcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246IGxlZnQ7IHBhZGRpbmctcmlnaHQ6IDEwXFxcIlxcdTAwM0VcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoW1wibGFiZWxcIiwoZ2FtZS5kcmF3PyBcIndhcm5pbmdcIjogXCJhbGVydFwiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkrXCIgc3R5bGU9XFxcImN1cnNvcjogcG9pbnRlclxcXCJcIikgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBnYW1lLm1ldGFbMV0pID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IFwiIFwiK2dhbWUubWV0YVswXSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAocHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dHYW1lKFwiK2dhbWUuaWQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5udW1wbGF5ZXJzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcIm5vd3JhcFxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd0dhbWUoXCIrZ2FtZS5pZCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDc3BhbiBjbGFzcz1cXFwiZGF0ZVxcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gKGdhbWUudGltZXN0YW1wIGluc3RhbmNlb2YgRGF0ZSk/IGdhbWUudGltZXN0YW1wLnRvSlNPTigpOiBnYW1lLnRpbWVzdGFtcCkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDXFx1MDAyRnRyXFx1MDAzRVwiO1xuICAgIH1cbiAgfVxufSkuY2FsbCh0aGlzKTtcblxufTtcbmlmICgoIW5vSGVhZCkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcIm1lZGl1bS0xMiBjb2x1bW5zXFxcIlxcdTAwM0VcIjtcbmlmIChyZXN1bHRzLmxlbmd0aCA9PSAwKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaDNcXHUwMDNFTm8gcmVzdWx0cyFcXHUwMDNDXFx1MDAyRmgzXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdGFibGUgY2xhc3M9XFxcInNjcm9sbFxcXCIgaWQ9XFxcInNlYXJjaC1yZXN1bHRzXFxcIiB3aWR0aD1cXFwiMTAwJVxcXCJcXHUwMDNFXFx1MDAzQ3RoZWFkXFx1MDAzRVxcdTAwM0N0clxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjE2JVxcXCJcXHUwMDNFU2VydmVyXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjEwJVxcXCJcXHUwMDNFTW9kZVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxMCVcXFwiXFx1MDAzRU1hcFxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxMCVcXFwiXFx1MDAzRVR5cGVcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCBjbGFzcz1cXFwidGV4dC1jZW50ZXJcXFwiIHdpZHRoPVxcXCIyNiVcXFwiXFx1MDAzRVJlc3VsdHNcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiOCVcXFwiXFx1MDAzRUNsaWVudHNcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiMjAlXFxcIlxcdTAwM0VFbmQgdGltZVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0clxcdTAwM0VcXHUwMDNDXFx1MDAyRnRoZWFkXFx1MDAzRVxcdTAwM0N0Ym9keVxcdTAwM0VcIjtcbnB1Z19taXhpbnNbXCJyZXN1bHRzXCJdKCk7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRib2R5XFx1MDAzRVxcdTAwM0NcXHUwMDJGdGFibGVcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJjb2x1bW5zIG1lZGl1bS04IGxhcmdlLTYgbWVkaXVtLWNlbnRlcmVkXFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1ucyB0ZXh0LWNlbnRlclxcXCJcXHUwMDNFXCI7XG5pZiAocHJldlBhZ2VVUkwpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcImhvbGxvdyBidXR0b24gc2Vjb25kYXJ5XFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCAocHJldlBhZ2VVUkwpLCB0cnVlLCBmYWxzZSkrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIFwicmV0dXJuIGxvYWRQYWdlKCdcIitwcmV2UGFnZVVSTCtcIicpO1wiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2kgY2xhc3M9XFxcImZhIGZhLWFuZ2xlLWRvdWJsZS1sZWZ0XFxcIlxcdTAwM0VcXHUwMDNDXFx1MDAyRmlcXHUwMDNFIE5ld2VyXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCImbmJzcDtcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1ucyB0ZXh0LWNlbnRlclxcXCJcXHUwMDNFXFx1MDAzQ2xhYmVsIGNsYXNzPVxcXCJiaWdcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHN0YXRzLmNvdW50KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIiByZXN1bHRzXFx1MDAzQ1xcdTAwMkZsYWJlbFxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC00IGNvbHVtbnMgdGV4dC1jZW50ZXJcXFwiXFx1MDAzRVwiO1xuaWYgKG5leHRQYWdlVVJMKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJob2xsb3cgYnV0dG9uIHNlY29uZGFyeVxcXCJcIitcIiBpZD1cXFwibmV4dC1wYWdlLWJ1dHRvblxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgKG5leHRQYWdlVVJMKSwgdHJ1ZSwgZmFsc2UpK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJyZXR1cm4gbG9hZFBhZ2UoJ1wiK25leHRQYWdlVVJMK1wiJyk7XCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFT2xkZXIgXFx1MDAzQ2kgY2xhc3M9XFxcImZhIGZhLWFuZ2xlLWRvdWJsZS1yaWdodFxcXCJcXHUwMDNFXFx1MDAzQ1xcdTAwMkZpXFx1MDAzRVxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbn1cbmVsc2Uge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiJm5ic3A7XCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdHIgY2xhc3M9XFxcInNjcm9sbC10b1xcXCJcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxNiVcXFwiXFx1MDAzRVNlcnZlclxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxMCVcXFwiXFx1MDAzRU1vZGVcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiMTAlXFxcIlxcdTAwM0VNYXBcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiMTAlXFxcIlxcdTAwM0VUeXBlXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgY2xhc3M9XFxcInRleHQtY2VudGVyXFxcIiB3aWR0aD1cXFwiMjYlXFxcIlxcdTAwM0VSZXN1bHRzXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjglXFxcIlxcdTAwM0VDbGllbnRzXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjIwJVxcXCJcXHUwMDNFRW5kIHRpbWVcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXCI7XG5wdWdfbWl4aW5zW1wicmVzdWx0c1wiXSgpO1xufX0uY2FsbCh0aGlzLFwiRGF0ZVwiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGguRGF0ZTp0eXBlb2YgRGF0ZSE9PVwidW5kZWZpbmVkXCI/RGF0ZTp1bmRlZmluZWQsXCJuZXh0UGFnZVVSTFwiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGgubmV4dFBhZ2VVUkw6dHlwZW9mIG5leHRQYWdlVVJMIT09XCJ1bmRlZmluZWRcIj9uZXh0UGFnZVVSTDp1bmRlZmluZWQsXCJub0hlYWRcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLm5vSGVhZDp0eXBlb2Ygbm9IZWFkIT09XCJ1bmRlZmluZWRcIj9ub0hlYWQ6dW5kZWZpbmVkLFwicHJldlBhZ2VVUkxcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLnByZXZQYWdlVVJMOnR5cGVvZiBwcmV2UGFnZVVSTCE9PVwidW5kZWZpbmVkXCI/cHJldlBhZ2VVUkw6dW5kZWZpbmVkLFwicmVzdWx0c1wiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGgucmVzdWx0czp0eXBlb2YgcmVzdWx0cyE9PVwidW5kZWZpbmVkXCI/cmVzdWx0czp1bmRlZmluZWQsXCJzdGF0c1wiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGguc3RhdHM6dHlwZW9mIHN0YXRzIT09XCJ1bmRlZmluZWRcIj9zdGF0czp1bmRlZmluZWQpKTs7cmV0dXJuIHB1Z19odG1sO307Il19
