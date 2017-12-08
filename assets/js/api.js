(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
"use strict";

var $ = window.$;
var _ = window._;
var foundation = window.Foundation;
var url = window.url;
var NProgress = window.NProgress;

window.runAPI = function (self) {
    var $parent = $(self).parent().parent();
    var path = $parent.find("input").val();
    var $area = $parent.parent().find("textarea");

    $.get(path, function (result) {
        $area.val(JSON.stringify(result, null, "\t"));
    });
};

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJ3ZWJzaXRlL2pzL2FwaS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxJQUFJLE9BQU8sQ0FBZjtBQUNBLElBQUksSUFBSSxPQUFPLENBQWY7QUFDQSxJQUFJLGFBQWEsT0FBTyxVQUF4QjtBQUNBLElBQUksTUFBTSxPQUFPLEdBQWpCO0FBQ0EsSUFBSSxZQUFZLE9BQU8sU0FBdkI7O0FBRUEsT0FBTyxNQUFQLEdBQWdCLFVBQVMsSUFBVCxFQUFlO0FBQzNCLFFBQUksVUFBVSxFQUFFLElBQUYsRUFBUSxNQUFSLEdBQWlCLE1BQWpCLEVBQWQ7QUFDQSxRQUFJLE9BQU8sUUFBUSxJQUFSLENBQWEsT0FBYixFQUFzQixHQUF0QixFQUFYO0FBQ0EsUUFBSSxRQUFRLFFBQVEsTUFBUixHQUFpQixJQUFqQixDQUFzQixVQUF0QixDQUFaOztBQUVBLE1BQUUsR0FBRixDQUFNLElBQU4sRUFBWSxrQkFBVTtBQUNsQixjQUFNLEdBQU4sQ0FBVSxLQUFLLFNBQUwsQ0FBZSxNQUFmLEVBQXVCLElBQXZCLEVBQTZCLElBQTdCLENBQVY7QUFDSCxLQUZEO0FBR0gsQ0FSRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgJCA9IHdpbmRvdy4kO1xudmFyIF8gPSB3aW5kb3cuXztcbnZhciBmb3VuZGF0aW9uID0gd2luZG93LkZvdW5kYXRpb247XG52YXIgdXJsID0gd2luZG93LnVybDtcbnZhciBOUHJvZ3Jlc3MgPSB3aW5kb3cuTlByb2dyZXNzO1xuXG53aW5kb3cucnVuQVBJID0gZnVuY3Rpb24oc2VsZikge1xuICAgIGxldCAkcGFyZW50ID0gJChzZWxmKS5wYXJlbnQoKS5wYXJlbnQoKTtcbiAgICBsZXQgcGF0aCA9ICRwYXJlbnQuZmluZChcImlucHV0XCIpLnZhbCgpO1xuICAgIGxldCAkYXJlYSA9ICRwYXJlbnQucGFyZW50KCkuZmluZChcInRleHRhcmVhXCIpO1xuXG4gICAgJC5nZXQocGF0aCwgcmVzdWx0ID0+IHtcbiAgICAgICAgJGFyZWEudmFsKEpTT04uc3RyaW5naWZ5KHJlc3VsdCwgbnVsbCwgXCJcXHRcIikpO1xuICAgIH0pO1xufTtcbiJdfQ==
