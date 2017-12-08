(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function() {
  var pluckCandidates, scorer, sortCandidates;

  scorer = require('./scorer');

  pluckCandidates = function(a) {
    return a.candidate;
  };

  sortCandidates = function(a, b) {
    return b.score - a.score;
  };

  module.exports = function(candidates, query, queryHasSlashes, _arg) {
    var candidate, key, maxResults, score, scoredCandidates, string, _i, _len, _ref;
    _ref = _arg != null ? _arg : {}, key = _ref.key, maxResults = _ref.maxResults;
    if (query) {
      scoredCandidates = [];
      for (_i = 0, _len = candidates.length; _i < _len; _i++) {
        candidate = candidates[_i];
        string = key != null ? candidate[key] : candidate;
        if (!string) {
          continue;
        }
        score = scorer.score(string, query, queryHasSlashes);
        if (!queryHasSlashes) {
          score = scorer.basenameScore(string, query, score);
        }
        if (score > 0) {
          scoredCandidates.push({
            candidate: candidate,
            score: score
          });
        }
      }
      scoredCandidates.sort(sortCandidates);
      candidates = scoredCandidates.map(pluckCandidates);
    }
    if (maxResults != null) {
      candidates = candidates.slice(0, maxResults);
    }
    return candidates;
  };

}).call(this);

},{"./scorer":5}],3:[function(require,module,exports){
(function() {
  var PathSeparator, SpaceRegex, filter, matcher, scorer;

  scorer = require('./scorer');

  filter = require('./filter');

  matcher = require('./matcher');

  PathSeparator = require('path').sep;

  SpaceRegex = /\ /g;

  module.exports = {
    filter: function(candidates, query, options) {
      var queryHasSlashes;
      if (query) {
        queryHasSlashes = query.indexOf(PathSeparator) !== -1;
        query = query.replace(SpaceRegex, '');
      }
      return filter(candidates, query, queryHasSlashes, options);
    },
    score: function(string, query) {
      var queryHasSlashes, score;
      if (!string) {
        return 0;
      }
      if (!query) {
        return 0;
      }
      if (string === query) {
        return 2;
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      score = scorer.score(string, query);
      if (!queryHasSlashes) {
        score = scorer.basenameScore(string, query, score);
      }
      return score;
    },
    match: function(string, query) {
      var baseMatches, index, matches, queryHasSlashes, seen, _i, _ref, _results;
      if (!string) {
        return [];
      }
      if (!query) {
        return [];
      }
      if (string === query) {
        return (function() {
          _results = [];
          for (var _i = 0, _ref = string.length; 0 <= _ref ? _i < _ref : _i > _ref; 0 <= _ref ? _i++ : _i--){ _results.push(_i); }
          return _results;
        }).apply(this);
      }
      queryHasSlashes = query.indexOf(PathSeparator) !== -1;
      query = query.replace(SpaceRegex, '');
      matches = matcher.match(string, query);
      if (!queryHasSlashes) {
        baseMatches = matcher.basenameMatch(string, query);
        matches = matches.concat(baseMatches).sort(function(a, b) {
          return a - b;
        });
        seen = null;
        index = 0;
        while (index < matches.length) {
          if (index && seen === matches[index]) {
            matches.splice(index, 1);
          } else {
            seen = matches[index];
            index++;
          }
        }
      }
      return matches;
    }
  };

}).call(this);

},{"./filter":2,"./matcher":4,"./scorer":5,"path":6}],4:[function(require,module,exports){
(function() {
  var PathSeparator;

  PathSeparator = require('path').sep;

  exports.basenameMatch = function(string, query) {
    var base, index, lastCharacter, slashCount;
    index = string.length - 1;
    while (string[index] === PathSeparator) {
      index--;
    }
    slashCount = 0;
    lastCharacter = index;
    base = null;
    while (index >= 0) {
      if (string[index] === PathSeparator) {
        slashCount++;
        if (base == null) {
          base = string.substring(index + 1, lastCharacter + 1);
        }
      } else if (index === 0) {
        if (lastCharacter < string.length - 1) {
          if (base == null) {
            base = string.substring(0, lastCharacter + 1);
          }
        } else {
          if (base == null) {
            base = string;
          }
        }
      }
      index--;
    }
    return exports.match(base, query, string.length - base.length);
  };

  exports.match = function(string, query, stringOffset) {
    var character, indexInQuery, indexInString, lowerCaseIndex, matches, minIndex, queryLength, stringLength, upperCaseIndex, _i, _ref, _results;
    if (stringOffset == null) {
      stringOffset = 0;
    }
    if (string === query) {
      return (function() {
        _results = [];
        for (var _i = stringOffset, _ref = stringOffset + string.length; stringOffset <= _ref ? _i < _ref : _i > _ref; stringOffset <= _ref ? _i++ : _i--){ _results.push(_i); }
        return _results;
      }).apply(this);
    }
    queryLength = query.length;
    stringLength = string.length;
    indexInQuery = 0;
    indexInString = 0;
    matches = [];
    while (indexInQuery < queryLength) {
      character = query[indexInQuery++];
      lowerCaseIndex = string.indexOf(character.toLowerCase());
      upperCaseIndex = string.indexOf(character.toUpperCase());
      minIndex = Math.min(lowerCaseIndex, upperCaseIndex);
      if (minIndex === -1) {
        minIndex = Math.max(lowerCaseIndex, upperCaseIndex);
      }
      indexInString = minIndex;
      if (indexInString === -1) {
        return [];
      }
      matches.push(stringOffset + indexInString);
      stringOffset += indexInString + 1;
      string = string.substring(indexInString + 1, stringLength);
    }
    return matches;
  };

}).call(this);

},{"path":6}],5:[function(require,module,exports){
(function() {
  var PathSeparator, queryIsLastPathSegment;

  PathSeparator = require('path').sep;

  exports.basenameScore = function(string, query, score) {
    var base, depth, index, lastCharacter, segmentCount, slashCount;
    index = string.length - 1;
    while (string[index] === PathSeparator) {
      index--;
    }
    slashCount = 0;
    lastCharacter = index;
    base = null;
    while (index >= 0) {
      if (string[index] === PathSeparator) {
        slashCount++;
        if (base == null) {
          base = string.substring(index + 1, lastCharacter + 1);
        }
      } else if (index === 0) {
        if (lastCharacter < string.length - 1) {
          if (base == null) {
            base = string.substring(0, lastCharacter + 1);
          }
        } else {
          if (base == null) {
            base = string;
          }
        }
      }
      index--;
    }
    if (base === string) {
      score *= 2;
    } else if (base) {
      score += exports.score(base, query);
    }
    segmentCount = slashCount + 1;
    depth = Math.max(1, 10 - segmentCount);
    score *= depth * 0.01;
    return score;
  };

  exports.score = function(string, query) {
    var character, characterScore, indexInQuery, indexInString, lowerCaseIndex, minIndex, queryLength, queryScore, stringLength, totalCharacterScore, upperCaseIndex, _ref;
    if (string === query) {
      return 1;
    }
    if (queryIsLastPathSegment(string, query)) {
      return 1;
    }
    totalCharacterScore = 0;
    queryLength = query.length;
    stringLength = string.length;
    indexInQuery = 0;
    indexInString = 0;
    while (indexInQuery < queryLength) {
      character = query[indexInQuery++];
      lowerCaseIndex = string.indexOf(character.toLowerCase());
      upperCaseIndex = string.indexOf(character.toUpperCase());
      minIndex = Math.min(lowerCaseIndex, upperCaseIndex);
      if (minIndex === -1) {
        minIndex = Math.max(lowerCaseIndex, upperCaseIndex);
      }
      indexInString = minIndex;
      if (indexInString === -1) {
        return 0;
      }
      characterScore = 0.1;
      if (string[indexInString] === character) {
        characterScore += 0.1;
      }
      if (indexInString === 0 || string[indexInString - 1] === PathSeparator) {
        characterScore += 0.8;
      } else if ((_ref = string[indexInString - 1]) === '-' || _ref === '_' || _ref === ' ') {
        characterScore += 0.7;
      }
      string = string.substring(indexInString + 1, stringLength);
      totalCharacterScore += characterScore;
    }
    queryScore = totalCharacterScore / queryLength;
    return ((queryScore * (queryLength / stringLength)) + queryScore) / 2;
  };

  queryIsLastPathSegment = function(string, query) {
    if (string[string.length - query.length - 1] === PathSeparator) {
      return string.lastIndexOf(query) === string.length - query.length;
    }
  };

}).call(this);

},{"path":6}],6:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))

},{"_process":7}],7:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],8:[function(require,module,exports){
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

},{"fs":1}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
'use strict';

var _fuzzaldrin = require('fuzzaldrin');

var $ = window.$;
var _ = window._;
var foundation = window.Foundation;


var vars = require("../../vars.json");

var serverListTemplate = require('../views/_partials/server-list.pug');
var clansOnlineTemplate = require('../views/_partials/clans-online.pug');
var gameTemplate = require('../views/_partials/game-mini.pug');

var servers = [];
var hideEmpty = $("#hide-empty").is(":checked");
var pauseUpdate = $("#pause-update").is(":checked");
var lookingForPlayer = $("#find-player").val();
var lookingForServer = $("#find-server").val();
var sortedBy = "clients";
var sortOrder = "desc";
var openServerHost = "";
var openServerPort = 0;
var openGame = null;
var allPlayers = [];

try {
	servers = JSON.parse($("#servers-json").text()) || [];
	_.each(servers, function (server) {
		server.fullText = (_.values(_.pick(server, ["gameMode", "mapName", "masterMode", "country", "countryName", "host"])).join(" ") + ":" + server.port).toLowerCase();
	});
} catch (e) {
	servers = [];
}

window.showConnect = function (host, port) {
	$("#connect-command").val("/connect " + host + " " + port);
	$("#connect-info").foundation("open");
	$("#connect-command").focus();
};

window.hideEmptyChanged = function () {
	hideEmpty = $("#hide-empty").is(":checked");
	renderServers();
};

window.pauseUpdateChanged = function () {
	pauseUpdate = $("#pause-update").is(":checked");
};

var playerSuggestions = function playerSuggestions(q, cb) {
	cb((0, _fuzzaldrin.filter)(allPlayers, q));
};

window.findPlayer = _.debounce(function (name) {
	if (name) $("#find-player").typeahead('val', name);
	lookingForPlayer = $("#find-player").val();
	renderServers();
	renderGame();
}, 150);

window.findServer = _.debounce(function () {
	lookingForServer = $("#find-server").val();
	renderServers();
}, 150);

window.sortBy = function (prop) {
	if (prop == sortedBy && sortOrder == "asc") sortOrder = "desc";else {
		sortedBy = prop;
		sortOrder = "asc";
	}
	renderServers();
};

function getClan(name) {
	var clan = _.find(vars.clans, function (clan) {
		return name.indexOf(clan.tag) >= 0;
	});
	return clan && clan.tag;
}

function renderServers() {
	$("#total-servers").text(servers.length);

	var lookFor = lookingForPlayer.toLowerCase();
	_.each(servers, function (server) {
		if (lookFor && _.find(server.players, function (pl) {
			return pl.toLowerCase().indexOf(lookFor) >= 0;
		})) server.highlight = true;else server.highlight = false;
	});

	allPlayers = [];
	_.each(servers, function (sv) {
		allPlayers.push.apply(allPlayers, sv.players);
	});
	allPlayers = _.uniq(allPlayers);

	$("#total-players").text(allPlayers.length);

	var clans = _.map(_.groupBy(allPlayers, getClan), function (group, key) {
		return { name: key, count: group.length, players: group };
	});
	clans = _.reject(_.orderBy(clans, "count", "desc"), { "name": "undefined" });

	var servs = servers;
	if (lookingForServer) {
		(function () {
			var lookingForLower = lookingForServer.toLowerCase();
			servs = _.union((0, _fuzzaldrin.filter)(servers, lookingForServer, { key: "description" }), _.filter(servers, function (serv) {
				return serv.fullText.indexOf(lookingForLower) >= 0;
			}));
		})();
	}
	servs = _.orderBy(servs, sortedBy, sortOrder);

	$("#server-list").html(serverListTemplate({
		servers: servs,
		hideEmpty: hideEmpty && !lookingForServer,
		sortedBy: sortedBy,
		sortOrder: sortOrder,
		lookingForPlayer: lookingForPlayer,
		vars: vars
	}));

	$("#clans-online").html(clansOnlineTemplate({
		clansOnline: clans
	}));

	window.disableDefault();
}
renderServers();

function tryLoadBackground(name) {
	var bg = new Image();
	bg.onload = function () {
		$("#server-info").css("background", "linear-gradient( rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5) ), url(/images/mapshots/" + name + ".jpg) no-repeat center center fixed");
		$("#server-info").css("background-size", "cover");
	};
	bg.src = "/images/mapshots/" + name + ".jpg";
}

function renderGame() {
	if (!openServerHost) return;
	var lookFor = lookingForPlayer.toLowerCase();
	_.each(openGame.players, function (player) {
		if (lookFor && player.name.toLowerCase().indexOf(lookFor) >= 0) player.highlight = true;else player.highlight = false;
	});
	$("#server-info-content").html(gameTemplate({ server: openGame, vars: vars, _: _ }));
	tryLoadBackground(openGame.mapName);
}

function loadServer(host, port) {
	$.get("/api/server/" + host + "/" + port, function (result) {
		if (!openServerHost || openServerHost != host || openServerPort != port) return;
		openGame = result;
		renderGame();
	});
}

window.showServer = function (host, port) {
	$("#server-info-content").html('<div style="text-align: center; margin-top: 4em;"><i class="fa fa-spinner fa-pulse fa-4x"></i></div>');
	$("#server-info").css("background", "rgba(27, 27, 27, 0.89)");
	loadServer(host, port);
	$("#server-info").css("display", "block");
	$("#server-info").animate({ height: "300px", scrollTop: 0 }, 350, "linear");
	openServerHost = host;
	openServerPort = port;
	return false;
};

window.hideServer = function () {
	$("#server-info").animate({ height: "0px" }, 350, "linear", function () {
		$("#server-info").css("display", "none");
	});
	openServerHost = "";
};

window.expandServer = function () {
	if (!openServerHost) return;
	window.location.href = "/server/" + openServerHost + "/" + openServerPort;
};

function updateAll() {
	if (openServerHost) loadServer(openServerHost, openServerPort);
	if (pauseUpdate) return;
	$.get("/api/servers", function (result) {
		servers = result;
		_.each(servers, function (server) {
			server.fullText = (_.values(_.pick(server, ["gameMode", "mapName", "masterMode", "country", "countryName", "host"])).join(" ") + ":" + server.port).toLowerCase();
		});
		renderServers();
	});
}
setInterval(updateAll, 5000);

$('.typeahead').typeahead({}, {
	name: 'players',
	source: playerSuggestions
});

window.onunload = function () {
	$("#server-info").css("display", "none");
	openServerHost = "";
};

$('.banner .x-button').click(function (e) {
	$('.banner').css('display', 'none');
	e.stopPropagation();
	sessionStorage.setItem('hideBanner', 'true');
});

if (sessionStorage.getItem('hideBanner') == 'true') $('.banner').css('display', 'none');

},{"../../vars.json":9,"../views/_partials/clans-online.pug":11,"../views/_partials/game-mini.pug":12,"../views/_partials/server-list.pug":13,"fuzzaldrin":3}],11:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_match_html=/["&<>]/;function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (clansOnline) {if (clansOnline && clansOnline.length) {
pug_html = pug_html + "\u003Clabel class=\"big\"\u003EClans online: ";
// iterate clansOnline
;(function(){
  var $$obj = clansOnline;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var clan = $$obj[pug_index0];
pug_html = pug_html + "\u003Ca" + (pug_attr("title", (clan.players.join(" \n")), true, false)+pug_attr("onclick", ("findPlayer('"+clan.name.replace(/\'/g, "\\'")+"')"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = clan.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E \u003Cspan class=\"label secondary\" style=\"margin-top: -5px\"\u003E " + (pug_escape(null == (pug_interp = clan.count) ? "" : pug_interp)) + " \u003C\u002Fspan\u003E ";
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var clan = $$obj[pug_index0];
pug_html = pug_html + "\u003Ca" + (pug_attr("title", (clan.players.join(" \n")), true, false)+pug_attr("onclick", ("findPlayer('"+clan.name.replace(/\'/g, "\\'")+"')"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = clan.name) ? "" : pug_interp)) + "\u003C\u002Fa\u003E \u003Cspan class=\"label secondary\" style=\"margin-top: -5px\"\u003E " + (pug_escape(null == (pug_interp = clan.count) ? "" : pug_interp)) + " \u003C\u002Fspan\u003E ";
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Flabel\u003E";
}}.call(this,"clansOnline" in locals_for_with?locals_for_with.clansOnline:typeof clansOnline!=="undefined"?clansOnline:undefined));;return pug_html;};
},{"pug-runtime":8}],12:[function(require,module,exports){
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
},{"pug-runtime":8}],13:[function(require,module,exports){
var pug = require("pug-runtime");

module.exports = template;function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||"class"!==t&&"style"!==t)?e===!0?" "+(f?t:t+'="'+t+'"'):("function"==typeof e.toJSON&&(e=e.toJSON()),"string"==typeof e||(e=JSON.stringify(e),n||e.indexOf('"')===-1)?(n&&(e=pug_escape(e))," "+t+'="'+e+'"'):" "+t+"='"+e.replace(/'/g,"&#39;")+"'"):""}
function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&"object"==typeof s?pug_classes_object(s):s||""}
function pug_classes_array(r,a){for(var s,e="",u="",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=" ");return e}
function pug_classes_object(r){var a="",n="";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=" ");return a}
function pug_escape(e){var a=""+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s="";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n="&quot;";break;case 38:n="&amp;";break;case 60:n="&lt;";break;case 62:n="&gt;";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}
var pug_has_own_property=Object.prototype.hasOwnProperty;
var pug_match_html=/["&<>]/;
function pug_style(r){if(!r)return"";if("object"==typeof r){var e="",t="";for(var n in r)pug_has_own_property.call(r,n)&&(e=e+t+n+":"+r[n],t=";");return e}return r=""+r,";"===r[r.length-1]?r.slice(0,-1):r}function template(locals) {var pug_html = "", pug_mixins = {}, pug_interp;;var locals_for_with = (locals || {});(function (hideEmpty, servers, sortOrder, sortedBy, vars) {pug_mixins["sortable"] = pug_interp = function(name, value){
var block = (this && this.block), attributes = (this && this.attributes) || {};
pug_html = pug_html + "\u003Ca" + (pug_attr("onclick", "sortBy('"+value+"')", true, false)) + "\u003E" + (pug_escape(null == (pug_interp = name) ? "" : pug_interp)) + "  ";
if (sortedBy == value) {
pug_html = pug_html + "\u003Cspan" + (pug_attr("class", pug_classes(["fa",("fa-caret-"+(sortOrder=="asc"? "up": "down"))], [false,true]), false, false)) + "\u003E\u003C\u002Fspan\u003E";
}
pug_html = pug_html + "\u003C\u002Fa\u003E";
};
pug_html = pug_html + "\u003Ctable class=\"scroll\" id=\"table-contents\" width=\"100%\"\u003E\u003Cthead\u003E\u003Ctr\u003E\u003Ctd class=\"nowrap\" width=\"18%\"\u003E";
pug_mixins["sortable"]("Description", "description");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"8%\"\u003E";
pug_mixins["sortable"]("Players", "clients");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"10%\"\u003E";
pug_mixins["sortable"]("Mode", "gameMode");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"11%\"\u003E";
pug_mixins["sortable"]("Map", "mapName");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"9%\"\u003E";
pug_mixins["sortable"]("Time left", "timeLeft");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"10%\"\u003E";
pug_mixins["sortable"]("Master mode", "masterMode");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"11%\"\u003E";
pug_mixins["sortable"]("Country", "country");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003Ctd class=\"nowrap\" width=\"22%\"\u003E";
pug_mixins["sortable"]("Host", "host");
pug_html = pug_html + " :  ";
pug_mixins["sortable"]("Port", "port");
pug_html = pug_html + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E\u003C\u002Fthead\u003E\u003Ctbody\u003E";
// iterate servers
;(function(){
  var $$obj = servers;
  if ('number' == typeof $$obj.length) {
      for (var pug_index0 = 0, $$l = $$obj.length; pug_index0 < $$l; pug_index0++) {
        var server = $$obj[pug_index0];
if ((!hideEmpty || server.clients > 0)) {
pug_html = pug_html + "\u003Ctr" + (pug_attr("class", pug_classes(["unclickable",(server.highlight? "highlighted": undefined)], [false,true]), false, false)) + "\u003E\u003Ctd" + (" class=\"nowrap clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/server/"+server.host+"/"+server.port, true, false)) + "\u003E" + (null == (pug_interp = server.description? server.descriptionStyled: server.host+":"+server.port) ? "" : pug_interp) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("style", pug_style((server.isFull? "color: yellow;": "")), true, false)+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.clients) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = server.maxClients) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.gameMode) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.mapName) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.timeLeftS) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E\u003Cspan" + (pug_attr("style", pug_style(("color: "+vars.materModeColors[server.masterMode])), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.masterMode) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable nowrap\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E";
if (server.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", "/images/flags/"+server.country+".png", true, false)) + "\u002F\u003E";
}
pug_html = pug_html + " " + (pug_escape(null == (pug_interp = server.countryName) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", "showConnect('"+server.host+"', "+server.port+")", true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.host) ? "" : pug_interp)) + ":" + (pug_escape(null == (pug_interp = server.port) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
}
      }
  } else {
    var $$l = 0;
    for (var pug_index0 in $$obj) {
      $$l++;
      var server = $$obj[pug_index0];
if ((!hideEmpty || server.clients > 0)) {
pug_html = pug_html + "\u003Ctr" + (pug_attr("class", pug_classes(["unclickable",(server.highlight? "highlighted": undefined)], [false,true]), false, false)) + "\u003E\u003Ctd" + (" class=\"nowrap clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E\u003Ca" + (" class=\"disable-default\""+pug_attr("href", "/server/"+server.host+"/"+server.port, true, false)) + "\u003E" + (null == (pug_interp = server.description? server.descriptionStyled: server.host+":"+server.port) ? "" : pug_interp) + "\u003C\u002Fa\u003E\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("style", pug_style((server.isFull? "color: yellow;": "")), true, false)+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.clients) ? "" : pug_interp)) + "\u002F" + (pug_escape(null == (pug_interp = server.maxClients) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.gameMode) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"nowrap clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.mapName) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.timeLeftS) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E\u003Cspan" + (pug_attr("style", pug_style(("color: "+vars.materModeColors[server.masterMode])), true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.masterMode) ? "" : pug_interp)) + "\u003C\u002Fspan\u003E\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable nowrap\""+pug_attr("onclick", ("showServer('"+server.host+"', "+server.port+")"), true, false)) + "\u003E";
if (server.country) {
pug_html = pug_html + "\u003Cimg" + (" class=\"flag\""+pug_attr("src", "/images/flags/"+server.country+".png", true, false)) + "\u002F\u003E";
}
pug_html = pug_html + " " + (pug_escape(null == (pug_interp = server.countryName) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003Ctd" + (" class=\"clickable\""+pug_attr("onclick", "showConnect('"+server.host+"', "+server.port+")", true, false)) + "\u003E" + (pug_escape(null == (pug_interp = server.host) ? "" : pug_interp)) + ":" + (pug_escape(null == (pug_interp = server.port) ? "" : pug_interp)) + "\u003C\u002Ftd\u003E\u003C\u002Ftr\u003E";
}
    }
  }
}).call(this);

pug_html = pug_html + "\u003C\u002Ftbody\u003E\u003C\u002Ftable\u003E";}.call(this,"hideEmpty" in locals_for_with?locals_for_with.hideEmpty:typeof hideEmpty!=="undefined"?hideEmpty:undefined,"servers" in locals_for_with?locals_for_with.servers:typeof servers!=="undefined"?servers:undefined,"sortOrder" in locals_for_with?locals_for_with.sortOrder:typeof sortOrder!=="undefined"?sortOrder:undefined,"sortedBy" in locals_for_with?locals_for_with.sortedBy:typeof sortedBy!=="undefined"?sortedBy:undefined,"vars" in locals_for_with?locals_for_with.vars:typeof vars!=="undefined"?vars:undefined));;return pug_html;};
},{"pug-runtime":8}]},{},[10])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvYnJvd3Nlci1yZXNvbHZlL2VtcHR5LmpzIiwibm9kZV9tb2R1bGVzL2Z1enphbGRyaW4vbGliL2ZpbHRlci5qcyIsIm5vZGVfbW9kdWxlcy9mdXp6YWxkcmluL2xpYi9mdXp6YWxkcmluLmpzIiwibm9kZV9tb2R1bGVzL2Z1enphbGRyaW4vbGliL21hdGNoZXIuanMiLCJub2RlX21vZHVsZXMvZnV6emFsZHJpbi9saWIvc2NvcmVyLmpzIiwibm9kZV9tb2R1bGVzL3BhdGgtYnJvd3NlcmlmeS9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9wcm9jZXNzL2Jyb3dzZXIuanMiLCJub2RlX21vZHVsZXMvcHVnLXJ1bnRpbWUvaW5kZXguanMiLCJ2YXJzLmpzb24iLCJ3ZWJzaXRlL2pzL3NlcnZlcnMuanMiLCJ3ZWJzaXRlL3ZpZXdzL19wYXJ0aWFscy9jbGFucy1vbmxpbmUucHVnIiwid2Vic2l0ZS92aWV3cy9fcGFydGlhbHMvZ2FtZS1taW5pLnB1ZyIsIndlYnNpdGUvdmlld3MvX3BhcnRpYWxzL3NlcnZlci1saXN0LnB1ZyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaEZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ2hPQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVBBO0FBQ0E7QUFD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QUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgcGx1Y2tDYW5kaWRhdGVzLCBzY29yZXIsIHNvcnRDYW5kaWRhdGVzO1xuXG4gIHNjb3JlciA9IHJlcXVpcmUoJy4vc2NvcmVyJyk7XG5cbiAgcGx1Y2tDYW5kaWRhdGVzID0gZnVuY3Rpb24oYSkge1xuICAgIHJldHVybiBhLmNhbmRpZGF0ZTtcbiAgfTtcblxuICBzb3J0Q2FuZGlkYXRlcyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICByZXR1cm4gYi5zY29yZSAtIGEuc2NvcmU7XG4gIH07XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbihjYW5kaWRhdGVzLCBxdWVyeSwgcXVlcnlIYXNTbGFzaGVzLCBfYXJnKSB7XG4gICAgdmFyIGNhbmRpZGF0ZSwga2V5LCBtYXhSZXN1bHRzLCBzY29yZSwgc2NvcmVkQ2FuZGlkYXRlcywgc3RyaW5nLCBfaSwgX2xlbiwgX3JlZjtcbiAgICBfcmVmID0gX2FyZyAhPSBudWxsID8gX2FyZyA6IHt9LCBrZXkgPSBfcmVmLmtleSwgbWF4UmVzdWx0cyA9IF9yZWYubWF4UmVzdWx0cztcbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHNjb3JlZENhbmRpZGF0ZXMgPSBbXTtcbiAgICAgIGZvciAoX2kgPSAwLCBfbGVuID0gY2FuZGlkYXRlcy5sZW5ndGg7IF9pIDwgX2xlbjsgX2krKykge1xuICAgICAgICBjYW5kaWRhdGUgPSBjYW5kaWRhdGVzW19pXTtcbiAgICAgICAgc3RyaW5nID0ga2V5ICE9IG51bGwgPyBjYW5kaWRhdGVba2V5XSA6IGNhbmRpZGF0ZTtcbiAgICAgICAgaWYgKCFzdHJpbmcpIHtcbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfVxuICAgICAgICBzY29yZSA9IHNjb3Jlci5zY29yZShzdHJpbmcsIHF1ZXJ5LCBxdWVyeUhhc1NsYXNoZXMpO1xuICAgICAgICBpZiAoIXF1ZXJ5SGFzU2xhc2hlcykge1xuICAgICAgICAgIHNjb3JlID0gc2NvcmVyLmJhc2VuYW1lU2NvcmUoc3RyaW5nLCBxdWVyeSwgc2NvcmUpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY29yZSA+IDApIHtcbiAgICAgICAgICBzY29yZWRDYW5kaWRhdGVzLnB1c2goe1xuICAgICAgICAgICAgY2FuZGlkYXRlOiBjYW5kaWRhdGUsXG4gICAgICAgICAgICBzY29yZTogc2NvcmVcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2NvcmVkQ2FuZGlkYXRlcy5zb3J0KHNvcnRDYW5kaWRhdGVzKTtcbiAgICAgIGNhbmRpZGF0ZXMgPSBzY29yZWRDYW5kaWRhdGVzLm1hcChwbHVja0NhbmRpZGF0ZXMpO1xuICAgIH1cbiAgICBpZiAobWF4UmVzdWx0cyAhPSBudWxsKSB7XG4gICAgICBjYW5kaWRhdGVzID0gY2FuZGlkYXRlcy5zbGljZSgwLCBtYXhSZXN1bHRzKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhbmRpZGF0ZXM7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBQYXRoU2VwYXJhdG9yLCBTcGFjZVJlZ2V4LCBmaWx0ZXIsIG1hdGNoZXIsIHNjb3JlcjtcblxuICBzY29yZXIgPSByZXF1aXJlKCcuL3Njb3JlcicpO1xuXG4gIGZpbHRlciA9IHJlcXVpcmUoJy4vZmlsdGVyJyk7XG5cbiAgbWF0Y2hlciA9IHJlcXVpcmUoJy4vbWF0Y2hlcicpO1xuXG4gIFBhdGhTZXBhcmF0b3IgPSByZXF1aXJlKCdwYXRoJykuc2VwO1xuXG4gIFNwYWNlUmVnZXggPSAvXFwgL2c7XG5cbiAgbW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZmlsdGVyOiBmdW5jdGlvbihjYW5kaWRhdGVzLCBxdWVyeSwgb3B0aW9ucykge1xuICAgICAgdmFyIHF1ZXJ5SGFzU2xhc2hlcztcbiAgICAgIGlmIChxdWVyeSkge1xuICAgICAgICBxdWVyeUhhc1NsYXNoZXMgPSBxdWVyeS5pbmRleE9mKFBhdGhTZXBhcmF0b3IpICE9PSAtMTtcbiAgICAgICAgcXVlcnkgPSBxdWVyeS5yZXBsYWNlKFNwYWNlUmVnZXgsICcnKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXIoY2FuZGlkYXRlcywgcXVlcnksIHF1ZXJ5SGFzU2xhc2hlcywgb3B0aW9ucyk7XG4gICAgfSxcbiAgICBzY29yZTogZnVuY3Rpb24oc3RyaW5nLCBxdWVyeSkge1xuICAgICAgdmFyIHF1ZXJ5SGFzU2xhc2hlcywgc2NvcmU7XG4gICAgICBpZiAoIXN0cmluZykge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGlmICghcXVlcnkpIHtcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICBpZiAoc3RyaW5nID09PSBxdWVyeSkge1xuICAgICAgICByZXR1cm4gMjtcbiAgICAgIH1cbiAgICAgIHF1ZXJ5SGFzU2xhc2hlcyA9IHF1ZXJ5LmluZGV4T2YoUGF0aFNlcGFyYXRvcikgIT09IC0xO1xuICAgICAgcXVlcnkgPSBxdWVyeS5yZXBsYWNlKFNwYWNlUmVnZXgsICcnKTtcbiAgICAgIHNjb3JlID0gc2NvcmVyLnNjb3JlKHN0cmluZywgcXVlcnkpO1xuICAgICAgaWYgKCFxdWVyeUhhc1NsYXNoZXMpIHtcbiAgICAgICAgc2NvcmUgPSBzY29yZXIuYmFzZW5hbWVTY29yZShzdHJpbmcsIHF1ZXJ5LCBzY29yZSk7XG4gICAgICB9XG4gICAgICByZXR1cm4gc2NvcmU7XG4gICAgfSxcbiAgICBtYXRjaDogZnVuY3Rpb24oc3RyaW5nLCBxdWVyeSkge1xuICAgICAgdmFyIGJhc2VNYXRjaGVzLCBpbmRleCwgbWF0Y2hlcywgcXVlcnlIYXNTbGFzaGVzLCBzZWVuLCBfaSwgX3JlZiwgX3Jlc3VsdHM7XG4gICAgICBpZiAoIXN0cmluZykge1xuICAgICAgICByZXR1cm4gW107XG4gICAgICB9XG4gICAgICBpZiAoIXF1ZXJ5KSB7XG4gICAgICAgIHJldHVybiBbXTtcbiAgICAgIH1cbiAgICAgIGlmIChzdHJpbmcgPT09IHF1ZXJ5KSB7XG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgX3Jlc3VsdHMgPSBbXTtcbiAgICAgICAgICBmb3IgKHZhciBfaSA9IDAsIF9yZWYgPSBzdHJpbmcubGVuZ3RoOyAwIDw9IF9yZWYgPyBfaSA8IF9yZWYgOiBfaSA+IF9yZWY7IDAgPD0gX3JlZiA/IF9pKysgOiBfaS0tKXsgX3Jlc3VsdHMucHVzaChfaSk7IH1cbiAgICAgICAgICByZXR1cm4gX3Jlc3VsdHM7XG4gICAgICAgIH0pLmFwcGx5KHRoaXMpO1xuICAgICAgfVxuICAgICAgcXVlcnlIYXNTbGFzaGVzID0gcXVlcnkuaW5kZXhPZihQYXRoU2VwYXJhdG9yKSAhPT0gLTE7XG4gICAgICBxdWVyeSA9IHF1ZXJ5LnJlcGxhY2UoU3BhY2VSZWdleCwgJycpO1xuICAgICAgbWF0Y2hlcyA9IG1hdGNoZXIubWF0Y2goc3RyaW5nLCBxdWVyeSk7XG4gICAgICBpZiAoIXF1ZXJ5SGFzU2xhc2hlcykge1xuICAgICAgICBiYXNlTWF0Y2hlcyA9IG1hdGNoZXIuYmFzZW5hbWVNYXRjaChzdHJpbmcsIHF1ZXJ5KTtcbiAgICAgICAgbWF0Y2hlcyA9IG1hdGNoZXMuY29uY2F0KGJhc2VNYXRjaGVzKS5zb3J0KGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICByZXR1cm4gYSAtIGI7XG4gICAgICAgIH0pO1xuICAgICAgICBzZWVuID0gbnVsbDtcbiAgICAgICAgaW5kZXggPSAwO1xuICAgICAgICB3aGlsZSAoaW5kZXggPCBtYXRjaGVzLmxlbmd0aCkge1xuICAgICAgICAgIGlmIChpbmRleCAmJiBzZWVuID09PSBtYXRjaGVzW2luZGV4XSkge1xuICAgICAgICAgICAgbWF0Y2hlcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWVuID0gbWF0Y2hlc1tpbmRleF07XG4gICAgICAgICAgICBpbmRleCsrO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIG1hdGNoZXM7XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiKGZ1bmN0aW9uKCkge1xuICB2YXIgUGF0aFNlcGFyYXRvcjtcblxuICBQYXRoU2VwYXJhdG9yID0gcmVxdWlyZSgncGF0aCcpLnNlcDtcblxuICBleHBvcnRzLmJhc2VuYW1lTWF0Y2ggPSBmdW5jdGlvbihzdHJpbmcsIHF1ZXJ5KSB7XG4gICAgdmFyIGJhc2UsIGluZGV4LCBsYXN0Q2hhcmFjdGVyLCBzbGFzaENvdW50O1xuICAgIGluZGV4ID0gc3RyaW5nLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKHN0cmluZ1tpbmRleF0gPT09IFBhdGhTZXBhcmF0b3IpIHtcbiAgICAgIGluZGV4LS07XG4gICAgfVxuICAgIHNsYXNoQ291bnQgPSAwO1xuICAgIGxhc3RDaGFyYWN0ZXIgPSBpbmRleDtcbiAgICBiYXNlID0gbnVsbDtcbiAgICB3aGlsZSAoaW5kZXggPj0gMCkge1xuICAgICAgaWYgKHN0cmluZ1tpbmRleF0gPT09IFBhdGhTZXBhcmF0b3IpIHtcbiAgICAgICAgc2xhc2hDb3VudCsrO1xuICAgICAgICBpZiAoYmFzZSA9PSBudWxsKSB7XG4gICAgICAgICAgYmFzZSA9IHN0cmluZy5zdWJzdHJpbmcoaW5kZXggKyAxLCBsYXN0Q2hhcmFjdGVyICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgaWYgKGxhc3RDaGFyYWN0ZXIgPCBzdHJpbmcubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGlmIChiYXNlID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2UgPSBzdHJpbmcuc3Vic3RyaW5nKDAsIGxhc3RDaGFyYWN0ZXIgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGJhc2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZSA9IHN0cmluZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGluZGV4LS07XG4gICAgfVxuICAgIHJldHVybiBleHBvcnRzLm1hdGNoKGJhc2UsIHF1ZXJ5LCBzdHJpbmcubGVuZ3RoIC0gYmFzZS5sZW5ndGgpO1xuICB9O1xuXG4gIGV4cG9ydHMubWF0Y2ggPSBmdW5jdGlvbihzdHJpbmcsIHF1ZXJ5LCBzdHJpbmdPZmZzZXQpIHtcbiAgICB2YXIgY2hhcmFjdGVyLCBpbmRleEluUXVlcnksIGluZGV4SW5TdHJpbmcsIGxvd2VyQ2FzZUluZGV4LCBtYXRjaGVzLCBtaW5JbmRleCwgcXVlcnlMZW5ndGgsIHN0cmluZ0xlbmd0aCwgdXBwZXJDYXNlSW5kZXgsIF9pLCBfcmVmLCBfcmVzdWx0cztcbiAgICBpZiAoc3RyaW5nT2Zmc2V0ID09IG51bGwpIHtcbiAgICAgIHN0cmluZ09mZnNldCA9IDA7XG4gICAgfVxuICAgIGlmIChzdHJpbmcgPT09IHF1ZXJ5KSB7XG4gICAgICByZXR1cm4gKGZ1bmN0aW9uKCkge1xuICAgICAgICBfcmVzdWx0cyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBfaSA9IHN0cmluZ09mZnNldCwgX3JlZiA9IHN0cmluZ09mZnNldCArIHN0cmluZy5sZW5ndGg7IHN0cmluZ09mZnNldCA8PSBfcmVmID8gX2kgPCBfcmVmIDogX2kgPiBfcmVmOyBzdHJpbmdPZmZzZXQgPD0gX3JlZiA/IF9pKysgOiBfaS0tKXsgX3Jlc3VsdHMucHVzaChfaSk7IH1cbiAgICAgICAgcmV0dXJuIF9yZXN1bHRzO1xuICAgICAgfSkuYXBwbHkodGhpcyk7XG4gICAgfVxuICAgIHF1ZXJ5TGVuZ3RoID0gcXVlcnkubGVuZ3RoO1xuICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgaW5kZXhJblF1ZXJ5ID0gMDtcbiAgICBpbmRleEluU3RyaW5nID0gMDtcbiAgICBtYXRjaGVzID0gW107XG4gICAgd2hpbGUgKGluZGV4SW5RdWVyeSA8IHF1ZXJ5TGVuZ3RoKSB7XG4gICAgICBjaGFyYWN0ZXIgPSBxdWVyeVtpbmRleEluUXVlcnkrK107XG4gICAgICBsb3dlckNhc2VJbmRleCA9IHN0cmluZy5pbmRleE9mKGNoYXJhY3Rlci50b0xvd2VyQ2FzZSgpKTtcbiAgICAgIHVwcGVyQ2FzZUluZGV4ID0gc3RyaW5nLmluZGV4T2YoY2hhcmFjdGVyLnRvVXBwZXJDYXNlKCkpO1xuICAgICAgbWluSW5kZXggPSBNYXRoLm1pbihsb3dlckNhc2VJbmRleCwgdXBwZXJDYXNlSW5kZXgpO1xuICAgICAgaWYgKG1pbkluZGV4ID09PSAtMSkge1xuICAgICAgICBtaW5JbmRleCA9IE1hdGgubWF4KGxvd2VyQ2FzZUluZGV4LCB1cHBlckNhc2VJbmRleCk7XG4gICAgICB9XG4gICAgICBpbmRleEluU3RyaW5nID0gbWluSW5kZXg7XG4gICAgICBpZiAoaW5kZXhJblN0cmluZyA9PT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIFtdO1xuICAgICAgfVxuICAgICAgbWF0Y2hlcy5wdXNoKHN0cmluZ09mZnNldCArIGluZGV4SW5TdHJpbmcpO1xuICAgICAgc3RyaW5nT2Zmc2V0ICs9IGluZGV4SW5TdHJpbmcgKyAxO1xuICAgICAgc3RyaW5nID0gc3RyaW5nLnN1YnN0cmluZyhpbmRleEluU3RyaW5nICsgMSwgc3RyaW5nTGVuZ3RoKTtcbiAgICB9XG4gICAgcmV0dXJuIG1hdGNoZXM7XG4gIH07XG5cbn0pLmNhbGwodGhpcyk7XG4iLCIoZnVuY3Rpb24oKSB7XG4gIHZhciBQYXRoU2VwYXJhdG9yLCBxdWVyeUlzTGFzdFBhdGhTZWdtZW50O1xuXG4gIFBhdGhTZXBhcmF0b3IgPSByZXF1aXJlKCdwYXRoJykuc2VwO1xuXG4gIGV4cG9ydHMuYmFzZW5hbWVTY29yZSA9IGZ1bmN0aW9uKHN0cmluZywgcXVlcnksIHNjb3JlKSB7XG4gICAgdmFyIGJhc2UsIGRlcHRoLCBpbmRleCwgbGFzdENoYXJhY3Rlciwgc2VnbWVudENvdW50LCBzbGFzaENvdW50O1xuICAgIGluZGV4ID0gc3RyaW5nLmxlbmd0aCAtIDE7XG4gICAgd2hpbGUgKHN0cmluZ1tpbmRleF0gPT09IFBhdGhTZXBhcmF0b3IpIHtcbiAgICAgIGluZGV4LS07XG4gICAgfVxuICAgIHNsYXNoQ291bnQgPSAwO1xuICAgIGxhc3RDaGFyYWN0ZXIgPSBpbmRleDtcbiAgICBiYXNlID0gbnVsbDtcbiAgICB3aGlsZSAoaW5kZXggPj0gMCkge1xuICAgICAgaWYgKHN0cmluZ1tpbmRleF0gPT09IFBhdGhTZXBhcmF0b3IpIHtcbiAgICAgICAgc2xhc2hDb3VudCsrO1xuICAgICAgICBpZiAoYmFzZSA9PSBudWxsKSB7XG4gICAgICAgICAgYmFzZSA9IHN0cmluZy5zdWJzdHJpbmcoaW5kZXggKyAxLCBsYXN0Q2hhcmFjdGVyICsgMSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoaW5kZXggPT09IDApIHtcbiAgICAgICAgaWYgKGxhc3RDaGFyYWN0ZXIgPCBzdHJpbmcubGVuZ3RoIC0gMSkge1xuICAgICAgICAgIGlmIChiYXNlID09IG51bGwpIHtcbiAgICAgICAgICAgIGJhc2UgPSBzdHJpbmcuc3Vic3RyaW5nKDAsIGxhc3RDaGFyYWN0ZXIgKyAxKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgaWYgKGJhc2UgPT0gbnVsbCkge1xuICAgICAgICAgICAgYmFzZSA9IHN0cmluZztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGluZGV4LS07XG4gICAgfVxuICAgIGlmIChiYXNlID09PSBzdHJpbmcpIHtcbiAgICAgIHNjb3JlICo9IDI7XG4gICAgfSBlbHNlIGlmIChiYXNlKSB7XG4gICAgICBzY29yZSArPSBleHBvcnRzLnNjb3JlKGJhc2UsIHF1ZXJ5KTtcbiAgICB9XG4gICAgc2VnbWVudENvdW50ID0gc2xhc2hDb3VudCArIDE7XG4gICAgZGVwdGggPSBNYXRoLm1heCgxLCAxMCAtIHNlZ21lbnRDb3VudCk7XG4gICAgc2NvcmUgKj0gZGVwdGggKiAwLjAxO1xuICAgIHJldHVybiBzY29yZTtcbiAgfTtcblxuICBleHBvcnRzLnNjb3JlID0gZnVuY3Rpb24oc3RyaW5nLCBxdWVyeSkge1xuICAgIHZhciBjaGFyYWN0ZXIsIGNoYXJhY3RlclNjb3JlLCBpbmRleEluUXVlcnksIGluZGV4SW5TdHJpbmcsIGxvd2VyQ2FzZUluZGV4LCBtaW5JbmRleCwgcXVlcnlMZW5ndGgsIHF1ZXJ5U2NvcmUsIHN0cmluZ0xlbmd0aCwgdG90YWxDaGFyYWN0ZXJTY29yZSwgdXBwZXJDYXNlSW5kZXgsIF9yZWY7XG4gICAgaWYgKHN0cmluZyA9PT0gcXVlcnkpIHtcbiAgICAgIHJldHVybiAxO1xuICAgIH1cbiAgICBpZiAocXVlcnlJc0xhc3RQYXRoU2VnbWVudChzdHJpbmcsIHF1ZXJ5KSkge1xuICAgICAgcmV0dXJuIDE7XG4gICAgfVxuICAgIHRvdGFsQ2hhcmFjdGVyU2NvcmUgPSAwO1xuICAgIHF1ZXJ5TGVuZ3RoID0gcXVlcnkubGVuZ3RoO1xuICAgIHN0cmluZ0xlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gICAgaW5kZXhJblF1ZXJ5ID0gMDtcbiAgICBpbmRleEluU3RyaW5nID0gMDtcbiAgICB3aGlsZSAoaW5kZXhJblF1ZXJ5IDwgcXVlcnlMZW5ndGgpIHtcbiAgICAgIGNoYXJhY3RlciA9IHF1ZXJ5W2luZGV4SW5RdWVyeSsrXTtcbiAgICAgIGxvd2VyQ2FzZUluZGV4ID0gc3RyaW5nLmluZGV4T2YoY2hhcmFjdGVyLnRvTG93ZXJDYXNlKCkpO1xuICAgICAgdXBwZXJDYXNlSW5kZXggPSBzdHJpbmcuaW5kZXhPZihjaGFyYWN0ZXIudG9VcHBlckNhc2UoKSk7XG4gICAgICBtaW5JbmRleCA9IE1hdGgubWluKGxvd2VyQ2FzZUluZGV4LCB1cHBlckNhc2VJbmRleCk7XG4gICAgICBpZiAobWluSW5kZXggPT09IC0xKSB7XG4gICAgICAgIG1pbkluZGV4ID0gTWF0aC5tYXgobG93ZXJDYXNlSW5kZXgsIHVwcGVyQ2FzZUluZGV4KTtcbiAgICAgIH1cbiAgICAgIGluZGV4SW5TdHJpbmcgPSBtaW5JbmRleDtcbiAgICAgIGlmIChpbmRleEluU3RyaW5nID09PSAtMSkge1xuICAgICAgICByZXR1cm4gMDtcbiAgICAgIH1cbiAgICAgIGNoYXJhY3RlclNjb3JlID0gMC4xO1xuICAgICAgaWYgKHN0cmluZ1tpbmRleEluU3RyaW5nXSA9PT0gY2hhcmFjdGVyKSB7XG4gICAgICAgIGNoYXJhY3RlclNjb3JlICs9IDAuMTtcbiAgICAgIH1cbiAgICAgIGlmIChpbmRleEluU3RyaW5nID09PSAwIHx8IHN0cmluZ1tpbmRleEluU3RyaW5nIC0gMV0gPT09IFBhdGhTZXBhcmF0b3IpIHtcbiAgICAgICAgY2hhcmFjdGVyU2NvcmUgKz0gMC44O1xuICAgICAgfSBlbHNlIGlmICgoX3JlZiA9IHN0cmluZ1tpbmRleEluU3RyaW5nIC0gMV0pID09PSAnLScgfHwgX3JlZiA9PT0gJ18nIHx8IF9yZWYgPT09ICcgJykge1xuICAgICAgICBjaGFyYWN0ZXJTY29yZSArPSAwLjc7XG4gICAgICB9XG4gICAgICBzdHJpbmcgPSBzdHJpbmcuc3Vic3RyaW5nKGluZGV4SW5TdHJpbmcgKyAxLCBzdHJpbmdMZW5ndGgpO1xuICAgICAgdG90YWxDaGFyYWN0ZXJTY29yZSArPSBjaGFyYWN0ZXJTY29yZTtcbiAgICB9XG4gICAgcXVlcnlTY29yZSA9IHRvdGFsQ2hhcmFjdGVyU2NvcmUgLyBxdWVyeUxlbmd0aDtcbiAgICByZXR1cm4gKChxdWVyeVNjb3JlICogKHF1ZXJ5TGVuZ3RoIC8gc3RyaW5nTGVuZ3RoKSkgKyBxdWVyeVNjb3JlKSAvIDI7XG4gIH07XG5cbiAgcXVlcnlJc0xhc3RQYXRoU2VnbWVudCA9IGZ1bmN0aW9uKHN0cmluZywgcXVlcnkpIHtcbiAgICBpZiAoc3RyaW5nW3N0cmluZy5sZW5ndGggLSBxdWVyeS5sZW5ndGggLSAxXSA9PT0gUGF0aFNlcGFyYXRvcikge1xuICAgICAgcmV0dXJuIHN0cmluZy5sYXN0SW5kZXhPZihxdWVyeSkgPT09IHN0cmluZy5sZW5ndGggLSBxdWVyeS5sZW5ndGg7XG4gICAgfVxuICB9O1xuXG59KS5jYWxsKHRoaXMpO1xuIiwiLy8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG4vL1xuLy8gUGVybWlzc2lvbiBpcyBoZXJlYnkgZ3JhbnRlZCwgZnJlZSBvZiBjaGFyZ2UsIHRvIGFueSBwZXJzb24gb2J0YWluaW5nIGFcbi8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcbi8vIFwiU29mdHdhcmVcIiksIHRvIGRlYWwgaW4gdGhlIFNvZnR3YXJlIHdpdGhvdXQgcmVzdHJpY3Rpb24sIGluY2x1ZGluZ1xuLy8gd2l0aG91dCBsaW1pdGF0aW9uIHRoZSByaWdodHMgdG8gdXNlLCBjb3B5LCBtb2RpZnksIG1lcmdlLCBwdWJsaXNoLFxuLy8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuLy8gcGVyc29ucyB0byB3aG9tIHRoZSBTb2Z0d2FyZSBpcyBmdXJuaXNoZWQgdG8gZG8gc28sIHN1YmplY3QgdG8gdGhlXG4vLyBmb2xsb3dpbmcgY29uZGl0aW9uczpcbi8vXG4vLyBUaGUgYWJvdmUgY29weXJpZ2h0IG5vdGljZSBhbmQgdGhpcyBwZXJtaXNzaW9uIG5vdGljZSBzaGFsbCBiZSBpbmNsdWRlZFxuLy8gaW4gYWxsIGNvcGllcyBvciBzdWJzdGFudGlhbCBwb3J0aW9ucyBvZiB0aGUgU29mdHdhcmUuXG4vL1xuLy8gVEhFIFNPRlRXQVJFIElTIFBST1ZJREVEIFwiQVMgSVNcIiwgV0lUSE9VVCBXQVJSQU5UWSBPRiBBTlkgS0lORCwgRVhQUkVTU1xuLy8gT1IgSU1QTElFRCwgSU5DTFVESU5HIEJVVCBOT1QgTElNSVRFRCBUTyBUSEUgV0FSUkFOVElFUyBPRlxuLy8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuLy8gTk8gRVZFTlQgU0hBTEwgVEhFIEFVVEhPUlMgT1IgQ09QWVJJR0hUIEhPTERFUlMgQkUgTElBQkxFIEZPUiBBTlkgQ0xBSU0sXG4vLyBEQU1BR0VTIE9SIE9USEVSIExJQUJJTElUWSwgV0hFVEhFUiBJTiBBTiBBQ1RJT04gT0YgQ09OVFJBQ1QsIFRPUlQgT1Jcbi8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcbi8vIFVTRSBPUiBPVEhFUiBERUFMSU5HUyBJTiBUSEUgU09GVFdBUkUuXG5cbi8vIHJlc29sdmVzIC4gYW5kIC4uIGVsZW1lbnRzIGluIGEgcGF0aCBhcnJheSB3aXRoIGRpcmVjdG9yeSBuYW1lcyB0aGVyZVxuLy8gbXVzdCBiZSBubyBzbGFzaGVzLCBlbXB0eSBlbGVtZW50cywgb3IgZGV2aWNlIG5hbWVzIChjOlxcKSBpbiB0aGUgYXJyYXlcbi8vIChzbyBhbHNvIG5vIGxlYWRpbmcgYW5kIHRyYWlsaW5nIHNsYXNoZXMgLSBpdCBkb2VzIG5vdCBkaXN0aW5ndWlzaFxuLy8gcmVsYXRpdmUgYW5kIGFic29sdXRlIHBhdGhzKVxuZnVuY3Rpb24gbm9ybWFsaXplQXJyYXkocGFydHMsIGFsbG93QWJvdmVSb290KSB7XG4gIC8vIGlmIHRoZSBwYXRoIHRyaWVzIHRvIGdvIGFib3ZlIHRoZSByb290LCBgdXBgIGVuZHMgdXAgPiAwXG4gIHZhciB1cCA9IDA7XG4gIGZvciAodmFyIGkgPSBwYXJ0cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBsYXN0ID0gcGFydHNbaV07XG4gICAgaWYgKGxhc3QgPT09ICcuJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgIH0gZWxzZSBpZiAobGFzdCA9PT0gJy4uJykge1xuICAgICAgcGFydHMuc3BsaWNlKGksIDEpO1xuICAgICAgdXArKztcbiAgICB9IGVsc2UgaWYgKHVwKSB7XG4gICAgICBwYXJ0cy5zcGxpY2UoaSwgMSk7XG4gICAgICB1cC0tO1xuICAgIH1cbiAgfVxuXG4gIC8vIGlmIHRoZSBwYXRoIGlzIGFsbG93ZWQgdG8gZ28gYWJvdmUgdGhlIHJvb3QsIHJlc3RvcmUgbGVhZGluZyAuLnNcbiAgaWYgKGFsbG93QWJvdmVSb290KSB7XG4gICAgZm9yICg7IHVwLS07IHVwKSB7XG4gICAgICBwYXJ0cy51bnNoaWZ0KCcuLicpO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBwYXJ0cztcbn1cblxuLy8gU3BsaXQgYSBmaWxlbmFtZSBpbnRvIFtyb290LCBkaXIsIGJhc2VuYW1lLCBleHRdLCB1bml4IHZlcnNpb25cbi8vICdyb290JyBpcyBqdXN0IGEgc2xhc2gsIG9yIG5vdGhpbmcuXG52YXIgc3BsaXRQYXRoUmUgPVxuICAgIC9eKFxcLz98KShbXFxzXFxTXSo/KSgoPzpcXC57MSwyfXxbXlxcL10rP3wpKFxcLlteLlxcL10qfCkpKD86W1xcL10qKSQvO1xudmFyIHNwbGl0UGF0aCA9IGZ1bmN0aW9uKGZpbGVuYW1lKSB7XG4gIHJldHVybiBzcGxpdFBhdGhSZS5leGVjKGZpbGVuYW1lKS5zbGljZSgxKTtcbn07XG5cbi8vIHBhdGgucmVzb2x2ZShbZnJvbSAuLi5dLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVzb2x2ZSA9IGZ1bmN0aW9uKCkge1xuICB2YXIgcmVzb2x2ZWRQYXRoID0gJycsXG4gICAgICByZXNvbHZlZEFic29sdXRlID0gZmFsc2U7XG5cbiAgZm9yICh2YXIgaSA9IGFyZ3VtZW50cy5sZW5ndGggLSAxOyBpID49IC0xICYmICFyZXNvbHZlZEFic29sdXRlOyBpLS0pIHtcbiAgICB2YXIgcGF0aCA9IChpID49IDApID8gYXJndW1lbnRzW2ldIDogcHJvY2Vzcy5jd2QoKTtcblxuICAgIC8vIFNraXAgZW1wdHkgYW5kIGludmFsaWQgZW50cmllc1xuICAgIGlmICh0eXBlb2YgcGF0aCAhPT0gJ3N0cmluZycpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0FyZ3VtZW50cyB0byBwYXRoLnJlc29sdmUgbXVzdCBiZSBzdHJpbmdzJyk7XG4gICAgfSBlbHNlIGlmICghcGF0aCkge1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgcmVzb2x2ZWRQYXRoID0gcGF0aCArICcvJyArIHJlc29sdmVkUGF0aDtcbiAgICByZXNvbHZlZEFic29sdXRlID0gcGF0aC5jaGFyQXQoMCkgPT09ICcvJztcbiAgfVxuXG4gIC8vIEF0IHRoaXMgcG9pbnQgdGhlIHBhdGggc2hvdWxkIGJlIHJlc29sdmVkIHRvIGEgZnVsbCBhYnNvbHV0ZSBwYXRoLCBidXRcbiAgLy8gaGFuZGxlIHJlbGF0aXZlIHBhdGhzIHRvIGJlIHNhZmUgKG1pZ2h0IGhhcHBlbiB3aGVuIHByb2Nlc3MuY3dkKCkgZmFpbHMpXG5cbiAgLy8gTm9ybWFsaXplIHRoZSBwYXRoXG4gIHJlc29sdmVkUGF0aCA9IG5vcm1hbGl6ZUFycmF5KGZpbHRlcihyZXNvbHZlZFBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhcmVzb2x2ZWRBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIHJldHVybiAoKHJlc29sdmVkQWJzb2x1dGUgPyAnLycgOiAnJykgKyByZXNvbHZlZFBhdGgpIHx8ICcuJztcbn07XG5cbi8vIHBhdGgubm9ybWFsaXplKHBhdGgpXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLm5vcm1hbGl6ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIGlzQWJzb2x1dGUgPSBleHBvcnRzLmlzQWJzb2x1dGUocGF0aCksXG4gICAgICB0cmFpbGluZ1NsYXNoID0gc3Vic3RyKHBhdGgsIC0xKSA9PT0gJy8nO1xuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgcGF0aFxuICBwYXRoID0gbm9ybWFsaXplQXJyYXkoZmlsdGVyKHBhdGguc3BsaXQoJy8nKSwgZnVuY3Rpb24ocCkge1xuICAgIHJldHVybiAhIXA7XG4gIH0pLCAhaXNBYnNvbHV0ZSkuam9pbignLycpO1xuXG4gIGlmICghcGF0aCAmJiAhaXNBYnNvbHV0ZSkge1xuICAgIHBhdGggPSAnLic7XG4gIH1cbiAgaWYgKHBhdGggJiYgdHJhaWxpbmdTbGFzaCkge1xuICAgIHBhdGggKz0gJy8nO1xuICB9XG5cbiAgcmV0dXJuIChpc0Fic29sdXRlID8gJy8nIDogJycpICsgcGF0aDtcbn07XG5cbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMuaXNBYnNvbHV0ZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgcmV0dXJuIHBhdGguY2hhckF0KDApID09PSAnLyc7XG59O1xuXG4vLyBwb3NpeCB2ZXJzaW9uXG5leHBvcnRzLmpvaW4gPSBmdW5jdGlvbigpIHtcbiAgdmFyIHBhdGhzID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgcmV0dXJuIGV4cG9ydHMubm9ybWFsaXplKGZpbHRlcihwYXRocywgZnVuY3Rpb24ocCwgaW5kZXgpIHtcbiAgICBpZiAodHlwZW9mIHAgIT09ICdzdHJpbmcnKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdBcmd1bWVudHMgdG8gcGF0aC5qb2luIG11c3QgYmUgc3RyaW5ncycpO1xuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfSkuam9pbignLycpKTtcbn07XG5cblxuLy8gcGF0aC5yZWxhdGl2ZShmcm9tLCB0bylcbi8vIHBvc2l4IHZlcnNpb25cbmV4cG9ydHMucmVsYXRpdmUgPSBmdW5jdGlvbihmcm9tLCB0bykge1xuICBmcm9tID0gZXhwb3J0cy5yZXNvbHZlKGZyb20pLnN1YnN0cigxKTtcbiAgdG8gPSBleHBvcnRzLnJlc29sdmUodG8pLnN1YnN0cigxKTtcblxuICBmdW5jdGlvbiB0cmltKGFycikge1xuICAgIHZhciBzdGFydCA9IDA7XG4gICAgZm9yICg7IHN0YXJ0IDwgYXJyLmxlbmd0aDsgc3RhcnQrKykge1xuICAgICAgaWYgKGFycltzdGFydF0gIT09ICcnKSBicmVhaztcbiAgICB9XG5cbiAgICB2YXIgZW5kID0gYXJyLmxlbmd0aCAtIDE7XG4gICAgZm9yICg7IGVuZCA+PSAwOyBlbmQtLSkge1xuICAgICAgaWYgKGFycltlbmRdICE9PSAnJykgYnJlYWs7XG4gICAgfVxuXG4gICAgaWYgKHN0YXJ0ID4gZW5kKSByZXR1cm4gW107XG4gICAgcmV0dXJuIGFyci5zbGljZShzdGFydCwgZW5kIC0gc3RhcnQgKyAxKTtcbiAgfVxuXG4gIHZhciBmcm9tUGFydHMgPSB0cmltKGZyb20uc3BsaXQoJy8nKSk7XG4gIHZhciB0b1BhcnRzID0gdHJpbSh0by5zcGxpdCgnLycpKTtcblxuICB2YXIgbGVuZ3RoID0gTWF0aC5taW4oZnJvbVBhcnRzLmxlbmd0aCwgdG9QYXJ0cy5sZW5ndGgpO1xuICB2YXIgc2FtZVBhcnRzTGVuZ3RoID0gbGVuZ3RoO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgaWYgKGZyb21QYXJ0c1tpXSAhPT0gdG9QYXJ0c1tpXSkge1xuICAgICAgc2FtZVBhcnRzTGVuZ3RoID0gaTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvdXRwdXRQYXJ0cyA9IFtdO1xuICBmb3IgKHZhciBpID0gc2FtZVBhcnRzTGVuZ3RoOyBpIDwgZnJvbVBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgb3V0cHV0UGFydHMucHVzaCgnLi4nKTtcbiAgfVxuXG4gIG91dHB1dFBhcnRzID0gb3V0cHV0UGFydHMuY29uY2F0KHRvUGFydHMuc2xpY2Uoc2FtZVBhcnRzTGVuZ3RoKSk7XG5cbiAgcmV0dXJuIG91dHB1dFBhcnRzLmpvaW4oJy8nKTtcbn07XG5cbmV4cG9ydHMuc2VwID0gJy8nO1xuZXhwb3J0cy5kZWxpbWl0ZXIgPSAnOic7XG5cbmV4cG9ydHMuZGlybmFtZSA9IGZ1bmN0aW9uKHBhdGgpIHtcbiAgdmFyIHJlc3VsdCA9IHNwbGl0UGF0aChwYXRoKSxcbiAgICAgIHJvb3QgPSByZXN1bHRbMF0sXG4gICAgICBkaXIgPSByZXN1bHRbMV07XG5cbiAgaWYgKCFyb290ICYmICFkaXIpIHtcbiAgICAvLyBObyBkaXJuYW1lIHdoYXRzb2V2ZXJcbiAgICByZXR1cm4gJy4nO1xuICB9XG5cbiAgaWYgKGRpcikge1xuICAgIC8vIEl0IGhhcyBhIGRpcm5hbWUsIHN0cmlwIHRyYWlsaW5nIHNsYXNoXG4gICAgZGlyID0gZGlyLnN1YnN0cigwLCBkaXIubGVuZ3RoIC0gMSk7XG4gIH1cblxuICByZXR1cm4gcm9vdCArIGRpcjtcbn07XG5cblxuZXhwb3J0cy5iYXNlbmFtZSA9IGZ1bmN0aW9uKHBhdGgsIGV4dCkge1xuICB2YXIgZiA9IHNwbGl0UGF0aChwYXRoKVsyXTtcbiAgLy8gVE9ETzogbWFrZSB0aGlzIGNvbXBhcmlzb24gY2FzZS1pbnNlbnNpdGl2ZSBvbiB3aW5kb3dzP1xuICBpZiAoZXh0ICYmIGYuc3Vic3RyKC0xICogZXh0Lmxlbmd0aCkgPT09IGV4dCkge1xuICAgIGYgPSBmLnN1YnN0cigwLCBmLmxlbmd0aCAtIGV4dC5sZW5ndGgpO1xuICB9XG4gIHJldHVybiBmO1xufTtcblxuXG5leHBvcnRzLmV4dG5hbWUgPSBmdW5jdGlvbihwYXRoKSB7XG4gIHJldHVybiBzcGxpdFBhdGgocGF0aClbM107XG59O1xuXG5mdW5jdGlvbiBmaWx0ZXIgKHhzLCBmKSB7XG4gICAgaWYgKHhzLmZpbHRlcikgcmV0dXJuIHhzLmZpbHRlcihmKTtcbiAgICB2YXIgcmVzID0gW107XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB4cy5sZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoZih4c1tpXSwgaSwgeHMpKSByZXMucHVzaCh4c1tpXSk7XG4gICAgfVxuICAgIHJldHVybiByZXM7XG59XG5cbi8vIFN0cmluZy5wcm90b3R5cGUuc3Vic3RyIC0gbmVnYXRpdmUgaW5kZXggZG9uJ3Qgd29yayBpbiBJRThcbnZhciBzdWJzdHIgPSAnYWInLnN1YnN0cigtMSkgPT09ICdiJ1xuICAgID8gZnVuY3Rpb24gKHN0ciwgc3RhcnQsIGxlbikgeyByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKSB9XG4gICAgOiBmdW5jdGlvbiAoc3RyLCBzdGFydCwgbGVuKSB7XG4gICAgICAgIGlmIChzdGFydCA8IDApIHN0YXJ0ID0gc3RyLmxlbmd0aCArIHN0YXJ0O1xuICAgICAgICByZXR1cm4gc3RyLnN1YnN0cihzdGFydCwgbGVuKTtcbiAgICB9XG47XG4iLCIvLyBzaGltIGZvciB1c2luZyBwcm9jZXNzIGluIGJyb3dzZXJcbnZhciBwcm9jZXNzID0gbW9kdWxlLmV4cG9ydHMgPSB7fTtcblxuLy8gY2FjaGVkIGZyb20gd2hhdGV2ZXIgZ2xvYmFsIGlzIHByZXNlbnQgc28gdGhhdCB0ZXN0IHJ1bm5lcnMgdGhhdCBzdHViIGl0XG4vLyBkb24ndCBicmVhayB0aGluZ3MuICBCdXQgd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdHJ5IGNhdGNoIGluIGNhc2UgaXQgaXNcbi8vIHdyYXBwZWQgaW4gc3RyaWN0IG1vZGUgY29kZSB3aGljaCBkb2Vzbid0IGRlZmluZSBhbnkgZ2xvYmFscy4gIEl0J3MgaW5zaWRlIGFcbi8vIGZ1bmN0aW9uIGJlY2F1c2UgdHJ5L2NhdGNoZXMgZGVvcHRpbWl6ZSBpbiBjZXJ0YWluIGVuZ2luZXMuXG5cbnZhciBjYWNoZWRTZXRUaW1lb3V0O1xudmFyIGNhY2hlZENsZWFyVGltZW91dDtcblxuZnVuY3Rpb24gZGVmYXVsdFNldFRpbW91dCgpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ3NldFRpbWVvdXQgaGFzIG5vdCBiZWVuIGRlZmluZWQnKTtcbn1cbmZ1bmN0aW9uIGRlZmF1bHRDbGVhclRpbWVvdXQgKCkge1xuICAgIHRocm93IG5ldyBFcnJvcignY2xlYXJUaW1lb3V0IGhhcyBub3QgYmVlbiBkZWZpbmVkJyk7XG59XG4oZnVuY3Rpb24gKCkge1xuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2V0VGltZW91dCA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IHNldFRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gZGVmYXVsdFNldFRpbW91dDtcbiAgICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgY2FjaGVkU2V0VGltZW91dCA9IGRlZmF1bHRTZXRUaW1vdXQ7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIGlmICh0eXBlb2YgY2xlYXJUaW1lb3V0ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBjbGVhclRpbWVvdXQ7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgICBjYWNoZWRDbGVhclRpbWVvdXQgPSBkZWZhdWx0Q2xlYXJUaW1lb3V0O1xuICAgIH1cbn0gKCkpXG5mdW5jdGlvbiBydW5UaW1lb3V0KGZ1bikge1xuICAgIGlmIChjYWNoZWRTZXRUaW1lb3V0ID09PSBzZXRUaW1lb3V0KSB7XG4gICAgICAgIC8vbm9ybWFsIGVudmlyb21lbnRzIGluIHNhbmUgc2l0dWF0aW9uc1xuICAgICAgICByZXR1cm4gc2V0VGltZW91dChmdW4sIDApO1xuICAgIH1cbiAgICAvLyBpZiBzZXRUaW1lb3V0IHdhc24ndCBhdmFpbGFibGUgYnV0IHdhcyBsYXR0ZXIgZGVmaW5lZFxuICAgIGlmICgoY2FjaGVkU2V0VGltZW91dCA9PT0gZGVmYXVsdFNldFRpbW91dCB8fCAhY2FjaGVkU2V0VGltZW91dCkgJiYgc2V0VGltZW91dCkge1xuICAgICAgICBjYWNoZWRTZXRUaW1lb3V0ID0gc2V0VGltZW91dDtcbiAgICAgICAgcmV0dXJuIHNldFRpbWVvdXQoZnVuLCAwKTtcbiAgICB9XG4gICAgdHJ5IHtcbiAgICAgICAgLy8gd2hlbiB3aGVuIHNvbWVib2R5IGhhcyBzY3Jld2VkIHdpdGggc2V0VGltZW91dCBidXQgbm8gSS5FLiBtYWRkbmVzc1xuICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dChmdW4sIDApO1xuICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBXaGVuIHdlIGFyZSBpbiBJLkUuIGJ1dCB0aGUgc2NyaXB0IGhhcyBiZWVuIGV2YWxlZCBzbyBJLkUuIGRvZXNuJ3QgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRTZXRUaW1lb3V0LmNhbGwobnVsbCwgZnVuLCAwKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yXG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkU2V0VGltZW91dC5jYWxsKHRoaXMsIGZ1biwgMCk7XG4gICAgICAgIH1cbiAgICB9XG5cblxufVxuZnVuY3Rpb24gcnVuQ2xlYXJUaW1lb3V0KG1hcmtlcikge1xuICAgIGlmIChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGNsZWFyVGltZW91dCkge1xuICAgICAgICAvL25vcm1hbCBlbnZpcm9tZW50cyBpbiBzYW5lIHNpdHVhdGlvbnNcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICAvLyBpZiBjbGVhclRpbWVvdXQgd2Fzbid0IGF2YWlsYWJsZSBidXQgd2FzIGxhdHRlciBkZWZpbmVkXG4gICAgaWYgKChjYWNoZWRDbGVhclRpbWVvdXQgPT09IGRlZmF1bHRDbGVhclRpbWVvdXQgfHwgIWNhY2hlZENsZWFyVGltZW91dCkgJiYgY2xlYXJUaW1lb3V0KSB7XG4gICAgICAgIGNhY2hlZENsZWFyVGltZW91dCA9IGNsZWFyVGltZW91dDtcbiAgICAgICAgcmV0dXJuIGNsZWFyVGltZW91dChtYXJrZXIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICAvLyB3aGVuIHdoZW4gc29tZWJvZHkgaGFzIHNjcmV3ZWQgd2l0aCBzZXRUaW1lb3V0IGJ1dCBubyBJLkUuIG1hZGRuZXNzXG4gICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQobWFya2VyKTtcbiAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIC8vIFdoZW4gd2UgYXJlIGluIEkuRS4gYnV0IHRoZSBzY3JpcHQgaGFzIGJlZW4gZXZhbGVkIHNvIEkuRS4gZG9lc24ndCAgdHJ1c3QgdGhlIGdsb2JhbCBvYmplY3Qgd2hlbiBjYWxsZWQgbm9ybWFsbHlcbiAgICAgICAgICAgIHJldHVybiBjYWNoZWRDbGVhclRpbWVvdXQuY2FsbChudWxsLCBtYXJrZXIpO1xuICAgICAgICB9IGNhdGNoIChlKXtcbiAgICAgICAgICAgIC8vIHNhbWUgYXMgYWJvdmUgYnV0IHdoZW4gaXQncyBhIHZlcnNpb24gb2YgSS5FLiB0aGF0IG11c3QgaGF2ZSB0aGUgZ2xvYmFsIG9iamVjdCBmb3IgJ3RoaXMnLCBob3BmdWxseSBvdXIgY29udGV4dCBjb3JyZWN0IG90aGVyd2lzZSBpdCB3aWxsIHRocm93IGEgZ2xvYmFsIGVycm9yLlxuICAgICAgICAgICAgLy8gU29tZSB2ZXJzaW9ucyBvZiBJLkUuIGhhdmUgZGlmZmVyZW50IHJ1bGVzIGZvciBjbGVhclRpbWVvdXQgdnMgc2V0VGltZW91dFxuICAgICAgICAgICAgcmV0dXJuIGNhY2hlZENsZWFyVGltZW91dC5jYWxsKHRoaXMsIG1hcmtlcik7XG4gICAgICAgIH1cbiAgICB9XG5cblxuXG59XG52YXIgcXVldWUgPSBbXTtcbnZhciBkcmFpbmluZyA9IGZhbHNlO1xudmFyIGN1cnJlbnRRdWV1ZTtcbnZhciBxdWV1ZUluZGV4ID0gLTE7XG5cbmZ1bmN0aW9uIGNsZWFuVXBOZXh0VGljaygpIHtcbiAgICBpZiAoIWRyYWluaW5nIHx8ICFjdXJyZW50UXVldWUpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBkcmFpbmluZyA9IGZhbHNlO1xuICAgIGlmIChjdXJyZW50UXVldWUubGVuZ3RoKSB7XG4gICAgICAgIHF1ZXVlID0gY3VycmVudFF1ZXVlLmNvbmNhdChxdWV1ZSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgIH1cbiAgICBpZiAocXVldWUubGVuZ3RoKSB7XG4gICAgICAgIGRyYWluUXVldWUoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGRyYWluUXVldWUoKSB7XG4gICAgaWYgKGRyYWluaW5nKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHRpbWVvdXQgPSBydW5UaW1lb3V0KGNsZWFuVXBOZXh0VGljayk7XG4gICAgZHJhaW5pbmcgPSB0cnVlO1xuXG4gICAgdmFyIGxlbiA9IHF1ZXVlLmxlbmd0aDtcbiAgICB3aGlsZShsZW4pIHtcbiAgICAgICAgY3VycmVudFF1ZXVlID0gcXVldWU7XG4gICAgICAgIHF1ZXVlID0gW107XG4gICAgICAgIHdoaWxlICgrK3F1ZXVlSW5kZXggPCBsZW4pIHtcbiAgICAgICAgICAgIGlmIChjdXJyZW50UXVldWUpIHtcbiAgICAgICAgICAgICAgICBjdXJyZW50UXVldWVbcXVldWVJbmRleF0ucnVuKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcXVldWVJbmRleCA9IC0xO1xuICAgICAgICBsZW4gPSBxdWV1ZS5sZW5ndGg7XG4gICAgfVxuICAgIGN1cnJlbnRRdWV1ZSA9IG51bGw7XG4gICAgZHJhaW5pbmcgPSBmYWxzZTtcbiAgICBydW5DbGVhclRpbWVvdXQodGltZW91dCk7XG59XG5cbnByb2Nlc3MubmV4dFRpY2sgPSBmdW5jdGlvbiAoZnVuKSB7XG4gICAgdmFyIGFyZ3MgPSBuZXcgQXJyYXkoYXJndW1lbnRzLmxlbmd0aCAtIDEpO1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID4gMSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3VtZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG4gICAgICAgIH1cbiAgICB9XG4gICAgcXVldWUucHVzaChuZXcgSXRlbShmdW4sIGFyZ3MpKTtcbiAgICBpZiAocXVldWUubGVuZ3RoID09PSAxICYmICFkcmFpbmluZykge1xuICAgICAgICBydW5UaW1lb3V0KGRyYWluUXVldWUpO1xuICAgIH1cbn07XG5cbi8vIHY4IGxpa2VzIHByZWRpY3RpYmxlIG9iamVjdHNcbmZ1bmN0aW9uIEl0ZW0oZnVuLCBhcnJheSkge1xuICAgIHRoaXMuZnVuID0gZnVuO1xuICAgIHRoaXMuYXJyYXkgPSBhcnJheTtcbn1cbkl0ZW0ucHJvdG90eXBlLnJ1biA9IGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLmZ1bi5hcHBseShudWxsLCB0aGlzLmFycmF5KTtcbn07XG5wcm9jZXNzLnRpdGxlID0gJ2Jyb3dzZXInO1xucHJvY2Vzcy5icm93c2VyID0gdHJ1ZTtcbnByb2Nlc3MuZW52ID0ge307XG5wcm9jZXNzLmFyZ3YgPSBbXTtcbnByb2Nlc3MudmVyc2lvbiA9ICcnOyAvLyBlbXB0eSBzdHJpbmcgdG8gYXZvaWQgcmVnZXhwIGlzc3Vlc1xucHJvY2Vzcy52ZXJzaW9ucyA9IHt9O1xuXG5mdW5jdGlvbiBub29wKCkge31cblxucHJvY2Vzcy5vbiA9IG5vb3A7XG5wcm9jZXNzLmFkZExpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3Mub25jZSA9IG5vb3A7XG5wcm9jZXNzLm9mZiA9IG5vb3A7XG5wcm9jZXNzLnJlbW92ZUxpc3RlbmVyID0gbm9vcDtcbnByb2Nlc3MucmVtb3ZlQWxsTGlzdGVuZXJzID0gbm9vcDtcbnByb2Nlc3MuZW1pdCA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRMaXN0ZW5lciA9IG5vb3A7XG5wcm9jZXNzLnByZXBlbmRPbmNlTGlzdGVuZXIgPSBub29wO1xuXG5wcm9jZXNzLmxpc3RlbmVycyA9IGZ1bmN0aW9uIChuYW1lKSB7IHJldHVybiBbXSB9XG5cbnByb2Nlc3MuYmluZGluZyA9IGZ1bmN0aW9uIChuYW1lKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmJpbmRpbmcgaXMgbm90IHN1cHBvcnRlZCcpO1xufTtcblxucHJvY2Vzcy5jd2QgPSBmdW5jdGlvbiAoKSB7IHJldHVybiAnLycgfTtcbnByb2Nlc3MuY2hkaXIgPSBmdW5jdGlvbiAoZGlyKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdwcm9jZXNzLmNoZGlyIGlzIG5vdCBzdXBwb3J0ZWQnKTtcbn07XG5wcm9jZXNzLnVtYXNrID0gZnVuY3Rpb24oKSB7IHJldHVybiAwOyB9O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG52YXIgcHVnX2hhc19vd25fcHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG4vKipcbiAqIE1lcmdlIHR3byBhdHRyaWJ1dGUgb2JqZWN0cyBnaXZpbmcgcHJlY2VkZW5jZVxuICogdG8gdmFsdWVzIGluIG9iamVjdCBgYmAuIENsYXNzZXMgYXJlIHNwZWNpYWwtY2FzZWRcbiAqIGFsbG93aW5nIGZvciBhcnJheXMgYW5kIG1lcmdpbmcvam9pbmluZyBhcHByb3ByaWF0ZWx5XG4gKiByZXN1bHRpbmcgaW4gYSBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IGFcbiAqIEBwYXJhbSB7T2JqZWN0fSBiXG4gKiBAcmV0dXJuIHtPYmplY3R9IGFcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMubWVyZ2UgPSBwdWdfbWVyZ2U7XG5mdW5jdGlvbiBwdWdfbWVyZ2UoYSwgYikge1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMSkge1xuICAgIHZhciBhdHRycyA9IGFbMF07XG4gICAgZm9yICh2YXIgaSA9IDE7IGkgPCBhLmxlbmd0aDsgaSsrKSB7XG4gICAgICBhdHRycyA9IHB1Z19tZXJnZShhdHRycywgYVtpXSk7XG4gICAgfVxuICAgIHJldHVybiBhdHRycztcbiAgfVxuXG4gIGZvciAodmFyIGtleSBpbiBiKSB7XG4gICAgaWYgKGtleSA9PT0gJ2NsYXNzJykge1xuICAgICAgdmFyIHZhbEEgPSBhW2tleV0gfHwgW107XG4gICAgICBhW2tleV0gPSAoQXJyYXkuaXNBcnJheSh2YWxBKSA/IHZhbEEgOiBbdmFsQV0pLmNvbmNhdChiW2tleV0gfHwgW10pO1xuICAgIH0gZWxzZSBpZiAoa2V5ID09PSAnc3R5bGUnKSB7XG4gICAgICB2YXIgdmFsQSA9IHB1Z19zdHlsZShhW2tleV0pO1xuICAgICAgdmFyIHZhbEIgPSBwdWdfc3R5bGUoYltrZXldKTtcbiAgICAgIGFba2V5XSA9IHZhbEEgKyAodmFsQSAmJiB2YWxCICYmICc7JykgKyB2YWxCO1xuICAgIH0gZWxzZSB7XG4gICAgICBhW2tleV0gPSBiW2tleV07XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGE7XG59O1xuXG4vKipcbiAqIFByb2Nlc3MgYXJyYXksIG9iamVjdCwgb3Igc3RyaW5nIGFzIGEgc3RyaW5nIG9mIGNsYXNzZXMgZGVsaW1pdGVkIGJ5IGEgc3BhY2UuXG4gKlxuICogSWYgYHZhbGAgaXMgYW4gYXJyYXksIGFsbCBtZW1iZXJzIG9mIGl0IGFuZCBpdHMgc3ViYXJyYXlzIGFyZSBjb3VudGVkIGFzXG4gKiBjbGFzc2VzLiBJZiBgZXNjYXBpbmdgIGlzIGFuIGFycmF5LCB0aGVuIHdoZXRoZXIgb3Igbm90IHRoZSBpdGVtIGluIGB2YWxgIGlzXG4gKiBlc2NhcGVkIGRlcGVuZHMgb24gdGhlIGNvcnJlc3BvbmRpbmcgaXRlbSBpbiBgZXNjYXBpbmdgLiBJZiBgZXNjYXBpbmdgIGlzXG4gKiBub3QgYW4gYXJyYXksIG5vIGVzY2FwaW5nIGlzIGRvbmUuXG4gKlxuICogSWYgYHZhbGAgaXMgYW4gb2JqZWN0LCBhbGwgdGhlIGtleXMgd2hvc2UgdmFsdWUgaXMgdHJ1dGh5IGFyZSBjb3VudGVkIGFzXG4gKiBjbGFzc2VzLiBObyBlc2NhcGluZyBpcyBkb25lLlxuICpcbiAqIElmIGB2YWxgIGlzIGEgc3RyaW5nLCBpdCBpcyBjb3VudGVkIGFzIGEgY2xhc3MuIE5vIGVzY2FwaW5nIGlzIGRvbmUuXG4gKlxuICogQHBhcmFtIHsoQXJyYXkuPHN0cmluZz58T2JqZWN0LjxzdHJpbmcsIGJvb2xlYW4+fHN0cmluZyl9IHZhbFxuICogQHBhcmFtIHs/QXJyYXkuPHN0cmluZz59IGVzY2FwaW5nXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cbmV4cG9ydHMuY2xhc3NlcyA9IHB1Z19jbGFzc2VzO1xuZnVuY3Rpb24gcHVnX2NsYXNzZXNfYXJyYXkodmFsLCBlc2NhcGluZykge1xuICB2YXIgY2xhc3NTdHJpbmcgPSAnJywgY2xhc3NOYW1lLCBwYWRkaW5nID0gJycsIGVzY2FwZUVuYWJsZWQgPSBBcnJheS5pc0FycmF5KGVzY2FwaW5nKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB2YWwubGVuZ3RoOyBpKyspIHtcbiAgICBjbGFzc05hbWUgPSBwdWdfY2xhc3Nlcyh2YWxbaV0pO1xuICAgIGlmICghY2xhc3NOYW1lKSBjb250aW51ZTtcbiAgICBlc2NhcGVFbmFibGVkICYmIGVzY2FwaW5nW2ldICYmIChjbGFzc05hbWUgPSBwdWdfZXNjYXBlKGNsYXNzTmFtZSkpO1xuICAgIGNsYXNzU3RyaW5nID0gY2xhc3NTdHJpbmcgKyBwYWRkaW5nICsgY2xhc3NOYW1lO1xuICAgIHBhZGRpbmcgPSAnICc7XG4gIH1cbiAgcmV0dXJuIGNsYXNzU3RyaW5nO1xufVxuZnVuY3Rpb24gcHVnX2NsYXNzZXNfb2JqZWN0KHZhbCkge1xuICB2YXIgY2xhc3NTdHJpbmcgPSAnJywgcGFkZGluZyA9ICcnO1xuICBmb3IgKHZhciBrZXkgaW4gdmFsKSB7XG4gICAgaWYgKGtleSAmJiB2YWxba2V5XSAmJiBwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKHZhbCwga2V5KSkge1xuICAgICAgY2xhc3NTdHJpbmcgPSBjbGFzc1N0cmluZyArIHBhZGRpbmcgKyBrZXk7XG4gICAgICBwYWRkaW5nID0gJyAnO1xuICAgIH1cbiAgfVxuICByZXR1cm4gY2xhc3NTdHJpbmc7XG59XG5mdW5jdGlvbiBwdWdfY2xhc3Nlcyh2YWwsIGVzY2FwaW5nKSB7XG4gIGlmIChBcnJheS5pc0FycmF5KHZhbCkpIHtcbiAgICByZXR1cm4gcHVnX2NsYXNzZXNfYXJyYXkodmFsLCBlc2NhcGluZyk7XG4gIH0gZWxzZSBpZiAodmFsICYmIHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgcmV0dXJuIHB1Z19jbGFzc2VzX29iamVjdCh2YWwpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWwgfHwgJyc7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0IG9iamVjdCBvciBzdHJpbmcgdG8gYSBzdHJpbmcgb2YgQ1NTIHN0eWxlcyBkZWxpbWl0ZWQgYnkgYSBzZW1pY29sb24uXG4gKlxuICogQHBhcmFtIHsoT2JqZWN0LjxzdHJpbmcsIHN0cmluZz58c3RyaW5nKX0gdmFsXG4gKiBAcmV0dXJuIHtTdHJpbmd9XG4gKi9cblxuZXhwb3J0cy5zdHlsZSA9IHB1Z19zdHlsZTtcbmZ1bmN0aW9uIHB1Z19zdHlsZSh2YWwpIHtcbiAgaWYgKCF2YWwpIHJldHVybiAnJztcbiAgaWYgKHR5cGVvZiB2YWwgPT09ICdvYmplY3QnKSB7XG4gICAgdmFyIG91dCA9ICcnLCBkZWxpbSA9ICcnO1xuICAgIGZvciAodmFyIHN0eWxlIGluIHZhbCkge1xuICAgICAgLyogaXN0YW5idWwgaWdub3JlIGVsc2UgKi9cbiAgICAgIGlmIChwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKHZhbCwgc3R5bGUpKSB7XG4gICAgICAgIG91dCA9IG91dCArIGRlbGltICsgc3R5bGUgKyAnOicgKyB2YWxbc3R5bGVdO1xuICAgICAgICBkZWxpbSA9ICc7JztcbiAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIG91dDtcbiAgfSBlbHNlIHtcbiAgICB2YWwgPSAnJyArIHZhbDtcbiAgICBpZiAodmFsW3ZhbC5sZW5ndGggLSAxXSA9PT0gJzsnKSByZXR1cm4gdmFsLnNsaWNlKDAsIC0xKTtcbiAgICByZXR1cm4gdmFsO1xuICB9XG59O1xuXG4vKipcbiAqIFJlbmRlciB0aGUgZ2l2ZW4gYXR0cmlidXRlLlxuICpcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXlcbiAqIEBwYXJhbSB7U3RyaW5nfSB2YWxcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gZXNjYXBlZFxuICogQHBhcmFtIHtCb29sZWFufSB0ZXJzZVxuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmF0dHIgPSBwdWdfYXR0cjtcbmZ1bmN0aW9uIHB1Z19hdHRyKGtleSwgdmFsLCBlc2NhcGVkLCB0ZXJzZSkge1xuICBpZiAodmFsID09PSBmYWxzZSB8fCB2YWwgPT0gbnVsbCB8fCAhdmFsICYmIChrZXkgPT09ICdjbGFzcycgfHwga2V5ID09PSAnc3R5bGUnKSkge1xuICAgIHJldHVybiAnJztcbiAgfVxuICBpZiAodmFsID09PSB0cnVlKSB7XG4gICAgcmV0dXJuICcgJyArICh0ZXJzZSA/IGtleSA6IGtleSArICc9XCInICsga2V5ICsgJ1wiJyk7XG4gIH1cbiAgaWYgKHR5cGVvZiB2YWwudG9KU09OID09PSAnZnVuY3Rpb24nKSB7XG4gICAgdmFsID0gdmFsLnRvSlNPTigpO1xuICB9XG4gIGlmICh0eXBlb2YgdmFsICE9PSAnc3RyaW5nJykge1xuICAgIHZhbCA9IEpTT04uc3RyaW5naWZ5KHZhbCk7XG4gICAgaWYgKCFlc2NhcGVkICYmIHZhbC5pbmRleE9mKCdcIicpICE9PSAtMSkge1xuICAgICAgcmV0dXJuICcgJyArIGtleSArICc9XFwnJyArIHZhbC5yZXBsYWNlKC8nL2csICcmIzM5OycpICsgJ1xcJyc7XG4gICAgfVxuICB9XG4gIGlmIChlc2NhcGVkKSB2YWwgPSBwdWdfZXNjYXBlKHZhbCk7XG4gIHJldHVybiAnICcgKyBrZXkgKyAnPVwiJyArIHZhbCArICdcIic7XG59O1xuXG4vKipcbiAqIFJlbmRlciB0aGUgZ2l2ZW4gYXR0cmlidXRlcyBvYmplY3QuXG4gKlxuICogQHBhcmFtIHtPYmplY3R9IG9ialxuICogQHBhcmFtIHtPYmplY3R9IHRlcnNlIHdoZXRoZXIgdG8gdXNlIEhUTUw1IHRlcnNlIGJvb2xlYW4gYXR0cmlidXRlc1xuICogQHJldHVybiB7U3RyaW5nfVxuICovXG5leHBvcnRzLmF0dHJzID0gcHVnX2F0dHJzO1xuZnVuY3Rpb24gcHVnX2F0dHJzKG9iaiwgdGVyc2Upe1xuICB2YXIgYXR0cnMgPSAnJztcblxuICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7XG4gICAgaWYgKHB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwob2JqLCBrZXkpKSB7XG4gICAgICB2YXIgdmFsID0gb2JqW2tleV07XG5cbiAgICAgIGlmICgnY2xhc3MnID09PSBrZXkpIHtcbiAgICAgICAgdmFsID0gcHVnX2NsYXNzZXModmFsKTtcbiAgICAgICAgYXR0cnMgPSBwdWdfYXR0cihrZXksIHZhbCwgZmFsc2UsIHRlcnNlKSArIGF0dHJzO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICAgIGlmICgnc3R5bGUnID09PSBrZXkpIHtcbiAgICAgICAgdmFsID0gcHVnX3N0eWxlKHZhbCk7XG4gICAgICB9XG4gICAgICBhdHRycyArPSBwdWdfYXR0cihrZXksIHZhbCwgZmFsc2UsIHRlcnNlKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYXR0cnM7XG59O1xuXG4vKipcbiAqIEVzY2FwZSB0aGUgZ2l2ZW4gc3RyaW5nIG9mIGBodG1sYC5cbiAqXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxuICogQHJldHVybiB7U3RyaW5nfVxuICogQGFwaSBwcml2YXRlXG4gKi9cblxudmFyIHB1Z19tYXRjaF9odG1sID0gL1tcIiY8Pl0vO1xuZXhwb3J0cy5lc2NhcGUgPSBwdWdfZXNjYXBlO1xuZnVuY3Rpb24gcHVnX2VzY2FwZShfaHRtbCl7XG4gIHZhciBodG1sID0gJycgKyBfaHRtbDtcbiAgdmFyIHJlZ2V4UmVzdWx0ID0gcHVnX21hdGNoX2h0bWwuZXhlYyhodG1sKTtcbiAgaWYgKCFyZWdleFJlc3VsdCkgcmV0dXJuIF9odG1sO1xuXG4gIHZhciByZXN1bHQgPSAnJztcbiAgdmFyIGksIGxhc3RJbmRleCwgZXNjYXBlO1xuICBmb3IgKGkgPSByZWdleFJlc3VsdC5pbmRleCwgbGFzdEluZGV4ID0gMDsgaSA8IGh0bWwubGVuZ3RoOyBpKyspIHtcbiAgICBzd2l0Y2ggKGh0bWwuY2hhckNvZGVBdChpKSkge1xuICAgICAgY2FzZSAzNDogZXNjYXBlID0gJyZxdW90Oyc7IGJyZWFrO1xuICAgICAgY2FzZSAzODogZXNjYXBlID0gJyZhbXA7JzsgYnJlYWs7XG4gICAgICBjYXNlIDYwOiBlc2NhcGUgPSAnJmx0Oyc7IGJyZWFrO1xuICAgICAgY2FzZSA2MjogZXNjYXBlID0gJyZndDsnOyBicmVhaztcbiAgICAgIGRlZmF1bHQ6IGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAobGFzdEluZGV4ICE9PSBpKSByZXN1bHQgKz0gaHRtbC5zdWJzdHJpbmcobGFzdEluZGV4LCBpKTtcbiAgICBsYXN0SW5kZXggPSBpICsgMTtcbiAgICByZXN1bHQgKz0gZXNjYXBlO1xuICB9XG4gIGlmIChsYXN0SW5kZXggIT09IGkpIHJldHVybiByZXN1bHQgKyBodG1sLnN1YnN0cmluZyhsYXN0SW5kZXgsIGkpO1xuICBlbHNlIHJldHVybiByZXN1bHQ7XG59O1xuXG4vKipcbiAqIFJlLXRocm93IHRoZSBnaXZlbiBgZXJyYCBpbiBjb250ZXh0IHRvIHRoZVxuICogdGhlIHB1ZyBpbiBgZmlsZW5hbWVgIGF0IHRoZSBnaXZlbiBgbGluZW5vYC5cbiAqXG4gKiBAcGFyYW0ge0Vycm9yfSBlcnJcbiAqIEBwYXJhbSB7U3RyaW5nfSBmaWxlbmFtZVxuICogQHBhcmFtIHtTdHJpbmd9IGxpbmVub1xuICogQHBhcmFtIHtTdHJpbmd9IHN0ciBvcmlnaW5hbCBzb3VyY2VcbiAqIEBhcGkgcHJpdmF0ZVxuICovXG5cbmV4cG9ydHMucmV0aHJvdyA9IHB1Z19yZXRocm93O1xuZnVuY3Rpb24gcHVnX3JldGhyb3coZXJyLCBmaWxlbmFtZSwgbGluZW5vLCBzdHIpe1xuICBpZiAoIShlcnIgaW5zdGFuY2VvZiBFcnJvcikpIHRocm93IGVycjtcbiAgaWYgKCh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnIHx8ICFmaWxlbmFtZSkgJiYgIXN0cikge1xuICAgIGVyci5tZXNzYWdlICs9ICcgb24gbGluZSAnICsgbGluZW5vO1xuICAgIHRocm93IGVycjtcbiAgfVxuICB0cnkge1xuICAgIHN0ciA9IHN0ciB8fCByZXF1aXJlKCdmcycpLnJlYWRGaWxlU3luYyhmaWxlbmFtZSwgJ3V0ZjgnKVxuICB9IGNhdGNoIChleCkge1xuICAgIHB1Z19yZXRocm93KGVyciwgbnVsbCwgbGluZW5vKVxuICB9XG4gIHZhciBjb250ZXh0ID0gM1xuICAgICwgbGluZXMgPSBzdHIuc3BsaXQoJ1xcbicpXG4gICAgLCBzdGFydCA9IE1hdGgubWF4KGxpbmVubyAtIGNvbnRleHQsIDApXG4gICAgLCBlbmQgPSBNYXRoLm1pbihsaW5lcy5sZW5ndGgsIGxpbmVubyArIGNvbnRleHQpO1xuXG4gIC8vIEVycm9yIGNvbnRleHRcbiAgdmFyIGNvbnRleHQgPSBsaW5lcy5zbGljZShzdGFydCwgZW5kKS5tYXAoZnVuY3Rpb24obGluZSwgaSl7XG4gICAgdmFyIGN1cnIgPSBpICsgc3RhcnQgKyAxO1xuICAgIHJldHVybiAoY3VyciA9PSBsaW5lbm8gPyAnICA+ICcgOiAnICAgICcpXG4gICAgICArIGN1cnJcbiAgICAgICsgJ3wgJ1xuICAgICAgKyBsaW5lO1xuICB9KS5qb2luKCdcXG4nKTtcblxuICAvLyBBbHRlciBleGNlcHRpb24gbWVzc2FnZVxuICBlcnIucGF0aCA9IGZpbGVuYW1lO1xuICBlcnIubWVzc2FnZSA9IChmaWxlbmFtZSB8fCAnUHVnJykgKyAnOicgKyBsaW5lbm9cbiAgICArICdcXG4nICsgY29udGV4dCArICdcXG5cXG4nICsgZXJyLm1lc3NhZ2U7XG4gIHRocm93IGVycjtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cz17XG5cdFwiY2xhbnNcIjogW1xuXHRcdHsgXCJ0YWdcIjogXCIhc11cIiwgXCJ0aXRsZVwiOiBcIiFtcHJlc3NpdmUgU3F1YWRcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2ltcHJlc3NpdmVzcXVhZC5ldVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxSQnxcIiwgXCJ0aXRsZVwiOiBcIlJlZCBCdXRjaGVyc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vYnV0Y2hlcnMuc3VcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCIuY1N8XCIsIFwidGl0bGVcIjogXCJDdWJlIFN0cmlrZXJzXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiLnJDfFwiLCBcInRpdGxlXCI6IFwiUmlzaW5nIEN1YmVyc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vcmlzaW5nLWN1YmVycy5ldVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIkdDMS9cIiwgXCJ0aXRsZVwiOiBcIkdhbWVyIENsYXNzIDFcIn0sXG5cdFx0eyBcInRhZ1wiOiBcInZhUSdcIiwgXCJ0aXRsZVwiOiBcIlZ1bHR1cmUgQXR0YWNrIFNxdWFkXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly92YXEtY2xhbi5kZVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInNwNG5rXCIsIFwidGl0bGVcIjogXCJzcDRua1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vc3A0bmsubmV0XCIgfSxcblx0XHR7IFwidGFnXCI6IFwiW3RCTUNdXCIsIFwidGl0bGVcIjogXCJUaGUgQmx1ZSBNb25rZXkgQ3VsdFwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vdGhlYmx1ZW1vbmtleWN1bHQud2Vicy5jb21cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJvb3xcIiwgXCJ0aXRsZVwiOiBcIk9ncm9zXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9vZ3Jvcy5vcmdcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ3MDBwfFwiLCBcInRpdGxlXCI6IFwidzAwcFwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vd29vcC51c1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxETXxcIiwgXCJ0aXRsZVwiOiBcIkRhbmdlcm91cyBNb25rZXlzXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9kYW5nZXJvdXNtb25rZXlzLmZvcnVtY29tbXVuaXR5Lm5ldFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxub1ZJOlwiLCBcInRpdGxlXCI6IFwiTm8gVmlvbGVuY2VcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL25vdml0ZWFtLmRlXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiW0ZEXVwiLCBcInRpdGxlXCI6IFwiRm9yZ290dGVuIERyZWFtXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9mb3Jnb3R0ZW5kcmVhbS5vcmdcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCI9REs9XCIsIFwidGl0bGVcIjogXCJEYXJrIEtlZXBlcnNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2RhcmtrZWVwZXJzLmRrXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiZVhjfFwiLCBcInRpdGxlXCI6IFwiRXhjZWxsZW5jZVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIkNyb3dkPlwiLCBcInRpdGxlXCI6IFwiQ3Jvd2RcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2Nyb3dkLmdnXCIgfSxcblx0XHR7IFwidGFnXCI6IFwifEhEfFwiLCBcInRpdGxlXCI6IFwiSGlnaCBEZWZpbml0aW9uXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiPHNBcy9cIiwgXCJ0aXRsZVwiOiBcInNBc1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcImNtfFwiLCBcInRpdGxlXCI6IFwiQ3ViaWMgTWF0dGVyXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9jdWJpY21hdHRlci5uZXRcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJnbG9yeXxcIiwgXCJ0aXRsZVwiOiBcIkdsb3J5XCIgfSxcblx0XHR7IFwidGFnXCI6IFwifE9SS3xcIiwgXCJ0aXRsZVwiOiBcIk9SS1wiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIltHTFhdXCIsIFwidGl0bGVcIjogXCJHTFhcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJlQy5cIiwgXCJ0aXRsZVwiOiBcIkVuaWdtYXRpYyBDcmV3XCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9lbmljcmV3LnRrXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiPHBXbj5cIiwgXCJ0aXRsZVwiOiBcInBXblwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIi5jMnxcIiwgXCJ0aXRsZVwiOiBcIkMyXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9jMmNsYW4udGtcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCIoRVNQKVwiLCBcInRpdGxlXCI6IFwiRXNwZWNpYWwgU3VwZXIgUGFyYWdvbnNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2VzcHRlYW0ub3JnXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiW1JVU1NdXCIsIFwidGl0bGVcIjogXCJSVVNTXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9ydXNzYXVlcmNsYW4uYm9hcmRzLm5ldFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIlJFRHxcIiwgXCJ0aXRsZVwiOiBcIlJFRFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcIiNUSlMuXCIsIFwidGl0bGVcIjogXCJUSlNcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ2YXxcIiwgXCJ0aXRsZVwiOiBcIlZveGVsQXJteVwiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vd3d3LnZveGVsYXJteS5jb21cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ2RSdcIiwgXCJ0aXRsZVwiOiBcInZFJ2N0b3JcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3ZlY3Rvci5lbmppbi5jb21cIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJ8RUt8XCIsIFwidGl0bGVcIjogXCJFdGVybmFsIEtpbGxlcnNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3Rla2NsYW5zYXVlci5jcmVhdGVhZm9ydW0uY29tXCIgfSxcblx0XHR7IFwidGFnXCI6IFwiTXlTXCIsIFwidGl0bGVcIjogXCJNYWtlcyB5b3UgU2lja1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vbXl5cy5icGxhY2VkLm5ldFwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxPTkl8XCIsIFwidGl0bGVcIjogXCJPTklcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3d3dy5vbmljbGFuLmVuamluLmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInd3fFwiLCBcInRpdGxlXCI6IFwiV2FyIFdvbHZlc1wiLCBcIndlYnNpdGVcIjogXCJodHRwOi8vd3ctd2Fyd29sdmVzLmVuamluLmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxTTXxcIiwgXCJ0aXRsZVwiOiBcIlN1cGVyaW9yIE1hcHBlcnNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL3N1cGVyaW9ybWFwcGVycy5mb3J1bW90aW9uLmV1XCIgfSxcblx0XHR7IFwidGFnXCI6IFwiJ2VTfFwiLCBcInRpdGxlXCI6IFwiRXNzZW50aWFsIFNtaWxleXNcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJzM3h5fFwiLCBcInRpdGxlXCI6IFwiU2V4aWVzdCBDbGFuXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9zZXh5c2F1ZXIuY29tXCIgfSxcblx0XHR7IFwidGFnXCI6IFwieFMnXCIsIFwidGl0bGVcIjogXCJlWHBlcmltZW50YWwgU3F1YWRcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cDovL2ltcHJlc3NpdmVzcXVhZC5ldVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcImFDZXxcIiwgXCJ0aXRsZVwiOiBcIkFtYXppbmcgQ3ViZSBFdmVudHNcIiB9LFxuXHRcdHsgXCJ0YWdcIjogXCJjSCdcIiwgXCJ0aXRsZVwiOiBcIkNvb3AgSG9wZXNcIiwgXCJ3ZWJzaXRlXCI6IFwiaHR0cHM6Ly9jaC1jbGFuLmNvbVwiIH0sXG5cdFx0eyBcInRhZ1wiOiBcInxHTXxcIiwgXCJ0aXRsZVwiOiBcIkdlcm1hbiBNYXN0ZXJzXCIsIFwid2Vic2l0ZVwiOiBcImh0dHA6Ly9nZXJtYW5tYXN0ZXJzLmNsYW53ZWJzaXRlLmNvbS9cIiB9XG5cdF0sXG5cdFwibWF0ZXJNb2RlQ29sb3JzXCI6IHtcblx0ICBcImF1dGhcIjogXCJsaWdodGdyYXlcIixcblx0ICBcIm9wZW5cIjogXCJsaWdodGdyZWVuXCIsXG5cdCAgXCJ2ZXRvXCI6IFwieWVsbG93XCIsXG5cdCAgXCJsb2NrZWRcIjogXCJ5ZWxsb3dcIixcblx0ICBcInByaXZhdGVcIjogXCJyZWRcIixcblx0ICBcInBhc3N3b3JkXCI6IFwicmVkXCJcblx0fSxcblx0XCJnYW1lTW9kZXNcIjoge1xuXHRcdFwiZmZhXCI6IHt9LFxuXHRcdFwiY29vcF9lZGl0XCI6IHt9LFxuXHRcdFwidGVhbXBsYXlcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUgfSxcblx0XHRcImluc3RhZ2liXCI6IHsgXCJpbnN0YU1vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiaW5zdGFfdGVhbVwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJpbnN0YU1vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiZWZmaWNpZW5jeVwiOiB7IFwiZWZmaWNNb2RlXCI6IHRydWUgfSxcblx0XHRcImVmZmljX3RlYW1cIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZWZmaWNNb2RlXCI6IHRydWUgfSxcblx0XHRcInRhY3RpY3NcIjoge30sXG5cdFx0XCJ0YWNfdGVhbVwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiY2FwdHVyZVwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJyZWdlbl9jYXB0dXJlXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImN0ZlwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJpbnN0YV9jdGZcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiaW5zdGFNb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwicHJvdGVjdFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJpbnN0YV9wcm90ZWN0XCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImluc3RhTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImhvbGRcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiaW5zdGFfaG9sZFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJpbnN0YU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJlZmZpY19jdGZcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZWZmaWNNb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiZWZmaWNfcHJvdGVjdFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJlZmZpY01vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJlZmZpY19ob2xkXCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImVmZmljTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfSxcblx0XHRcImNvbGxlY3RcIjogeyBcInRlYW1Nb2RlXCI6IHRydWUsIFwiZmxhZ01vZGVcIjogdHJ1ZSB9LFxuXHRcdFwiaW5zdGFfY29sbGVjdFwiOiB7IFwidGVhbU1vZGVcIjogdHJ1ZSwgXCJpbnN0YU1vZGVcIjogdHJ1ZSwgXCJmbGFnTW9kZVwiOiB0cnVlIH0sXG5cdFx0XCJlZmZpY19jb2xsZWN0XCI6IHsgXCJ0ZWFtTW9kZVwiOiB0cnVlLCBcImVmZmljTW9kZVwiOiB0cnVlLCBcImZsYWdNb2RlXCI6IHRydWUgfVxuXHR9LFxuXHRcImdhbWVNb2RlR3JvdXBzXCI6IFtcblx0XHR7IFwibmFtZVwiOiBcIkNsYXNzaWNcIiwgXCJtb2Rlc1wiOiBbXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiY29vcF9lZGl0XCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJmZmFcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImluc3RhZ2liXCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJlZmZpY2llbmN5XCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJ0YWN0aWNzXCIgfVxuXHRcdFx0XSB9LFxuXHRcdHsgXCJuYW1lXCI6IFwiVGVhbVwiLCBcIm1vZGVzXCI6IFtcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJ0ZWFtcGxheVwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFfdGVhbVwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiZWZmaWNfdGVhbVwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwidGFjX3RlYW1cIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJDYXB0dXJlIFRoZSBGbGFnXCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcImN0ZlwiIH0sXG5cdFx0XHRcdHsgXCJuYW1lXCI6IFwiaW5zdGFfY3RmXCIgfSxcblx0XHRcdFx0eyBcIm5hbWVcIjogXCJlZmZpY19jdGZcIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJIb2xkXCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcImhvbGRcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImluc3RhX2hvbGRcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImVmZmljX2hvbGRcIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJQcm90ZWN0XCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcInByb3RlY3RcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImluc3RhX3Byb3RlY3RcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImVmZmljX3Byb3RlY3RcIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJDYXB0dXJlXCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcImNhcHR1cmVcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcInJlZ2VuX2NhcHR1cmVcIiB9XG5cdFx0XHRdIH0sXG5cdFx0eyBcIm5hbWVcIjogXCJDb2xsZWN0XCIsIFwibW9kZXNcIjogW1xuXHRcdFx0XHR7IFwibmFtZVwiOiBcImNvbGxlY3RcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImluc3RhX2NvbGxlY3RcIiB9LFxuXHRcdFx0XHR7IFwibmFtZVwiOiBcImVmZmljX2NvbGxlY3RcIiB9XG5cdFx0XHRdIH1cblx0XSxcblx0XCJkdWVsTW9kZXNcIjogWyBcImluc3RhZ2liXCIsIFwiaW5zdGFfdGVhbVwiLCBcImVmZmljaWVuY3lcIiwgXCJlZmZpY190ZWFtXCIsIFwidGFjdGljc1wiLCBcInRhY190ZWFtXCIsIFwiZmZhXCIsIFwidGVhbXBsYXlcIiBdLFxuXHRcIm1peE1vZGVzXCI6IFsgXCJ0ZWFtcGxheVwiLCBcImluc3RhX3RlYW1cIiwgXCJlZmZpY190ZWFtXCIsIFwiY2FwdHVyZVwiLCBcInJlZ2VuX2NhcHR1cmVcIiwgXCJjdGZcIiwgXCJpbnN0YV9jdGZcIiwgXCJwcm90ZWN0XCIsIFwiaW5zdGFfcHJvdGVjdFwiLCBcImhvbGRcIiwgXCJpbnN0YV9ob2xkXCIsIFwiZWZmaWNfY3RmXCIsIFwiZWZmaWNfcHJvdGVjdFwiLCBcImVmZmljX2hvbGRcIiwgXCJjb2xsZWN0XCIsIFwiaW5zdGFfY29sbGVjdFwiLCBcImVmZmljX2NvbGxlY3RcIiBdLFxuXHRcImxvY2tlZE1Nb2Rlc1wiOiBbIFwibG9ja2VkXCIsIFwicHJpdmF0ZVwiLCBcInBhc3N3b3JkXCIgXSxcblx0XCJkdWVsVGhyZXNob2xkc1wiOiB7IFwiaW5zdGFnaWJcIjogOCwgXCJpbnN0YV90ZWFtXCI6IDgsIFwiZWZmaWNpZW5jeVwiOiA4LCBcImVmZmljX3RlYW1cIjogOCwgXCJ0YWN0aWNzXCI6IDAsIFwidGFjX3RlYW1cIjogMCwgXCJmZmFcIjogMCwgXCJ0ZWFtcGxheVwiOiAwIH0sXG5cdFwiYmFubmVyVVJMXCI6IFwiaHR0cHM6Ly9iYW5uZXJzLnNhdWVydHJhY2tlci5uZXQvXCJcbn1cbiIsInZhciAkID0gd2luZG93LiQ7XG52YXIgXyA9IHdpbmRvdy5fO1xudmFyIGZvdW5kYXRpb24gPSB3aW5kb3cuRm91bmRhdGlvbjtcbmltcG9ydCB7ZmlsdGVyfSBmcm9tICdmdXp6YWxkcmluJztcblxudmFyIHZhcnMgPSByZXF1aXJlKFwiLi4vLi4vdmFycy5qc29uXCIpO1xuXG52YXIgc2VydmVyTGlzdFRlbXBsYXRlID0gcmVxdWlyZSgnLi4vdmlld3MvX3BhcnRpYWxzL3NlcnZlci1saXN0LnB1ZycpO1xudmFyIGNsYW5zT25saW5lVGVtcGxhdGUgPSByZXF1aXJlKCcuLi92aWV3cy9fcGFydGlhbHMvY2xhbnMtb25saW5lLnB1ZycpO1xudmFyIGdhbWVUZW1wbGF0ZSA9IHJlcXVpcmUoJy4uL3ZpZXdzL19wYXJ0aWFscy9nYW1lLW1pbmkucHVnJyk7XG5cbnZhciBzZXJ2ZXJzID0gW107XG52YXIgaGlkZUVtcHR5ID0gJChcIiNoaWRlLWVtcHR5XCIpLmlzKFwiOmNoZWNrZWRcIik7XG52YXIgcGF1c2VVcGRhdGUgPSAkKFwiI3BhdXNlLXVwZGF0ZVwiKS5pcyhcIjpjaGVja2VkXCIpO1xudmFyIGxvb2tpbmdGb3JQbGF5ZXIgPSAkKFwiI2ZpbmQtcGxheWVyXCIpLnZhbCgpO1xudmFyIGxvb2tpbmdGb3JTZXJ2ZXIgPSAkKFwiI2ZpbmQtc2VydmVyXCIpLnZhbCgpO1xudmFyIHNvcnRlZEJ5ID0gXCJjbGllbnRzXCI7XG52YXIgc29ydE9yZGVyID0gXCJkZXNjXCI7XG52YXIgb3BlblNlcnZlckhvc3QgPSBcIlwiO1xudmFyIG9wZW5TZXJ2ZXJQb3J0ID0gMDtcbnZhciBvcGVuR2FtZSA9IG51bGw7XG52YXIgYWxsUGxheWVycyA9IFtdO1xuXG50cnkge1xuXHRzZXJ2ZXJzID0gSlNPTi5wYXJzZSgkKFwiI3NlcnZlcnMtanNvblwiKS50ZXh0KCkpfHxbXTtcblx0Xy5lYWNoKHNlcnZlcnMsIChzZXJ2ZXIpID0+IHtcblx0XHRzZXJ2ZXIuZnVsbFRleHQgPSAoXy52YWx1ZXMoXy5waWNrKHNlcnZlciwgWyBcImdhbWVNb2RlXCIsIFwibWFwTmFtZVwiLCBcIm1hc3Rlck1vZGVcIiwgXCJjb3VudHJ5XCIsIFwiY291bnRyeU5hbWVcIiwgXCJob3N0XCIgXSkpLmpvaW4oXCIgXCIpK1wiOlwiK3NlcnZlci5wb3J0KS50b0xvd2VyQ2FzZSgpO1xuXHR9KTtcbn0gY2F0Y2goZSkge1xuXHRzZXJ2ZXJzID0gW107XG59XG5cbndpbmRvdy5zaG93Q29ubmVjdCA9IGZ1bmN0aW9uIChob3N0LCBwb3J0KSB7XG5cdCQoXCIjY29ubmVjdC1jb21tYW5kXCIpLnZhbChcIi9jb25uZWN0IFwiK2hvc3QrXCIgXCIrcG9ydCk7XG5cdCQoXCIjY29ubmVjdC1pbmZvXCIpLmZvdW5kYXRpb24oXCJvcGVuXCIpO1xuXHQkKFwiI2Nvbm5lY3QtY29tbWFuZFwiKS5mb2N1cygpO1xufTtcblxud2luZG93LmhpZGVFbXB0eUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcblx0aGlkZUVtcHR5ID0gJChcIiNoaWRlLWVtcHR5XCIpLmlzKFwiOmNoZWNrZWRcIik7XG5cdHJlbmRlclNlcnZlcnMoKTtcbn07XG5cbndpbmRvdy5wYXVzZVVwZGF0ZUNoYW5nZWQgPSBmdW5jdGlvbigpIHtcblx0cGF1c2VVcGRhdGUgPSAkKFwiI3BhdXNlLXVwZGF0ZVwiKS5pcyhcIjpjaGVja2VkXCIpO1xufTtcblxudmFyIHBsYXllclN1Z2dlc3Rpb25zID0gZnVuY3Rpb24ocSwgY2IpIHtcblx0Y2IoZmlsdGVyKGFsbFBsYXllcnMsIHEpKTtcbn07XG5cbndpbmRvdy5maW5kUGxheWVyID0gXy5kZWJvdW5jZShmdW5jdGlvbihuYW1lKSB7XG5cdGlmIChuYW1lKSAkKFwiI2ZpbmQtcGxheWVyXCIpLnR5cGVhaGVhZCgndmFsJywgbmFtZSk7XG5cdGxvb2tpbmdGb3JQbGF5ZXIgPSAkKFwiI2ZpbmQtcGxheWVyXCIpLnZhbCgpO1xuXHRyZW5kZXJTZXJ2ZXJzKCk7XG5cdHJlbmRlckdhbWUoKTtcbn0sIDE1MCk7XG5cbndpbmRvdy5maW5kU2VydmVyID0gXy5kZWJvdW5jZShmdW5jdGlvbigpIHtcblx0bG9va2luZ0ZvclNlcnZlciA9ICQoXCIjZmluZC1zZXJ2ZXJcIikudmFsKCk7XG5cdHJlbmRlclNlcnZlcnMoKTtcbn0sIDE1MCk7XG5cbndpbmRvdy5zb3J0QnkgPSBmdW5jdGlvbihwcm9wKSB7XG5cdGlmIChwcm9wID09IHNvcnRlZEJ5ICYmIHNvcnRPcmRlciA9PSBcImFzY1wiKSBzb3J0T3JkZXIgPSBcImRlc2NcIjtcblx0ZWxzZSB7XG5cdFx0c29ydGVkQnkgPSBwcm9wO1xuXHRcdHNvcnRPcmRlciA9IFwiYXNjXCI7XG5cdH1cblx0cmVuZGVyU2VydmVycygpO1xufTtcblxuZnVuY3Rpb24gZ2V0Q2xhbihuYW1lKSB7XG5cdGxldCBjbGFuID0gXy5maW5kKHZhcnMuY2xhbnMsIGNsYW4gPT4gKG5hbWUuaW5kZXhPZihjbGFuLnRhZykgPj0gMCkpO1xuXHRyZXR1cm4gY2xhbiYmY2xhbi50YWc7XG59XG5cbmZ1bmN0aW9uIHJlbmRlclNlcnZlcnMoKSB7XG5cdCQoXCIjdG90YWwtc2VydmVyc1wiKS50ZXh0KHNlcnZlcnMubGVuZ3RoKTtcblxuXHR2YXIgbG9va0ZvciA9IGxvb2tpbmdGb3JQbGF5ZXIudG9Mb3dlckNhc2UoKTtcblx0Xy5lYWNoKHNlcnZlcnMsIGZ1bmN0aW9uKHNlcnZlcikge1xuXHRcdGlmIChsb29rRm9yICYmIF8uZmluZChzZXJ2ZXIucGxheWVycywgZnVuY3Rpb24gKHBsKSB7IHJldHVybiAocGwudG9Mb3dlckNhc2UoKS5pbmRleE9mKGxvb2tGb3IpID49IDApOyB9KSkgc2VydmVyLmhpZ2hsaWdodCA9IHRydWU7XG5cdFx0ZWxzZSBzZXJ2ZXIuaGlnaGxpZ2h0ID0gZmFsc2U7XG5cdH0pO1xuXG5cdGFsbFBsYXllcnMgPSBbXTtcblx0Xy5lYWNoKHNlcnZlcnMsIHN2ID0+IHtcblx0XHRhbGxQbGF5ZXJzLnB1c2guYXBwbHkoYWxsUGxheWVycywgc3YucGxheWVycyk7XG5cdH0pO1xuXHRhbGxQbGF5ZXJzID0gXy51bmlxKGFsbFBsYXllcnMpO1xuXG5cdCQoXCIjdG90YWwtcGxheWVyc1wiKS50ZXh0KGFsbFBsYXllcnMubGVuZ3RoKTtcblxuXHRsZXQgY2xhbnMgPSBfLm1hcChfLmdyb3VwQnkoYWxsUGxheWVycywgZ2V0Q2xhbiksIChncm91cCwga2V5KSA9PiB7XG5cdFx0cmV0dXJuIHsgbmFtZToga2V5LCBjb3VudDogZ3JvdXAubGVuZ3RoLCBwbGF5ZXJzOiBncm91cCB9O1xuXHR9KTtcblx0Y2xhbnMgPSBfLnJlamVjdChfLm9yZGVyQnkoY2xhbnMsIFwiY291bnRcIiwgXCJkZXNjXCIpLCB7IFwibmFtZVwiOiBcInVuZGVmaW5lZFwiIH0pO1xuXG5cdGxldCBzZXJ2cyA9IHNlcnZlcnM7XG5cdGlmIChsb29raW5nRm9yU2VydmVyKSB7XG5cdFx0bGV0IGxvb2tpbmdGb3JMb3dlciA9IGxvb2tpbmdGb3JTZXJ2ZXIudG9Mb3dlckNhc2UoKTtcblx0XHRzZXJ2cyA9IF8udW5pb24oZmlsdGVyKHNlcnZlcnMsIGxvb2tpbmdGb3JTZXJ2ZXIsIHtrZXk6IFwiZGVzY3JpcHRpb25cIn0pLCBfLmZpbHRlcihzZXJ2ZXJzLCBzZXJ2ID0+IHNlcnYuZnVsbFRleHQuaW5kZXhPZihsb29raW5nRm9yTG93ZXIpID49IDAgKSk7XG5cdH1cblx0c2VydnMgPSBfLm9yZGVyQnkoc2VydnMsIHNvcnRlZEJ5LCBzb3J0T3JkZXIpO1xuXG5cdCQoXCIjc2VydmVyLWxpc3RcIikuaHRtbChzZXJ2ZXJMaXN0VGVtcGxhdGUoe1xuXHRcdHNlcnZlcnM6IHNlcnZzLFxuXHRcdGhpZGVFbXB0eTogaGlkZUVtcHR5JiYhbG9va2luZ0ZvclNlcnZlcixcblx0XHRzb3J0ZWRCeTogc29ydGVkQnksXG5cdFx0c29ydE9yZGVyOiBzb3J0T3JkZXIsXG5cdFx0bG9va2luZ0ZvclBsYXllcjogbG9va2luZ0ZvclBsYXllcixcblx0XHR2YXJzOiB2YXJzXG5cdH0pKTtcblxuXHQkKFwiI2NsYW5zLW9ubGluZVwiKS5odG1sKGNsYW5zT25saW5lVGVtcGxhdGUoe1xuXHRcdGNsYW5zT25saW5lOiBjbGFuc1xuXHR9KSk7XG5cblx0d2luZG93LmRpc2FibGVEZWZhdWx0KCk7XG59XG5yZW5kZXJTZXJ2ZXJzKCk7XG5cbmZ1bmN0aW9uIHRyeUxvYWRCYWNrZ3JvdW5kKG5hbWUpIHtcblx0dmFyIGJnID0gbmV3IEltYWdlKCk7XG5cdGJnLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcblx0XHQkKFwiI3NlcnZlci1pbmZvXCIpLmNzcyhcImJhY2tncm91bmRcIiwgXCJsaW5lYXItZ3JhZGllbnQoIHJnYmEoMCwgMCwgMCwgMC41KSwgcmdiYSgwLCAwLCAwLCAwLjUpICksIHVybCgvaW1hZ2VzL21hcHNob3RzL1wiK25hbWUrXCIuanBnKSBuby1yZXBlYXQgY2VudGVyIGNlbnRlciBmaXhlZFwiKTtcblx0XHQkKFwiI3NlcnZlci1pbmZvXCIpLmNzcyhcImJhY2tncm91bmQtc2l6ZVwiLCBcImNvdmVyXCIpO1xuXHR9O1xuXHRiZy5zcmMgPSBcIi9pbWFnZXMvbWFwc2hvdHMvXCIrbmFtZStcIi5qcGdcIjtcbn1cblxuZnVuY3Rpb24gcmVuZGVyR2FtZSgpIHtcblx0aWYgKCFvcGVuU2VydmVySG9zdCkgcmV0dXJuO1xuXHRsZXQgbG9va0ZvciA9IGxvb2tpbmdGb3JQbGF5ZXIudG9Mb3dlckNhc2UoKTtcblx0Xy5lYWNoKG9wZW5HYW1lLnBsYXllcnMsIGZ1bmN0aW9uKHBsYXllcikge1xuICAgICAgICBpZiAobG9va0ZvciAmJiBwbGF5ZXIubmFtZS50b0xvd2VyQ2FzZSgpLmluZGV4T2YobG9va0ZvcikgPj0gMCkgcGxheWVyLmhpZ2hsaWdodCA9IHRydWU7XG4gICAgICAgIGVsc2UgcGxheWVyLmhpZ2hsaWdodCA9IGZhbHNlO1xuICAgIH0pO1xuXHQkKFwiI3NlcnZlci1pbmZvLWNvbnRlbnRcIikuaHRtbChnYW1lVGVtcGxhdGUoeyBzZXJ2ZXI6IG9wZW5HYW1lLCB2YXJzOiB2YXJzLCBfOiBfIH0pKTtcblx0dHJ5TG9hZEJhY2tncm91bmQob3BlbkdhbWUubWFwTmFtZSk7XG59XG5cbmZ1bmN0aW9uIGxvYWRTZXJ2ZXIoaG9zdCwgcG9ydCkge1xuXHQkLmdldChcIi9hcGkvc2VydmVyL1wiK2hvc3QrXCIvXCIrcG9ydCwgZnVuY3Rpb24ocmVzdWx0KSB7XG5cdFx0aWYgKCFvcGVuU2VydmVySG9zdCB8fCBvcGVuU2VydmVySG9zdCAhPSBob3N0IHx8IG9wZW5TZXJ2ZXJQb3J0ICE9IHBvcnQpIHJldHVybjtcblx0XHRvcGVuR2FtZSA9IHJlc3VsdDtcblx0XHRyZW5kZXJHYW1lKCk7XG5cdH0pO1xufVxuXG53aW5kb3cuc2hvd1NlcnZlciA9IGZ1bmN0aW9uKGhvc3QsIHBvcnQpIHtcblx0JChcIiNzZXJ2ZXItaW5mby1jb250ZW50XCIpLmh0bWwoJzxkaXYgc3R5bGU9XCJ0ZXh0LWFsaWduOiBjZW50ZXI7IG1hcmdpbi10b3A6IDRlbTtcIj48aSBjbGFzcz1cImZhIGZhLXNwaW5uZXIgZmEtcHVsc2UgZmEtNHhcIj48L2k+PC9kaXY+Jyk7XG5cdCQoXCIjc2VydmVyLWluZm9cIikuY3NzKFwiYmFja2dyb3VuZFwiLCBcInJnYmEoMjcsIDI3LCAyNywgMC44OSlcIik7XG5cdGxvYWRTZXJ2ZXIoaG9zdCwgcG9ydCk7XG5cdCQoXCIjc2VydmVyLWluZm9cIikuY3NzKFwiZGlzcGxheVwiLCBcImJsb2NrXCIpO1xuXHQkKFwiI3NlcnZlci1pbmZvXCIpLmFuaW1hdGUoeyBoZWlnaHQ6IFwiMzAwcHhcIiwgc2Nyb2xsVG9wOiAwIH0sIDM1MCwgXCJsaW5lYXJcIik7XG5cdG9wZW5TZXJ2ZXJIb3N0ID0gaG9zdDtcblx0b3BlblNlcnZlclBvcnQgPSBwb3J0O1xuXHRyZXR1cm4gZmFsc2U7XG59O1xuXG53aW5kb3cuaGlkZVNlcnZlciA9IGZ1bmN0aW9uKCkge1xuXHQkKFwiI3NlcnZlci1pbmZvXCIpLmFuaW1hdGUoeyBoZWlnaHQ6IFwiMHB4XCIgfSwgMzUwLCBcImxpbmVhclwiLCBmdW5jdGlvbigpIHtcblx0XHQkKFwiI3NlcnZlci1pbmZvXCIpLmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHR9KTtcblx0b3BlblNlcnZlckhvc3QgPSBcIlwiO1xufTtcblxud2luZG93LmV4cGFuZFNlcnZlciA9IGZ1bmN0aW9uKCkge1xuXHRpZiAoIW9wZW5TZXJ2ZXJIb3N0KSByZXR1cm47XG5cdHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gXCIvc2VydmVyL1wiK29wZW5TZXJ2ZXJIb3N0K1wiL1wiK29wZW5TZXJ2ZXJQb3J0O1xufTtcblxuZnVuY3Rpb24gdXBkYXRlQWxsKCkge1xuXHRpZiAob3BlblNlcnZlckhvc3QpIGxvYWRTZXJ2ZXIob3BlblNlcnZlckhvc3QsIG9wZW5TZXJ2ZXJQb3J0KTtcblx0aWYgKHBhdXNlVXBkYXRlKSByZXR1cm47XG5cdCQuZ2V0KFwiL2FwaS9zZXJ2ZXJzXCIsIGZ1bmN0aW9uKHJlc3VsdCkge1xuXHRcdHNlcnZlcnMgPSByZXN1bHQ7XG5cdFx0Xy5lYWNoKHNlcnZlcnMsIChzZXJ2ZXIpID0+IHtcblx0XHRcdHNlcnZlci5mdWxsVGV4dCA9IChfLnZhbHVlcyhfLnBpY2soc2VydmVyLCBbIFwiZ2FtZU1vZGVcIiwgXCJtYXBOYW1lXCIsIFwibWFzdGVyTW9kZVwiLCBcImNvdW50cnlcIiwgXCJjb3VudHJ5TmFtZVwiLCBcImhvc3RcIiBdKSkuam9pbihcIiBcIikrXCI6XCIrc2VydmVyLnBvcnQpLnRvTG93ZXJDYXNlKCk7XG5cdFx0fSk7XG5cdFx0cmVuZGVyU2VydmVycygpO1xuXHR9KTtcbn1cbnNldEludGVydmFsKHVwZGF0ZUFsbCwgNTAwMCk7XG5cbiQoJy50eXBlYWhlYWQnKS50eXBlYWhlYWQoe30sXG57XG5cdG5hbWU6ICdwbGF5ZXJzJyxcblx0c291cmNlOiBwbGF5ZXJTdWdnZXN0aW9uc1xufSk7XG5cbndpbmRvdy5vbnVubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHQkKFwiI3NlcnZlci1pbmZvXCIpLmNzcyhcImRpc3BsYXlcIiwgXCJub25lXCIpO1xuXHRvcGVuU2VydmVySG9zdCA9IFwiXCI7XG59O1xuXG4kKCcuYmFubmVyIC54LWJ1dHRvbicpLmNsaWNrKGZ1bmN0aW9uIChlKSB7XG5cdCQoJy5iYW5uZXInKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuXHRlLnN0b3BQcm9wYWdhdGlvbigpO1xuXHRzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdoaWRlQmFubmVyJywgJ3RydWUnKTtcbn0pO1xuXG5pZiAoc2Vzc2lvblN0b3JhZ2UuZ2V0SXRlbSgnaGlkZUJhbm5lcicpID09ICd0cnVlJykgJCgnLmJhbm5lcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4iLCJ2YXIgcHVnID0gcmVxdWlyZShcInB1Zy1ydW50aW1lXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlO2Z1bmN0aW9uIHB1Z19hdHRyKHQsZSxuLGYpe3JldHVybiBlIT09ITEmJm51bGwhPWUmJihlfHxcImNsYXNzXCIhPT10JiZcInN0eWxlXCIhPT10KT9lPT09ITA/XCIgXCIrKGY/dDp0Kyc9XCInK3QrJ1wiJyk6KFwiZnVuY3Rpb25cIj09dHlwZW9mIGUudG9KU09OJiYoZT1lLnRvSlNPTigpKSxcInN0cmluZ1wiPT10eXBlb2YgZXx8KGU9SlNPTi5zdHJpbmdpZnkoZSksbnx8ZS5pbmRleE9mKCdcIicpPT09LTEpPyhuJiYoZT1wdWdfZXNjYXBlKGUpKSxcIiBcIit0Kyc9XCInK2UrJ1wiJyk6XCIgXCIrdCtcIj0nXCIrZS5yZXBsYWNlKC8nL2csXCImIzM5O1wiKStcIidcIik6XCJcIn1cbmZ1bmN0aW9uIHB1Z19lc2NhcGUoZSl7dmFyIGE9XCJcIitlLHQ9cHVnX21hdGNoX2h0bWwuZXhlYyhhKTtpZighdClyZXR1cm4gZTt2YXIgcixjLG4scz1cIlwiO2ZvcihyPXQuaW5kZXgsYz0wO3I8YS5sZW5ndGg7cisrKXtzd2l0Y2goYS5jaGFyQ29kZUF0KHIpKXtjYXNlIDM0Om49XCImcXVvdDtcIjticmVhaztjYXNlIDM4Om49XCImYW1wO1wiO2JyZWFrO2Nhc2UgNjA6bj1cIiZsdDtcIjticmVhaztjYXNlIDYyOm49XCImZ3Q7XCI7YnJlYWs7ZGVmYXVsdDpjb250aW51ZX1jIT09ciYmKHMrPWEuc3Vic3RyaW5nKGMscikpLGM9cisxLHMrPW59cmV0dXJuIGMhPT1yP3MrYS5zdWJzdHJpbmcoYyxyKTpzfVxudmFyIHB1Z19tYXRjaF9odG1sPS9bXCImPD5dLztmdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHt2YXIgcHVnX2h0bWwgPSBcIlwiLCBwdWdfbWl4aW5zID0ge30sIHB1Z19pbnRlcnA7O3ZhciBsb2NhbHNfZm9yX3dpdGggPSAobG9jYWxzIHx8IHt9KTsoZnVuY3Rpb24gKGNsYW5zT25saW5lKSB7aWYgKGNsYW5zT25saW5lICYmIGNsYW5zT25saW5lLmxlbmd0aCkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2xhYmVsIGNsYXNzPVxcXCJiaWdcXFwiXFx1MDAzRUNsYW5zIG9ubGluZTogXCI7XG4vLyBpdGVyYXRlIGNsYW5zT25saW5lXG47KGZ1bmN0aW9uKCl7XG4gIHZhciAkJG9iaiA9IGNsYW5zT25saW5lO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mICQkb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgcHVnX2luZGV4MCA9IDAsICQkbCA9ICQkb2JqLmxlbmd0aDsgcHVnX2luZGV4MCA8ICQkbDsgcHVnX2luZGV4MCsrKSB7XG4gICAgICAgIHZhciBjbGFuID0gJCRvYmpbcHVnX2luZGV4MF07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDYVwiICsgKHB1Z19hdHRyKFwidGl0bGVcIiwgKGNsYW4ucGxheWVycy5qb2luKFwiIFxcblwiKSksIHRydWUsIGZhbHNlKStwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwiZmluZFBsYXllcignXCIrY2xhbi5uYW1lLnJlcGxhY2UoL1xcJy9nLCBcIlxcXFwnXCIpK1wiJylcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBjbGFuLm5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRSBcXHUwMDNDc3BhbiBjbGFzcz1cXFwibGFiZWwgc2Vjb25kYXJ5XFxcIiBzdHlsZT1cXFwibWFyZ2luLXRvcDogLTVweFxcXCJcXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IGNsYW4uY291bnQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiIFxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0UgXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MCBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgY2xhbiA9ICQkb2JqW3B1Z19pbmRleDBdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcInRpdGxlXCIsIChjbGFuLnBsYXllcnMuam9pbihcIiBcXG5cIikpLCB0cnVlLCBmYWxzZSkrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcImZpbmRQbGF5ZXIoJ1wiK2NsYW4ubmFtZS5yZXBsYWNlKC9cXCcvZywgXCJcXFxcJ1wiKStcIicpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gY2xhbi5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0UgXFx1MDAzQ3NwYW4gY2xhc3M9XFxcImxhYmVsIHNlY29uZGFyeVxcXCIgc3R5bGU9XFxcIm1hcmdpbi10b3A6IC01cHhcXFwiXFx1MDAzRSBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBjbGFuLmNvdW50KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIiBcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFIFwiO1xuICAgIH1cbiAgfVxufSkuY2FsbCh0aGlzKTtcblxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZsYWJlbFxcdTAwM0VcIjtcbn19LmNhbGwodGhpcyxcImNsYW5zT25saW5lXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5jbGFuc09ubGluZTp0eXBlb2YgY2xhbnNPbmxpbmUhPT1cInVuZGVmaW5lZFwiP2NsYW5zT25saW5lOnVuZGVmaW5lZCkpOztyZXR1cm4gcHVnX2h0bWw7fTsiLCJ2YXIgcHVnID0gcmVxdWlyZShcInB1Zy1ydW50aW1lXCIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IHRlbXBsYXRlO2Z1bmN0aW9uIHB1Z19hdHRyKHQsZSxuLGYpe3JldHVybiBlIT09ITEmJm51bGwhPWUmJihlfHxcImNsYXNzXCIhPT10JiZcInN0eWxlXCIhPT10KT9lPT09ITA/XCIgXCIrKGY/dDp0Kyc9XCInK3QrJ1wiJyk6KFwiZnVuY3Rpb25cIj09dHlwZW9mIGUudG9KU09OJiYoZT1lLnRvSlNPTigpKSxcInN0cmluZ1wiPT10eXBlb2YgZXx8KGU9SlNPTi5zdHJpbmdpZnkoZSksbnx8ZS5pbmRleE9mKCdcIicpPT09LTEpPyhuJiYoZT1wdWdfZXNjYXBlKGUpKSxcIiBcIit0Kyc9XCInK2UrJ1wiJyk6XCIgXCIrdCtcIj0nXCIrZS5yZXBsYWNlKC8nL2csXCImIzM5O1wiKStcIidcIik6XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzKHMscil7cmV0dXJuIEFycmF5LmlzQXJyYXkocyk/cHVnX2NsYXNzZXNfYXJyYXkocyxyKTpzJiZcIm9iamVjdFwiPT10eXBlb2Ygcz9wdWdfY2xhc3Nlc19vYmplY3Qocyk6c3x8XCJcIn1cbmZ1bmN0aW9uIHB1Z19jbGFzc2VzX2FycmF5KHIsYSl7Zm9yKHZhciBzLGU9XCJcIix1PVwiXCIsYz1BcnJheS5pc0FycmF5KGEpLGc9MDtnPHIubGVuZ3RoO2crKylzPXB1Z19jbGFzc2VzKHJbZ10pLHMmJihjJiZhW2ddJiYocz1wdWdfZXNjYXBlKHMpKSxlPWUrdStzLHU9XCIgXCIpO3JldHVybiBlfVxuZnVuY3Rpb24gcHVnX2NsYXNzZXNfb2JqZWN0KHIpe3ZhciBhPVwiXCIsbj1cIlwiO2Zvcih2YXIgbyBpbiByKW8mJnJbb10mJnB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwocixvKSYmKGE9YStuK28sbj1cIiBcIik7cmV0dXJuIGF9XG5mdW5jdGlvbiBwdWdfZXNjYXBlKGUpe3ZhciBhPVwiXCIrZSx0PXB1Z19tYXRjaF9odG1sLmV4ZWMoYSk7aWYoIXQpcmV0dXJuIGU7dmFyIHIsYyxuLHM9XCJcIjtmb3Iocj10LmluZGV4LGM9MDtyPGEubGVuZ3RoO3IrKyl7c3dpdGNoKGEuY2hhckNvZGVBdChyKSl7Y2FzZSAzNDpuPVwiJnF1b3Q7XCI7YnJlYWs7Y2FzZSAzODpuPVwiJmFtcDtcIjticmVhaztjYXNlIDYwOm49XCImbHQ7XCI7YnJlYWs7Y2FzZSA2MjpuPVwiJmd0O1wiO2JyZWFrO2RlZmF1bHQ6Y29udGludWV9YyE9PXImJihzKz1hLnN1YnN0cmluZyhjLHIpKSxjPXIrMSxzKz1ufXJldHVybiBjIT09cj9zK2Euc3Vic3RyaW5nKGMscik6c31cbnZhciBwdWdfaGFzX293bl9wcm9wZXJ0eT1PYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xudmFyIHB1Z19tYXRjaF9odG1sPS9bXCImPD5dLztcbmZ1bmN0aW9uIHB1Z19zdHlsZShyKXtpZighcilyZXR1cm5cIlwiO2lmKFwib2JqZWN0XCI9PXR5cGVvZiByKXt2YXIgZT1cIlwiLHQ9XCJcIjtmb3IodmFyIG4gaW4gcilwdWdfaGFzX293bl9wcm9wZXJ0eS5jYWxsKHIsbikmJihlPWUrdCtuK1wiOlwiK3Jbbl0sdD1cIjtcIik7cmV0dXJuIGV9cmV0dXJuIHI9XCJcIityLFwiO1wiPT09cltyLmxlbmd0aC0xXT9yLnNsaWNlKDAsLTEpOnJ9ZnVuY3Rpb24gdGVtcGxhdGUobG9jYWxzKSB7dmFyIHB1Z19odG1sID0gXCJcIiwgcHVnX21peGlucyA9IHt9LCBwdWdfaW50ZXJwOzt2YXIgbG9jYWxzX2Zvcl93aXRoID0gKGxvY2FscyB8fCB7fSk7KGZ1bmN0aW9uIChEYXRlLCBfLCBlbmNvZGVVUklDb21wb25lbnQsIHNlcnZlciwgdmFycykge2lmICghc2VydmVyIHx8ICFzZXJ2ZXIuZ2FtZU1vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlNlcnZlciBub3QgZm91bmQuXCI7XG59XG5lbHNlIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXYgY2xhc3M9XFxcInJvd1xcXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwibGFyZ2UtNCBjb2x1bW5zXFxcIlxcdTAwM0VcXHUwMDNDaDJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImhyZWZcIiwgKFwiL3NlcnZlci9cIitzZXJ2ZXIuaG9zdCtcIi9cIitzZXJ2ZXIucG9ydCksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmRlc2NyaXB0aW9uU3R5bGVkKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGaDJcXHUwMDNFXFx1MDAzQ2FcIiArIChcIiBpZD1cXFwic2VydmVyLWFkZHJlc3NcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIFwic2hvd0Nvbm5lY3QoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuaG9zdCkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCI6XCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLnBvcnQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NzcGFuXFx1MDAzRSB8ICBcIjtcbmlmICgoc2VydmVyLmNvdW50cnkgJiYgc2VydmVyLmNvdW50cnkgIT0gXCJ1bmtub3duXCIpKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaW1nXCIgKyAoXCIgY2xhc3M9XFxcImZsYWdcXFwiXCIrcHVnX2F0dHIoXCJzcmNcIiwgXCIvaW1hZ2VzL2ZsYWdzL1wiK3NlcnZlci5jb3VudHJ5K1wiLnBuZ1wiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5jb3VudHJ5TmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwibGFyZ2UtNiBjb2x1bW5zIGVuZFxcXCIgc3R5bGU9XFxcIm1hcmdpbi10b3A6IDEwcHhcXFwiXFx1MDAzRVwiO1xuaWYgKHNlcnZlci5pbmZvLmJhbm5lZCkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3NwYW4gc3R5bGU9XFxcImNvbG9yOiByZWRcXFwiXFx1MDAzRVRoaXMgc2VydmVyIGlzIGJhbm5lZC4gUmVhc29uOiBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuaW5mby5iYW5uZWQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiLlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbmVsc2Uge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImhyZWZcIiwgKFwiL2dhbWVzL2ZpbmQ/aG9zdD1cIitzZXJ2ZXIuaG9zdCtcIiZwb3J0PVwiK3NlcnZlci5wb3J0KSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVZpZXcgb3RoZXIgZ2FtZXMgZnJvbSB0aGlzIHNlcnZlci4uLlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NiclxcdTAwMkZcXHUwMDNFXCI7XG5pZiAoc2VydmVyLnpvbWJpZSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3NwYW4gc3R5bGU9XFxcImNvbG9yOiByZWRcXFwiXFx1MDAzRVpvbWJpZSBnYW1lcyBhcmUgbm90IHJlY29yZGVkLlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcXHUwMDNDYnJcXHUwMDJGXFx1MDAzRVwiO1xufVxuaWYgKHNlcnZlci5nYW1lTW9kZSA9PSBcImNvb3BfZWRpdFwiKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDc3BhbiBzdHlsZT1cXFwiY29sb3I6IHJlZFxcXCJcXHUwMDNFQ29vcC1lZGl0IGdhbWVzIGFyZSBub3QgcmVjb3JkZWQuXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVxcdTAwM0NiclxcdTAwMkZcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaDUgc3R5bGU9XFxcIm1hcmdpbi10b3A6IDEwcHhcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5nYW1lTW9kZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDc3BhbiBpZD1cXFwibWFwLW5hbWVcXFwiXFx1MDAzRSBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIubWFwTmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXCI7XG5pZiAoc2VydmVyLm1hc3Rlck1vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIiB8XFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcInN0eWxlXCIsIHB1Z19zdHlsZSgoXCJjb2xvcjogXCIrdmFycy5tYXRlck1vZGVDb2xvcnNbc2VydmVyLm1hc3Rlck1vZGVdKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLm1hc3Rlck1vZGUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVwiO1xufVxuaWYgKHNlcnZlci5nYW1lVHlwZSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIChcIiB8IFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5nYW1lVHlwZSkgPyBcIlwiIDogcHVnX2ludGVycCkpKTtcbn1cbmlmIChzZXJ2ZXIudGltZUxlZnRTKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgKFwiIHwgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLnRpbWVMZWZ0UykgPyBcIlwiIDogcHVnX2ludGVycCkpKTtcbmlmIChzZXJ2ZXIudGltZUxlZnRTICE9IFwiaW50ZXJtaXNzaW9uXCIpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIiBsZWZ0XCI7XG59XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgKFwiIHxcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwic3R5bGVcIiwgcHVnX3N0eWxlKChzZXJ2ZXIuY2xpZW50cz09c2VydmVyLm1heENsaWVudHM/IFwiY29sb3I6IHllbGxvd1wiOiBcIlwiKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmNsaWVudHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSk7XG5pZiAoc2VydmVyLm1heENsaWVudHMpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyAoXCJcXHUwMDJGXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLm1heENsaWVudHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSk7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFIHBsYXllcnNcIjtcbmlmIChzZXJ2ZXIudGltZSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiIHwgIFxcdTAwM0NzcGFuIGNsYXNzPVxcXCJkYXRlXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSAoc2VydmVyLnRpbWUgaW5zdGFuY2VvZiBEYXRlKT8gc2VydmVyLnRpbWUudG9KU09OKCk6IHNlcnZlci50aW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGaDVcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG52YXIgcGxheWVycyA9IF8uZ3JvdXBCeShzZXJ2ZXIucGxheWVycywgZnVuY3Rpb24gKHBsKSB7IHJldHVybiBwbC5zdGF0ZT09NTsgfSk7XG52YXIgc3BlY3MgPSBwbGF5ZXJzW3RydWVdO1xucGxheWVycyA9IHBsYXllcnNbZmFsc2VdO1xudmFyIHRlYW1Nb2RlID0gdmFycy5nYW1lTW9kZXNbc2VydmVyLmdhbWVNb2RlXS50ZWFtTW9kZTtcbnZhciBmbGFnTW9kZSA9IHZhcnMuZ2FtZU1vZGVzW3NlcnZlci5nYW1lTW9kZV0uZmxhZ01vZGU7XG5pZiAoIXRlYW1Nb2RlKSB7XG50ZWFtcyA9IFt7cGxheWVyczogcGxheWVyc31dO1xufSBlbHNlIHtcbnZhciB0ZWFtcyA9IF8uZ3JvdXBCeShwbGF5ZXJzLCBcInRlYW1cIik7XG50ZWFtcyA9IF8ub3JkZXJCeShfLm1hcChzZXJ2ZXIudGVhbXMsIGZ1bmN0aW9uICh2YWwsIGtleSkge1xuaWYgKHRlYW1Nb2RlICYmICFmbGFnTW9kZSkgdmFsID0gXy5zdW1CeSh0ZWFtc1trZXldLCBcImZyYWdzXCIpO1xucmV0dXJuIHtuYW1lOiBrZXksIHNjb3JlOiB2YWwsIHBsYXllcnM6IHRlYW1zW2tleV19O1xufSksIFwic2NvcmVcIiwgXCJkZXNjXCIpO1xufVxuXy5lYWNoKHRlYW1zLCBmdW5jdGlvbiAodGVhbSkgeyB0ZWFtLnBsYXllcnMgPSBfLm9yZGVyQnkodGVhbS5wbGF5ZXJzLCBbXCJmbGFnc1wiLCBcImZyYWdzXCIsIFwiZGVhdGhzXCJdLCBbXCJkZXNjXCIsIFwiZGVzY1wiLCBcImFzY1wiXSk7IH0pXG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiIHN0eWxlPVxcXCJtYXJnaW4tdG9wOiAxMHB4XFxcIlxcdTAwM0VcIjtcbi8vIGl0ZXJhdGUgdGVhbXNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gdGVhbXM7XG4gIGlmICgnbnVtYmVyJyA9PSB0eXBlb2YgJCRvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBpID0gMCwgJCRsID0gJCRvYmoubGVuZ3RoOyBpIDwgJCRsOyBpKyspIHtcbiAgICAgICAgdmFyIHRlYW0gPSAkJG9ialtpXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXZcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcIm1lZGl1bS02XCIsXCJsYXJnZS00XCIsXCJjb2x1bW5zXCIsKGk9PXRlYW1zLmxlbmd0aC0xPyBcImVuZFwiOiB1bmRlZmluZWQpXSwgW2ZhbHNlLGZhbHNlLGZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEyIGNvbHVtbnNcXFwiXFx1MDAzRVwiO1xuaWYgKCF0ZWFtTW9kZSAmJiB0ZWFtLnBsYXllcnMubGVuZ3RoKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDbGFiZWwgY2xhc3M9XFxcImJpZ1xcXCJcXHUwMDNFUGxheWVyc1xcdTAwM0NcXHUwMDJGbGFiZWxcXHUwMDNFXCI7XG59XG5lbHNlIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NsYWJlbCBjbGFzcz1cXFwiYmlnXFxcIlxcdTAwM0VcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoWyh0ZWFtLm5hbWU9PVwiZ29vZFwiPyBcInByaW1hcnlcIjogXCJhbGVydFwiKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gdGVhbS5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gdGVhbS5zY29yZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmxhYmVsXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHRlYW0ucGxheWVyc1xuOyhmdW5jdGlvbigpe1xuICB2YXIgJCRvYmogPSB0ZWFtLnBsYXllcnM7XG4gIGlmICgnbnVtYmVyJyA9PSB0eXBlb2YgJCRvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBwdWdfaW5kZXgxID0gMCwgJCRsID0gJCRvYmoubGVuZ3RoOyBwdWdfaW5kZXgxIDwgJCRsOyBwdWdfaW5kZXgxKyspIHtcbiAgICAgICAgdmFyIHBsYXllciA9ICQkb2JqW3B1Z19pbmRleDFdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEgY29sdW1uc1xcXCJcXHUwMDNFXCI7XG5pZiAoZmxhZ01vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChwbGF5ZXIuZmxhZ3M/IFwic3VjY2Vzc1wiOiBcInNlY29uZGFyeVwiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZsYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsocGxheWVyLmhpZ2hsaWdodD8gXCJoaWdobGlnaHRlZFwiOiBudWxsKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9wbGF5ZXIvXCIrZW5jb2RlVVJJQ29tcG9uZW50KHBsYXllci5uYW1lKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMiBjb2x1bW5zXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZnJhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5kZWF0aHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNSBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXCI7XG5pZiAocGxheWVyLmNvdW50cnkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3BsYXllci5jb3VudHJ5K1wiLnBuZ1wiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0UgXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwibm8tY29sb3JcXFwiXCIrcHVnX2F0dHIoXCJocmVmXCIsIFwiL3BsYXllcnMvZmluZD9jb3VudHJ5PVwiK3BsYXllci5jb3VudHJ5LCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmNvdW50cnkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MSBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgcGxheWVyID0gJCRvYmpbcHVnX2luZGV4MV07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3cgYm9yZGVyZWQtbGVmdFxcXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMSBjb2x1bW5zXFxcIlxcdTAwM0VcIjtcbmlmIChmbGFnTW9kZSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcImxhYmVsXCIsKHBsYXllci5mbGFncz8gXCJzdWNjZXNzXCI6IFwic2Vjb25kYXJ5XCIpXSwgW2ZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZmxhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNCBjb2x1bW5zXFxcIlxcdTAwM0VcXHUwMDNDYVwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoWyhwbGF5ZXIuaGlnaGxpZ2h0PyBcImhpZ2hsaWdodGVkXCI6IG51bGwpXSwgW3RydWVdKSwgZmFsc2UsIGZhbHNlKStwdWdfYXR0cihcImhyZWZcIiwgKFwiL3BsYXllci9cIitlbmNvZGVVUklDb21wb25lbnQocGxheWVyLm5hbWUpKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0yIGNvbHVtbnNcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mcmFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDJGXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmRlYXRocykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC01IGNvbHVtbnMgZW5kXFxcIlxcdTAwM0VcIjtcbmlmIChwbGF5ZXIuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIChcIi9pbWFnZXMvZmxhZ3MvXCIrcGxheWVyLmNvdW50cnkrXCIucG5nXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRSBcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJuby1jb2xvclxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvcGxheWVycy9maW5kP2NvdW50cnk9XCIrcGxheWVyLmNvdW50cnksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuY291bnRyeSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbiAgICB9XG4gIH1cbn0pLmNhbGwodGhpcyk7XG5cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgICAgfVxuICB9IGVsc2Uge1xuICAgIHZhciAkJGwgPSAwO1xuICAgIGZvciAodmFyIGkgaW4gJCRvYmopIHtcbiAgICAgICQkbCsrO1xuICAgICAgdmFyIHRlYW0gPSAkJG9ialtpXTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NkaXZcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcIm1lZGl1bS02XCIsXCJsYXJnZS00XCIsXCJjb2x1bW5zXCIsKGk9PXRlYW1zLmxlbmd0aC0xPyBcImVuZFwiOiB1bmRlZmluZWQpXSwgW2ZhbHNlLGZhbHNlLGZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3dcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEyIGNvbHVtbnNcXFwiXFx1MDAzRVwiO1xuaWYgKCF0ZWFtTW9kZSAmJiB0ZWFtLnBsYXllcnMubGVuZ3RoKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDbGFiZWwgY2xhc3M9XFxcImJpZ1xcXCJcXHUwMDNFUGxheWVyc1xcdTAwM0NcXHUwMDJGbGFiZWxcXHUwMDNFXCI7XG59XG5lbHNlIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NsYWJlbCBjbGFzcz1cXFwiYmlnXFxcIlxcdTAwM0VcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoWyh0ZWFtLm5hbWU9PVwiZ29vZFwiPyBcInByaW1hcnlcIjogXCJhbGVydFwiKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gdGVhbS5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gdGVhbS5zY29yZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmxhYmVsXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHRlYW0ucGxheWVyc1xuOyhmdW5jdGlvbigpe1xuICB2YXIgJCRvYmogPSB0ZWFtLnBsYXllcnM7XG4gIGlmICgnbnVtYmVyJyA9PSB0eXBlb2YgJCRvYmoubGVuZ3RoKSB7XG4gICAgICBmb3IgKHZhciBwdWdfaW5kZXgyID0gMCwgJCRsID0gJCRvYmoubGVuZ3RoOyBwdWdfaW5kZXgyIDwgJCRsOyBwdWdfaW5kZXgyKyspIHtcbiAgICAgICAgdmFyIHBsYXllciA9ICQkb2JqW3B1Z19pbmRleDJdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTEgY29sdW1uc1xcXCJcXHUwMDNFXCI7XG5pZiAoZmxhZ01vZGUpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NzcGFuXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJsYWJlbFwiLChwbGF5ZXIuZmxhZ3M/IFwic3VjY2Vzc1wiOiBcInNlY29uZGFyeVwiKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmZsYWdzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsocGxheWVyLmhpZ2hsaWdodD8gXCJoaWdobGlnaHRlZFwiOiBudWxsKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9wbGF5ZXIvXCIrZW5jb2RlVVJJQ29tcG9uZW50KHBsYXllci5uYW1lKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMiBjb2x1bW5zXFxcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZnJhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5kZWF0aHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNSBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXCI7XG5pZiAocGxheWVyLmNvdW50cnkpIHtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3BsYXllci5jb3VudHJ5K1wiLnBuZ1wiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0UgXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwibm8tY29sb3JcXFwiXCIrcHVnX2F0dHIoXCJocmVmXCIsIFwiL3BsYXllcnMvZmluZD9jb3VudHJ5PVwiK3BsYXllci5jb3VudHJ5LCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmNvdW50cnkpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MiBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgcGxheWVyID0gJCRvYmpbcHVnX2luZGV4Ml07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3cgYm9yZGVyZWQtbGVmdFxcXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtMSBjb2x1bW5zXFxcIlxcdTAwM0VcIjtcbmlmIChmbGFnTW9kZSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcImxhYmVsXCIsKHBsYXllci5mbGFncz8gXCJzdWNjZXNzXCI6IFwic2Vjb25kYXJ5XCIpXSwgW2ZhbHNlLHRydWVdKSwgZmFsc2UsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuZmxhZ3MpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZzcGFuXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNCBjb2x1bW5zXFxcIlxcdTAwM0VcXHUwMDNDYVwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoWyhwbGF5ZXIuaGlnaGxpZ2h0PyBcImhpZ2hsaWdodGVkXCI6IG51bGwpXSwgW3RydWVdKSwgZmFsc2UsIGZhbHNlKStwdWdfYXR0cihcImhyZWZcIiwgKFwiL3BsYXllci9cIitlbmNvZGVVUklDb21wb25lbnQocGxheWVyLm5hbWUpKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5uYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC0yIGNvbHVtbnNcXFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHBsYXllci5mcmFncykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDJGXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gcGxheWVyLmRlYXRocykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDZGl2IGNsYXNzPVxcXCJzbWFsbC01IGNvbHVtbnMgZW5kXFxcIlxcdTAwM0VcIjtcbmlmIChwbGF5ZXIuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIChcIi9pbWFnZXMvZmxhZ3MvXCIrcGxheWVyLmNvdW50cnkrXCIucG5nXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRSBcXHUwMDNDYVwiICsgKFwiIGNsYXNzPVxcXCJuby1jb2xvclxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvcGxheWVycy9maW5kP2NvdW50cnk9XCIrcGxheWVyLmNvdW50cnksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBwbGF5ZXIuY291bnRyeSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbiAgICB9XG4gIH1cbn0pLmNhbGwodGhpcyk7XG5cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgIH1cbiAgfVxufSkuY2FsbCh0aGlzKTtcblxuaWYgKHNwZWNzKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJtZWRpdW0tNiBsYXJnZS00IGNvbHVtbnMgZW5kXFxcIlxcdTAwM0VcXHUwMDNDbGFiZWwgY2xhc3M9XFxcImJpZ1xcXCJcXHUwMDNFU3BlY3RhdG9yc1xcdTAwM0NcXHUwMDJGbGFiZWxcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHNwZWNzXG47KGZ1bmN0aW9uKCl7XG4gIHZhciAkJG9iaiA9IHNwZWNzO1xuICBpZiAoJ251bWJlcicgPT0gdHlwZW9mICQkb2JqLmxlbmd0aCkge1xuICAgICAgZm9yICh2YXIgcHVnX2luZGV4MyA9IDAsICQkbCA9ICQkb2JqLmxlbmd0aDsgcHVnX2luZGV4MyA8ICQkbDsgcHVnX2luZGV4MysrKSB7XG4gICAgICAgIHZhciBzcGVjID0gJCRvYmpbcHVnX2luZGV4M107XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDZGl2IGNsYXNzPVxcXCJyb3cgYm9yZGVyZWQtbGVmdFxcXCJcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNCBjb2x1bW5zXFxcIlxcdTAwM0VcXHUwMDNDYVwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoWyhzcGVjLmhpZ2hsaWdodD8gXCJoaWdobGlnaHRlZFwiOiBudWxsKV0sIFt0cnVlXSksIGZhbHNlLCBmYWxzZSkrcHVnX2F0dHIoXCJocmVmXCIsIChcIi9wbGF5ZXIvXCIrc3BlYy5uYW1lKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNwZWMubmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRmFcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ2RpdiBjbGFzcz1cXFwic21hbGwtNSBjb2x1bW5zIGVuZFxcXCJcXHUwMDNFXCI7XG5pZiAoc3BlYy5jb3VudHJ5KSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgKFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIChcIi9pbWFnZXMvZmxhZ3MvXCIrc3BlYy5jb3VudHJ5K1wiLnBuZ1wiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0UgXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc3BlYy5jb3VudHJ5KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkpO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG4gICAgICB9XG4gIH0gZWxzZSB7XG4gICAgdmFyICQkbCA9IDA7XG4gICAgZm9yICh2YXIgcHVnX2luZGV4MyBpbiAkJG9iaikge1xuICAgICAgJCRsKys7XG4gICAgICB2YXIgc3BlYyA9ICQkb2JqW3B1Z19pbmRleDNdO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2RpdiBjbGFzcz1cXFwicm93IGJvcmRlcmVkLWxlZnRcXFwiXFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTQgY29sdW1uc1xcXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFsoc3BlYy5oaWdobGlnaHQ/IFwiaGlnaGxpZ2h0ZWRcIjogbnVsbCldLCBbdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpK3B1Z19hdHRyKFwiaHJlZlwiLCAoXCIvcGxheWVyL1wiK3NwZWMubmFtZSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzcGVjLm5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NkaXYgY2xhc3M9XFxcInNtYWxsLTUgY29sdW1ucyBlbmRcXFwiXFx1MDAzRVwiO1xuaWYgKHNwZWMuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIChcIlxcdTAwM0NpbWdcIiArIChcIiBjbGFzcz1cXFwiZmxhZ1xcXCJcIitwdWdfYXR0cihcInNyY1wiLCAoXCIvaW1hZ2VzL2ZsYWdzL1wiK3NwZWMuY291bnRyeStcIi5wbmdcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwMkZcXHUwMDNFIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNwZWMuY291bnRyeSkgPyBcIlwiIDogcHVnX2ludGVycCkpKTtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVxcdTAwM0NcXHUwMDJGZGl2XFx1MDAzRVwiO1xuICAgIH1cbiAgfVxufSkuY2FsbCh0aGlzKTtcblxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZkaXZcXHUwMDNFXCI7XG59XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRmRpdlxcdTAwM0VcIjtcbn19LmNhbGwodGhpcyxcIkRhdGVcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLkRhdGU6dHlwZW9mIERhdGUhPT1cInVuZGVmaW5lZFwiP0RhdGU6dW5kZWZpbmVkLFwiX1wiIGluIGxvY2Fsc19mb3Jfd2l0aD9sb2NhbHNfZm9yX3dpdGguXzp0eXBlb2YgXyE9PVwidW5kZWZpbmVkXCI/Xzp1bmRlZmluZWQsXCJlbmNvZGVVUklDb21wb25lbnRcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLmVuY29kZVVSSUNvbXBvbmVudDp0eXBlb2YgZW5jb2RlVVJJQ29tcG9uZW50IT09XCJ1bmRlZmluZWRcIj9lbmNvZGVVUklDb21wb25lbnQ6dW5kZWZpbmVkLFwic2VydmVyXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5zZXJ2ZXI6dHlwZW9mIHNlcnZlciE9PVwidW5kZWZpbmVkXCI/c2VydmVyOnVuZGVmaW5lZCxcInZhcnNcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLnZhcnM6dHlwZW9mIHZhcnMhPT1cInVuZGVmaW5lZFwiP3ZhcnM6dW5kZWZpbmVkKSk7O3JldHVybiBwdWdfaHRtbDt9OyIsInZhciBwdWcgPSByZXF1aXJlKFwicHVnLXJ1bnRpbWVcIik7XG5cbm1vZHVsZS5leHBvcnRzID0gdGVtcGxhdGU7ZnVuY3Rpb24gcHVnX2F0dHIodCxlLG4sZil7cmV0dXJuIGUhPT0hMSYmbnVsbCE9ZSYmKGV8fFwiY2xhc3NcIiE9PXQmJlwic3R5bGVcIiE9PXQpP2U9PT0hMD9cIiBcIisoZj90OnQrJz1cIicrdCsnXCInKTooXCJmdW5jdGlvblwiPT10eXBlb2YgZS50b0pTT04mJihlPWUudG9KU09OKCkpLFwic3RyaW5nXCI9PXR5cGVvZiBlfHwoZT1KU09OLnN0cmluZ2lmeShlKSxufHxlLmluZGV4T2YoJ1wiJyk9PT0tMSk/KG4mJihlPXB1Z19lc2NhcGUoZSkpLFwiIFwiK3QrJz1cIicrZSsnXCInKTpcIiBcIit0K1wiPSdcIitlLnJlcGxhY2UoLycvZyxcIiYjMzk7XCIpK1wiJ1wiKTpcIlwifVxuZnVuY3Rpb24gcHVnX2NsYXNzZXMocyxyKXtyZXR1cm4gQXJyYXkuaXNBcnJheShzKT9wdWdfY2xhc3Nlc19hcnJheShzLHIpOnMmJlwib2JqZWN0XCI9PXR5cGVvZiBzP3B1Z19jbGFzc2VzX29iamVjdChzKTpzfHxcIlwifVxuZnVuY3Rpb24gcHVnX2NsYXNzZXNfYXJyYXkocixhKXtmb3IodmFyIHMsZT1cIlwiLHU9XCJcIixjPUFycmF5LmlzQXJyYXkoYSksZz0wO2c8ci5sZW5ndGg7ZysrKXM9cHVnX2NsYXNzZXMocltnXSkscyYmKGMmJmFbZ10mJihzPXB1Z19lc2NhcGUocykpLGU9ZSt1K3MsdT1cIiBcIik7cmV0dXJuIGV9XG5mdW5jdGlvbiBwdWdfY2xhc3Nlc19vYmplY3Qocil7dmFyIGE9XCJcIixuPVwiXCI7Zm9yKHZhciBvIGluIHIpbyYmcltvXSYmcHVnX2hhc19vd25fcHJvcGVydHkuY2FsbChyLG8pJiYoYT1hK24rbyxuPVwiIFwiKTtyZXR1cm4gYX1cbmZ1bmN0aW9uIHB1Z19lc2NhcGUoZSl7dmFyIGE9XCJcIitlLHQ9cHVnX21hdGNoX2h0bWwuZXhlYyhhKTtpZighdClyZXR1cm4gZTt2YXIgcixjLG4scz1cIlwiO2ZvcihyPXQuaW5kZXgsYz0wO3I8YS5sZW5ndGg7cisrKXtzd2l0Y2goYS5jaGFyQ29kZUF0KHIpKXtjYXNlIDM0Om49XCImcXVvdDtcIjticmVhaztjYXNlIDM4Om49XCImYW1wO1wiO2JyZWFrO2Nhc2UgNjA6bj1cIiZsdDtcIjticmVhaztjYXNlIDYyOm49XCImZ3Q7XCI7YnJlYWs7ZGVmYXVsdDpjb250aW51ZX1jIT09ciYmKHMrPWEuc3Vic3RyaW5nKGMscikpLGM9cisxLHMrPW59cmV0dXJuIGMhPT1yP3MrYS5zdWJzdHJpbmcoYyxyKTpzfVxudmFyIHB1Z19oYXNfb3duX3Byb3BlcnR5PU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG52YXIgcHVnX21hdGNoX2h0bWw9L1tcIiY8Pl0vO1xuZnVuY3Rpb24gcHVnX3N0eWxlKHIpe2lmKCFyKXJldHVyblwiXCI7aWYoXCJvYmplY3RcIj09dHlwZW9mIHIpe3ZhciBlPVwiXCIsdD1cIlwiO2Zvcih2YXIgbiBpbiByKXB1Z19oYXNfb3duX3Byb3BlcnR5LmNhbGwocixuKSYmKGU9ZSt0K24rXCI6XCIrcltuXSx0PVwiO1wiKTtyZXR1cm4gZX1yZXR1cm4gcj1cIlwiK3IsXCI7XCI9PT1yW3IubGVuZ3RoLTFdP3Iuc2xpY2UoMCwtMSk6cn1mdW5jdGlvbiB0ZW1wbGF0ZShsb2NhbHMpIHt2YXIgcHVnX2h0bWwgPSBcIlwiLCBwdWdfbWl4aW5zID0ge30sIHB1Z19pbnRlcnA7O3ZhciBsb2NhbHNfZm9yX3dpdGggPSAobG9jYWxzIHx8IHt9KTsoZnVuY3Rpb24gKGhpZGVFbXB0eSwgc2VydmVycywgc29ydE9yZGVyLCBzb3J0ZWRCeSwgdmFycykge3B1Z19taXhpbnNbXCJzb3J0YWJsZVwiXSA9IHB1Z19pbnRlcnAgPSBmdW5jdGlvbihuYW1lLCB2YWx1ZSl7XG52YXIgYmxvY2sgPSAodGhpcyAmJiB0aGlzLmJsb2NrKSwgYXR0cmlidXRlcyA9ICh0aGlzICYmIHRoaXMuYXR0cmlidXRlcykgfHwge307XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDYVwiICsgKHB1Z19hdHRyKFwib25jbGlja1wiLCBcInNvcnRCeSgnXCIrdmFsdWUrXCInKVwiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gbmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCIgIFwiO1xuaWYgKHNvcnRlZEJ5ID09IHZhbHVlKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwiY2xhc3NcIiwgcHVnX2NsYXNzZXMoW1wiZmFcIiwoXCJmYS1jYXJldC1cIisoc29ydE9yZGVyPT1cImFzY1wiPyBcInVwXCI6IFwiZG93blwiKSldLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcIjtcbn07XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdGFibGUgY2xhc3M9XFxcInNjcm9sbFxcXCIgaWQ9XFxcInRhYmxlLWNvbnRlbnRzXFxcIiB3aWR0aD1cXFwiMTAwJVxcXCJcXHUwMDNFXFx1MDAzQ3RoZWFkXFx1MDAzRVxcdTAwM0N0clxcdTAwM0VcXHUwMDNDdGQgY2xhc3M9XFxcIm5vd3JhcFxcXCIgd2lkdGg9XFxcIjE4JVxcXCJcXHUwMDNFXCI7XG5wdWdfbWl4aW5zW1wic29ydGFibGVcIl0oXCJEZXNjcmlwdGlvblwiLCBcImRlc2NyaXB0aW9uXCIpO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgY2xhc3M9XFxcIm5vd3JhcFxcXCIgd2lkdGg9XFxcIjglXFxcIlxcdTAwM0VcIjtcbnB1Z19taXhpbnNbXCJzb3J0YWJsZVwiXShcIlBsYXllcnNcIiwgXCJjbGllbnRzXCIpO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGQgY2xhc3M9XFxcIm5vd3JhcFxcXCIgd2lkdGg9XFxcIjEwJVxcXCJcXHUwMDNFXCI7XG5wdWdfbWl4aW5zW1wic29ydGFibGVcIl0oXCJNb2RlXCIsIFwiZ2FtZU1vZGVcIik7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCBjbGFzcz1cXFwibm93cmFwXFxcIiB3aWR0aD1cXFwiMTElXFxcIlxcdTAwM0VcIjtcbnB1Z19taXhpbnNbXCJzb3J0YWJsZVwiXShcIk1hcFwiLCBcIm1hcE5hbWVcIik7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCBjbGFzcz1cXFwibm93cmFwXFxcIiB3aWR0aD1cXFwiOSVcXFwiXFx1MDAzRVwiO1xucHVnX21peGluc1tcInNvcnRhYmxlXCJdKFwiVGltZSBsZWZ0XCIsIFwidGltZUxlZnRcIik7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCBjbGFzcz1cXFwibm93cmFwXFxcIiB3aWR0aD1cXFwiMTAlXFxcIlxcdTAwM0VcIjtcbnB1Z19taXhpbnNbXCJzb3J0YWJsZVwiXShcIk1hc3RlciBtb2RlXCIsIFwibWFzdGVyTW9kZVwiKTtcbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkIGNsYXNzPVxcXCJub3dyYXBcXFwiIHdpZHRoPVxcXCIxMSVcXFwiXFx1MDAzRVwiO1xucHVnX21peGluc1tcInNvcnRhYmxlXCJdKFwiQ291bnRyeVwiLCBcImNvdW50cnlcIik7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZCBjbGFzcz1cXFwibm93cmFwXFxcIiB3aWR0aD1cXFwiMjIlXFxcIlxcdTAwM0VcIjtcbnB1Z19taXhpbnNbXCJzb3J0YWJsZVwiXShcIkhvc3RcIiwgXCJob3N0XCIpO1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiIDogIFwiO1xucHVnX21peGluc1tcInNvcnRhYmxlXCJdKFwiUG9ydFwiLCBcInBvcnRcIik7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0NcXHUwMDJGdHJcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0aGVhZFxcdTAwM0VcXHUwMDNDdGJvZHlcXHUwMDNFXCI7XG4vLyBpdGVyYXRlIHNlcnZlcnNcbjsoZnVuY3Rpb24oKXtcbiAgdmFyICQkb2JqID0gc2VydmVycztcbiAgaWYgKCdudW1iZXInID09IHR5cGVvZiAkJG9iai5sZW5ndGgpIHtcbiAgICAgIGZvciAodmFyIHB1Z19pbmRleDAgPSAwLCAkJGwgPSAkJG9iai5sZW5ndGg7IHB1Z19pbmRleDAgPCAkJGw7IHB1Z19pbmRleDArKykge1xuICAgICAgICB2YXIgc2VydmVyID0gJCRvYmpbcHVnX2luZGV4MF07XG5pZiAoKCFoaWRlRW1wdHkgfHwgc2VydmVyLmNsaWVudHMgPiAwKSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ3RyXCIgKyAocHVnX2F0dHIoXCJjbGFzc1wiLCBwdWdfY2xhc3NlcyhbXCJ1bmNsaWNrYWJsZVwiLChzZXJ2ZXIuaGlnaGxpZ2h0PyBcImhpZ2hsaWdodGVkXCI6IHVuZGVmaW5lZCldLCBbZmFsc2UsdHJ1ZV0pLCBmYWxzZSwgZmFsc2UpKSArIFwiXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXAgY2xpY2thYmxlXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93U2VydmVyKCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVxcdTAwM0NhXCIgKyAoXCIgY2xhc3M9XFxcImRpc2FibGUtZGVmYXVsdFxcXCJcIitwdWdfYXR0cihcImhyZWZcIiwgXCIvc2VydmVyL1wiK3NlcnZlci5ob3N0K1wiL1wiK3NlcnZlci5wb3J0LCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5kZXNjcmlwdGlvbj8gc2VydmVyLmRlc2NyaXB0aW9uU3R5bGVkOiBzZXJ2ZXIuaG9zdCtcIjpcIitzZXJ2ZXIucG9ydCkgPyBcIlwiIDogcHVnX2ludGVycCkgKyBcIlxcdTAwM0NcXHUwMDJGYVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJzdHlsZVwiLCBwdWdfc3R5bGUoKHNlcnZlci5pc0Z1bGw/IFwiY29sb3I6IHllbGxvdztcIjogXCJcIikpLCB0cnVlLCBmYWxzZSkrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dTZXJ2ZXIoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmNsaWVudHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAyRlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5tYXhDbGllbnRzKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuZ2FtZU1vZGUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChcIiBjbGFzcz1cXFwibm93cmFwIGNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIubWFwTmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dTZXJ2ZXIoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLnRpbWVMZWZ0UykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dTZXJ2ZXIoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ3NwYW5cIiArIChwdWdfYXR0cihcInN0eWxlXCIsIHB1Z19zdHlsZSgoXCJjb2xvcjogXCIrdmFycy5tYXRlck1vZGVDb2xvcnNbc2VydmVyLm1hc3Rlck1vZGVdKSksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIubWFzdGVyTW9kZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnNwYW5cXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChcIiBjbGFzcz1cXFwiY2xpY2thYmxlIG5vd3JhcFxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIjtcbmlmIChzZXJ2ZXIuY291bnRyeSkge1xucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ2ltZ1wiICsgKFwiIGNsYXNzPVxcXCJmbGFnXFxcIlwiK3B1Z19hdHRyKFwic3JjXCIsIFwiL2ltYWdlcy9mbGFncy9cIitzZXJ2ZXIuY291bnRyeStcIi5wbmdcIiwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAyRlxcdTAwM0VcIjtcbn1cbnB1Z19odG1sID0gcHVnX2h0bWwgKyBcIiBcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuY291bnRyeU5hbWUpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChcIiBjbGFzcz1cXFwiY2xpY2thYmxlXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCBcInNob3dDb25uZWN0KCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmhvc3QpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiOlwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5wb3J0KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ1xcdTAwMkZ0clxcdTAwM0VcIjtcbn1cbiAgICAgIH1cbiAgfSBlbHNlIHtcbiAgICB2YXIgJCRsID0gMDtcbiAgICBmb3IgKHZhciBwdWdfaW5kZXgwIGluICQkb2JqKSB7XG4gICAgICAkJGwrKztcbiAgICAgIHZhciBzZXJ2ZXIgPSAkJG9ialtwdWdfaW5kZXgwXTtcbmlmICgoIWhpZGVFbXB0eSB8fCBzZXJ2ZXIuY2xpZW50cyA+IDApKSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDdHJcIiArIChwdWdfYXR0cihcImNsYXNzXCIsIHB1Z19jbGFzc2VzKFtcInVuY2xpY2thYmxlXCIsKHNlcnZlci5oaWdobGlnaHQ/IFwiaGlnaGxpZ2h0ZWRcIjogdW5kZWZpbmVkKV0sIFtmYWxzZSx0cnVlXSksIGZhbHNlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcIm5vd3JhcCBjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIChcInNob3dTZXJ2ZXIoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIpLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDNFXFx1MDAzQ2FcIiArIChcIiBjbGFzcz1cXFwiZGlzYWJsZS1kZWZhdWx0XFxcIlwiK3B1Z19hdHRyKFwiaHJlZlwiLCBcIi9zZXJ2ZXIvXCIrc2VydmVyLmhvc3QrXCIvXCIrc2VydmVyLnBvcnQsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLmRlc2NyaXB0aW9uPyBzZXJ2ZXIuZGVzY3JpcHRpb25TdHlsZWQ6IHNlcnZlci5ob3N0K1wiOlwiK3NlcnZlci5wb3J0KSA/IFwiXCIgOiBwdWdfaW50ZXJwKSArIFwiXFx1MDAzQ1xcdTAwMkZhXFx1MDAzRVxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcInN0eWxlXCIsIHB1Z19zdHlsZSgoc2VydmVyLmlzRnVsbD8gXCJjb2xvcjogeWVsbG93O1wiOiBcIlwiKSksIHRydWUsIGZhbHNlKStwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuY2xpZW50cykgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDJGXCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLm1heENsaWVudHMpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDdGRcIiArIChcIiBjbGFzcz1cXFwiY2xpY2thYmxlXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93U2VydmVyKCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5nYW1lTW9kZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJub3dyYXAgY2xpY2thYmxlXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93U2VydmVyKCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5tYXBOYW1lKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIudGltZUxlZnRTKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGdGRcXHUwMDNFXFx1MDAzQ3RkXCIgKyAoXCIgY2xhc3M9XFxcImNsaWNrYWJsZVxcXCJcIitwdWdfYXR0cihcIm9uY2xpY2tcIiwgKFwic2hvd1NlcnZlcignXCIrc2VydmVyLmhvc3QrXCInLCBcIitzZXJ2ZXIucG9ydCtcIilcIiksIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcXHUwMDNDc3BhblwiICsgKHB1Z19hdHRyKFwic3R5bGVcIiwgcHVnX3N0eWxlKChcImNvbG9yOiBcIit2YXJzLm1hdGVyTW9kZUNvbG9yc1tzZXJ2ZXIubWFzdGVyTW9kZV0pKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5tYXN0ZXJNb2RlKSA/IFwiXCIgOiBwdWdfaW50ZXJwKSkgKyBcIlxcdTAwM0NcXHUwMDJGc3BhblxcdTAwM0VcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGUgbm93cmFwXFxcIlwiK3B1Z19hdHRyKFwib25jbGlja1wiLCAoXCJzaG93U2VydmVyKCdcIitzZXJ2ZXIuaG9zdCtcIicsIFwiK3NlcnZlci5wb3J0K1wiKVwiKSwgdHJ1ZSwgZmFsc2UpKSArIFwiXFx1MDAzRVwiO1xuaWYgKHNlcnZlci5jb3VudHJ5KSB7XG5wdWdfaHRtbCA9IHB1Z19odG1sICsgXCJcXHUwMDNDaW1nXCIgKyAoXCIgY2xhc3M9XFxcImZsYWdcXFwiXCIrcHVnX2F0dHIoXCJzcmNcIiwgXCIvaW1hZ2VzL2ZsYWdzL1wiK3NlcnZlci5jb3VudHJ5K1wiLnBuZ1wiLCB0cnVlLCBmYWxzZSkpICsgXCJcXHUwMDJGXFx1MDAzRVwiO1xufVxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiIFwiICsgKHB1Z19lc2NhcGUobnVsbCA9PSAocHVnX2ludGVycCA9IHNlcnZlci5jb3VudHJ5TmFtZSkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCJcXHUwMDNDXFx1MDAyRnRkXFx1MDAzRVxcdTAwM0N0ZFwiICsgKFwiIGNsYXNzPVxcXCJjbGlja2FibGVcXFwiXCIrcHVnX2F0dHIoXCJvbmNsaWNrXCIsIFwic2hvd0Nvbm5lY3QoJ1wiK3NlcnZlci5ob3N0K1wiJywgXCIrc2VydmVyLnBvcnQrXCIpXCIsIHRydWUsIGZhbHNlKSkgKyBcIlxcdTAwM0VcIiArIChwdWdfZXNjYXBlKG51bGwgPT0gKHB1Z19pbnRlcnAgPSBzZXJ2ZXIuaG9zdCkgPyBcIlwiIDogcHVnX2ludGVycCkpICsgXCI6XCIgKyAocHVnX2VzY2FwZShudWxsID09IChwdWdfaW50ZXJwID0gc2VydmVyLnBvcnQpID8gXCJcIiA6IHB1Z19pbnRlcnApKSArIFwiXFx1MDAzQ1xcdTAwMkZ0ZFxcdTAwM0VcXHUwMDNDXFx1MDAyRnRyXFx1MDAzRVwiO1xufVxuICAgIH1cbiAgfVxufSkuY2FsbCh0aGlzKTtcblxucHVnX2h0bWwgPSBwdWdfaHRtbCArIFwiXFx1MDAzQ1xcdTAwMkZ0Ym9keVxcdTAwM0VcXHUwMDNDXFx1MDAyRnRhYmxlXFx1MDAzRVwiO30uY2FsbCh0aGlzLFwiaGlkZUVtcHR5XCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5oaWRlRW1wdHk6dHlwZW9mIGhpZGVFbXB0eSE9PVwidW5kZWZpbmVkXCI/aGlkZUVtcHR5OnVuZGVmaW5lZCxcInNlcnZlcnNcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLnNlcnZlcnM6dHlwZW9mIHNlcnZlcnMhPT1cInVuZGVmaW5lZFwiP3NlcnZlcnM6dW5kZWZpbmVkLFwic29ydE9yZGVyXCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5zb3J0T3JkZXI6dHlwZW9mIHNvcnRPcmRlciE9PVwidW5kZWZpbmVkXCI/c29ydE9yZGVyOnVuZGVmaW5lZCxcInNvcnRlZEJ5XCIgaW4gbG9jYWxzX2Zvcl93aXRoP2xvY2Fsc19mb3Jfd2l0aC5zb3J0ZWRCeTp0eXBlb2Ygc29ydGVkQnkhPT1cInVuZGVmaW5lZFwiP3NvcnRlZEJ5OnVuZGVmaW5lZCxcInZhcnNcIiBpbiBsb2NhbHNfZm9yX3dpdGg/bG9jYWxzX2Zvcl93aXRoLnZhcnM6dHlwZW9mIHZhcnMhPT1cInVuZGVmaW5lZFwiP3ZhcnM6dW5kZWZpbmVkKSk7O3JldHVybiBwdWdfaHRtbDt9OyJdfQ==
