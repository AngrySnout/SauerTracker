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
"use strict";

var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var NProgress = window.NProgress;
var url = window.url;

var searchResultsTemplate = require('../views/_partials/player-search-results.pug');

var originalURL = window.location.pathname + window.location.search + window.location.hash;

function loadPage(url, name) {
	NProgress.start();
	$.get("/api" + url).success(function (result) {
		$("#search-result-container").html(searchResultsTemplate({ results: result.results, _: _ }));
	}).fail(function () {
		$("#search-result-container").html("Error loading search results.");
	}).always(function () {
		$("#name").val(name);
		NProgress.done();
	});
}

$("#search-form").on("submit", function (event) {
	event.preventDefault();
	var url = "/players/find?" + $(this).serialize();
	var name = $("#name").val();
	loadPage(url, name);
	history.pushState({ url: url, name: name }, window.title, url);
});

$(window).bind("popstate", function (event) {
	var state = event.originalEvent.state;
	if (!state) {
		if (originalURL === "/players") window.location.reload();else loadPage(originalURL);
	} else loadPage(state.url, state.name);
});

window.selectCategory = function (category) {
	$(".category-body").hide();
	$("#top-" + category).show();
	$(".category-title").removeClass("inverted");
	$("#ct-" + category).addClass("inverted");
};

