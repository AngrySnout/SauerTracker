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

var similarGamesTemplate = require('../views/_partials/similar-games.pug');

var mapName = $("#map-name").text();
var gameType = $("#game-type").text();

window.tryLoadBackground(mapName);

function loadSimilarGames() {
    if (gameType === "duel" || gameType === "clanwar") {
        var meta = JSON.parse($("#game-meta").text());
        var query = "/games/find?gametype=" + gameType + "&limit=10&players=" + meta[0] + " " + meta[2];
        $.get("/api" + query, function (result) {
            $("#similar-games").html(similarGamesTemplate({ similarGames: result.results, viewAllLink: query }));
            $("#similar-games-parent").css("display", "block");
            disableDefault();
        });
    }
}
loadSimilarGames();

},{"../views/_partials/similar-games.pug":4}],4:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (similarGames, viewAllLink) {pug_html = pug_html + "\u003Ctable class=\"scroll\" id=\"search-results\" width=\"50%\"\u003E\u003Cthead\u003E\u003Ctr\u003E\u003Ctd width=\"40%\"\u003EMode \u002F Map\u003C\u002Ftd\u003E\u003Ctd class=\"text-center\" width=\"60%\"\u003EResult\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate similarGames
;(function(){
  var $$obj = similarGames;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var game = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr" + (" class=\"clickable\""+pug_attr("onclick", "if (window.history) { history.pushState({}, window.location.href); } window.location.replace('/game/"+game.id+"')", true, false)) + "\u003E\u003Ctd\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/game/"+game.id, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gamemode + " " + game.map) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/game/"+game.id, true, false)) + "\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: right; padding-right: 10\"\u003E" + (pug_escape(null == (pug_interp = game.meta[2]+" ") ? "" : pug_interp)) + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "success")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[3]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: left; padding-right: 10\"\u003E\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "alert")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[1]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E" + (pug_escape(null == (pug_interp = " "+game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var game = $$obj[pug_index0];
pug_html = pug_html + "\u003Ctr" + (" class=\"clickable\""+pug_attr("onclick", "if (window.history) { history.pushState({}, window.location.href); } window.location.replace('/game/"+game.id+"')", true, false)) + "\u003E\u003Ctd\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/game/"+game.id, true, false)) + "\u003E" + (pug_escape(null == (pug_interp = game.gamemode + " " + game.map) ? "" : pug_interp)) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/game/"+game.id, true, false)) + "\u003E\u003Cdiv class=\"row\"\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: right; padding-right: 10\"\u003E" + (pug_escape(null == (pug_interp = game.meta[2]+" ") ? "" : pug_interp)) + "\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "success")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[3]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Fdiv\u003E\u003Cdiv class=\"small-6 columns\" style=\"text-align: left; padding-right: 10\"\u003E\u003Cspan" + (pug_attr("class", pug_classes(["label",(game.draw? "warning": "alert")], [false,true]), false, false)+" style=\"cursor: pointer\"") + "\u003E" + (pug_escape(null == (pug_interp = game.meta[1]) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E" + (pug_escape(null == (pug_interp = " "+game.meta[0]) ? "" : pug_interp)) + "\u003C\u002Fdiv\u003E\u003C\u002Fdiv\u003E\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
    }
  }
}).call(this);