window.selectCategory("monthly");

},{"../views/_partials/player-search-results.pug":4}],4:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (_, encodeURIComponent, parseInt, results) {if (results.length) {
pug_html = pug_html + "\u003Ctable class=\"scroll\" id=\"search-results\" width=\"100%\"\u003E\u003Cthead\u003E\u003Ctr\u003E\u003Ctd width=\"19%\"\u003EName\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EFrags\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EFlags\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EDeaths\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003ETKs\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EK\u002FD\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EAccuracy\u003C\u002Ftd\u003E\u003Ctd width=\"9%\"\u003EElo\u003C\u002Ftd\u003E\u003Ctd width=\"18%\"\u003ECountry\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate results
;(function(){
  var $$obj = results;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var player = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr class=\"unclickable\"\u003E\u003Ctd\u003E\u003Ca" + (pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
if (player.online) {
pug_html = pug_html + " \u003Cspan class=\"label success\"\u003Eonline\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.tks) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.kpd) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = _.padStart(parseInt(player.acc).toString(), 2, "0")+"%") ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.elo) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.countryName) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
else {
pug_html = pug_html + "Unknown";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var player = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr class=\"unclickable\"\u003E\u003Ctd\u003E\u003Ca" + (pug_attr("href", ("/player/"+encodeURIComponent(player.name)), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
if (player.online) {
pug_html = pug_html + " \u003Cspan class=\"label success\"\u003Eonline\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.frags) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.flags) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.deaths) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.tks) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.kpd) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = _.padStart(parseInt(player.acc).toString(), 2, "0")+"%") ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E" + (pug_escape(null == (pug_interp = player.elo) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd\u003E";
if (player.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", ("/images/flags/"+player.country+".png"), true, false)) + "\u002F\u003E \u003Ca" + (" class=\"no-color\""+pug_attr("href", "/players/find?country="+player.country, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = player.countryName) ? "" : pug_interp)) + "\u003C\u002Fa\u003E";
}
else {
pug_html = pug_html + "Unknown";
}
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";
if ((results.length == 200)) {
pug_html = pug_html + "Results are too big to show. You should narrow down your search query.";
}
}
else {
pug_html = pug_html + "No results.";
}}.call(this,"_" in locals_for_with?locals_for_with._:typeof _!=="undefined"?_:undefined,"encodeURIComponent" in locals_for_with?locals_for_with.encodeURIComponent:typeof encodeURIComponent!=="undefined"?encodeURIComponent:undefined,"parseInt" in locals_for_with?locals_for_with.parseInt:typeof parseInt!=="undefined"?parseInt:undefined,"results" in locals_for_with?locals_for_with.results:typeof results!=="undefined"?results:undefined));;return pug_html;};
},{"pug-runtime":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3B1Zy1ydW50aW1lL2luZGV4LmpzIiwid2Vic2l0ZS9qcy9wbGF5ZXJzLmpzIiwid2Vic2l0ZS92aWV3cy9fcGFydGlhbHMvcGxheWVyLXNlYXJjaC1yZXN1bHRzLnB1ZyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNB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QSxPQUFPLGNBQVAsR0FBd0IsVUFBUyxRQUFULEVBQW1CO0FBQzFDLEdBQUUsZ0JBQUYsRUFBb0IsSUFBcEI7QUFDQSxHQUFFLFVBQVEsUUFBVixFQUFvQixJQUFwQjtBQUNBLEdBQUUsaUJBQUYsRUFBcUIsV0FBckIsQ0FBaUMsVUFBakM7QUFDQSxHQUFFLFNBQU8sUUFBVCxFQUFtQixRQUFuQixDQUE0QixVQUE1QjtBQUNBLENBTEQ7O0FBT0EsT0FBTyxjQUFQLENBQXNCLFNBQXRCOzs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHB1Z19oYXNfb3duX3Byb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBNZXJnZSB0d28gYXR0cmlidXRlIG9iamVjdHMgZ2l2aW5nIHByZWNlZGVuY2VcbiAqIHRvIHZhbHVlcyBpbiBvYmplY3QgYGJgLiBDbGFzc2VzIGFyZSBzcGVjaWFsLWNhc2VkXG4gKiBhbGxvd2luZyBmb3IgYXJyYXlzIGFuZCBtZXJnaW5nL2pvaW5pbmcgYXBwcm9wcmlhdGVseVxuICogcmVzdWx0aW5nIGluIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICogQHJldHVybiB7T2JqZWN0fSBhXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLm1lcmdlID0gcHVnX21lcmdlO1xuZnVuY3Rpb24gcHVnX21lcmdlKGEsIGIpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICB2YXIgYXR0cnMgPSBhWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgYXR0cnMgPSBwdWdfbWVyZ2UoYXR0cnMsIGFbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cnM7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gYikge1xuICAgIGlmIChrZXkgPT09ICdjbGFzcycpIHtcbiAgICAgIHZhciB2YWxBID0gYVtrZXldIHx8IFtdO1xuICAgICAgYVtrZXldID0gKEFycmF5LmlzQXJyYXkodmFsQSkgPyB2YWxBIDogW3ZhbEFdKS5jb25jYXQoYltrZXldIHx8IFtdKTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgdmFyIHZhbEEgPSBwdWdfc3R5bGUoYVtrZXldKTtcbiAgICAgIHZhciB2YWxCID0gcHVnX3N0eWxlKGJba2V5XSk7XG4gICAgICBhW2tleV0gPSB2YWxBICsgKHZhbEEgJiYgdmFsQiAmJiAnOycpICsgdmFsQjtcbiAgICB9IGVsc2Uge1xuICAgICAgYVtrZXldID0gYltrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhO1xufTtcblxuLyoqXG4gKiBQcm9jZXNzIGFycmF5LCBvYmplY3QsIG9yIHN0cmluZyBhcyBhIHN0cmluZyBvZiBjbGFzc2VzIGRlbGltaXRlZCBieSBhIHNwYWNlLlxuICpcbiAqIElmIGB2YWxgIGlzIGFuIGFycmF5LCBhbGwgbWVtYmVycyBvZiBpdCBhbmQgaXRzIHN1YmFycmF5cyBhcmUgY291bnRlZCBhc1xuICogY2xhc3Nlcy4gSWYgYGVzY2FwaW5nYCBpcyBhbiBhcnJheSwgdGhlbiB3aGV0aGVyIG9yIG5vdCB0aGUgaXRlbSBpbiBgdmFsYCBpc1xuICogZXNjYXBlZCBkZXBlbmRzIG9uIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW4gYGVzY2FwaW5nYC4gSWYgYGVzY2FwaW5nYCBpc1xuICogbm90IGFuIGFycmF5LCBubyBlc2NhcGluZyBpcyBkb25lLlxuICpcbiAqIElmIGB2YWxgIGlzIGFuIG9iamVjdCwgYWxsIHRoZSBrZXlzIHdob3NlIHZhbHVlIGlzIHRydXRoeSBhcmUgY291bnRlZCBhc1xuICogY2xhc3Nlcy4gTm8gZXNjYXBpbmcgaXMgZG9uZS5cbiAqXG4gKiBJZiBgdmFsYCBpcyBhIHN0cmluZywgaXQgaXMgY291bnRlZCBhcyBhIGNsYXNzLiBObyBlc2NhcGluZyBpcyBkb25lLlxuICpcbiAqIEBwYXJhbSB7KEFycmF5LjxzdHJpbmc+fE9iamVjdC48c3RyaW5nLCBib29sZWFuPnxzdHJpbmcpfSB2YWxcbiAqIEBwYXJhbSB7P0FycmF5LjxzdHJpbmc+fSBlc2NhcGluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmNsYXNzZXMgPSBwdWdfY2xhc3NlcztcbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX2FycmF5KHZhbCwgZXNjYXBpbmcpIHtcbiAgdmFyIGNsYXNzU3RyaW5nID0gJycsIGNsYXNzTmFtZSwgcGFkZGluZyA9ICcnLCBlc2NhcGVFbmFibGVkID0gQXJyYXkuaXNBcnJheShlc2NhcGluZyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgY2xhc3NOYW1lID0gcHVnX2NsYXNzZXModmFsW2ldKTtcbiAgICBpZiAoIWNsYXNzTmFtZSkgY29udGludWU7XG4gICAgZXNjYXBlRW5hYmxlZCAmJiBlc2NhcGluZ1tpXSAmJiAoY2xhc3NOYW1lID0gcHVnX2VzY2FwZShjbGFzc05hbWUpKTtcbiAgICBjbGFzc1N0cmluZyA9IGNsYXNzU3RyaW5nICsgcGFkZGluZyArIGNsYXNzTmFtZTtcbiAgICBwYWRkaW5nID0gJyAnO1xuICB9XG4gIHJldHVybiBjbGFzc1N0cmluZztcbn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX29iamVjdCh2YWwpIHtcbiAgdmFyIGNsYXNzU3RyaW5nID0gJycsIHBhZGRpbmcgPSAnJztcbiAgZm9yICh2YXIga2V5IGluIHZhbCkge1xuICAgIGlmIChrZXkgJiYgdmFsW2tleV0gJiYgcHVnX2hhc19vd25fcHJvcGVydHkuY2FsbCh2YWwsIGtleSkpIHtcbiAgICAgIGNsYXNzU3RyaW5nID0gY2xhc3NTdHJpbmcgKyBwYWRkaW5nICsga2V5O1xuICAgICAgcGFkZGluZyA9ICcgJztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzU3RyaW5nO1xufVxuZnVuY3Rpb24gcHVnX2NsYXNzZXModmFsLCBlc2NhcGluZykge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgcmV0dXJuIHB1Z19jbGFzc2VzX2FycmF5KHZhbCwgZXNjYXBpbmcpO1xuICB9IGVsc2UgaWYgKHZhbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBwdWdfY2xhc3Nlc19vYmplY3QodmFsKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsIHx8ICcnO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydCBvYmplY3Qgb3Igc3RyaW5nIHRvIGEgc3RyaW5nIG9mIENTUyBzdHlsZXMgZGVsaW1pdGVkIGJ5IGEgc2VtaWNvbG9uLlxuICpcbiAqIEBwYXJhbSB7KE9iamVjdC48c3RyaW5nLCBzdHJpbmc+fHN0cmluZyl9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmV4cG9ydHMuc3R5bGUgPSBwdWdfc3R5bGU7XG5mdW5jdGlvbiBwdWdfc3R5bGUodmFsKSB7XG4gIGlmICghdmFsKSByZXR1cm4gJyc7XG4gIGlmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgIHZhciBvdXQgPSAnJywgZGVsaW0gPSAnJztcbiAgICBmb3IgKHZhciBzdHlsZSBpbiB2YWwpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAocHVnX2hhc19vd25fcHJvcGVydHkuY2FsbCh2YWwsIHN0eWxlKSkge1xuICAgICAgICBvdXQgPSBvdXQgKyBkZWxpbSArIHN0eWxlICsgJzonICsgdmFsW3N0eWxlXTtcbiAgICAgICAgZGVsaW0gPSAnOyc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gJycgKyB2YWw7XG4gICAgaWYgKHZhbFt2YWwubGVuZ3RoIC0gMV0gPT09ICc7JykgcmV0dXJuIHZhbC5zbGljZSgwLCAtMSk7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGVzY2FwZWRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGVyc2VcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0cy5hdHRyID0gcHVnX2F0dHI7XG5mdW5jdGlvbiBwdWdfYXR0cihrZXksIHZhbCwgZXNjYXBlZCwgdGVyc2UpIHtcbiAgaWYgKHZhbCA9PT0gZmFsc2UgfHwgdmFsID09IG51bGwgfHwgIXZhbCAmJiAoa2V5ID09PSAnY2xhc3MnIHx8IGtleSA9PT0gJ3N0eWxlJykpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgaWYgKHZhbCA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiAnICcgKyAodGVyc2UgPyBrZXkgOiBrZXkgKyAnPVwiJyArIGtleSArICdcIicpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhbCA9IHZhbC50b0pTT04oKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICAgIGlmICghZXNjYXBlZCAmJiB2YWwuaW5kZXhPZignXCInKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiAnICcgKyBrZXkgKyAnPVxcJycgKyB2YWwucmVwbGFjZSgvJy9nLCAnJiMzOTsnKSArICdcXCcnO1xuICAgIH1cbiAgfVxuICBpZiAoZXNjYXBlZCkgdmFsID0gcHVnX2VzY2FwZSh2YWwpO1xuICByZXR1cm4gJyAnICsga2V5ICsgJz1cIicgKyB2YWwgKyAnXCInO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZXMgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0ZXJzZSB3aGV0aGVyIHRvIHVzZSBIVE1MNSB0ZXJzZSBib29sZWFuIGF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0cy5hdHRycyA9IHB1Z19hdHRycztcbmZ1bmN0aW9uIHB1Z19hdHRycyhvYmosIHRlcnNlKXtcbiAgdmFyIGF0dHJzID0gJyc7XG5cbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgdmFyIHZhbCA9IG9ialtrZXldO1xuXG4gICAgICBpZiAoJ2NsYXNzJyA9PT0ga2V5KSB7XG4gICAgICAgIHZhbCA9IHB1Z19jbGFzc2VzKHZhbCk7XG4gICAgICAgIGF0dHJzID0gcHVnX2F0dHIoa2V5LCB2YWwsIGZhbHNlLCB0ZXJzZSkgKyBhdHRycztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoJ3N0eWxlJyA9PT0ga2V5KSB7XG4gICAgICAgIHZhbCA9IHB1Z19zdHlsZSh2YWwpO1xuICAgICAgfVxuICAgICAgYXR0cnMgKz0gcHVnX2F0dHIoa2V5LCB2YWwsIGZhbHNlLCB0ZXJzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJzO1xufTtcblxuLyoqXG4gKiBFc2NhcGUgdGhlIGdpdmVuIHN0cmluZyBvZiBgaHRtbGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciBwdWdfbWF0Y2hfaHRtbCA9IC9bXCImPD5dLztcbmV4cG9ydHMuZXNjYXBlID0gcHVnX2VzY2FwZTtcbmZ1bmN0aW9uIHB1Z19lc2NhcGUoX2h0bWwpe1xuICB2YXIgaHRtbCA9ICcnICsgX2h0bWw7XG4gIHZhciByZWdleFJlc3VsdCA9IHB1Z19tYXRjaF9odG1sLmV4ZWMoaHRtbCk7XG4gIGlmICghcmVnZXhSZXN1bHQpIHJldHVybiBfaHRtbDtcblxuICB2YXIgcmVzdWx0ID0gJyc7XG4gIHZhciBpLCBsYXN0SW5kZXgsIGVzY2FwZTtcbiAgZm9yIChpID0gcmVnZXhSZXN1bHQuaW5kZXgsIGxhc3RJbmRleCA9IDA7IGkgPCBodG1sLmxlbmd0aDsgaSsrKSB7XG4gICAgc3dpdGNoIChodG1sLmNoYXJDb2RlQXQoaSkpIHtcbiAgICAgIGNhc2UgMzQ6IGVzY2FwZSA9ICcmcXVvdDsnOyBicmVhaztcbiAgICAgIGNhc2UgMzg6IGVzY2FwZSA9ICcmYW1wOyc7IGJyZWFrO1xuICAgICAgY2FzZSA2MDogZXNjYXBlID0gJyZsdDsnOyBicmVhaztcbiAgICAgIGNhc2UgNjI6IGVzY2FwZSA9ICcmZ3Q7JzsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGxhc3RJbmRleCAhPT0gaSkgcmVzdWx0ICs9IGh0bWwuc3Vic3RyaW5nKGxhc3RJbmRleCwgaSk7XG4gICAgbGFzdEluZGV4ID0gaSArIDE7XG4gICAgcmVzdWx0ICs9IGVzY2FwZTtcbiAgfVxuICBpZiAobGFzdEluZGV4ICE9PSBpKSByZXR1cm4gcmVzdWx0ICsgaHRtbC5zdWJzdHJpbmcobGFzdEluZGV4LCBpKTtcbiAgZWxzZSByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZS10aHJvdyB0aGUgZ2l2ZW4gYGVycmAgaW4gY29udGV4dCB0byB0aGVcbiAqIHRoZSBwdWcgaW4gYGZpbGVuYW1lYCBhdCB0aGUgZ2l2ZW4gYGxpbmVub2AuXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBsaW5lbm9cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgb3JpZ2luYWwgc291cmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnJldGhyb3cgPSBwdWdfcmV0aHJvdztcbmZ1bmN0aW9uIHB1Z19yZXRocm93KGVyciwgZmlsZW5hbWUsIGxpbmVubywgc3RyKXtcbiAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpKSB0aHJvdyBlcnI7XG4gIGlmICgodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyB8fCAhZmlsZW5hbWUpICYmICFzdHIpIHtcbiAgICBlcnIubWVzc2FnZSArPSAnIG9uIGxpbmUgJyArIGxpbmVubztcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgdHJ5IHtcbiAgICBzdHIgPSBzdHIgfHwgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMoZmlsZW5hbWUsICd1dGY4JylcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBwdWdfcmV0aHJvdyhlcnIsIG51bGwsIGxpbmVubylcbiAgfVxuICB2YXIgY29udGV4dCA9IDNcbiAgICAsIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgc3RhcnQgPSBNYXRoLm1heChsaW5lbm8gLSBjb250ZXh0LCAwKVxuICAgICwgZW5kID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBsaW5lbm8gKyBjb250ZXh0KTtcblxuICAvLyBFcnJvciBjb250ZXh0XG4gIHZhciBjb250ZXh0ID0gbGluZXMuc2xpY2Uoc3RhcnQsIGVuZCkubWFwKGZ1bmN0aW9uKGxpbmUsIGkpe1xuICAgIHZhciBjdXJyID0gaSArIHN0YXJ0ICsgMTtcbiAgICByZXR1cm4gKGN1cnIgPT0gbGluZW5vID8gJyAgPiAnIDogJyAgICAnKVxuICAgICAgKyBjdXJyXG4gICAgICArICd8ICdcbiAgICAgICsgbGluZTtcbiAgfSkuam9pbignXFxuJyk7XG5cbiAgLy8gQWx0ZXIgZXhjZXB0aW9uIG1lc3NhZ2VcbiAgZXJyLnBhdGggPSBmaWxlbmFtZTtcbiAgZXJyLm1lc3NhZ2UgPSAoZmlsZW5hbWUgfHwgJ1B1ZycpICsgJzonICsgbGluZW5vXG4gICAgKyAnXFxuJyArIGNvbnRleHQgKyAnXFxuXFxuJyArIGVyci5tZXNzYWdlO1xuICB0aHJvdyBlcnI7XG59O1xuIiwidmFyICQgPSB3aW5kb3cuJDtcbnZhciBfID0gd2luZG93Ll87XG52YXIgZm91bmRhdGlvbiA9IHdpbmRvdy5Gb3VuZGF0aW9uO1xudmFyIE5Qcm9ncmVzcyA9IHdpbmRvdy5OUHJvZ3Jlc3M7XG52YXIgdXJsID0gd2luZG93LnVybDtcblxudmFyIHNlYXJjaFJlc3VsdHNUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3ZpZXdzL19wYXJ0aWFscy9wbGF5ZXItc2VhcmNoLXJlc3VsdHMucHVnJyk7XG5cbnZhciBvcmlnaW5hbFVSTCA9IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZSArIHdpbmRvdy5sb2NhdGlvbi5zZWFyY2ggKyB3aW5kb3cubG9jYXRpb24uaGFzaDtcblxuZnVuY3Rpb24gbG9hZFBhZ2UodXJsLCBuYW1lKSB7XG5cdE5Qcm9ncmVzcy5zdGFydCgpO1xuXHQkLmdldChcIi9hcGlcIit1cmwpXG5cdCBcdC5zdWNjZXNzKHJlc3VsdCA9PiB7XG5cdFx0XHQkKFwiI3NlYXJjaC1yZXN1bHQtY29udGFpbmVyXCIpLmh0bWwoc2VhcmNoUmVzdWx0c1RlbXBsYXRlKHsgcmVzdWx0czogcmVzdWx0LnJlc3VsdHMsIF86IF8gfSkpO1xuXHRcdH0pXG5cdFx0LmZhaWwoKCkgPT4ge1xuXHRcdFx0JChcIiNzZWFyY2gtcmVzdWx0LWNvbnRhaW5lclwiKS5odG1sKFwiRXJyb3IgbG9hZGluZyBzZWFyY2ggcmVzdWx0cy5cIik7XG5cdFx0fSlcblx0XHQuYWx3YXlzKCgpID0+IHtcblx0XHRcdCQoXCIjbmFtZVwiKS52YWwobmFtZSk7XG5cdFx0XHROUHJvZ3Jlc3MuZG9uZSgpO1xuXHRcdH0pO1xufVxuXG4kKFwiI3NlYXJjaC1mb3JtXCIpLm9uKFwic3VibWl0XCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG5cdGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG5cdHZhciB1cmwgPSBcIi9wbGF5ZXJzL2ZpbmQ/XCIrJCh0aGlzKS5zZXJpYWxpemUoKTtcblx0dmFyIG5hbWUgPSAkKFwiI25hbWVcIikudmFsKCk7XG5cdGxvYWRQYWdlKHVybCwgbmFtZSk7XG5cdGhpc3RvcnkucHVzaFN0YXRlKHsgdXJsOiB1cmwsIG5hbWU6IG5hbWUgfSwgd2luZG93LnRpdGxlLCB1cmwpO1xufSk7XG5cbiQod2luZG93KS5iaW5kKFwicG9wc3RhdGVcIiwgZnVuY3Rpb24oZXZlbnQpIHtcblx0bGV0IHN0YXRlID0gZXZlbnQub3JpZ2luYWxFdmVudC5zdGF0ZTtcblx0aWYgKCFzdGF0ZSkge1xuXHRcdGlmIChvcmlnaW5hbFVSTCA9PT0gXCIvcGxheWVyc1wiKSB3aW5kb3cubG9jYXRpb24ucmVsb2FkKCk7XG5cdFx0ZWxzZSBsb2FkUGFnZShvcmlnaW5hbFVSTCk7XG5cdH0gZWxzZSBsb2FkUGFnZShzdGF0ZS51cmwsIHN0YXRlLm5hbWUpO1xufSk7XG5cbndpbmRvdy5zZWxlY3RDYXRlZ29yeSA9IGZ1bmN0aW9uKGNhdGVnb3J5KSB7XG5cdCQoXCIuY2F0ZWdvcnktYm9keVwiKS5oaWRlKCk7XG5cdCQoXCIjdG9wLVwiK2NhdGVnb3J5KS5zaG93KCk7XG5cdCQoXCIuY2F0ZWdvcnktdGl0bGVcIikucmVtb3ZlQ2xhc3MoXCJpbnZlcnRlZFwiKTtcblx0JChcIiNjdC1cIitjYXRlZ29yeSkuYWRkQ2xhc3MoXCJpbnZlcnRlZFwiKTtcbn1cblxud2luZG93LnNlbGVjdENhdGVnb3J5KFwibW9udGhseVwiKTtcbiIsInZhciBwdWcgPSByZXF1aXJlKFwicHVnLXJ1bnRpbWVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHVnX2F0dHIodCxlLG4sZil7cmV0dXJuIGUhPT0hMSYmbnVsbCE9ZSYmKGV8fFwiY2xhc3NcIiE9PXQmJlwic3R5bGVcIiE9PXQpP2U9PT0hMD9cIiBcIisoZj90OnQrJz1cIicrdCsnXCInKTooXCJmdW5jdGlvblwiPT10eXBlb2YgZS50b0pTT04mJihlPWUudG9KU09OKCkpLFwic3RyaW5nXCI9PXR5cGVvZiBlfHwoZT1KU09OLnN0cmluZ2lmeShlKSxufHxlLmluZGV4T2YoJ1wiJyk9PT0tMSk/KG4mJihlPXB1Z19lc2NhcGUoZSkpLFwiIFwiK3QrJz1cIicrZSsnXCInKTpcIiBcIit0K1wiPSdcIitlLnJlcGxhY2UoLycvZyxcIiYjMzk7XCIpK1wiJ1wiKTpcIlwifVxuZnVuY3Rpb24gcHVnX2VzY2FwZShlKXt2YXIgYT1cIlwiK2UsdD1wdWdfbWF0Y2hfaHRtbC5leGVjKGEpO2lmKCF0KXJldHVybiBlO3ZhciByLGMsbixzPVwiXCI7Zm9yKHI9dC5pbmRleCxjPTA7cjxhLmxlbmd0aDtyKyspe3N3aXRjaChhLmNoYXJDb2RlQXQocikpe2Nhc2UgMzQ6bj1cIiZxdW90O1wiO2JyZWFrO2Nhc2UgMzg6bj1cIiZhbXA7XCI7YnJlYWs7Y2FzZSA2MDpuPVwiJmx0O1wiO2JyZWFrO2Nhc2UgNjI6bj1cIiZndDtcIjticmVhaztkZWZhdWx0OmNvbnRpbnVlfWMhPT1yJiYocys9YS5zdWJzdHJpbmcoYyxyKSksYz1yKzEscys9bn1yZXR1cm4gYyE9PXI/cythLnN1YnN0cmluZyhjLHIpOnN9XG52YXIgcHVnX21hdGNoX2h0bWw9L1tcIiY8Pl0vO2Z1bmN0aW9uIHRlbXBsYXRlKGxvY2Fscykge3ZhciBwdWdfaHRtbCA9IFwiXCIsIHB1Z19taXhpbnMgPSB7fSwgcHVnX2ludGVycDs7dmFyIGxvY2Fsc19mb3Jfd2l0aCA9IChsb2NhbHMgfHwge30pOyhmdW5jdGlvbiAoXywgZW5jb2RlVVJJQ29tcG9uZW50LCBwYXJzZUludCwgcmVzdWx0cykge2lmIChyZXN1bHRzLmxlbmd0aCkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3RhYmxlIGNsYXNzPVxcXCJzY3JvbGxcXFwiIGlkPVxcXCJzZWFyY2gtcmVzdWx0c1xcXCIgd2lkdGg9XFxcIjEwMCVcXFwiXFx1MDAzRVxcdTAwM0N0aGVhZFxcdTAwM0VcXHUwMDNDdHJcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxOSVcXFwiXFx1MDAzRU5hbWVcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiOSVcXFwiXFx1MDAzRUZyYWdzXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjklXFxcIlxcdTAwM0VGbGFnc1xcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCI5JVxcXCJcXHUwMDNFRGVhdGhzXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgd2lkdGg9XFxcIjklXFxcIlxcdTAwM0VUS3NcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiOSVcXFwiXFx1MDAzRUtcXHUwMDJGRFxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCI5JVxcXCJcXHUwMDNFQWNjdXJhY3lcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiOSVcXFwiXFx1MDAzRUVsb1xcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIHdpZHRoPVxcXCIxOCVcXFwiXFx1MDAzRUNvdW50cnlcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0aGVhZFxcdTAwM0VcXHUwMDNDdGJvZHlcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHJlc3VsdHNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gcmVzdWx0cztcbiAgaWYgKCdudW1iZXInID09IHR5cGVvZiAkJG9iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIHB1Z19pbmRleDAgPSAwLCAkJGwgPSAkJG9iai5sZW5ndGg7IHB1Z19pbmRleDAgPCAkJGw7IHB1Z19pbmRleDArKykge1xuICAgICAgICB2YXIgcGxheWVyID0gJCRvYmpbcHVnX2luZGV4MF07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdHIgY2xhc3M9XFxcInVuY2xpY2thYmxlXFxcIlxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImhyZWZcIiwgKFwiL3BsYXllci9cIitlbmNvZGVVUklDb21wb25lbnQocGxheWVyLm5hbWUpKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbmlmIChwbGF5ZXIub25saW5lKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCIgXFx1MDAzQ3NwYW4gY2xhc3M9XFxcImxhYmVsIHN1Y2Nlc3NcXFwiXFx1MDAzRW9ubGluZVxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mcmFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZmxhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmRlYXRocykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIudGtzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5rcGQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gXy5wYWRTdGFydChwYXJzZUludChwbGF5ZXIuYWNjKS50b1N0cmluZygpLCAyLCBcIjBcIikrXCIlXCIpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmVsbykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIjtcbmlmIChwbGF5ZXIuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIChcIi9pbWFnZXMvZmxhZ3MvXCIrcGxheWVyLmNvdW50cnkrXCIucG5nXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRSBcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJuby1jb2xvclxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvcGxheWVycy9maW5kP2NvdW50cnk9XCIrcGxheWVyLmNvdW50cnksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuY291bnRyeU5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJVbmtub3duXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MCBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgcGxheWVyID0gJCRvYmpbcHVnX2luZGV4MF07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdHIgY2xhc3M9XFxcInVuY2xpY2thYmxlXFxcIlxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImhyZWZcIiwgKFwiL3BsYXllci9cIitlbmNvZGVVUklDb21wb25lbnQocGxheWVyLm5hbWUpKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbmlmIChwbGF5ZXIub25saW5lKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCIgXFx1MDAzQ3NwYW4gY2xhc3M9XFxcImxhYmVsIHN1Y2Nlc3NcXFwiXFx1MDAzRW9ubGluZVxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mcmFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZmxhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmRlYXRocykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIudGtzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5rcGQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gXy5wYWRTdGFydChwYXJzZUludChwbGF5ZXIuYWNjKS50b1N0cmluZygpLCAyLCBcIjBcIikrXCIlXCIpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmVsbykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFxcdTAwM0VcIjtcbmlmIChwbGF5ZXIuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIChcIi9pbWFnZXMvZmxhZ3MvXCIrcGxheWVyLmNvdW50cnkrXCIucG5nXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRSBcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJuby1jb2xvclxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvcGxheWVycy9maW5kP2NvdW50cnk9XCIrcGxheWVyLmNvdW50cnksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuY291bnRyeU5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxuZWxzZSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJVbmtub3duXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXCI7XG4gICAgfVxuICB9XG59KS5jYWxsKHRoaXMpO1xuXG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRib2R5XFx1MDAzRVxcdTAwM0NcXHUwMDJGdGFibGVcXHUwMDNFXCI7XG5pZiAoKHJlc3VsdHMubGVuZ3RoID09IDIwMCkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlJlc3VsdHMgYXJlIHRvbyBiaWcgdG8gc2hvdy4gWW91IHNob3VsZCBuYXJyb3cgZG93biB5b3VyIHNlYXJjaCBxdWVyeS5cIjtcbn1cbn1cbmVsc2Uge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiTm8gcmVzdWx0cy5cIjtcbn19LmNhbGwodGhpcyxcIl9cIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLl86dHlwZW9mIF8hPT1cInVuZGVmaW5lZFwiP186dW5kZWZpbmVkLFwiZW5jb2RlVVJJQ29tcG9uZW50XCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5lbmNvZGVVUklDb21wb25lbnQ6dHlwZW9mIGVuY29kZVVSSUNvbXBvbmVudCE9PVwidW5kZWZpbmVkXCI/ZW5jb2RlVVJJQ29tcG9uZW50OnVuZGVmaW5lZCxcInBhcnNlSW50XCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5wYXJzZUludDp0eXBlb2YgcGFyc2VJbnQhPT1cInVuZGVmaW5lZFwiP3BhcnNlSW50OnVuZGVmaW5lZCxcInJlc3VsdHNcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLnJlc3VsdHM6dHlwZW9mIHJlc3VsdHMhPT1cInVuZGVmaW5lZFwiP3Jlc3VsdHM6dW5kZWZpbmVkKSk7O3JldHVybiBwdWdfaHRtbDt9OyJdfQ==