pug_html = pug_html + "\u003Ctr\u003E\u003Ctd colspan=\"2\"\u003E\u003Ca" + (pug_attr("href", viewAllLink, true, false)) + "\u003EView all...\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";}.call(this,"similarGames" in locals_for_with?locals_for_with.similarGames:typeof similarGames!=="undefined"?similarGames:undefined,"viewAllLink" in locals_for_with?locals_for_with.viewAllLink:typeof viewAllLink!=="undefined"?viewAllLink:undefined));;return pug_html;};
},{"pug-runtime":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL3B1Zy1ydW50aW1lL2luZGV4LmpzIiwid2Vic2l0ZS9qcy9nYW1lLmpzIiwid2Vic2l0ZS92aWV3cy9fcGFydGlhbHMvc2ltaWxhci1nYW1lcy5wdWciXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTs7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7Ozs7QUM5UEEsSUFBSSxJQUFJLE9BQU8sQ0FBZjs7QUFFQSxJQUFJLHVCQUF1QixRQUFRLHNDQUFSLENBQTNCOztBQUVBLElBQUksVUFBVSxFQUFFLFdBQUYsRUFBZSxJQUFmLEVBQWQ7QUFDQSxJQUFJLFdBQVcsRUFBRSxZQUFGLEVBQWdCLElBQWhCLEVBQWY7O0FBRUEsT0FBTyxpQkFBUCxDQUF5QixPQUF6Qjs7QUFFQSxTQUFTLGdCQUFULEdBQTRCO0FBQ3hCLFFBQUksYUFBYSxNQUFiLElBQXVCLGFBQWEsU0FBeEMsRUFBbUQ7QUFDL0MsWUFBSSxPQUFPLEtBQUssS0FBTCxDQUFXLEVBQUUsWUFBRixFQUFnQixJQUFoQixFQUFYLENBQVg7QUFDQSxZQUFJLFFBQVEsMEJBQXdCLFFBQXhCLEdBQWlDLG9CQUFqQyxHQUFzRCxLQUFLLENBQUwsQ0FBdEQsR0FBOEQsR0FBOUQsR0FBa0UsS0FBSyxDQUFMLENBQTlFO0FBQ0EsVUFBRSxHQUFGLENBQU0sU0FBTyxLQUFiLEVBQW9CLFVBQVMsTUFBVCxFQUFpQjtBQUNqQyxjQUFFLGdCQUFGLEVBQW9CLElBQXBCLENBQXlCLHFCQUFxQixFQUFFLGNBQWMsT0FBTyxPQUF2QixFQUFnQyxhQUFhLEtBQTdDLEVBQXJCLENBQXpCO0FBQ0EsY0FBRSx1QkFBRixFQUEyQixHQUEzQixDQUErQixTQUEvQixFQUEwQyxPQUExQztBQUNBO0FBQ0gsU0FKRDtBQUtIO0FBQ0o7QUFDRDs7O0FDcEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIiIsIid1c2Ugc3RyaWN0JztcblxudmFyIHB1Z19oYXNfb3duX3Byb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuLyoqXG4gKiBNZXJnZSB0d28gYXR0cmlidXRlIG9iamVjdHMgZ2l2aW5nIHByZWNlZGVuY2VcbiAqIHRvIHZhbHVlcyBpbiBvYmplY3QgYGJgLiBDbGFzc2VzIGFyZSBzcGVjaWFsLWNhc2VkXG4gKiBhbGxvd2luZyBmb3IgYXJyYXlzIGFuZCBtZXJnaW5nL2pvaW5pbmcgYXBwcm9wcmlhdGVseVxuICogcmVzdWx0aW5nIGluIGEgc3RyaW5nLlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBhXG4gKiBAcGFyYW0ge09iamVjdH0gYlxuICogQHJldHVybiB7T2JqZWN0fSBhXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLm1lcmdlID0gcHVnX21lcmdlO1xuZnVuY3Rpb24gcHVnX21lcmdlKGEsIGIpIHtcbiAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICB2YXIgYXR0cnMgPSBhWzBdO1xuICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYS5sZW5ndGg7IGkrKykge1xuICAgICAgYXR0cnMgPSBwdWdfbWVyZ2UoYXR0cnMsIGFbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gYXR0cnM7XG4gIH1cblxuICBmb3IgKHZhciBrZXkgaW4gYikge1xuICAgIGlmIChrZXkgPT09ICdjbGFzcycpIHtcbiAgICAgIHZhciB2YWxBID0gYVtrZXldIHx8IFtdO1xuICAgICAgYVtrZXldID0gKEFycmF5LmlzQXJyYXkodmFsQSkgPyB2YWxBIDogW3ZhbEFdKS5jb25jYXQoYltrZXldIHx8IFtdKTtcbiAgICB9IGVsc2UgaWYgKGtleSA9PT0gJ3N0eWxlJykge1xuICAgICAgdmFyIHZhbEEgPSBwdWdfc3R5bGUoYVtrZXldKTtcbiAgICAgIHZhciB2YWxCID0gcHVnX3N0eWxlKGJba2V5XSk7XG4gICAgICBhW2tleV0gPSB2YWxBICsgKHZhbEEgJiYgdmFsQiAmJiAnOycpICsgdmFsQjtcbiAgICB9IGVsc2Uge1xuICAgICAgYVtrZXldID0gYltrZXldO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBhO1xufTtcblxuLyoqXG4gKiBQcm9jZXNzIGFycmF5LCBvYmplY3QsIG9yIHN0cmluZyBhcyBhIHN0cmluZyBvZiBjbGFzc2VzIGRlbGltaXRlZCBieSBhIHNwYWNlLlxuICpcbiAqIElmIGB2YWxgIGlzIGFuIGFycmF5LCBhbGwgbWVtYmVycyBvZiBpdCBhbmQgaXRzIHN1YmFycmF5cyBhcmUgY291bnRlZCBhc1xuICogY2xhc3Nlcy4gSWYgYGVzY2FwaW5nYCBpcyBhbiBhcnJheSwgdGhlbiB3aGV0aGVyIG9yIG5vdCB0aGUgaXRlbSBpbiBgdmFsYCBpc1xuICogZXNjYXBlZCBkZXBlbmRzIG9uIHRoZSBjb3JyZXNwb25kaW5nIGl0ZW0gaW4gYGVzY2FwaW5nYC4gSWYgYGVzY2FwaW5nYCBpc1xuICogbm90IGFuIGFycmF5LCBubyBlc2NhcGluZyBpcyBkb25lLlxuICpcbiAqIElmIGB2YWxgIGlzIGFuIG9iamVjdCwgYWxsIHRoZSBrZXlzIHdob3NlIHZhbHVlIGlzIHRydXRoeSBhcmUgY291bnRlZCBhc1xuICogY2xhc3Nlcy4gTm8gZXNjYXBpbmcgaXMgZG9uZS5cbiAqXG4gKiBJZiBgdmFsYCBpcyBhIHN0cmluZywgaXQgaXMgY291bnRlZCBhcyBhIGNsYXNzLiBObyBlc2NhcGluZyBpcyBkb25lLlxuICpcbiAqIEBwYXJhbSB7KEFycmF5LjxzdHJpbmc+fE9iamVjdC48c3RyaW5nLCBib29sZWFuPnxzdHJpbmcpfSB2YWxcbiAqIEBwYXJhbSB7P0FycmF5LjxzdHJpbmc+fSBlc2NhcGluZ1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmNsYXNzZXMgPSBwdWdfY2xhc3NlcztcbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX2FycmF5KHZhbCwgZXNjYXBpbmcpIHtcbiAgdmFyIGNsYXNzU3RyaW5nID0gJycsIGNsYXNzTmFtZSwgcGFkZGluZyA9ICcnLCBlc2NhcGVFbmFibGVkID0gQXJyYXkuaXNBcnJheShlc2NhcGluZyk7XG4gIGZvciAodmFyIGkgPSAwOyBpIDwgdmFsLmxlbmd0aDsgaSsrKSB7XG4gICAgY2xhc3NOYW1lID0gcHVnX2NsYXNzZXModmFsW2ldKTtcbiAgICBpZiAoIWNsYXNzTmFtZSkgY29udGludWU7XG4gICAgZXNjYXBlRW5hYmxlZCAmJiBlc2NhcGluZ1tpXSAmJiAoY2xhc3NOYW1lID0gcHVnX2VzY2FwZShjbGFzc05hbWUpKTtcbiAgICBjbGFzc1N0cmluZyA9IGNsYXNzU3RyaW5nICsgcGFkZGluZyArIGNsYXNzTmFtZTtcbiAgICBwYWRkaW5nID0gJyAnO1xuICB9XG4gIHJldHVybiBjbGFzc1N0cmluZztcbn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX29iamVjdCh2YWwpIHtcbiAgdmFyIGNsYXNzU3RyaW5nID0gJycsIHBhZGRpbmcgPSAnJztcbiAgZm9yICh2YXIga2V5IGluIHZhbCkge1xuICAgIGlmIChrZXkgJiYgdmFsW2tleV0gJiYgcHVnX2hhc19vd25fcHJvcGVydHkuY2FsbCh2YWwsIGtleSkpIHtcbiAgICAgIGNsYXNzU3RyaW5nID0gY2xhc3NTdHJpbmcgKyBwYWRkaW5nICsga2V5O1xuICAgICAgcGFkZGluZyA9ICcgJztcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNsYXNzU3RyaW5nO1xufVxuZnVuY3Rpb24gcHVnX2NsYXNzZXModmFsLCBlc2NhcGluZykge1xuICBpZiAoQXJyYXkuaXNBcnJheSh2YWwpKSB7XG4gICAgcmV0dXJuIHB1Z19jbGFzc2VzX2FycmF5KHZhbCwgZXNjYXBpbmcpO1xuICB9IGVsc2UgaWYgKHZhbCAmJiB0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgIHJldHVybiBwdWdfY2xhc3Nlc19vYmplY3QodmFsKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsIHx8ICcnO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydCBvYmplY3Qgb3Igc3RyaW5nIHRvIGEgc3RyaW5nIG9mIENTUyBzdHlsZXMgZGVsaW1pdGVkIGJ5IGEgc2VtaWNvbG9uLlxuICpcbiAqIEBwYXJhbSB7KE9iamVjdC48c3RyaW5nLCBzdHJpbmc+fHN0cmluZyl9IHZhbFxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5cbmV4cG9ydHMuc3R5bGUgPSBwdWdfc3R5bGU7XG5mdW5jdGlvbiBwdWdfc3R5bGUodmFsKSB7XG4gIGlmICghdmFsKSByZXR1cm4gJyc7XG4gIGlmICh0eXBlb2YgdmFsID09PSAnb2JqZWN0Jykge1xuICAgIHZhciBvdXQgPSAnJywgZGVsaW0gPSAnJztcbiAgICBmb3IgKHZhciBzdHlsZSBpbiB2YWwpIHtcbiAgICAgIC8qIGlzdGFuYnVsIGlnbm9yZSBlbHNlICovXG4gICAgICBpZiAocHVnX2hhc19vd25fcHJvcGVydHkuY2FsbCh2YWwsIHN0eWxlKSkge1xuICAgICAgICBvdXQgPSBvdXQgKyBkZWxpbSArIHN0eWxlICsgJzonICsgdmFsW3N0eWxlXTtcbiAgICAgICAgZGVsaW0gPSAnOyc7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBvdXQ7XG4gIH0gZWxzZSB7XG4gICAgdmFsID0gJycgKyB2YWw7XG4gICAgaWYgKHZhbFt2YWwubGVuZ3RoIC0gMV0gPT09ICc7JykgcmV0dXJuIHZhbC5zbGljZSgwLCAtMSk7XG4gICAgcmV0dXJuIHZhbDtcbiAgfVxufTtcblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZS5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5XG4gKiBAcGFyYW0ge1N0cmluZ30gdmFsXG4gKiBAcGFyYW0ge0Jvb2xlYW59IGVzY2FwZWRcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gdGVyc2VcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0cy5hdHRyID0gcHVnX2F0dHI7XG5mdW5jdGlvbiBwdWdfYXR0cihrZXksIHZhbCwgZXNjYXBlZCwgdGVyc2UpIHtcbiAgaWYgKHZhbCA9PT0gZmFsc2UgfHwgdmFsID09IG51bGwgfHwgIXZhbCAmJiAoa2V5ID09PSAnY2xhc3MnIHx8IGtleSA9PT0gJ3N0eWxlJykpIHtcbiAgICByZXR1cm4gJyc7XG4gIH1cbiAgaWYgKHZhbCA9PT0gdHJ1ZSkge1xuICAgIHJldHVybiAnICcgKyAodGVyc2UgPyBrZXkgOiBrZXkgKyAnPVwiJyArIGtleSArICdcIicpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsLnRvSlNPTiA9PT0gJ2Z1bmN0aW9uJykge1xuICAgIHZhbCA9IHZhbC50b0pTT04oKTtcbiAgfVxuICBpZiAodHlwZW9mIHZhbCAhPT0gJ3N0cmluZycpIHtcbiAgICB2YWwgPSBKU09OLnN0cmluZ2lmeSh2YWwpO1xuICAgIGlmICghZXNjYXBlZCAmJiB2YWwuaW5kZXhPZignXCInKSAhPT0gLTEpIHtcbiAgICAgIHJldHVybiAnICcgKyBrZXkgKyAnPVxcJycgKyB2YWwucmVwbGFjZSgvJy9nLCAnJiMzOTsnKSArICdcXCcnO1xuICAgIH1cbiAgfVxuICBpZiAoZXNjYXBlZCkgdmFsID0gcHVnX2VzY2FwZSh2YWwpO1xuICByZXR1cm4gJyAnICsga2V5ICsgJz1cIicgKyB2YWwgKyAnXCInO1xufTtcblxuLyoqXG4gKiBSZW5kZXIgdGhlIGdpdmVuIGF0dHJpYnV0ZXMgb2JqZWN0LlxuICpcbiAqIEBwYXJhbSB7T2JqZWN0fSBvYmpcbiAqIEBwYXJhbSB7T2JqZWN0fSB0ZXJzZSB3aGV0aGVyIHRvIHVzZSBIVE1MNSB0ZXJzZSBib29sZWFuIGF0dHJpYnV0ZXNcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqL1xuZXhwb3J0cy5hdHRycyA9IHB1Z19hdHRycztcbmZ1bmN0aW9uIHB1Z19hdHRycyhvYmosIHRlcnNlKXtcbiAgdmFyIGF0dHJzID0gJyc7XG5cbiAgZm9yICh2YXIga2V5IGluIG9iaikge1xuICAgIGlmIChwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKG9iaiwga2V5KSkge1xuICAgICAgdmFyIHZhbCA9IG9ialtrZXldO1xuXG4gICAgICBpZiAoJ2NsYXNzJyA9PT0ga2V5KSB7XG4gICAgICAgIHZhbCA9IHB1Z19jbGFzc2VzKHZhbCk7XG4gICAgICAgIGF0dHJzID0gcHVnX2F0dHIoa2V5LCB2YWwsIGZhbHNlLCB0ZXJzZSkgKyBhdHRycztcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG4gICAgICBpZiAoJ3N0eWxlJyA9PT0ga2V5KSB7XG4gICAgICAgIHZhbCA9IHB1Z19zdHlsZSh2YWwpO1xuICAgICAgfVxuICAgICAgYXR0cnMgKz0gcHVnX2F0dHIoa2V5LCB2YWwsIGZhbHNlLCB0ZXJzZSk7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGF0dHJzO1xufTtcblxuLyoqXG4gKiBFc2NhcGUgdGhlIGdpdmVuIHN0cmluZyBvZiBgaHRtbGAuXG4gKlxuICogQHBhcmFtIHtTdHJpbmd9IGh0bWxcbiAqIEByZXR1cm4ge1N0cmluZ31cbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbnZhciBwdWdfbWF0Y2hfaHRtbCA9IC9bXCImPD5dLztcbmV4cG9ydHMuZXNjYXBlID0gcHVnX2VzY2FwZTtcbmZ1bmN0aW9uIHB1Z19lc2NhcGUoX2h0bWwpe1xuICB2YXIgaHRtbCA9ICcnICsgX2h0bWw7XG4gIHZhciByZWdleFJlc3VsdCA9IHB1Z19tYXRjaF9odG1sLmV4ZWMoaHRtbCk7XG4gIGlmICghcmVnZXhSZXN1bHQpIHJldHVybiBfaHRtbDtcblxuICB2YXIgcmVzdWx0ID0gJyc7XG4gIHZhciBpLCBsYXN0SW5kZXgsIGVzY2FwZTtcbiAgZm9yIChpID0gcmVnZXhSZXN1bHQuaW5kZXgsIGxhc3RJbmRleCA9IDA7IGkgPCBodG1sLmxlbmd0aDsgaSsrKSB7XG4gICAgc3dpdGNoIChodG1sLmNoYXJDb2RlQXQoaSkpIHtcbiAgICAgIGNhc2UgMzQ6IGVzY2FwZSA9ICcmcXVvdDsnOyBicmVhaztcbiAgICAgIGNhc2UgMzg6IGVzY2FwZSA9ICcmYW1wOyc7IGJyZWFrO1xuICAgICAgY2FzZSA2MDogZXNjYXBlID0gJyZsdDsnOyBicmVhaztcbiAgICAgIGNhc2UgNjI6IGVzY2FwZSA9ICcmZ3Q7JzsgYnJlYWs7XG4gICAgICBkZWZhdWx0OiBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGxhc3RJbmRleCAhPT0gaSkgcmVzdWx0ICs9IGh0bWwuc3Vic3RyaW5nKGxhc3RJbmRleCwgaSk7XG4gICAgbGFzdEluZGV4ID0gaSArIDE7XG4gICAgcmVzdWx0ICs9IGVzY2FwZTtcbiAgfVxuICBpZiAobGFzdEluZGV4ICE9PSBpKSByZXR1cm4gcmVzdWx0ICsgaHRtbC5zdWJzdHJpbmcobGFzdEluZGV4LCBpKTtcbiAgZWxzZSByZXR1cm4gcmVzdWx0O1xufTtcblxuLyoqXG4gKiBSZS10aHJvdyB0aGUgZ2l2ZW4gYGVycmAgaW4gY29udGV4dCB0byB0aGVcbiAqIHRoZSBwdWcgaW4gYGZpbGVuYW1lYCBhdCB0aGUgZ2l2ZW4gYGxpbmVub2AuXG4gKlxuICogQHBhcmFtIHtFcnJvcn0gZXJyXG4gKiBAcGFyYW0ge1N0cmluZ30gZmlsZW5hbWVcbiAqIEBwYXJhbSB7U3RyaW5nfSBsaW5lbm9cbiAqIEBwYXJhbSB7U3RyaW5nfSBzdHIgb3JpZ2luYWwgc291cmNlXG4gKiBAYXBpIHByaXZhdGVcbiAqL1xuXG5leHBvcnRzLnJldGhyb3cgPSBwdWdfcmV0aHJvdztcbmZ1bmN0aW9uIHB1Z19yZXRocm93KGVyciwgZmlsZW5hbWUsIGxpbmVubywgc3RyKXtcbiAgaWYgKCEoZXJyIGluc3RhbmNlb2YgRXJyb3IpKSB0aHJvdyBlcnI7XG4gIGlmICgodHlwZW9mIHdpbmRvdyAhPSAndW5kZWZpbmVkJyB8fCAhZmlsZW5hbWUpICYmICFzdHIpIHtcbiAgICBlcnIubWVzc2FnZSArPSAnIG9uIGxpbmUgJyArIGxpbmVubztcbiAgICB0aHJvdyBlcnI7XG4gIH1cbiAgdHJ5IHtcbiAgICBzdHIgPSBzdHIgfHwgcmVxdWlyZSgnZnMnKS5yZWFkRmlsZVN5bmMoZmlsZW5hbWUsICd1dGY4JylcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICBwdWdfcmV0aHJvdyhlcnIsIG51bGwsIGxpbmVubylcbiAgfVxuICB2YXIgY29udGV4dCA9IDNcbiAgICAsIGxpbmVzID0gc3RyLnNwbGl0KCdcXG4nKVxuICAgICwgc3RhcnQgPSBNYXRoLm1heChsaW5lbm8gLSBjb250ZXh0LCAwKVxuICAgICwgZW5kID0gTWF0aC5taW4obGluZXMubGVuZ3RoLCBsaW5lbm8gKyBjb250ZXh0KTtcblxuICAvLyBFcnJvciBjb250ZXh0XG4gIHZhciBjb250ZXh0ID0gbGluZXMuc2xpY2Uoc3RhcnQsIGVuZCkubWFwKGZ1bmN0aW9uKGxpbmUsIGkpe1xuICAgIHZhciBjdXJyID0gaSArIHN0YXJ0ICsgMTtcbiAgICByZXR1cm4gKGN1cnIgPT0gbGluZW5vID8gJyAgPiAnIDogJyAgICAnKVxuICAgICAgKyBjdXJyXG4gICAgICArICd8ICdcbiAgICAgICsgbGluZTtcbiAgfSkuam9pbignXFxuJyk7XG5cbiAgLy8gQWx0ZXIgZXhjZXB0aW9uIG1lc3NhZ2VcbiAgZXJyLnBhdGggPSBmaWxlbmFtZTtcbiAgZXJyLm1lc3NhZ2UgPSAoZmlsZW5hbWUgfHwgJ1B1ZycpICsgJzonICsgbGluZW5vXG4gICAgKyAnXFxuJyArIGNvbnRleHQgKyAnXFxuXFxuJyArIGVyci5tZXNzYWdlO1xuICB0aHJvdyBlcnI7XG59O1xuIiwidmFyICQgPSB3aW5kb3cuJDtcblxudmFyIHNpbWlsYXJHYW1lc1RlbXBsYXRlID0gcmVxdWlyZSgnLi4vdmlld3MvX3BhcnRpYWxzL3NpbWlsYXItZ2FtZXMucHVnJyk7XG5cbnZhciBtYXBOYW1lID0gJChcIiNtYXAtbmFtZVwiKS50ZXh0KCk7XG52YXIgZ2FtZVR5cGUgPSAkKFwiI2dhbWUtdHlwZVwiKS50ZXh0KCk7XG5cbndpbmRvdy50cnlMb2FkQmFja2dyb3VuZChtYXBOYW1lKTtcblxuZnVuY3Rpb24gbG9hZFNpbWlsYXJHYW1lcygpIHtcbiAgICBpZiAoZ2FtZVR5cGUgPT09IFwiZHVlbFwiIHx8IGdhbWVUeXBlID09PSBcImNsYW53YXJcIikge1xuICAgICAgICB2YXIgbWV0YSA9IEpTT04ucGFyc2UoJChcIiNnYW1lLW1ldGFcIikudGV4dCgpKTtcbiAgICAgICAgdmFyIHF1ZXJ5ID0gXCIvZ2FtZXMvZmluZD9nYW1ldHlwZT1cIitnYW1lVHlwZStcIiZsaW1pdD0xMCZwbGF5ZXJzPVwiK21ldGFbMF0rXCIgXCIrbWV0YVsyXTtcbiAgICAgICAgJC5nZXQoXCIvYXBpXCIrcXVlcnksIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgJChcIiNzaW1pbGFyLWdhbWVzXCIpLmh0bWwoc2ltaWxhckdhbWVzVGVtcGxhdGUoeyBzaW1pbGFyR2FtZXM6IHJlc3VsdC5yZXN1bHRzLCB2aWV3QWxsTGluazogcXVlcnkgfSkpO1xuICAgICAgICAgICAgJChcIiNzaW1pbGFyLWdhbWVzLXBhcmVudFwiKS5jc3MoXCJkaXNwbGF5XCIsIFwiYmxvY2tcIik7XG4gICAgICAgICAgICBkaXNhYmxlRGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59XG5sb2FkU2ltaWxhckdhbWVzKCk7XG4iLCJ2YXIgcHVnID0gcmVxdWlyZShcInB1Zy1ydW50aW1lXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlO2Z1bmN0aW9uIHB1Z19hdHRyKHQsZSxuLGYpe3JldHVybiBlIT09ITEmJm51bGwhPWUmJihlfHxcImNsYXNzXCIhPT10JiZcInN0eWxlXCIhPT10KT9lPT09ITA/XCIgXCIrKGY/dDp0Kyc9XCInK3QrJ1wiJyk6KFwiZnVuY3Rpb25cIj09dHlwZW9mIGUudG9KU09OJiYoZT1lLnRvSlNPTigpKSxcInN0cmluZ1wiPT10eXBlb2YgZXx8KGU9SlNPTi5zdHJpbmdpZnkoZSksbnx8ZS5pbmRleE9mKCdcIicpPT09LTEpPyhuJiYoZT1wdWdfZXNjYXBlKGUpKSxcIiBcIit0Kyc9XCInK2UrJ1wiJyk6XCIgXCIrdCtcIj0nXCIrZS5yZXBsYWNlKC8nL2csXCImIzM5O1wiKStcIidcIik6XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzKHMscil7cmV0dXJuIEFycmF5LmlzQXJyYXkocyk/cHVnX2NsYXNzZXNfYXJyYXkocyxyKTpzJiZcIm9iamVjdFwiPT10eXBlb2Ygcz9wdWdfY2xhc3Nlc19vYmplY3Qocyk6c3x8XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX2FycmF5KHIsYSl7Zm9yKHZhciBzLGU9XCJcIix1PVwiXCIsYz1BcnJheS5pc0FycmF5KGEpLGc9MDtnPHIubGVuZ3RoO2crKylzPXB1Z19jbGFzc2VzKHJbZ10pLHMmJihjJiZhW2ddJiYocz1wdWdfZXNjYXBlKHMpKSxlPWUrdStzLHU9XCIgXCIpO3JldHVybiBlfVxuZnVuY3Rpb24gcHVnX2NsYXNzZXNfb2JqZWN0KHIpe3ZhciBhPVwiXCIsbj1cIlwiO2Zvcih2YXIgbyBpbiByKW8mJnJbb10mJnB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwocixvKSYmKGE9YStuK28sbj1cIiBcIik7cmV0dXJuIGF9XG5mdW5jdGlvbiBwdWdfZXNjYXBlKGUpe3ZhciBhPVwiXCIrZSx0PXB1Z19tYXRjaF9odG1sLmV4ZWMoYSk7aWYoIXQpcmV0dXJuIGU7dmFyIHIsYyxuLHM9XCJcIjtmb3Iocj10LmluZGV4LGM9MDtyPGEubGVuZ3RoO3IrKyl7c3dpdGNoKGEuY2hhckNvZGVBdChyKSl7Y2FzZSAzNDpuPVwiJnF1b3Q7XCI7YnJlYWs7Y2FzZSAzODpuPVwiJmFtcDtcIjticmVhaztjYXNlIDYwOm49XCImbHQ7XCI7YnJlYWs7Y2FzZSA2MjpuPVwiJmd0O1wiO2JyZWFrO2RlZmF1bHQ6Y29udGludWV9YyE9PXImJihzKz1hLnN1YnN0cmluZyhjLHIpKSxjPXIrMSxzKz1ufXJldHVybiBjIT09cj9zK2Euc3Vic3RyaW5nKGMscik6c31cbnZhciBwdWdfaGFzX293bl9wcm9wZXJ0eT1PYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHB1Z19tYXRjaF9odG1sPS9bXCImPD5dLztmdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHt2YXIgcHVnX2h0bWwgPSBcIlwiLCBwdWdfbWl4aW5zID0ge30sIHB1Z19pbnRlcnA7O3ZhciBsb2NhbHNfZm9yX3dpdGggPSAobG9jYWxzIHx8IHt9KTsoZnVuY3Rpb24gKHNpbWlsYXJHYW1lcywgdmlld0FsbExpbmspIHtwdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdGFibGUgY2xhc3M9XFxcInNjcm9sbFxcXCIgaWQ9XFxcInNlYXJjaC1yZXN1bHRzXFxcIiB3aWR0aD1cXFwiNTAlXFxcIlxcdTAwM0VcXHUwMDNDdGhlYWRcXHUwMDNFXFx1MDAzQ3RyXFx1MDAzRVxcdTAwM0N0ZCB3aWR0aD1cXFwiNDAlXFxcIlxcdTAwM0VNb2RlIFxcdTAwMkYgTWFwXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgY2xhc3M9XFxcInRleHQtY2VudGVyXFxcIiB3aWR0aD1cXFwiNjAlXFxcIlxcdTAwM0VSZXN1bHRcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0aGVhZFxcdTAwM0VcXHUwMDNDdGJvZHlcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHNpbWlsYXJHYW1lc1xuOyhmdW5jdGlvbigpe1xuICB2YXIgJCRvYmogPSBzaW1pbGFyR2FtZXM7XG4gIGlmICgnbnVtYmVyJyA9PSB0eXBlb2YgJCRvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBwdWdfaW5kZXgwID0gMCwgJCRsID0gJCRvYmoubGVuZ3RoOyBwdWdfaW5kZXgwIDwgJCRsOyBwdWdfaW5kZXgwKyspIHtcbiAgICAgICAgdmFyIGdhbWUgPSAkJG9ialtwdWdfaW5kZXgwXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0N0clwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIFwiaWYgKHdpbmRvdy5oaXN0b3J5KSB7IGhpc3RvcnkucHVzaFN0YXRlKHt9LCB3aW5kb3cubG9jYXRpb24uaHJlZik7IH0gd2luZG93LmxvY2F0aW9uLnJlcGxhY2UoJy9nYW1lL1wiK2dhbWUuaWQrXCInKVwiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcImRpc2FibGUtZGVmYXVsdFxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvZ2FtZS9cIitnYW1lLmlkLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5nYW1lbW9kZSArIFwiIFwiICsgZ2FtZS5tYXApID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXFx1MDAzRVxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcImRpc2FibGUtZGVmYXVsdFxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvZ2FtZS9cIitnYW1lLmlkLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93XFxcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC02IGNvbHVtbnNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiByaWdodDsgcGFkZGluZy1yaWdodDogMTBcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubWV0YVsyXStcIiBcIikgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoW1wibGFiZWxcIiwoZ2FtZS5kcmF3PyBcIndhcm5pbmdcIjogXCJzdWNjZXNzXCIpXSwgW2ZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKStcIiBzdHlsZT1cXFwiY3Vyc29yOiBwb2ludGVyXFxcIlwiKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubWV0YVszXSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNiBjb2x1bW5zXFxcIiBzdHlsZT1cXFwidGV4dC1hbGlnbjogbGVmdDsgcGFkZGluZy1yaWdodDogMTBcXFwiXFx1MDAzRVxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChnYW1lLmRyYXc/IFwid2FybmluZ1wiOiBcImFsZXJ0XCIpXSwgW2ZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKStcIiBzdHlsZT1cXFwiY3Vyc29yOiBwb2ludGVyXFxcIlwiKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGdhbWUubWV0YVsxXSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gXCIgXCIrZ2FtZS5tZXRhWzBdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MCBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgZ2FtZSA9ICQkb2JqW3B1Z19pbmRleDBdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3RyXCIgKyAoXCIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgXCJpZiAod2luZG93Lmhpc3RvcnkpIHsgaGlzdG9yeS5wdXNoU3RhdGUoe30sIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTsgfSB3aW5kb3cubG9jYXRpb24ucmVwbGFjZSgnL2dhbWUvXCIrZ2FtZS5pZCtcIicpXCIsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwiZGlzYWJsZS1kZWZhdWx0XFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCBcIi9nYW1lL1wiK2dhbWUuaWQsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBnYW1lLmdhbWVtb2RlICsgXCIgXCIgKyBnYW1lLm1hcCkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcXHUwMDNFXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwiZGlzYWJsZS1kZWZhdWx0XFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCBcIi9nYW1lL1wiK2dhbWUuaWQsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTYgY29sdW1uc1xcXCIgc3R5bGU9XFxcInRleHQtYWxpZ246IHJpZ2h0OyBwYWRkaW5nLXJpZ2h0OiAxMFxcXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzJdK1wiIFwiKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChnYW1lLmRyYXc/IFwid2FybmluZ1wiOiBcInN1Y2Nlc3NcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK1wiIHN0eWxlPVxcXCJjdXJzb3I6IHBvaW50ZXJcXFwiXCIpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzNdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC02IGNvbHVtbnNcXFwiIHN0eWxlPVxcXCJ0ZXh0LWFsaWduOiBsZWZ0OyBwYWRkaW5nLXJpZ2h0OiAxMFxcXCJcXHUwMDNFXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcImxhYmVsXCIsKGdhbWUuZHJhdz8gXCJ3YXJuaW5nXCI6IFwiYWxlcnRcIildLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK1wiIHN0eWxlPVxcXCJjdXJzb3I6IHBvaW50ZXJcXFwiXCIpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gZ2FtZS5tZXRhWzFdKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBcIiBcIitnYW1lLm1ldGFbMF0pID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0clxcdTAwM0VcIjtcbiAgICB9XG4gIH1cbn0pLmNhbGwodGhpcyk7XG5cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0N0clxcdTAwM0VcXHUwMDNDdGQgY29sc3Bhbj1cXFwiMlxcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImhyZWZcIiwgdmlld0FsbExpbmssIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VWaWV3IGFsbC4uLlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0Ym9keVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRhYmxlXFx1MDAzRVwiO30uY2FsbCh0aGlzLFwic2ltaWxhckdhbWVzXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5zaW1pbGFyR2FtZXM6dHlwZW9mIHNpbWlsYXJHYW1lcyE9PVwidW5kZWZpbmVkXCI/c2ltaWxhckdhbWVzOnVuZGVmaW5lZCxcInZpZXdBbGxMaW5rXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC52aWV3QWxsTGluazp0eXBlb2Ygdmlld0FsbExpbmshPT1cInVuZGVmaW5lZFwiP3ZpZXdBbGxMaW5rOnVuZGVmaW5lZCkpOztyZXR1cm4gcHVnX2h0bWw7fTsiXX0=
