(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/*!
 * Chart.js
 * http://chartjs.org/
 * Version: 1.1.1
 *
 * Copyright 2015 Nick Downie
 * Released under the MIT license
 * https://github.com/nnnick/Chart.js/blob/master/LICENSE.md
 */


(function(){

	"use strict";

	//Declare root variable - window in the browser, global on the server
	var root = this,
		previous = root.Chart;

	//Occupy the global variable of Chart, and create a simple base class
	var Chart = function(context){
		var chart = this;
		this.canvas = context.canvas;

		this.ctx = context;

		//Variables global to the chart
		var computeDimension = function(element,dimension)
		{
			if (element['offset'+dimension])
			{
				return element['offset'+dimension];
			}
			else
			{
				return document.defaultView.getComputedStyle(element).getPropertyValue(dimension);
			}
		};

		var width = this.width = computeDimension(context.canvas,'Width') || context.canvas.width;
		var height = this.height = computeDimension(context.canvas,'Height') || context.canvas.height;

		this.aspectRatio = this.width / this.height;
		//High pixel density displays - multiply the size of the canvas height/width by the device pixel ratio, then scale.
		helpers.retinaScale(this);

		return this;
	};
	//Globally expose the defaults to allow for user updating/changing
	Chart.defaults = {
		global: {
			// Boolean - Whether to animate the chart
			animation: true,

			// Number - Number of animation steps
			animationSteps: 60,

			// String - Animation easing effect
			animationEasing: "easeOutQuart",

			// Boolean - If we should show the scale at all
			showScale: true,

			// Boolean - If we want to override with a hard coded scale
			scaleOverride: false,

			// ** Required if scaleOverride is true **
			// Number - The number of steps in a hard coded scale
			scaleSteps: null,
			// Number - The value jump in the hard coded scale
			scaleStepWidth: null,
			// Number - The scale starting value
			scaleStartValue: null,

			// String - Colour of the scale line
			scaleLineColor: "rgba(0,0,0,.1)",

			// Number - Pixel width of the scale line
			scaleLineWidth: 1,

			// Boolean - Whether to show labels on the scale
			scaleShowLabels: true,

			// Interpolated JS string - can access value
			scaleLabel: "<%=value%>",

			// Boolean - Whether the scale should stick to integers, and not show any floats even if drawing space is there
			scaleIntegersOnly: true,

			// Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
			scaleBeginAtZero: false,

			// String - Scale label font declaration for the scale label
			scaleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Scale label font size in pixels
			scaleFontSize: 12,

			// String - Scale label font weight style
			scaleFontStyle: "normal",

			// String - Scale label font colour
			scaleFontColor: "#666",

			// Boolean - whether or not the chart should be responsive and resize when the browser does.
			responsive: false,

			// Boolean - whether to maintain the starting aspect ratio or not when responsive, if set to false, will take up entire container
			maintainAspectRatio: true,

			// Boolean - Determines whether to draw tooltips on the canvas or not - attaches events to touchmove & mousemove
			showTooltips: true,

			// Boolean - Determines whether to draw built-in tooltip or call custom tooltip function
			customTooltips: false,

			// Array - Array of string names to attach tooltip events
			tooltipEvents: ["mousemove", "touchstart", "touchmove", "mouseout"],

			// String - Tooltip background colour
			tooltipFillColor: "rgba(0,0,0,0.8)",

			// String - Tooltip label font declaration for the scale label
			tooltipFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Tooltip label font size in pixels
			tooltipFontSize: 14,

			// String - Tooltip font weight style
			tooltipFontStyle: "normal",

			// String - Tooltip label font colour
			tooltipFontColor: "#fff",

			// String - Tooltip title font declaration for the scale label
			tooltipTitleFontFamily: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",

			// Number - Tooltip title font size in pixels
			tooltipTitleFontSize: 14,

			// String - Tooltip title font weight style
			tooltipTitleFontStyle: "bold",

			// String - Tooltip title font colour
			tooltipTitleFontColor: "#fff",

			// String - Tooltip title template
			tooltipTitleTemplate: "<%= label%>",

			// Number - pixel width of padding around tooltip text
			tooltipYPadding: 6,

			// Number - pixel width of padding around tooltip text
			tooltipXPadding: 6,

			// Number - Size of the caret on the tooltip
			tooltipCaretSize: 8,

			// Number - Pixel radius of the tooltip border
			tooltipCornerRadius: 6,

			// Number - Pixel offset from point x to tooltip edge
			tooltipXOffset: 10,

			// String - Template string for single tooltips
			tooltipTemplate: "<%if (label){%><%=label%>: <%}%><%= value %>",

			// String - Template string for single tooltips
			multiTooltipTemplate: "<%= datasetLabel %>: <%= value %>",

			// String - Colour behind the legend colour block
			multiTooltipKeyBackground: '#fff',

			// Array - A list of colors to use as the defaults
			segmentColorDefault: ["#A6CEE3", "#1F78B4", "#B2DF8A", "#33A02C", "#FB9A99", "#E31A1C", "#FDBF6F", "#FF7F00", "#CAB2D6", "#6A3D9A", "#B4B482", "#B15928" ],

			// Array - A list of highlight colors to use as the defaults
			segmentHighlightColorDefaults: [ "#CEF6FF", "#47A0DC", "#DAFFB2", "#5BC854", "#FFC2C1", "#FF4244", "#FFE797", "#FFA728", "#F2DAFE", "#9265C2", "#DCDCAA", "#D98150" ],

			// Function - Will fire on animation progression.
			onAnimationProgress: function(){},

			// Function - Will fire on animation completion.
			onAnimationComplete: function(){}

		}
	};

	//Create a dictionary of chart types, to allow for extension of existing types
	Chart.types = {};

	//Global Chart helpers object for utility methods and classes
	var helpers = Chart.helpers = {};

		//-- Basic js utility methods
	var each = helpers.each = function(loopable,callback,self){
			var additionalArgs = Array.prototype.slice.call(arguments, 3);
			// Check to see if null or undefined firstly.
			if (loopable){
				if (loopable.length === +loopable.length){
					var i;
					for (i=0; i<loopable.length; i++){
						callback.apply(self,[loopable[i], i].concat(additionalArgs));
					}
				}
				else{
					for (var item in loopable){
						callback.apply(self,[loopable[item],item].concat(additionalArgs));
					}
				}
			}
		},
		clone = helpers.clone = function(obj){
			var objClone = {};
			each(obj,function(value,key){
				if (obj.hasOwnProperty(key)){
					objClone[key] = value;
				}
			});
			return objClone;
		},
		extend = helpers.extend = function(base){
			each(Array.prototype.slice.call(arguments,1), function(extensionObject) {
				each(extensionObject,function(value,key){
					if (extensionObject.hasOwnProperty(key)){
						base[key] = value;
					}
				});
			});
			return base;
		},
		merge = helpers.merge = function(base,master){
			//Merge properties in left object over to a shallow clone of object right.
			var args = Array.prototype.slice.call(arguments,0);
			args.unshift({});
			return extend.apply(null, args);
		},
		indexOf = helpers.indexOf = function(arrayToSearch, item){
			if (Array.prototype.indexOf) {
				return arrayToSearch.indexOf(item);
			}
			else{
				for (var i = 0; i < arrayToSearch.length; i++) {
					if (arrayToSearch[i] === item) return i;
				}
				return -1;
			}
		},
		where = helpers.where = function(collection, filterCallback){
			var filtered = [];

			helpers.each(collection, function(item){
				if (filterCallback(item)){
					filtered.push(item);
				}
			});

			return filtered;
		},
		findNextWhere = helpers.findNextWhere = function(arrayToSearch, filterCallback, startIndex){
			// Default to start of the array
			if (!startIndex){
				startIndex = -1;
			}
			for (var i = startIndex + 1; i < arrayToSearch.length; i++) {
				var currentItem = arrayToSearch[i];
				if (filterCallback(currentItem)){
					return currentItem;
				}
			}
		},
		findPreviousWhere = helpers.findPreviousWhere = function(arrayToSearch, filterCallback, startIndex){
			// Default to end of the array
			if (!startIndex){
				startIndex = arrayToSearch.length;
			}
			for (var i = startIndex - 1; i >= 0; i--) {
				var currentItem = arrayToSearch[i];
				if (filterCallback(currentItem)){
					return currentItem;
				}
			}
		},
		inherits = helpers.inherits = function(extensions){
			//Basic javascript inheritance based on the model created in Backbone.js
			var parent = this;
			var ChartElement = (extensions && extensions.hasOwnProperty("constructor")) ? extensions.constructor : function(){ return parent.apply(this, arguments); };

			var Surrogate = function(){ this.constructor = ChartElement;};
			Surrogate.prototype = parent.prototype;
			ChartElement.prototype = new Surrogate();

			ChartElement.extend = inherits;

			if (extensions) extend(ChartElement.prototype, extensions);

			ChartElement.__super__ = parent.prototype;

			return ChartElement;
		},
		noop = helpers.noop = function(){},
		uid = helpers.uid = (function(){
			var id=0;
			return function(){
				return "chart-" + id++;
			};
		})(),
		warn = helpers.warn = function(str){
			//Method for warning of errors
			if (window.console && typeof window.console.warn === "function") console.warn(str);
		},
		amd = helpers.amd = (typeof define === 'function' && define.amd),
		//-- Math methods
		isNumber = helpers.isNumber = function(n){
			return !isNaN(parseFloat(n)) && isFinite(n);
		},
		max = helpers.max = function(array){
			return Math.max.apply( Math, array );
		},
		min = helpers.min = function(array){
			return Math.min.apply( Math, array );
		},
		cap = helpers.cap = function(valueToCap,maxValue,minValue){
			if(isNumber(maxValue)) {
				if( valueToCap > maxValue ) {
					return maxValue;
				}
			}
			else if(isNumber(minValue)){
				if ( valueToCap < minValue ){
					return minValue;
				}
			}
			return valueToCap;
		},
		getDecimalPlaces = helpers.getDecimalPlaces = function(num){
			if (num%1!==0 && isNumber(num)){
				var s = num.toString();
				if(s.indexOf("e-") < 0){
					// no exponent, e.g. 0.01
					return s.split(".")[1].length;
				}
				else if(s.indexOf(".") < 0) {
					// no decimal point, e.g. 1e-9
					return parseInt(s.split("e-")[1]);
				}
				else {
					// exponent and decimal point, e.g. 1.23e-9
					var parts = s.split(".")[1].split("e-");
					return parts[0].length + parseInt(parts[1]);
				}
			}
			else {
				return 0;
			}
		},
		toRadians = helpers.radians = function(degrees){
			return degrees * (Math.PI/180);
		},
		// Gets the angle from vertical upright to the point about a centre.
		getAngleFromPoint = helpers.getAngleFromPoint = function(centrePoint, anglePoint){
			var distanceFromXCenter = anglePoint.x - centrePoint.x,
				distanceFromYCenter = anglePoint.y - centrePoint.y,
				radialDistanceFromCenter = Math.sqrt( distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);


			var angle = Math.PI * 2 + Math.atan2(distanceFromYCenter, distanceFromXCenter);

			//If the segment is in the top left quadrant, we need to add another rotation to the angle
			if (distanceFromXCenter < 0 && distanceFromYCenter < 0){
				angle += Math.PI*2;
			}

			return {
				angle: angle,
				distance: radialDistanceFromCenter
			};
		},
		aliasPixel = helpers.aliasPixel = function(pixelWidth){
			return (pixelWidth % 2 === 0) ? 0 : 0.5;
		},
		splineCurve = helpers.splineCurve = function(FirstPoint,MiddlePoint,AfterPoint,t){
			//Props to Rob Spencer at scaled innovation for his post on splining between points
			//http://scaledinnovation.com/analytics/splines/aboutSplines.html
			var d01=Math.sqrt(Math.pow(MiddlePoint.x-FirstPoint.x,2)+Math.pow(MiddlePoint.y-FirstPoint.y,2)),
				d12=Math.sqrt(Math.pow(AfterPoint.x-MiddlePoint.x,2)+Math.pow(AfterPoint.y-MiddlePoint.y,2)),
				fa=t*d01/(d01+d12),// scaling factor for triangle Ta
				fb=t*d12/(d01+d12);
			return {
				inner : {
					x : MiddlePoint.x-fa*(AfterPoint.x-FirstPoint.x),
					y : MiddlePoint.y-fa*(AfterPoint.y-FirstPoint.y)
				},
				outer : {
					x: MiddlePoint.x+fb*(AfterPoint.x-FirstPoint.x),
					y : MiddlePoint.y+fb*(AfterPoint.y-FirstPoint.y)
				}
			};
		},
		calculateOrderOfMagnitude = helpers.calculateOrderOfMagnitude = function(val){
			return Math.floor(Math.log(val) / Math.LN10);
		},
		calculateScaleRange = helpers.calculateScaleRange = function(valuesArray, drawingSize, textSize, startFromZero, integersOnly){

			//Set a minimum step of two - a point at the top of the graph, and a point at the base
			var minSteps = 2,
				maxSteps = Math.floor(drawingSize/(textSize * 1.5)),
				skipFitting = (minSteps >= maxSteps);

			// Filter out null values since these would min() to zero
			var values = [];
			each(valuesArray, function( v ){
				v == null || values.push( v );
			});
			var minValue = min(values),
			    maxValue = max(values);

			// We need some degree of separation here to calculate the scales if all the values are the same
			// Adding/minusing 0.5 will give us a range of 1.
			if (maxValue === minValue){
				maxValue += 0.5;
				// So we don't end up with a graph with a negative start value if we've said always start from zero
				if (minValue >= 0.5 && !startFromZero){
					minValue -= 0.5;
				}
				else{
					// Make up a whole number above the values
					maxValue += 0.5;
				}
			}

			var	valueRange = Math.abs(maxValue - minValue),
				rangeOrderOfMagnitude = calculateOrderOfMagnitude(valueRange),
				graphMax = Math.ceil(maxValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
				graphMin = (startFromZero) ? 0 : Math.floor(minValue / (1 * Math.pow(10, rangeOrderOfMagnitude))) * Math.pow(10, rangeOrderOfMagnitude),
				graphRange = graphMax - graphMin,
				stepValue = Math.pow(10, rangeOrderOfMagnitude),
				numberOfSteps = Math.round(graphRange / stepValue);

			//If we have more space on the graph we'll use it to give more definition to the data
			while((numberOfSteps > maxSteps || (numberOfSteps * 2) < maxSteps) && !skipFitting) {
				if(numberOfSteps > maxSteps){
					stepValue *=2;
					numberOfSteps = Math.round(graphRange/stepValue);
					// Don't ever deal with a decimal number of steps - cancel fitting and just use the minimum number of steps.
					if (numberOfSteps % 1 !== 0){
						skipFitting = true;
					}
				}
				//We can fit in double the amount of scale points on the scale
				else{
					//If user has declared ints only, and the step value isn't a decimal
					if (integersOnly && rangeOrderOfMagnitude >= 0){
						//If the user has said integers only, we need to check that making the scale more granular wouldn't make it a float
						if(stepValue/2 % 1 === 0){
							stepValue /=2;
							numberOfSteps = Math.round(graphRange/stepValue);
						}
						//If it would make it a float break out of the loop
						else{
							break;
						}
					}
					//If the scale doesn't have to be an int, make the scale more granular anyway.
					else{
						stepValue /=2;
						numberOfSteps = Math.round(graphRange/stepValue);
					}

				}
			}

			if (skipFitting){
				numberOfSteps = minSteps;
				stepValue = graphRange / numberOfSteps;
			}

			return {
				steps : numberOfSteps,
				stepValue : stepValue,
				min : graphMin,
				max	: graphMin + (numberOfSteps * stepValue)
			};

		},
		/* jshint ignore:start */
		// Blows up jshint errors based on the new Function constructor
		//Templating methods
		//Javascript micro templating by John Resig - source at http://ejohn.org/blog/javascript-micro-templating/
		template = helpers.template = function(templateString, valuesObject){

			// If templateString is function rather than string-template - call the function for valuesObject

			if(templateString instanceof Function){
			 	return templateString(valuesObject);
		 	}

			var cache = {};
			function tmpl(str, data){
				// Figure out if we're getting a template, or if we need to
				// load the template - and be sure to cache the result.
				var fn = !/\W/.test(str) ?
				cache[str] = cache[str] :

				// Generate a reusable function that will serve as a template
				// generator (and which will be cached).
				new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +

					// Introduce the data as local variables using with(){}
					"with(obj){p.push('" +

					// Convert the template into pure JavaScript
					str
						.replace(/[\r\t\n]/g, " ")
						.split("<%").join("\t")
						.replace(/((^|%>)[^\t]*)'/g, "$1\r")
						.replace(/\t=(.*?)%>/g, "',$1,'")
						.split("\t").join("');")
						.split("%>").join("p.push('")
						.split("\r").join("\\'") +
					"');}return p.join('');"
				);

				// Provide some basic currying to the user
				return data ? fn( data ) : fn;
			}
			return tmpl(templateString,valuesObject);
		},
		/* jshint ignore:end */
		generateLabels = helpers.generateLabels = function(templateString,numberOfSteps,graphMin,stepValue){
			var labelsArray = new Array(numberOfSteps);
			if (templateString){
				each(labelsArray,function(val,index){
					labelsArray[index] = template(templateString,{value: (graphMin + (stepValue*(index+1)))});
				});
			}
			return labelsArray;
		},
		//--Animation methods
		//Easing functions adapted from Robert Penner's easing equations
		//http://www.robertpenner.com/easing/
		easingEffects = helpers.easingEffects = {
			linear: function (t) {
				return t;
			},
			easeInQuad: function (t) {
				return t * t;
			},
			easeOutQuad: function (t) {
				return -1 * t * (t - 2);
			},
			easeInOutQuad: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t;
				}
				return -1 / 2 * ((--t) * (t - 2) - 1);
			},
			easeInCubic: function (t) {
				return t * t * t;
			},
			easeOutCubic: function (t) {
				return 1 * ((t = t / 1 - 1) * t * t + 1);
			},
			easeInOutCubic: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t;
				}
				return 1 / 2 * ((t -= 2) * t * t + 2);
			},
			easeInQuart: function (t) {
				return t * t * t * t;
			},
			easeOutQuart: function (t) {
				return -1 * ((t = t / 1 - 1) * t * t * t - 1);
			},
			easeInOutQuart: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t * t;
				}
				return -1 / 2 * ((t -= 2) * t * t * t - 2);
			},
			easeInQuint: function (t) {
				return 1 * (t /= 1) * t * t * t * t;
			},
			easeOutQuint: function (t) {
				return 1 * ((t = t / 1 - 1) * t * t * t * t + 1);
			},
			easeInOutQuint: function (t) {
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * t * t * t * t * t;
				}
				return 1 / 2 * ((t -= 2) * t * t * t * t + 2);
			},
			easeInSine: function (t) {
				return -1 * Math.cos(t / 1 * (Math.PI / 2)) + 1;
			},
			easeOutSine: function (t) {
				return 1 * Math.sin(t / 1 * (Math.PI / 2));
			},
			easeInOutSine: function (t) {
				return -1 / 2 * (Math.cos(Math.PI * t / 1) - 1);
			},
			easeInExpo: function (t) {
				return (t === 0) ? 1 : 1 * Math.pow(2, 10 * (t / 1 - 1));
			},
			easeOutExpo: function (t) {
				return (t === 1) ? 1 : 1 * (-Math.pow(2, -10 * t / 1) + 1);
			},
			easeInOutExpo: function (t) {
				if (t === 0){
					return 0;
				}
				if (t === 1){
					return 1;
				}
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * Math.pow(2, 10 * (t - 1));
				}
				return 1 / 2 * (-Math.pow(2, -10 * --t) + 2);
			},
			easeInCirc: function (t) {
				if (t >= 1){
					return t;
				}
				return -1 * (Math.sqrt(1 - (t /= 1) * t) - 1);
			},
			easeOutCirc: function (t) {
				return 1 * Math.sqrt(1 - (t = t / 1 - 1) * t);
			},
			easeInOutCirc: function (t) {
				if ((t /= 1 / 2) < 1){
					return -1 / 2 * (Math.sqrt(1 - t * t) - 1);
				}
				return 1 / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1);
			},
			easeInElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1) == 1){
					return 1;
				}
				if (!p){
					p = 1 * 0.3;
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else{
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));
			},
			easeOutElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1) == 1){
					return 1;
				}
				if (!p){
					p = 1 * 0.3;
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else{
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				return a * Math.pow(2, -10 * t) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) + 1;
			},
			easeInOutElastic: function (t) {
				var s = 1.70158;
				var p = 0;
				var a = 1;
				if (t === 0){
					return 0;
				}
				if ((t /= 1 / 2) == 2){
					return 1;
				}
				if (!p){
					p = 1 * (0.3 * 1.5);
				}
				if (a < Math.abs(1)) {
					a = 1;
					s = p / 4;
				} else {
					s = p / (2 * Math.PI) * Math.asin(1 / a);
				}
				if (t < 1){
					return -0.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p));}
				return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * 1 - s) * (2 * Math.PI) / p) * 0.5 + 1;
			},
			easeInBack: function (t) {
				var s = 1.70158;
				return 1 * (t /= 1) * t * ((s + 1) * t - s);
			},
			easeOutBack: function (t) {
				var s = 1.70158;
				return 1 * ((t = t / 1 - 1) * t * ((s + 1) * t + s) + 1);
			},
			easeInOutBack: function (t) {
				var s = 1.70158;
				if ((t /= 1 / 2) < 1){
					return 1 / 2 * (t * t * (((s *= (1.525)) + 1) * t - s));
				}
				return 1 / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
			},
			easeInBounce: function (t) {
				return 1 - easingEffects.easeOutBounce(1 - t);
			},
			easeOutBounce: function (t) {
				if ((t /= 1) < (1 / 2.75)) {
					return 1 * (7.5625 * t * t);
				} else if (t < (2 / 2.75)) {
					return 1 * (7.5625 * (t -= (1.5 / 2.75)) * t + 0.75);
				} else if (t < (2.5 / 2.75)) {
					return 1 * (7.5625 * (t -= (2.25 / 2.75)) * t + 0.9375);
				} else {
					return 1 * (7.5625 * (t -= (2.625 / 2.75)) * t + 0.984375);
				}
			},
			easeInOutBounce: function (t) {
				if (t < 1 / 2){
					return easingEffects.easeInBounce(t * 2) * 0.5;
				}
				return easingEffects.easeOutBounce(t * 2 - 1) * 0.5 + 1 * 0.5;
			}
		},
		//Request animation polyfill - http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
		requestAnimFrame = helpers.requestAnimFrame = (function(){
			return window.requestAnimationFrame ||
				window.webkitRequestAnimationFrame ||
				window.mozRequestAnimationFrame ||
				window.oRequestAnimationFrame ||
				window.msRequestAnimationFrame ||
				function(callback) {
					return window.setTimeout(callback, 1000 / 60);
				};
		})(),
		cancelAnimFrame = helpers.cancelAnimFrame = (function(){
			return window.cancelAnimationFrame ||
				window.webkitCancelAnimationFrame ||
				window.mozCancelAnimationFrame ||
				window.oCancelAnimationFrame ||
				window.msCancelAnimationFrame ||
				function(callback) {
					return window.clearTimeout(callback, 1000 / 60);
				};
		})(),
		animationLoop = helpers.animationLoop = function(callback,totalSteps,easingString,onProgress,onComplete,chartInstance){

			var currentStep = 0,
				easingFunction = easingEffects[easingString] || easingEffects.linear;

			var animationFrame = function(){
				currentStep++;
				var stepDecimal = currentStep/totalSteps;
				var easeDecimal = easingFunction(stepDecimal);

				callback.call(chartInstance,easeDecimal,stepDecimal, currentStep);
				onProgress.call(chartInstance,easeDecimal,stepDecimal);
				if (currentStep < totalSteps){
					chartInstance.animationFrame = requestAnimFrame(animationFrame);
				} else{
					onComplete.apply(chartInstance);
				}
			};
			requestAnimFrame(animationFrame);
		},
		//-- DOM methods
		getRelativePosition = helpers.getRelativePosition = function(evt){
			var mouseX, mouseY;
			var e = evt.originalEvent || evt,
				canvas = evt.currentTarget || evt.srcElement,
				boundingRect = canvas.getBoundingClientRect();

			if (e.touches){
				mouseX = e.touches[0].clientX - boundingRect.left;
				mouseY = e.touches[0].clientY - boundingRect.top;

			}
			else{
				mouseX = e.clientX - boundingRect.left;
				mouseY = e.clientY - boundingRect.top;
			}

			return {
				x : mouseX,
				y : mouseY
			};

		},
		addEvent = helpers.addEvent = function(node,eventType,method){
			if (node.addEventListener){
				node.addEventListener(eventType,method);
			} else if (node.attachEvent){
				node.attachEvent("on"+eventType, method);
			} else {
				node["on"+eventType] = method;
			}
		},
		removeEvent = helpers.removeEvent = function(node, eventType, handler){
			if (node.removeEventListener){
				node.removeEventListener(eventType, handler, false);
			} else if (node.detachEvent){
				node.detachEvent("on"+eventType,handler);
			} else{
				node["on" + eventType] = noop;
			}
		},
		bindEvents = helpers.bindEvents = function(chartInstance, arrayOfEvents, handler){
			// Create the events object if it's not already present
			if (!chartInstance.events) chartInstance.events = {};

			each(arrayOfEvents,function(eventName){
				chartInstance.events[eventName] = function(){
					handler.apply(chartInstance, arguments);
				};
				addEvent(chartInstance.chart.canvas,eventName,chartInstance.events[eventName]);
			});
		},
		unbindEvents = helpers.unbindEvents = function (chartInstance, arrayOfEvents) {
			each(arrayOfEvents, function(handler,eventName){
				removeEvent(chartInstance.chart.canvas, eventName, handler);
			});
		},
		getMaximumWidth = helpers.getMaximumWidth = function(domNode){
			var container = domNode.parentNode,
			    padding = parseInt(getStyle(container, 'padding-left')) + parseInt(getStyle(container, 'padding-right'));
			// TODO = check cross browser stuff with this.
			return container ? container.clientWidth - padding : 0;
		},
		getMaximumHeight = helpers.getMaximumHeight = function(domNode){
			var container = domNode.parentNode,
			    padding = parseInt(getStyle(container, 'padding-bottom')) + parseInt(getStyle(container, 'padding-top'));
			// TODO = check cross browser stuff with this.
			return container ? container.clientHeight - padding : 0;
		},
		getStyle = helpers.getStyle = function (el, property) {
			return el.currentStyle ?
				el.currentStyle[property] :
				document.defaultView.getComputedStyle(el, null).getPropertyValue(property);
		},
		getMaximumSize = helpers.getMaximumSize = helpers.getMaximumWidth, // legacy support
		retinaScale = helpers.retinaScale = function(chart){
			var ctx = chart.ctx,
				width = chart.canvas.width,
				height = chart.canvas.height;

			if (window.devicePixelRatio) {
				ctx.canvas.style.width = width + "px";
				ctx.canvas.style.height = height + "px";
				ctx.canvas.height = height * window.devicePixelRatio;
				ctx.canvas.width = width * window.devicePixelRatio;
				ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
			}
		},
		//-- Canvas methods
		clear = helpers.clear = function(chart){
			chart.ctx.clearRect(0,0,chart.width,chart.height);
		},
		fontString = helpers.fontString = function(pixelSize,fontStyle,fontFamily){
			return fontStyle + " " + pixelSize+"px " + fontFamily;
		},
		longestText = helpers.longestText = function(ctx,font,arrayOfStrings){
			ctx.font = font;
			var longest = 0;
			each(arrayOfStrings,function(string){
				var textWidth = ctx.measureText(string).width;
				longest = (textWidth > longest) ? textWidth : longest;
			});
			return longest;
		},
		drawRoundedRectangle = helpers.drawRoundedRectangle = function(ctx,x,y,width,height,radius){
			ctx.beginPath();
			ctx.moveTo(x + radius, y);
			ctx.lineTo(x + width - radius, y);
			ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
			ctx.lineTo(x + width, y + height - radius);
			ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
			ctx.lineTo(x + radius, y + height);
			ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
			ctx.lineTo(x, y + radius);
			ctx.quadraticCurveTo(x, y, x + radius, y);
			ctx.closePath();
		};


	//Store a reference to each instance - allowing us to globally resize chart instances on window resize.
	//Destroy method on the chart will remove the instance of the chart from this reference.
	Chart.instances = {};

	Chart.Type = function(data,options,chart){
		this.options = options;
		this.chart = chart;
		this.id = uid();
		//Add the chart instance to the global namespace
		Chart.instances[this.id] = this;

		// Initialize is always called when a chart type is created
		// By default it is a no op, but it should be extended
		if (options.responsive){
			this.resize();
		}
		this.initialize.call(this,data);
	};

	//Core methods that'll be a part of every chart type
	extend(Chart.Type.prototype,{
		initialize : function(){return this;},
		clear : function(){
			clear(this.chart);
			return this;
		},
		stop : function(){
			// Stops any current animation loop occuring
			Chart.animationService.cancelAnimation(this);
			return this;
		},
		resize : function(callback){
			this.stop();
			var canvas = this.chart.canvas,
				newWidth = getMaximumWidth(this.chart.canvas),
				newHeight = this.options.maintainAspectRatio ? newWidth / this.chart.aspectRatio : getMaximumHeight(this.chart.canvas);

			canvas.width = this.chart.width = newWidth;
			canvas.height = this.chart.height = newHeight;

			retinaScale(this.chart);

			if (typeof callback === "function"){
				callback.apply(this, Array.prototype.slice.call(arguments, 1));
			}
			return this;
		},
		reflow : noop,
		render : function(reflow){
			if (reflow){
				this.reflow();
			}
			
			if (this.options.animation && !reflow){
				var animation = new Chart.Animation();
				animation.numSteps = this.options.animationSteps;
				animation.easing = this.options.animationEasing;
				
				// render function
				animation.render = function(chartInstance, animationObject) {
					var easingFunction = helpers.easingEffects[animationObject.easing];
					var stepDecimal = animationObject.currentStep / animationObject.numSteps;
					var easeDecimal = easingFunction(stepDecimal);
					
					chartInstance.draw(easeDecimal, stepDecimal, animationObject.currentStep);
				};
				
				// user events
				animation.onAnimationProgress = this.options.onAnimationProgress;
				animation.onAnimationComplete = this.options.onAnimationComplete;
				
				Chart.animationService.addAnimation(this, animation);
			}
			else{
				this.draw();
				this.options.onAnimationComplete.call(this);
			}
			return this;
		},
		generateLegend : function(){
			return helpers.template(this.options.legendTemplate, this);
		},
		destroy : function(){
			this.stop();
			this.clear();
			unbindEvents(this, this.events);
			var canvas = this.chart.canvas;

			// Reset canvas height/width attributes starts a fresh with the canvas context
			canvas.width = this.chart.width;
			canvas.height = this.chart.height;

			// < IE9 doesn't support removeProperty
			if (canvas.style.removeProperty) {
				canvas.style.removeProperty('width');
				canvas.style.removeProperty('height');
			} else {
				canvas.style.removeAttribute('width');
				canvas.style.removeAttribute('height');
			}

			delete Chart.instances[this.id];
		},
		showTooltip : function(ChartElements, forceRedraw){
			// Only redraw the chart if we've actually changed what we're hovering on.
			if (typeof this.activeElements === 'undefined') this.activeElements = [];

			var isChanged = (function(Elements){
				var changed = false;

				if (Elements.length !== this.activeElements.length){
					changed = true;
					return changed;
				}

				each(Elements, function(element, index){
					if (element !== this.activeElements[index]){
						changed = true;
					}
				}, this);
				return changed;
			}).call(this, ChartElements);

			if (!isChanged && !forceRedraw){
				return;
			}
			else{
				this.activeElements = ChartElements;
			}
			this.draw();
			if(this.options.customTooltips){
				this.options.customTooltips(false);
			}
			if (ChartElements.length > 0){
				// If we have multiple datasets, show a MultiTooltip for all of the data points at that index
				if (this.datasets && this.datasets.length > 1) {
					var dataArray,
						dataIndex;

					for (var i = this.datasets.length - 1; i >= 0; i--) {
						dataArray = this.datasets[i].points || this.datasets[i].bars || this.datasets[i].segments;
						dataIndex = indexOf(dataArray, ChartElements[0]);
						if (dataIndex !== -1){
							break;
						}
					}
					var tooltipLabels = [],
						tooltipColors = [],
						medianPosition = (function(index) {

							// Get all the points at that particular index
							var Elements = [],
								dataCollection,
								xPositions = [],
								yPositions = [],
								xMax,
								yMax,
								xMin,
								yMin;
							helpers.each(this.datasets, function(dataset){
								dataCollection = dataset.points || dataset.bars || dataset.segments;
								if (dataCollection[dataIndex] && dataCollection[dataIndex].hasValue()){
									Elements.push(dataCollection[dataIndex]);
								}
							});

							helpers.each(Elements, function(element) {
								xPositions.push(element.x);
								yPositions.push(element.y);


								//Include any colour information about the element
								tooltipLabels.push(helpers.template(this.options.multiTooltipTemplate, element));
								tooltipColors.push({
									fill: element._saved.fillColor || element.fillColor,
									stroke: element._saved.strokeColor || element.strokeColor
								});

							}, this);

							yMin = min(yPositions);
							yMax = max(yPositions);

							xMin = min(xPositions);
							xMax = max(xPositions);

							return {
								x: (xMin > this.chart.width/2) ? xMin : xMax,
								y: (yMin + yMax)/2
							};
						}).call(this, dataIndex);

					new Chart.MultiTooltip({
						x: medianPosition.x,
						y: medianPosition.y,
						xPadding: this.options.tooltipXPadding,
						yPadding: this.options.tooltipYPadding,
						xOffset: this.options.tooltipXOffset,
						fillColor: this.options.tooltipFillColor,
						textColor: this.options.tooltipFontColor,
						fontFamily: this.options.tooltipFontFamily,
						fontStyle: this.options.tooltipFontStyle,
						fontSize: this.options.tooltipFontSize,
						titleTextColor: this.options.tooltipTitleFontColor,
						titleFontFamily: this.options.tooltipTitleFontFamily,
						titleFontStyle: this.options.tooltipTitleFontStyle,
						titleFontSize: this.options.tooltipTitleFontSize,
						cornerRadius: this.options.tooltipCornerRadius,
						labels: tooltipLabels,
						legendColors: tooltipColors,
						legendColorBackground : this.options.multiTooltipKeyBackground,
						title: template(this.options.tooltipTitleTemplate,ChartElements[0]),
						chart: this.chart,
						ctx: this.chart.ctx,
						custom: this.options.customTooltips
					}).draw();

				} else {
					each(ChartElements, function(Element) {
						var tooltipPosition = Element.tooltipPosition();
						new Chart.Tooltip({
							x: Math.round(tooltipPosition.x),
							y: Math.round(tooltipPosition.y),
							xPadding: this.options.tooltipXPadding,
							yPadding: this.options.tooltipYPadding,
							fillColor: this.options.tooltipFillColor,
							textColor: this.options.tooltipFontColor,
							fontFamily: this.options.tooltipFontFamily,
							fontStyle: this.options.tooltipFontStyle,
							fontSize: this.options.tooltipFontSize,
							caretHeight: this.options.tooltipCaretSize,
							cornerRadius: this.options.tooltipCornerRadius,
							text: template(this.options.tooltipTemplate, Element),
							chart: this.chart,
							custom: this.options.customTooltips
						}).draw();
					}, this);
				}
			}
			return this;
		},
		toBase64Image : function(){
			return this.chart.canvas.toDataURL.apply(this.chart.canvas, arguments);
		}
	});

	Chart.Type.extend = function(extensions){

		var parent = this;

		var ChartType = function(){
			return parent.apply(this,arguments);
		};

		//Copy the prototype object of the this class
		ChartType.prototype = clone(parent.prototype);
		//Now overwrite some of the properties in the base class with the new extensions
		extend(ChartType.prototype, extensions);

		ChartType.extend = Chart.Type.extend;

		if (extensions.name || parent.prototype.name){

			var chartName = extensions.name || parent.prototype.name;
			//Assign any potential default values of the new chart type

			//If none are defined, we'll use a clone of the chart type this is being extended from.
			//I.e. if we extend a line chart, we'll use the defaults from the line chart if our new chart
			//doesn't define some defaults of their own.

			var baseDefaults = (Chart.defaults[parent.prototype.name]) ? clone(Chart.defaults[parent.prototype.name]) : {};

			Chart.defaults[chartName] = extend(baseDefaults,extensions.defaults);

			Chart.types[chartName] = ChartType;

			//Register this new chart type in the Chart prototype
			Chart.prototype[chartName] = function(data,options){
				var config = merge(Chart.defaults.global, Chart.defaults[chartName], options || {});
				return new ChartType(data,config,this);
			};
		} else{
			warn("Name not provided for this chart, so it hasn't been registered");
		}
		return parent;
	};

	Chart.Element = function(configuration){
		extend(this,configuration);
		this.initialize.apply(this,arguments);
		this.save();
	};
	extend(Chart.Element.prototype,{
		initialize : function(){},
		restore : function(props){
			if (!props){
				extend(this,this._saved);
			} else {
				each(props,function(key){
					this[key] = this._saved[key];
				},this);
			}
			return this;
		},
		save : function(){
			this._saved = clone(this);
			delete this._saved._saved;
			return this;
		},
		update : function(newProps){
			each(newProps,function(value,key){
				this._saved[key] = this[key];
				this[key] = value;
			},this);
			return this;
		},
		transition : function(props,ease){
			each(props,function(value,key){
				this[key] = ((value - this._saved[key]) * ease) + this._saved[key];
			},this);
			return this;
		},
		tooltipPosition : function(){
			return {
				x : this.x,
				y : this.y
			};
		},
		hasValue: function(){
			return isNumber(this.value);
		}
	});

	Chart.Element.extend = inherits;


	Chart.Point = Chart.Element.extend({
		display: true,
		inRange: function(chartX,chartY){
			var hitDetectionRange = this.hitDetectionRadius + this.radius;
			return ((Math.pow(chartX-this.x, 2)+Math.pow(chartY-this.y, 2)) < Math.pow(hitDetectionRange,2));
		},
		draw : function(){
			if (this.display){
				var ctx = this.ctx;
				ctx.beginPath();

				ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2);
				ctx.closePath();

				ctx.strokeStyle = this.strokeColor;
				ctx.lineWidth = this.strokeWidth;

				ctx.fillStyle = this.fillColor;

				ctx.fill();
				ctx.stroke();
			}


			//Quick debug for bezier curve splining
			//Highlights control points and the line between them.
			//Handy for dev - stripped in the min version.

			// ctx.save();
			// ctx.fillStyle = "black";
			// ctx.strokeStyle = "black"
			// ctx.beginPath();
			// ctx.arc(this.controlPoints.inner.x,this.controlPoints.inner.y, 2, 0, Math.PI*2);
			// ctx.fill();

			// ctx.beginPath();
			// ctx.arc(this.controlPoints.outer.x,this.controlPoints.outer.y, 2, 0, Math.PI*2);
			// ctx.fill();

			// ctx.moveTo(this.controlPoints.inner.x,this.controlPoints.inner.y);
			// ctx.lineTo(this.x, this.y);
			// ctx.lineTo(this.controlPoints.outer.x,this.controlPoints.outer.y);
			// ctx.stroke();

			// ctx.restore();



		}
	});

	Chart.Arc = Chart.Element.extend({
		inRange : function(chartX,chartY){

			var pointRelativePosition = helpers.getAngleFromPoint(this, {
				x: chartX,
				y: chartY
			});

			// Normalize all angles to 0 - 2*PI (0 - 360°)
			var pointRelativeAngle = pointRelativePosition.angle % (Math.PI * 2),
			    startAngle = (Math.PI * 2 + this.startAngle) % (Math.PI * 2),
			    endAngle = (Math.PI * 2 + this.endAngle) % (Math.PI * 2) || 360;

			// Calculate wether the pointRelativeAngle is between the start and the end angle
			var betweenAngles = (endAngle < startAngle) ?
				pointRelativeAngle <= endAngle || pointRelativeAngle >= startAngle:
				pointRelativeAngle >= startAngle && pointRelativeAngle <= endAngle;

			//Check if within the range of the open/close angle
			var withinRadius = (pointRelativePosition.distance >= this.innerRadius && pointRelativePosition.distance <= this.outerRadius);

			return (betweenAngles && withinRadius);
			//Ensure within the outside of the arc centre, but inside arc outer
		},
		tooltipPosition : function(){
			var centreAngle = this.startAngle + ((this.endAngle - this.startAngle) / 2),
				rangeFromCentre = (this.outerRadius - this.innerRadius) / 2 + this.innerRadius;
			return {
				x : this.x + (Math.cos(centreAngle) * rangeFromCentre),
				y : this.y + (Math.sin(centreAngle) * rangeFromCentre)
			};
		},
		draw : function(animationPercent){

			var easingDecimal = animationPercent || 1;

			var ctx = this.ctx;

			ctx.beginPath();

			ctx.arc(this.x, this.y, this.outerRadius < 0 ? 0 : this.outerRadius, this.startAngle, this.endAngle);

            ctx.arc(this.x, this.y, this.innerRadius < 0 ? 0 : this.innerRadius, this.endAngle, this.startAngle, true);

			ctx.closePath();
			ctx.strokeStyle = this.strokeColor;
			ctx.lineWidth = this.strokeWidth;

			ctx.fillStyle = this.fillColor;

			ctx.fill();
			ctx.lineJoin = 'bevel';

			if (this.showStroke){
				ctx.stroke();
			}
		}
	});

	Chart.Rectangle = Chart.Element.extend({
		draw : function(){
			var ctx = this.ctx,
				halfWidth = this.width/2,
				leftX = this.x - halfWidth,
				rightX = this.x + halfWidth,
				top = this.base - (this.base - this.y),
				halfStroke = this.strokeWidth / 2;

			// Canvas doesn't allow us to stroke inside the width so we can
			// adjust the sizes to fit if we're setting a stroke on the line
			if (this.showStroke){
				leftX += halfStroke;
				rightX -= halfStroke;
				top += halfStroke;
			}

			ctx.beginPath();

			ctx.fillStyle = this.fillColor;
			ctx.strokeStyle = this.strokeColor;
			ctx.lineWidth = this.strokeWidth;

			// It'd be nice to keep this class totally generic to any rectangle
			// and simply specify which border to miss out.
			ctx.moveTo(leftX, this.base);
			ctx.lineTo(leftX, top);
			ctx.lineTo(rightX, top);
			ctx.lineTo(rightX, this.base);
			ctx.fill();
			if (this.showStroke){
				ctx.stroke();
			}
		},
		height : function(){
			return this.base - this.y;
		},
		inRange : function(chartX,chartY){
			return (chartX >= this.x - this.width/2 && chartX <= this.x + this.width/2) && (chartY >= this.y && chartY <= this.base);
		}
	});

	Chart.Animation = Chart.Element.extend({
		currentStep: null, // the current animation step
		numSteps: 60, // default number of steps
		easing: "", // the easing to use for this animation
		render: null, // render function used by the animation service
		
		onAnimationProgress: null, // user specified callback to fire on each step of the animation 
		onAnimationComplete: null, // user specified callback to fire when the animation finishes
	});
	
	Chart.Tooltip = Chart.Element.extend({
		draw : function(){

			var ctx = this.chart.ctx;

			ctx.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);

			this.xAlign = "center";
			this.yAlign = "above";

			//Distance between the actual element.y position and the start of the tooltip caret
			var caretPadding = this.caretPadding = 2;

			var tooltipWidth = ctx.measureText(this.text).width + 2*this.xPadding,
				tooltipRectHeight = this.fontSize + 2*this.yPadding,
				tooltipHeight = tooltipRectHeight + this.caretHeight + caretPadding;

			if (this.x + tooltipWidth/2 >this.chart.width){
				this.xAlign = "left";
			} else if (this.x - tooltipWidth/2 < 0){
				this.xAlign = "right";
			}

			if (this.y - tooltipHeight < 0){
				this.yAlign = "below";
			}


			var tooltipX = this.x - tooltipWidth/2,
				tooltipY = this.y - tooltipHeight;

			ctx.fillStyle = this.fillColor;

			// Custom Tooltips
			if(this.custom){
				this.custom(this);
			}
			else{
				switch(this.yAlign)
				{
				case "above":
					//Draw a caret above the x/y
					ctx.beginPath();
					ctx.moveTo(this.x,this.y - caretPadding);
					ctx.lineTo(this.x + this.caretHeight, this.y - (caretPadding + this.caretHeight));
					ctx.lineTo(this.x - this.caretHeight, this.y - (caretPadding + this.caretHeight));
					ctx.closePath();
					ctx.fill();
					break;
				case "below":
					tooltipY = this.y + caretPadding + this.caretHeight;
					//Draw a caret below the x/y
					ctx.beginPath();
					ctx.moveTo(this.x, this.y + caretPadding);
					ctx.lineTo(this.x + this.caretHeight, this.y + caretPadding + this.caretHeight);
					ctx.lineTo(this.x - this.caretHeight, this.y + caretPadding + this.caretHeight);
					ctx.closePath();
					ctx.fill();
					break;
				}

				switch(this.xAlign)
				{
				case "left":
					tooltipX = this.x - tooltipWidth + (this.cornerRadius + this.caretHeight);
					break;
				case "right":
					tooltipX = this.x - (this.cornerRadius + this.caretHeight);
					break;
				}

				drawRoundedRectangle(ctx,tooltipX,tooltipY,tooltipWidth,tooltipRectHeight,this.cornerRadius);

				ctx.fill();

				ctx.fillStyle = this.textColor;
				ctx.textAlign = "center";
				ctx.textBaseline = "middle";
				ctx.fillText(this.text, tooltipX + tooltipWidth/2, tooltipY + tooltipRectHeight/2);
			}
		}
	});

	Chart.MultiTooltip = Chart.Element.extend({
		initialize : function(){
			this.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);

			this.titleFont = fontString(this.titleFontSize,this.titleFontStyle,this.titleFontFamily);

			this.titleHeight = this.title ? this.titleFontSize * 1.5 : 0;
			this.height = (this.labels.length * this.fontSize) + ((this.labels.length-1) * (this.fontSize/2)) + (this.yPadding*2) + this.titleHeight;

			this.ctx.font = this.titleFont;

			var titleWidth = this.ctx.measureText(this.title).width,
				//Label has a legend square as well so account for this.
				labelWidth = longestText(this.ctx,this.font,this.labels) + this.fontSize + 3,
				longestTextWidth = max([labelWidth,titleWidth]);

			this.width = longestTextWidth + (this.xPadding*2);


			var halfHeight = this.height/2;

			//Check to ensure the height will fit on the canvas
			if (this.y - halfHeight < 0 ){
				this.y = halfHeight;
			} else if (this.y + halfHeight > this.chart.height){
				this.y = this.chart.height - halfHeight;
			}

			//Decide whether to align left or right based on position on canvas
			if (this.x > this.chart.width/2){
				this.x -= this.xOffset + this.width;
			} else {
				this.x += this.xOffset;
			}


		},
		getLineHeight : function(index){
			var baseLineHeight = this.y - (this.height/2) + this.yPadding,
				afterTitleIndex = index-1;

			//If the index is zero, we're getting the title
			if (index === 0){
				return baseLineHeight + this.titleHeight / 3;
			} else{
				return baseLineHeight + ((this.fontSize * 1.5 * afterTitleIndex) + this.fontSize / 2) + this.titleHeight;
			}

		},
		draw : function(){
			// Custom Tooltips
			if(this.custom){
				this.custom(this);
			}
			else{
				drawRoundedRectangle(this.ctx,this.x,this.y - this.height/2,this.width,this.height,this.cornerRadius);
				var ctx = this.ctx;
				ctx.fillStyle = this.fillColor;
				ctx.fill();
				ctx.closePath();

				ctx.textAlign = "left";
				ctx.textBaseline = "middle";
				ctx.fillStyle = this.titleTextColor;
				ctx.font = this.titleFont;

				ctx.fillText(this.title,this.x + this.xPadding, this.getLineHeight(0));

				ctx.font = this.font;
				helpers.each(this.labels,function(label,index){
					ctx.fillStyle = this.textColor;
					ctx.fillText(label,this.x + this.xPadding + this.fontSize + 3, this.getLineHeight(index + 1));

					//A bit gnarly, but clearing this rectangle breaks when using explorercanvas (clears whole canvas)
					//ctx.clearRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);
					//Instead we'll make a white filled block to put the legendColour palette over.

					ctx.fillStyle = this.legendColorBackground;
					ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);

					ctx.fillStyle = this.legendColors[index].fill;
					ctx.fillRect(this.x + this.xPadding, this.getLineHeight(index + 1) - this.fontSize/2, this.fontSize, this.fontSize);


				},this);
			}
		}
	});

	Chart.Scale = Chart.Element.extend({
		initialize : function(){
			this.fit();
		},
		buildYLabels : function(){
			this.yLabels = [];

			var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

			for (var i=0; i<=this.steps; i++){
				this.yLabels.push(template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
			}
			this.yLabelWidth = (this.display && this.showLabels) ? longestText(this.ctx,this.font,this.yLabels) + 10 : 0;
		},
		addXLabel : function(label){
			this.xLabels.push(label);
			this.valuesCount++;
			this.fit();
		},
		removeXLabel : function(){
			this.xLabels.shift();
			this.valuesCount--;
			this.fit();
		},
		// Fitting loop to rotate x Labels and figure out what fits there, and also calculate how many Y steps to use
		fit: function(){
			// First we need the width of the yLabels, assuming the xLabels aren't rotated

			// To do that we need the base line at the top and base of the chart, assuming there is no x label rotation
			this.startPoint = (this.display) ? this.fontSize : 0;
			this.endPoint = (this.display) ? this.height - (this.fontSize * 1.5) - 5 : this.height; // -5 to pad labels

			// Apply padding settings to the start and end point.
			this.startPoint += this.padding;
			this.endPoint -= this.padding;

			// Cache the starting endpoint, excluding the space for x labels
			var cachedEndPoint = this.endPoint;

			// Cache the starting height, so can determine if we need to recalculate the scale yAxis
			var cachedHeight = this.endPoint - this.startPoint,
				cachedYLabelWidth;

			// Build the current yLabels so we have an idea of what size they'll be to start
			/*
			 *	This sets what is returned from calculateScaleRange as static properties of this class:
			 *
				this.steps;
				this.stepValue;
				this.min;
				this.max;
			 *
			 */
			this.calculateYRange(cachedHeight);

			// With these properties set we can now build the array of yLabels
			// and also the width of the largest yLabel
			this.buildYLabels();

			this.calculateXLabelRotation();

			while((cachedHeight > this.endPoint - this.startPoint)){
				cachedHeight = this.endPoint - this.startPoint;
				cachedYLabelWidth = this.yLabelWidth;

				this.calculateYRange(cachedHeight);
				this.buildYLabels();

				// Only go through the xLabel loop again if the yLabel width has changed
				if (cachedYLabelWidth < this.yLabelWidth){
					this.endPoint = cachedEndPoint;
					this.calculateXLabelRotation();
				}
			}

		},
		calculateXLabelRotation : function(){
			//Get the width of each grid by calculating the difference
			//between x offsets between 0 and 1.

			this.ctx.font = this.font;

			var firstWidth = this.ctx.measureText(this.xLabels[0]).width,
				lastWidth = this.ctx.measureText(this.xLabels[this.xLabels.length - 1]).width,
				firstRotated,
				lastRotated;


			this.xScalePaddingRight = lastWidth/2 + 3;
			this.xScalePaddingLeft = (firstWidth/2 > this.yLabelWidth) ? firstWidth/2 : this.yLabelWidth;

			this.xLabelRotation = 0;
			if (this.display){
				var originalLabelWidth = longestText(this.ctx,this.font,this.xLabels),
					cosRotation,
					firstRotatedWidth;
				this.xLabelWidth = originalLabelWidth;
				//Allow 3 pixels x2 padding either side for label readability
				var xGridWidth = Math.floor(this.calculateX(1) - this.calculateX(0)) - 6;

				//Max label rotate should be 90 - also act as a loop counter
				while ((this.xLabelWidth > xGridWidth && this.xLabelRotation === 0) || (this.xLabelWidth > xGridWidth && this.xLabelRotation <= 90 && this.xLabelRotation > 0)){
					cosRotation = Math.cos(toRadians(this.xLabelRotation));

					firstRotated = cosRotation * firstWidth;
					lastRotated = cosRotation * lastWidth;

					// We're right aligning the text now.
					if (firstRotated + this.fontSize / 2 > this.yLabelWidth){
						this.xScalePaddingLeft = firstRotated + this.fontSize / 2;
					}
					this.xScalePaddingRight = this.fontSize/2;


					this.xLabelRotation++;
					this.xLabelWidth = cosRotation * originalLabelWidth;

				}
				if (this.xLabelRotation > 0){
					this.endPoint -= Math.sin(toRadians(this.xLabelRotation))*originalLabelWidth + 3;
				}
			}
			else{
				this.xLabelWidth = 0;
				this.xScalePaddingRight = this.padding;
				this.xScalePaddingLeft = this.padding;
			}

		},
		// Needs to be overidden in each Chart type
		// Otherwise we need to pass all the data into the scale class
		calculateYRange: noop,
		drawingArea: function(){
			return this.startPoint - this.endPoint;
		},
		calculateY : function(value){
			var scalingFactor = this.drawingArea() / (this.min - this.max);
			return this.endPoint - (scalingFactor * (value - this.min));
		},
		calculateX : function(index){
			var isRotated = (this.xLabelRotation > 0),
				// innerWidth = (this.offsetGridLines) ? this.width - offsetLeft - this.padding : this.width - (offsetLeft + halfLabelWidth * 2) - this.padding,
				innerWidth = this.width - (this.xScalePaddingLeft + this.xScalePaddingRight),
				valueWidth = innerWidth/Math.max((this.valuesCount - ((this.offsetGridLines) ? 0 : 1)), 1),
				valueOffset = (valueWidth * index) + this.xScalePaddingLeft;

			if (this.offsetGridLines){
				valueOffset += (valueWidth/2);
			}

			return Math.round(valueOffset);
		},
		update : function(newProps){
			helpers.extend(this, newProps);
			this.fit();
		},
		draw : function(){
			var ctx = this.ctx,
				yLabelGap = (this.endPoint - this.startPoint) / this.steps,
				xStart = Math.round(this.xScalePaddingLeft);
			if (this.display){
				ctx.fillStyle = this.textColor;
				ctx.font = this.font;
				each(this.yLabels,function(labelString,index){
					var yLabelCenter = this.endPoint - (yLabelGap * index),
						linePositionY = Math.round(yLabelCenter),
						drawHorizontalLine = this.showHorizontalLines;

					ctx.textAlign = "right";
					ctx.textBaseline = "middle";
					if (this.showLabels){
						ctx.fillText(labelString,xStart - 10,yLabelCenter);
					}

					// This is X axis, so draw it
					if (index === 0 && !drawHorizontalLine){
						drawHorizontalLine = true;
					}

					if (drawHorizontalLine){
						ctx.beginPath();
					}

					if (index > 0){
						// This is a grid line in the centre, so drop that
						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;
					} else {
						// This is the first line on the scale
						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;
					}

					linePositionY += helpers.aliasPixel(ctx.lineWidth);

					if(drawHorizontalLine){
						ctx.moveTo(xStart, linePositionY);
						ctx.lineTo(this.width, linePositionY);
						ctx.stroke();
						ctx.closePath();
					}

					ctx.lineWidth = this.lineWidth;
					ctx.strokeStyle = this.lineColor;
					ctx.beginPath();
					ctx.moveTo(xStart - 5, linePositionY);
					ctx.lineTo(xStart, linePositionY);
					ctx.stroke();
					ctx.closePath();

				},this);

				each(this.xLabels,function(label,index){
					var xPos = this.calculateX(index) + aliasPixel(this.lineWidth),
						// Check to see if line/bar here and decide where to place the line
						linePos = this.calculateX(index - (this.offsetGridLines ? 0.5 : 0)) + aliasPixel(this.lineWidth),
						isRotated = (this.xLabelRotation > 0),
						drawVerticalLine = this.showVerticalLines;

					// This is Y axis, so draw it
					if (index === 0 && !drawVerticalLine){
						drawVerticalLine = true;
					}

					if (drawVerticalLine){
						ctx.beginPath();
					}

					if (index > 0){
						// This is a grid line in the centre, so drop that
						ctx.lineWidth = this.gridLineWidth;
						ctx.strokeStyle = this.gridLineColor;
					} else {
						// This is the first line on the scale
						ctx.lineWidth = this.lineWidth;
						ctx.strokeStyle = this.lineColor;
					}

					if (drawVerticalLine){
						ctx.moveTo(linePos,this.endPoint);
						ctx.lineTo(linePos,this.startPoint - 3);
						ctx.stroke();
						ctx.closePath();
					}


					ctx.lineWidth = this.lineWidth;
					ctx.strokeStyle = this.lineColor;


					// Small lines at the bottom of the base grid line
					ctx.beginPath();
					ctx.moveTo(linePos,this.endPoint);
					ctx.lineTo(linePos,this.endPoint + 5);
					ctx.stroke();
					ctx.closePath();

					ctx.save();
					ctx.translate(xPos,(isRotated) ? this.endPoint + 12 : this.endPoint + 8);
					ctx.rotate(toRadians(this.xLabelRotation)*-1);
					ctx.font = this.font;
					ctx.textAlign = (isRotated) ? "right" : "center";
					ctx.textBaseline = (isRotated) ? "middle" : "top";
					ctx.fillText(label, 0, 0);
					ctx.restore();
				},this);

			}
		}

	});

	Chart.RadialScale = Chart.Element.extend({
		initialize: function(){
			this.size = min([this.height, this.width]);
			this.drawingArea = (this.display) ? (this.size/2) - (this.fontSize/2 + this.backdropPaddingY) : (this.size/2);
		},
		calculateCenterOffset: function(value){
			// Take into account half font size + the yPadding of the top value
			var scalingFactor = this.drawingArea / (this.max - this.min);

			return (value - this.min) * scalingFactor;
		},
		update : function(){
			if (!this.lineArc){
				this.setScaleSize();
			} else {
				this.drawingArea = (this.display) ? (this.size/2) - (this.fontSize/2 + this.backdropPaddingY) : (this.size/2);
			}
			this.buildYLabels();
		},
		buildYLabels: function(){
			this.yLabels = [];

			var stepDecimalPlaces = getDecimalPlaces(this.stepValue);

			for (var i=0; i<=this.steps; i++){
				this.yLabels.push(template(this.templateString,{value:(this.min + (i * this.stepValue)).toFixed(stepDecimalPlaces)}));
			}
		},
		getCircumference : function(){
			return ((Math.PI*2) / this.valuesCount);
		},
		setScaleSize: function(){
			/*
			 * Right, this is really confusing and there is a lot of maths going on here
			 * The gist of the problem is here: https://gist.github.com/nnnick/696cc9c55f4b0beb8fe9
			 *
			 * Reaction: https://dl.dropboxusercontent.com/u/34601363/toomuchscience.gif
			 *
			 * Solution:
			 *
			 * We assume the radius of the polygon is half the size of the canvas at first
			 * at each index we check if the text overlaps.
			 *
			 * Where it does, we store that angle and that index.
			 *
			 * After finding the largest index and angle we calculate how much we need to remove
			 * from the shape radius to move the point inwards by that x.
			 *
			 * We average the left and right distances to get the maximum shape radius that can fit in the box
			 * along with labels.
			 *
			 * Once we have that, we can find the centre point for the chart, by taking the x text protrusion
			 * on each side, removing that from the size, halving it and adding the left x protrusion width.
			 *
			 * This will mean we have a shape fitted to the canvas, as large as it can be with the labels
			 * and position it in the most space efficient manner
			 *
			 * https://dl.dropboxusercontent.com/u/34601363/yeahscience.gif
			 */


			// Get maximum radius of the polygon. Either half the height (minus the text width) or half the width.
			// Use this to calculate the offset + change. - Make sure L/R protrusion is at least 0 to stop issues with centre points
			var largestPossibleRadius = min([(this.height/2 - this.pointLabelFontSize - 5), this.width/2]),
				pointPosition,
				i,
				textWidth,
				halfTextWidth,
				furthestRight = this.width,
				furthestRightIndex,
				furthestRightAngle,
				furthestLeft = 0,
				furthestLeftIndex,
				furthestLeftAngle,
				xProtrusionLeft,
				xProtrusionRight,
				radiusReductionRight,
				radiusReductionLeft,
				maxWidthRadius;
			this.ctx.font = fontString(this.pointLabelFontSize,this.pointLabelFontStyle,this.pointLabelFontFamily);
			for (i=0;i<this.valuesCount;i++){
				// 5px to space the text slightly out - similar to what we do in the draw function.
				pointPosition = this.getPointPosition(i, largestPossibleRadius);
				textWidth = this.ctx.measureText(template(this.templateString, { value: this.labels[i] })).width + 5;
				if (i === 0 || i === this.valuesCount/2){
					// If we're at index zero, or exactly the middle, we're at exactly the top/bottom
					// of the radar chart, so text will be aligned centrally, so we'll half it and compare
					// w/left and right text sizes
					halfTextWidth = textWidth/2;
					if (pointPosition.x + halfTextWidth > furthestRight) {
						furthestRight = pointPosition.x + halfTextWidth;
						furthestRightIndex = i;
					}
					if (pointPosition.x - halfTextWidth < furthestLeft) {
						furthestLeft = pointPosition.x - halfTextWidth;
						furthestLeftIndex = i;
					}
				}
				else if (i < this.valuesCount/2) {
					// Less than half the values means we'll left align the text
					if (pointPosition.x + textWidth > furthestRight) {
						furthestRight = pointPosition.x + textWidth;
						furthestRightIndex = i;
					}
				}
				else if (i > this.valuesCount/2){
					// More than half the values means we'll right align the text
					if (pointPosition.x - textWidth < furthestLeft) {
						furthestLeft = pointPosition.x - textWidth;
						furthestLeftIndex = i;
					}
				}
			}

			xProtrusionLeft = furthestLeft;

			xProtrusionRight = Math.ceil(furthestRight - this.width);

			furthestRightAngle = this.getIndexAngle(furthestRightIndex);

			furthestLeftAngle = this.getIndexAngle(furthestLeftIndex);

			radiusReductionRight = xProtrusionRight / Math.sin(furthestRightAngle + Math.PI/2);

			radiusReductionLeft = xProtrusionLeft / Math.sin(furthestLeftAngle + Math.PI/2);

			// Ensure we actually need to reduce the size of the chart
			radiusReductionRight = (isNumber(radiusReductionRight)) ? radiusReductionRight : 0;
			radiusReductionLeft = (isNumber(radiusReductionLeft)) ? radiusReductionLeft : 0;

			this.drawingArea = largestPossibleRadius - (radiusReductionLeft + radiusReductionRight)/2;

			//this.drawingArea = min([maxWidthRadius, (this.height - (2 * (this.pointLabelFontSize + 5)))/2])
			this.setCenterPoint(radiusReductionLeft, radiusReductionRight);

		},
		setCenterPoint: function(leftMovement, rightMovement){

			var maxRight = this.width - rightMovement - this.drawingArea,
				maxLeft = leftMovement + this.drawingArea;

			this.xCenter = (maxLeft + maxRight)/2;
			// Always vertically in the centre as the text height doesn't change
			this.yCenter = (this.height/2);
		},

		getIndexAngle : function(index){
			var angleMultiplier = (Math.PI * 2) / this.valuesCount;
			// Start from the top instead of right, so remove a quarter of the circle

			return index * angleMultiplier - (Math.PI/2);
		},
		getPointPosition : function(index, distanceFromCenter){
			var thisAngle = this.getIndexAngle(index);
			return {
				x : (Math.cos(thisAngle) * distanceFromCenter) + this.xCenter,
				y : (Math.sin(thisAngle) * distanceFromCenter) + this.yCenter
			};
		},
		draw: function(){
			if (this.display){
				var ctx = this.ctx;
				each(this.yLabels, function(label, index){
					// Don't draw a centre value
					if (index > 0){
						var yCenterOffset = index * (this.drawingArea/this.steps),
							yHeight = this.yCenter - yCenterOffset,
							pointPosition;

						// Draw circular lines around the scale
						if (this.lineWidth > 0){
							ctx.strokeStyle = this.lineColor;
							ctx.lineWidth = this.lineWidth;

							if(this.lineArc){
								ctx.beginPath();
								ctx.arc(this.xCenter, this.yCenter, yCenterOffset, 0, Math.PI*2);
								ctx.closePath();
								ctx.stroke();
							} else{
								ctx.beginPath();
								for (var i=0;i<this.valuesCount;i++)
								{
									pointPosition = this.getPointPosition(i, this.calculateCenterOffset(this.min + (index * this.stepValue)));
									if (i === 0){
										ctx.moveTo(pointPosition.x, pointPosition.y);
									} else {
										ctx.lineTo(pointPosition.x, pointPosition.y);
									}
								}
								ctx.closePath();
								ctx.stroke();
							}
						}
						if(this.showLabels){
							ctx.font = fontString(this.fontSize,this.fontStyle,this.fontFamily);
							if (this.showLabelBackdrop){
								var labelWidth = ctx.measureText(label).width;
								ctx.fillStyle = this.backdropColor;
								ctx.fillRect(
									this.xCenter - labelWidth/2 - this.backdropPaddingX,
									yHeight - this.fontSize/2 - this.backdropPaddingY,
									labelWidth + this.backdropPaddingX*2,
									this.fontSize + this.backdropPaddingY*2
								);
							}
							ctx.textAlign = 'center';
							ctx.textBaseline = "middle";
							ctx.fillStyle = this.fontColor;
							ctx.fillText(label, this.xCenter, yHeight);
						}
					}
				}, this);

				if (!this.lineArc){
					ctx.lineWidth = this.angleLineWidth;
					ctx.strokeStyle = this.angleLineColor;
					for (var i = this.valuesCount - 1; i >= 0; i--) {
						var centerOffset = null, outerPosition = null;

						if (this.angleLineWidth > 0 && (i % this.angleLineInterval === 0)){
							centerOffset = this.calculateCenterOffset(this.max);
							outerPosition = this.getPointPosition(i, centerOffset);
							ctx.beginPath();
							ctx.moveTo(this.xCenter, this.yCenter);
							ctx.lineTo(outerPosition.x, outerPosition.y);
							ctx.stroke();
							ctx.closePath();
						}

						if (this.backgroundColors && this.backgroundColors.length == this.valuesCount) {
							if (centerOffset == null)
								centerOffset = this.calculateCenterOffset(this.max);

							if (outerPosition == null)
								outerPosition = this.getPointPosition(i, centerOffset);

							var previousOuterPosition = this.getPointPosition(i === 0 ? this.valuesCount - 1 : i - 1, centerOffset);
							var nextOuterPosition = this.getPointPosition(i === this.valuesCount - 1 ? 0 : i + 1, centerOffset);

							var previousOuterHalfway = { x: (previousOuterPosition.x + outerPosition.x) / 2, y: (previousOuterPosition.y + outerPosition.y) / 2 };
							var nextOuterHalfway = { x: (outerPosition.x + nextOuterPosition.x) / 2, y: (outerPosition.y + nextOuterPosition.y) / 2 };

							ctx.beginPath();
							ctx.moveTo(this.xCenter, this.yCenter);
							ctx.lineTo(previousOuterHalfway.x, previousOuterHalfway.y);
							ctx.lineTo(outerPosition.x, outerPosition.y);
							ctx.lineTo(nextOuterHalfway.x, nextOuterHalfway.y);
							ctx.fillStyle = this.backgroundColors[i];
							ctx.fill();
							ctx.closePath();
						}
						// Extra 3px out for some label spacing
						var pointLabelPosition = this.getPointPosition(i, this.calculateCenterOffset(this.max) + 5);
						ctx.font = fontString(this.pointLabelFontSize,this.pointLabelFontStyle,this.pointLabelFontFamily);
						ctx.fillStyle = this.pointLabelFontColor;

						var labelsCount = this.labels.length,
							halfLabelsCount = this.labels.length/2,
							quarterLabelsCount = halfLabelsCount/2,
							upperHalf = (i < quarterLabelsCount || i > labelsCount - quarterLabelsCount),
							exactQuarter = (i === quarterLabelsCount || i === labelsCount - quarterLabelsCount);
						if (i === 0){
							ctx.textAlign = 'center';
						} else if(i === halfLabelsCount){
							ctx.textAlign = 'center';
						} else if (i < halfLabelsCount){
							ctx.textAlign = 'left';
						} else {
							ctx.textAlign = 'right';
						}

						// Set the correct text baseline based on outer positioning
						if (exactQuarter){
							ctx.textBaseline = 'middle';
						} else if (upperHalf){
							ctx.textBaseline = 'bottom';
						} else {
							ctx.textBaseline = 'top';
						}

						ctx.fillText(this.labels[i], pointLabelPosition.x, pointLabelPosition.y);
					}
				}
			}
		}
	});

	Chart.animationService = {
		frameDuration: 17,
		animations: [],
		dropFrames: 0,
		addAnimation: function(chartInstance, animationObject) {
			for (var index = 0; index < this.animations.length; ++ index){
				if (this.animations[index].chartInstance === chartInstance){
					// replacing an in progress animation
					this.animations[index].animationObject = animationObject;
					return;
				}
			}
			
			this.animations.push({
				chartInstance: chartInstance,
				animationObject: animationObject
			});

			// If there are no animations queued, manually kickstart a digest, for lack of a better word
			if (this.animations.length == 1) {
				helpers.requestAnimFrame.call(window, this.digestWrapper);
			}
		},
		// Cancel the animation for a given chart instance
		cancelAnimation: function(chartInstance) {
			var index = helpers.findNextWhere(this.animations, function(animationWrapper) {
				return animationWrapper.chartInstance === chartInstance;
			});
			
			if (index)
			{
				this.animations.splice(index, 1);
			}
		},
		// calls startDigest with the proper context
		digestWrapper: function() {
			Chart.animationService.startDigest.call(Chart.animationService);
		},
		startDigest: function() {

			var startTime = Date.now();
			var framesToDrop = 0;

			if(this.dropFrames > 1){
				framesToDrop = Math.floor(this.dropFrames);
				this.dropFrames -= framesToDrop;
			}

			for (var i = 0; i < this.animations.length; i++) {

				if (this.animations[i].animationObject.currentStep === null){
					this.animations[i].animationObject.currentStep = 0;
				}

				this.animations[i].animationObject.currentStep += 1 + framesToDrop;
				if(this.animations[i].animationObject.currentStep > this.animations[i].animationObject.numSteps){
					this.animations[i].animationObject.currentStep = this.animations[i].animationObject.numSteps;
				}
				
				this.animations[i].animationObject.render(this.animations[i].chartInstance, this.animations[i].animationObject);
				
				// Check if executed the last frame.
				if (this.animations[i].animationObject.currentStep == this.animations[i].animationObject.numSteps){
					// Call onAnimationComplete
					this.animations[i].animationObject.onAnimationComplete.call(this.animations[i].chartInstance);
					// Remove the animation.
					this.animations.splice(i, 1);
					// Keep the index in place to offset the splice
					i--;
				}
			}

			var endTime = Date.now();
			var delay = endTime - startTime - this.frameDuration;
			var frameDelay = delay / this.frameDuration;

			if(frameDelay > 1){
				this.dropFrames += frameDelay;
			}

			// Do we have more stuff to animate?
			if (this.animations.length > 0){
				helpers.requestAnimFrame.call(window, this.digestWrapper);
			}
		}
	};

	// Attach global event to resize each chart instance when the browser resizes
	helpers.addEvent(window, "resize", (function(){
		// Basic debounce of resize function so it doesn't hurt performance when resizing browser.
		var timeout;
		return function(){
			clearTimeout(timeout);
			timeout = setTimeout(function(){
				each(Chart.instances,function(instance){
					// If the responsive flag is set in the chart instance config
					// Cascade the resize event down to the chart.
					if (instance.options.responsive){
						instance.resize(instance.render, true);
					}
				});
			}, 50);
		};
	})());


	if (amd) {
		define('Chart', [], function(){
			return Chart;
		});
	} else if (typeof module === 'object' && module.exports) {
		module.exports = Chart;
	}

	root.Chart = Chart;

	Chart.noConflict = function(){
		root.Chart = previous;
		return Chart;
	};

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;


	var defaultConfig = {
		//Boolean - Whether the scale should start at zero, or an order of magnitude down from the lowest value
		scaleBeginAtZero : true,

		//Boolean - Whether grid lines are shown across the chart
		scaleShowGridLines : true,

		//String - Colour of the grid lines
		scaleGridLineColor : "rgba(0,0,0,.05)",

		//Number - Width of the grid lines
		scaleGridLineWidth : 1,

		//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowHorizontalLines: true,

		//Boolean - Whether to show vertical lines (except Y axis)
		scaleShowVerticalLines: true,

		//Boolean - If there is a stroke on each bar
		barShowStroke : true,

		//Number - Pixel width of the bar stroke
		barStrokeWidth : 2,

		//Number - Spacing between each of the X value sets
		barValueSpacing : 5,

		//Number - Spacing between data sets within X values
		barDatasetSpacing : 1,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"

	};


	Chart.Type.extend({
		name: "Bar",
		defaults : defaultConfig,
		initialize:  function(data){

			//Expose options as a scope variable here so we can access it in the ScaleClass
			var options = this.options;

			this.ScaleClass = Chart.Scale.extend({
				offsetGridLines : true,
				calculateBarX : function(datasetCount, datasetIndex, barIndex){
					//Reusable method for calculating the xPosition of a given bar based on datasetIndex & width of the bar
					var xWidth = this.calculateBaseWidth(),
						xAbsolute = this.calculateX(barIndex) - (xWidth/2),
						barWidth = this.calculateBarWidth(datasetCount);

					return xAbsolute + (barWidth * datasetIndex) + (datasetIndex * options.barDatasetSpacing) + barWidth/2;
				},
				calculateBaseWidth : function(){
					return (this.calculateX(1) - this.calculateX(0)) - (2*options.barValueSpacing);
				},
				calculateBarWidth : function(datasetCount){
					//The padding between datasets is to the right of each bar, providing that there are more than 1 dataset
					var baseWidth = this.calculateBaseWidth() - ((datasetCount - 1) * options.barDatasetSpacing);

					return (baseWidth / datasetCount);
				}
			});

			this.datasets = [];

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeBars = (evt.type !== 'mouseout') ? this.getBarsAtEvent(evt) : [];

					this.eachBars(function(bar){
						bar.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activeBars, function(activeBar){
						if (activeBar) {
							activeBar.fillColor = activeBar.highlightFill;
							activeBar.strokeColor = activeBar.highlightStroke;
						}
					});
					this.showTooltip(activeBars);
				});
			}

			//Declare the extension of the default point, to cater for the options passed in to the constructor
			this.BarClass = Chart.Rectangle.extend({
				strokeWidth : this.options.barStrokeWidth,
				showStroke : this.options.barShowStroke,
				ctx : this.chart.ctx
			});

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset,datasetIndex){

				var datasetObject = {
					label : dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					bars : []
				};

				this.datasets.push(datasetObject);

				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.bars.push(new this.BarClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						strokeColor : (typeof dataset.strokeColor == 'object') ? dataset.strokeColor[index] : dataset.strokeColor,
						fillColor : (typeof dataset.fillColor == 'object') ? dataset.fillColor[index] : dataset.fillColor,
						highlightFill : (dataset.highlightFill) ? (typeof dataset.highlightFill == 'object') ? dataset.highlightFill[index] : dataset.highlightFill : (typeof dataset.fillColor == 'object') ? dataset.fillColor[index] : dataset.fillColor,
						highlightStroke : (dataset.highlightStroke) ? (typeof dataset.highlightStroke == 'object') ? dataset.highlightStroke[index] : dataset.highlightStroke : (typeof dataset.strokeColor == 'object') ? dataset.strokeColor[index] : dataset.strokeColor
					}));
				},this);

			},this);

			this.buildScale(data.labels);

			this.BarClass.prototype.base = this.scale.endPoint;

			this.eachBars(function(bar, index, datasetIndex){
				helpers.extend(bar, {
					width : this.scale.calculateBarWidth(this.datasets.length),
					x: this.scale.calculateBarX(this.datasets.length, datasetIndex, index),
					y: this.scale.endPoint
				});
				bar.save();
			}, this);

			this.render();
		},
		update : function(){
			this.scale.update();
			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor', 'strokeColor']);
			});

			this.eachBars(function(bar){
				bar.save();
			});
			this.render();
		},
		eachBars : function(callback){
			helpers.each(this.datasets,function(dataset, datasetIndex){
				helpers.each(dataset.bars, callback, this, datasetIndex);
			},this);
		},
		getBarsAtEvent : function(e){
			var barsArray = [],
				eventPosition = helpers.getRelativePosition(e),
				datasetIterator = function(dataset){
					barsArray.push(dataset.bars[barIndex]);
				},
				barIndex;

			for (var datasetIndex = 0; datasetIndex < this.datasets.length; datasetIndex++) {
				for (barIndex = 0; barIndex < this.datasets[datasetIndex].bars.length; barIndex++) {
					if (this.datasets[datasetIndex].bars[barIndex].inRange(eventPosition.x,eventPosition.y)){
						helpers.each(this.datasets, datasetIterator);
						return barsArray;
					}
				}
			}

			return barsArray;
		},
		buildScale : function(labels){
			var self = this;

			var dataTotal = function(){
				var values = [];
				self.eachBars(function(bar){
					values.push(bar.value);
				});
				return values;
			};

			var scaleOptions = {
				templateString : this.options.scaleLabel,
				height : this.chart.height,
				width : this.chart.width,
				ctx : this.chart.ctx,
				textColor : this.options.scaleFontColor,
				fontSize : this.options.scaleFontSize,
				fontStyle : this.options.scaleFontStyle,
				fontFamily : this.options.scaleFontFamily,
				valuesCount : labels.length,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,
				calculateYRange: function(currentHeight){
					var updatedRanges = helpers.calculateScaleRange(
						dataTotal(),
						currentHeight,
						this.fontSize,
						this.beginAtZero,
						this.integersOnly
					);
					helpers.extend(this, updatedRanges);
				},
				xLabels : labels,
				font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
				lineWidth : this.options.scaleLineWidth,
				lineColor : this.options.scaleLineColor,
				showHorizontalLines : this.options.scaleShowHorizontalLines,
				showVerticalLines : this.options.scaleShowVerticalLines,
				gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				padding : (this.options.showScale) ? 0 : (this.options.barShowStroke) ? this.options.barStrokeWidth : 0,
				showLabels : this.options.scaleShowLabels,
				display : this.options.showScale
			};

			if (this.options.scaleOverride){
				helpers.extend(scaleOptions, {
					calculateYRange: helpers.noop,
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				});
			}

			this.scale = new this.ScaleClass(scaleOptions);
		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets
			helpers.each(valuesArray,function(value,datasetIndex){
				//Add a new point for each piece of data, passing any required data to draw.
				this.datasets[datasetIndex].bars.push(new this.BarClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: this.scale.calculateBarX(this.datasets.length, datasetIndex, this.scale.valuesCount+1),
					y: this.scale.endPoint,
					width : this.scale.calculateBarWidth(this.datasets.length),
					base : this.scale.endPoint,
					strokeColor : this.datasets[datasetIndex].strokeColor,
					fillColor : this.datasets[datasetIndex].fillColor
				}));
			},this);

			this.scale.addXLabel(label);
			//Then re-render the chart.
			this.update();
		},
		removeData : function(){
			this.scale.removeXLabel();
			//Then re-render the chart.
			helpers.each(this.datasets,function(dataset){
				dataset.bars.shift();
			},this);
			this.update();
		},
		reflow : function(){
			helpers.extend(this.BarClass.prototype,{
				y: this.scale.endPoint,
				base : this.scale.endPoint
			});
			var newScaleProps = helpers.extend({
				height : this.chart.height,
				width : this.chart.width
			});
			this.scale.update(newScaleProps);
		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			this.scale.draw(easingDecimal);

			//Draw all the bars for each dataset
			helpers.each(this.datasets,function(dataset,datasetIndex){
				helpers.each(dataset.bars,function(bar,index){
					if (bar.hasValue()){
						bar.base = this.scale.endPoint;
						//Transition then draw
						bar.transition({
							x : this.scale.calculateBarX(this.datasets.length, datasetIndex, index),
							y : this.scale.calculateY(bar.value),
							width : this.scale.calculateBarWidth(this.datasets.length)
						}, easingDecimal).draw();
					}
				},this);

			},this);
		}
	});


}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Whether we should show a stroke on each segment
		segmentShowStroke : true,

		//String - The colour of each segment stroke
		segmentStrokeColor : "#fff",

		//Number - The width of each segment stroke
		segmentStrokeWidth : 2,

		//The percentage of the chart that we cut out of the middle.
		percentageInnerCutout : 50,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect
		animationEasing : "easeOutBounce",

		//Boolean - Whether we animate the rotation of the Doughnut
		animateRotate : true,

		//Boolean - Whether we animate scaling the Doughnut from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=segments[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"

	};

	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "Doughnut",
		//Providing a defaults will also register the defaults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){

			//Declare segments as a static property to prevent inheriting across the Chart type prototype
			this.segments = [];
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;

			this.SegmentArc = Chart.Arc.extend({
				ctx : this.chart.ctx,
				x : this.chart.width/2,
				y : this.chart.height/2
			});

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];

					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}
			this.calculateTotal(data);

			helpers.each(data,function(datapoint, index){
				if (!datapoint.color) {
					datapoint.color = 'hsl(' + (360 * index / data.length) + ', 100%, 50%)';
				}
				this.addData(datapoint, index, true);
			},this);

			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex !== undefined ? atIndex : this.segments.length;
			if ( typeof(segment.color) === "undefined" ) {
				segment.color = Chart.defaults.global.segmentColorDefault[index % Chart.defaults.global.segmentColorDefault.length];
				segment.highlight = Chart.defaults.global.segmentHighlightColorDefaults[index % Chart.defaults.global.segmentHighlightColorDefaults.length];				
			}
			this.segments.splice(index, 0, new this.SegmentArc({
				value : segment.value,
				outerRadius : (this.options.animateScale) ? 0 : this.outerRadius,
				innerRadius : (this.options.animateScale) ? 0 : (this.outerRadius/100) * this.options.percentageInnerCutout,
				fillColor : segment.color,
				highlightColor : segment.highlight || segment.color,
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				startAngle : Math.PI * 1.5,
				circumference : (this.options.animateRotate) ? 0 : this.calculateCircumference(segment.value),
				label : segment.label
			}));
			if (!silent){
				this.reflow();
				this.update();
			}
		},
		calculateCircumference : function(value) {
			if ( this.total > 0 ) {
				return (Math.PI*2)*(value / this.total);
			} else {
				return 0;
			}
		},
		calculateTotal : function(data){
			this.total = 0;
			helpers.each(data,function(segment){
				this.total += Math.abs(segment.value);
			},this);
		},
		update : function(){
			this.calculateTotal(this.segments);

			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor']);
			});

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			this.render();
		},

		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},

		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.outerRadius = (helpers.min([this.chart.width,this.chart.height]) -	this.options.segmentStrokeWidth/2)/2;
			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				});
			}, this);
		},
		draw : function(easeDecimal){
			var animDecimal = (easeDecimal) ? easeDecimal : 1;
			this.clear();
			helpers.each(this.segments,function(segment,index){
				segment.transition({
					circumference : this.calculateCircumference(segment.value),
					outerRadius : this.outerRadius,
					innerRadius : (this.outerRadius/100) * this.options.percentageInnerCutout
				},animDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;

				segment.draw();
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}
				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length-1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
			},this);

		}
	});

	Chart.types.Doughnut.extend({
		name : "Pie",
		defaults : helpers.merge(defaultConfig,{percentageInnerCutout : 0})
	});

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;

	var defaultConfig = {

		///Boolean - Whether grid lines are shown across the chart
		scaleShowGridLines : true,

		//String - Colour of the grid lines
		scaleGridLineColor : "rgba(0,0,0,.05)",

		//Number - Width of the grid lines
		scaleGridLineWidth : 1,

		//Boolean - Whether to show horizontal lines (except X axis)
		scaleShowHorizontalLines: true,

		//Boolean - Whether to show vertical lines (except Y axis)
		scaleShowVerticalLines: true,

		//Boolean - Whether the line is curved between points
		bezierCurve : true,

		//Number - Tension of the bezier curve between points
		bezierCurveTension : 0.4,

		//Boolean - Whether to show a dot for each point
		pointDot : true,

		//Number - Radius of each point dot in pixels
		pointDotRadius : 4,

		//Number - Pixel width of point dot stroke
		pointDotStrokeWidth : 1,

		//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
		pointHitDetectionRadius : 20,

		//Boolean - Whether to show a stroke for datasets
		datasetStroke : true,

		//Number - Pixel width of dataset stroke
		datasetStrokeWidth : 2,

		//Boolean - Whether to fill the dataset with a colour
		datasetFill : true,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].strokeColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>",

		//Boolean - Whether to horizontally center the label and point dot inside the grid
		offsetGridLines : false

	};


	Chart.Type.extend({
		name: "Line",
		defaults : defaultConfig,
		initialize:  function(data){
			//Declare the extension of the default point, to cater for the options passed in to the constructor
			this.PointClass = Chart.Point.extend({
				offsetGridLines : this.options.offsetGridLines,
				strokeWidth : this.options.pointDotStrokeWidth,
				radius : this.options.pointDotRadius,
				display: this.options.pointDot,
				hitDetectionRadius : this.options.pointHitDetectionRadius,
				ctx : this.chart.ctx,
				inRange : function(mouseX){
					return (Math.pow(mouseX-this.x, 2) < Math.pow(this.radius + this.hitDetectionRadius,2));
				}
			});

			this.datasets = [];

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activePoints = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];
					this.eachPoints(function(point){
						point.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activePoints, function(activePoint){
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});
					this.showTooltip(activePoints);
				});
			}

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset){

				var datasetObject = {
					label : dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					pointColor : dataset.pointColor,
					pointStrokeColor : dataset.pointStrokeColor,
					points : []
				};

				this.datasets.push(datasetObject);


				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					datasetObject.points.push(new this.PointClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						strokeColor : dataset.pointStrokeColor,
						fillColor : dataset.pointColor,
						highlightFill : dataset.pointHighlightFill || dataset.pointColor,
						highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
					}));
				},this);

				this.buildScale(data.labels);


				this.eachPoints(function(point, index){
					helpers.extend(point, {
						x: this.scale.calculateX(index),
						y: this.scale.endPoint
					});
					point.save();
				}, this);

			},this);


			this.render();
		},
		update : function(){
			this.scale.update();
			// Reset any highlight colours before updating.
			helpers.each(this.activeElements, function(activeElement){
				activeElement.restore(['fillColor', 'strokeColor']);
			});
			this.eachPoints(function(point){
				point.save();
			});
			this.render();
		},
		eachPoints : function(callback){
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,callback,this);
			},this);
		},
		getPointsAtEvent : function(e){
			var pointsArray = [],
				eventPosition = helpers.getRelativePosition(e);
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,function(point){
					if (point.inRange(eventPosition.x,eventPosition.y)) pointsArray.push(point);
				});
			},this);
			return pointsArray;
		},
		buildScale : function(labels){
			var self = this;

			var dataTotal = function(){
				var values = [];
				self.eachPoints(function(point){
					values.push(point.value);
				});

				return values;
			};

			var scaleOptions = {
				templateString : this.options.scaleLabel,
				height : this.chart.height,
				width : this.chart.width,
				ctx : this.chart.ctx,
				textColor : this.options.scaleFontColor,
				offsetGridLines : this.options.offsetGridLines,
				fontSize : this.options.scaleFontSize,
				fontStyle : this.options.scaleFontStyle,
				fontFamily : this.options.scaleFontFamily,
				valuesCount : labels.length,
				beginAtZero : this.options.scaleBeginAtZero,
				integersOnly : this.options.scaleIntegersOnly,
				calculateYRange : function(currentHeight){
					var updatedRanges = helpers.calculateScaleRange(
						dataTotal(),
						currentHeight,
						this.fontSize,
						this.beginAtZero,
						this.integersOnly
					);
					helpers.extend(this, updatedRanges);
				},
				xLabels : labels,
				font : helpers.fontString(this.options.scaleFontSize, this.options.scaleFontStyle, this.options.scaleFontFamily),
				lineWidth : this.options.scaleLineWidth,
				lineColor : this.options.scaleLineColor,
				showHorizontalLines : this.options.scaleShowHorizontalLines,
				showVerticalLines : this.options.scaleShowVerticalLines,
				gridLineWidth : (this.options.scaleShowGridLines) ? this.options.scaleGridLineWidth : 0,
				gridLineColor : (this.options.scaleShowGridLines) ? this.options.scaleGridLineColor : "rgba(0,0,0,0)",
				padding: (this.options.showScale) ? 0 : this.options.pointDotRadius + this.options.pointDotStrokeWidth,
				showLabels : this.options.scaleShowLabels,
				display : this.options.showScale
			};

			if (this.options.scaleOverride){
				helpers.extend(scaleOptions, {
					calculateYRange: helpers.noop,
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				});
			}


			this.scale = new Chart.Scale(scaleOptions);
		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets

			helpers.each(valuesArray,function(value,datasetIndex){
				//Add a new point for each piece of data, passing any required data to draw.
				this.datasets[datasetIndex].points.push(new this.PointClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: this.scale.calculateX(this.scale.valuesCount+1),
					y: this.scale.endPoint,
					strokeColor : this.datasets[datasetIndex].pointStrokeColor,
					fillColor : this.datasets[datasetIndex].pointColor
				}));
			},this);

			this.scale.addXLabel(label);
			//Then re-render the chart.
			this.update();
		},
		removeData : function(){
			this.scale.removeXLabel();
			//Then re-render the chart.
			helpers.each(this.datasets,function(dataset){
				dataset.points.shift();
			},this);
			this.update();
		},
		reflow : function(){
			var newScaleProps = helpers.extend({
				height : this.chart.height,
				width : this.chart.width
			});
			this.scale.update(newScaleProps);
		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			this.clear();

			var ctx = this.chart.ctx;

			// Some helper methods for getting the next/prev points
			var hasValue = function(item){
				return item.value !== null;
			},
			nextPoint = function(point, collection, index){
				return helpers.findNextWhere(collection, hasValue, index) || point;
			},
			previousPoint = function(point, collection, index){
				return helpers.findPreviousWhere(collection, hasValue, index) || point;
			};

			if (!this.scale) return;
			this.scale.draw(easingDecimal);


			helpers.each(this.datasets,function(dataset){
				var pointsWithValues = helpers.where(dataset.points, hasValue);

				//Transition each point first so that the line and point drawing isn't out of sync
				//We can use this extra loop to calculate the control points of this dataset also in this loop

				helpers.each(dataset.points, function(point, index){
					if (point.hasValue()){
						point.transition({
							y : this.scale.calculateY(point.value),
							x : this.scale.calculateX(index)
						}, easingDecimal);
					}
				},this);


				// Control points need to be calculated in a separate loop, because we need to know the current x/y of the point
				// This would cause issues when there is no animation, because the y of the next point would be 0, so beziers would be skewed
				if (this.options.bezierCurve){
					helpers.each(pointsWithValues, function(point, index){
						var tension = (index > 0 && index < pointsWithValues.length - 1) ? this.options.bezierCurveTension : 0;
						point.controlPoints = helpers.splineCurve(
							previousPoint(point, pointsWithValues, index),
							point,
							nextPoint(point, pointsWithValues, index),
							tension
						);

						// Prevent the bezier going outside of the bounds of the graph

						// Cap puter bezier handles to the upper/lower scale bounds
						if (point.controlPoints.outer.y > this.scale.endPoint){
							point.controlPoints.outer.y = this.scale.endPoint;
						}
						else if (point.controlPoints.outer.y < this.scale.startPoint){
							point.controlPoints.outer.y = this.scale.startPoint;
						}

						// Cap inner bezier handles to the upper/lower scale bounds
						if (point.controlPoints.inner.y > this.scale.endPoint){
							point.controlPoints.inner.y = this.scale.endPoint;
						}
						else if (point.controlPoints.inner.y < this.scale.startPoint){
							point.controlPoints.inner.y = this.scale.startPoint;
						}
					},this);
				}


				//Draw the line between all the points
				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();

				helpers.each(pointsWithValues, function(point, index){
					if (index === 0){
						ctx.moveTo(point.x, point.y);
					}
					else{
						if(this.options.bezierCurve){
							var previous = previousPoint(point, pointsWithValues, index);

							ctx.bezierCurveTo(
								previous.controlPoints.outer.x,
								previous.controlPoints.outer.y,
								point.controlPoints.inner.x,
								point.controlPoints.inner.y,
								point.x,
								point.y
							);
						}
						else{
							ctx.lineTo(point.x,point.y);
						}
					}
				}, this);

				if (this.options.datasetStroke) {
					ctx.stroke();
				}

				if (this.options.datasetFill && pointsWithValues.length > 0){
					//Round off the line by going to the base of the chart, back to the start, then fill.
					ctx.lineTo(pointsWithValues[pointsWithValues.length - 1].x, this.scale.endPoint);
					ctx.lineTo(pointsWithValues[0].x, this.scale.endPoint);
					ctx.fillStyle = dataset.fillColor;
					ctx.closePath();
					ctx.fill();
				}

				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				helpers.each(pointsWithValues,function(point){
					point.draw();
				});
			},this);
		}
	});


}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		//Cache a local reference to Chart.helpers
		helpers = Chart.helpers;

	var defaultConfig = {
		//Boolean - Show a backdrop to the scale label
		scaleShowLabelBackdrop : true,

		//String - The colour of the label backdrop
		scaleBackdropColor : "rgba(255,255,255,0.75)",

		// Boolean - Whether the scale should begin at zero
		scaleBeginAtZero : true,

		//Number - The backdrop padding above & below the label in pixels
		scaleBackdropPaddingY : 2,

		//Number - The backdrop padding to the side of the label in pixels
		scaleBackdropPaddingX : 2,

		//Boolean - Show line for each value in the scale
		scaleShowLine : true,

		//Boolean - Stroke a line around each segment in the chart
		segmentShowStroke : true,

		//String - The colour of the stroke on each segment.
		segmentStrokeColor : "#fff",

		//Number - The width of the stroke value in pixels
		segmentStrokeWidth : 2,

		//Number - Amount of animation steps
		animationSteps : 100,

		//String - Animation easing effect.
		animationEasing : "easeOutBounce",

		//Boolean - Whether to animate the rotation of the chart
		animateRotate : true,

		//Boolean - Whether to animate scaling the chart from the centre
		animateScale : false,

		//String - A legend template
		legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<segments.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=segments[i].fillColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(segments[i].label){%><%=segments[i].label%><%}%></span></li><%}%></ul>"
	};


	Chart.Type.extend({
		//Passing in a name registers this chart in the Chart namespace
		name: "PolarArea",
		//Providing a defaults will also register the defaults in the chart namespace
		defaults : defaultConfig,
		//Initialize is fired when the chart is initialized - Data is passed in as a parameter
		//Config is automatically merged by the core of Chart.js, and is available at this.options
		initialize:  function(data){
			this.segments = [];
			//Declare segment class as a chart instance specific class, so it can share props for this instance
			this.SegmentArc = Chart.Arc.extend({
				showStroke : this.options.segmentShowStroke,
				strokeWidth : this.options.segmentStrokeWidth,
				strokeColor : this.options.segmentStrokeColor,
				ctx : this.chart.ctx,
				innerRadius : 0,
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.scale = new Chart.RadialScale({
				display: this.options.showScale,
				fontStyle: this.options.scaleFontStyle,
				fontSize: this.options.scaleFontSize,
				fontFamily: this.options.scaleFontFamily,
				fontColor: this.options.scaleFontColor,
				showLabels: this.options.scaleShowLabels,
				showLabelBackdrop: this.options.scaleShowLabelBackdrop,
				backdropColor: this.options.scaleBackdropColor,
				backdropPaddingY : this.options.scaleBackdropPaddingY,
				backdropPaddingX: this.options.scaleBackdropPaddingX,
				lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
				lineColor: this.options.scaleLineColor,
				lineArc: true,
				width: this.chart.width,
				height: this.chart.height,
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2,
				ctx : this.chart.ctx,
				templateString: this.options.scaleLabel,
				valuesCount: data.length
			});

			this.updateScaleRange(data);

			this.scale.update();

			helpers.each(data,function(segment,index){
				this.addData(segment,index,true);
			},this);

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activeSegments = (evt.type !== 'mouseout') ? this.getSegmentsAtEvent(evt) : [];
					helpers.each(this.segments,function(segment){
						segment.restore(["fillColor"]);
					});
					helpers.each(activeSegments,function(activeSegment){
						activeSegment.fillColor = activeSegment.highlightColor;
					});
					this.showTooltip(activeSegments);
				});
			}

			this.render();
		},
		getSegmentsAtEvent : function(e){
			var segmentsArray = [];

			var location = helpers.getRelativePosition(e);

			helpers.each(this.segments,function(segment){
				if (segment.inRange(location.x,location.y)) segmentsArray.push(segment);
			},this);
			return segmentsArray;
		},
		addData : function(segment, atIndex, silent){
			var index = atIndex || this.segments.length;

			this.segments.splice(index, 0, new this.SegmentArc({
				fillColor: segment.color,
				highlightColor: segment.highlight || segment.color,
				label: segment.label,
				value: segment.value,
				outerRadius: (this.options.animateScale) ? 0 : this.scale.calculateCenterOffset(segment.value),
				circumference: (this.options.animateRotate) ? 0 : this.scale.getCircumference(),
				startAngle: Math.PI * 1.5
			}));
			if (!silent){
				this.reflow();
				this.update();
			}
		},
		removeData: function(atIndex){
			var indexToDelete = (helpers.isNumber(atIndex)) ? atIndex : this.segments.length-1;
			this.segments.splice(indexToDelete, 1);
			this.reflow();
			this.update();
		},
		calculateTotal: function(data){
			this.total = 0;
			helpers.each(data,function(segment){
				this.total += segment.value;
			},this);
			this.scale.valuesCount = this.segments.length;
		},
		updateScaleRange: function(datapoints){
			var valuesArray = [];
			helpers.each(datapoints,function(segment){
				valuesArray.push(segment.value);
			});

			var scaleSizes = (this.options.scaleOverride) ?
				{
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				} :
				helpers.calculateScaleRange(
					valuesArray,
					helpers.min([this.chart.width, this.chart.height])/2,
					this.options.scaleFontSize,
					this.options.scaleBeginAtZero,
					this.options.scaleIntegersOnly
				);

			helpers.extend(
				this.scale,
				scaleSizes,
				{
					size: helpers.min([this.chart.width, this.chart.height]),
					xCenter: this.chart.width/2,
					yCenter: this.chart.height/2
				}
			);

		},
		update : function(){
			this.calculateTotal(this.segments);

			helpers.each(this.segments,function(segment){
				segment.save();
			});
			
			this.reflow();
			this.render();
		},
		reflow : function(){
			helpers.extend(this.SegmentArc.prototype,{
				x : this.chart.width/2,
				y : this.chart.height/2
			});
			this.updateScaleRange(this.segments);
			this.scale.update();

			helpers.extend(this.scale,{
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2
			});

			helpers.each(this.segments, function(segment){
				segment.update({
					outerRadius : this.scale.calculateCenterOffset(segment.value)
				});
			}, this);

		},
		draw : function(ease){
			var easingDecimal = ease || 1;
			//Clear & draw the canvas
			this.clear();
			helpers.each(this.segments,function(segment, index){
				segment.transition({
					circumference : this.scale.getCircumference(),
					outerRadius : this.scale.calculateCenterOffset(segment.value)
				},easingDecimal);

				segment.endAngle = segment.startAngle + segment.circumference;

				// If we've removed the first segment we need to set the first one to
				// start at the top.
				if (index === 0){
					segment.startAngle = Math.PI * 1.5;
				}

				//Check to see if it's the last segment, if not get the next and update the start angle
				if (index < this.segments.length - 1){
					this.segments[index+1].startAngle = segment.endAngle;
				}
				segment.draw();
			}, this);
			this.scale.draw();
		}
	});

}).call(this);

(function(){
	"use strict";

	var root = this,
		Chart = root.Chart,
		helpers = Chart.helpers;



	Chart.Type.extend({
		name: "Radar",
		defaults:{
			//Boolean - Whether to show lines for each scale point
			scaleShowLine : true,

			//Boolean - Whether we show the angle lines out of the radar
			angleShowLineOut : true,

			//Boolean - Whether to show labels on the scale
			scaleShowLabels : false,

			// Boolean - Whether the scale should begin at zero
			scaleBeginAtZero : true,

			//String - Colour of the angle line
			angleLineColor : "rgba(0,0,0,.1)",

			//Number - Pixel width of the angle line
			angleLineWidth : 1,

			//Number - Interval at which to draw angle lines ("every Nth point")
			angleLineInterval: 1,

			//String - Point label font declaration
			pointLabelFontFamily : "'Arial'",

			//String - Point label font weight
			pointLabelFontStyle : "normal",

			//Number - Point label font size in pixels
			pointLabelFontSize : 10,

			//String - Point label font colour
			pointLabelFontColor : "#666",

			//Boolean - Whether to show a dot for each point
			pointDot : true,

			//Number - Radius of each point dot in pixels
			pointDotRadius : 3,

			//Number - Pixel width of point dot stroke
			pointDotStrokeWidth : 1,

			//Number - amount extra to add to the radius to cater for hit detection outside the drawn point
			pointHitDetectionRadius : 20,

			//Boolean - Whether to show a stroke for datasets
			datasetStroke : true,

			//Number - Pixel width of dataset stroke
			datasetStrokeWidth : 2,

			//Boolean - Whether to fill the dataset with a colour
			datasetFill : true,

			//String - A legend template
			legendTemplate : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span class=\"<%=name.toLowerCase()%>-legend-icon\" style=\"background-color:<%=datasets[i].strokeColor%>\"></span><span class=\"<%=name.toLowerCase()%>-legend-text\"><%if(datasets[i].label){%><%=datasets[i].label%><%}%></span></li><%}%></ul>"

		},

		initialize: function(data){
			this.PointClass = Chart.Point.extend({
				strokeWidth : this.options.pointDotStrokeWidth,
				radius : this.options.pointDotRadius,
				display: this.options.pointDot,
				hitDetectionRadius : this.options.pointHitDetectionRadius,
				ctx : this.chart.ctx
			});

			this.datasets = [];

			this.buildScale(data);

			//Set up tooltip events on the chart
			if (this.options.showTooltips){
				helpers.bindEvents(this, this.options.tooltipEvents, function(evt){
					var activePointsCollection = (evt.type !== 'mouseout') ? this.getPointsAtEvent(evt) : [];

					this.eachPoints(function(point){
						point.restore(['fillColor', 'strokeColor']);
					});
					helpers.each(activePointsCollection, function(activePoint){
						activePoint.fillColor = activePoint.highlightFill;
						activePoint.strokeColor = activePoint.highlightStroke;
					});

					this.showTooltip(activePointsCollection);
				});
			}

			//Iterate through each of the datasets, and build this into a property of the chart
			helpers.each(data.datasets,function(dataset){

				var datasetObject = {
					label: dataset.label || null,
					fillColor : dataset.fillColor,
					strokeColor : dataset.strokeColor,
					pointColor : dataset.pointColor,
					pointStrokeColor : dataset.pointStrokeColor,
					points : []
				};

				this.datasets.push(datasetObject);

				helpers.each(dataset.data,function(dataPoint,index){
					//Add a new point for each piece of data, passing any required data to draw.
					var pointPosition;
					if (!this.scale.animation){
						pointPosition = this.scale.getPointPosition(index, this.scale.calculateCenterOffset(dataPoint));
					}
					datasetObject.points.push(new this.PointClass({
						value : dataPoint,
						label : data.labels[index],
						datasetLabel: dataset.label,
						x: (this.options.animation) ? this.scale.xCenter : pointPosition.x,
						y: (this.options.animation) ? this.scale.yCenter : pointPosition.y,
						strokeColor : dataset.pointStrokeColor,
						fillColor : dataset.pointColor,
						highlightFill : dataset.pointHighlightFill || dataset.pointColor,
						highlightStroke : dataset.pointHighlightStroke || dataset.pointStrokeColor
					}));
				},this);

			},this);

			this.render();
		},
		eachPoints : function(callback){
			helpers.each(this.datasets,function(dataset){
				helpers.each(dataset.points,callback,this);
			},this);
		},

		getPointsAtEvent : function(evt){
			var mousePosition = helpers.getRelativePosition(evt),
				fromCenter = helpers.getAngleFromPoint({
					x: this.scale.xCenter,
					y: this.scale.yCenter
				}, mousePosition);

			var anglePerIndex = (Math.PI * 2) /this.scale.valuesCount,
				pointIndex = Math.round((fromCenter.angle - Math.PI * 1.5) / anglePerIndex),
				activePointsCollection = [];

			// If we're at the top, make the pointIndex 0 to get the first of the array.
			if (pointIndex >= this.scale.valuesCount || pointIndex < 0){
				pointIndex = 0;
			}

			if (fromCenter.distance <= this.scale.drawingArea){
				helpers.each(this.datasets, function(dataset){
					activePointsCollection.push(dataset.points[pointIndex]);
				});
			}

			return activePointsCollection;
		},

		buildScale : function(data){
			this.scale = new Chart.RadialScale({
				display: this.options.showScale,
				fontStyle: this.options.scaleFontStyle,
				fontSize: this.options.scaleFontSize,
				fontFamily: this.options.scaleFontFamily,
				fontColor: this.options.scaleFontColor,
				showLabels: this.options.scaleShowLabels,
				showLabelBackdrop: this.options.scaleShowLabelBackdrop,
				backdropColor: this.options.scaleBackdropColor,
				backgroundColors: this.options.scaleBackgroundColors,
				backdropPaddingY : this.options.scaleBackdropPaddingY,
				backdropPaddingX: this.options.scaleBackdropPaddingX,
				lineWidth: (this.options.scaleShowLine) ? this.options.scaleLineWidth : 0,
				lineColor: this.options.scaleLineColor,
				angleLineColor : this.options.angleLineColor,
				angleLineWidth : (this.options.angleShowLineOut) ? this.options.angleLineWidth : 0,
        angleLineInterval: (this.options.angleLineInterval) ? this.options.angleLineInterval : 1,
				// Point labels at the edge of each line
				pointLabelFontColor : this.options.pointLabelFontColor,
				pointLabelFontSize : this.options.pointLabelFontSize,
				pointLabelFontFamily : this.options.pointLabelFontFamily,
				pointLabelFontStyle : this.options.pointLabelFontStyle,
				height : this.chart.height,
				width: this.chart.width,
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2,
				ctx : this.chart.ctx,
				templateString: this.options.scaleLabel,
				labels: data.labels,
				valuesCount: data.datasets[0].data.length
			});

			this.scale.setScaleSize();
			this.updateScaleRange(data.datasets);
			this.scale.buildYLabels();
		},
		updateScaleRange: function(datasets){
			var valuesArray = (function(){
				var totalDataArray = [];
				helpers.each(datasets,function(dataset){
					if (dataset.data){
						totalDataArray = totalDataArray.concat(dataset.data);
					}
					else {
						helpers.each(dataset.points, function(point){
							totalDataArray.push(point.value);
						});
					}
				});
				return totalDataArray;
			})();


			var scaleSizes = (this.options.scaleOverride) ?
				{
					steps: this.options.scaleSteps,
					stepValue: this.options.scaleStepWidth,
					min: this.options.scaleStartValue,
					max: this.options.scaleStartValue + (this.options.scaleSteps * this.options.scaleStepWidth)
				} :
				helpers.calculateScaleRange(
					valuesArray,
					helpers.min([this.chart.width, this.chart.height])/2,
					this.options.scaleFontSize,
					this.options.scaleBeginAtZero,
					this.options.scaleIntegersOnly
				);

			helpers.extend(
				this.scale,
				scaleSizes
			);

		},
		addData : function(valuesArray,label){
			//Map the values array for each of the datasets
			this.scale.valuesCount++;
			helpers.each(valuesArray,function(value,datasetIndex){
				var pointPosition = this.scale.getPointPosition(this.scale.valuesCount, this.scale.calculateCenterOffset(value));
				this.datasets[datasetIndex].points.push(new this.PointClass({
					value : value,
					label : label,
					datasetLabel: this.datasets[datasetIndex].label,
					x: pointPosition.x,
					y: pointPosition.y,
					strokeColor : this.datasets[datasetIndex].pointStrokeColor,
					fillColor : this.datasets[datasetIndex].pointColor
				}));
			},this);

			this.scale.labels.push(label);

			this.reflow();

			this.update();
		},
		removeData : function(){
			this.scale.valuesCount--;
			this.scale.labels.shift();
			helpers.each(this.datasets,function(dataset){
				dataset.points.shift();
			},this);
			this.reflow();
			this.update();
		},
		update : function(){
			this.eachPoints(function(point){
				point.save();
			});
			this.reflow();
			this.render();
		},
		reflow: function(){
			helpers.extend(this.scale, {
				width : this.chart.width,
				height: this.chart.height,
				size : helpers.min([this.chart.width, this.chart.height]),
				xCenter: this.chart.width/2,
				yCenter: this.chart.height/2
			});
			this.updateScaleRange(this.datasets);
			this.scale.setScaleSize();
			this.scale.buildYLabels();
		},
		draw : function(ease){
			var easeDecimal = ease || 1,
				ctx = this.chart.ctx;
			this.clear();
			this.scale.draw();

			helpers.each(this.datasets,function(dataset){

				//Transition each point first so that the line and point drawing isn't out of sync
				helpers.each(dataset.points,function(point,index){
					if (point.hasValue()){
						point.transition(this.scale.getPointPosition(index, this.scale.calculateCenterOffset(point.value)), easeDecimal);
					}
				},this);



				//Draw the line between all the points
				ctx.lineWidth = this.options.datasetStrokeWidth;
				ctx.strokeStyle = dataset.strokeColor;
				ctx.beginPath();
				helpers.each(dataset.points,function(point,index){
					if (index === 0){
						ctx.moveTo(point.x,point.y);
					}
					else{
						ctx.lineTo(point.x,point.y);
					}
				},this);
				ctx.closePath();
				ctx.stroke();

				ctx.fillStyle = dataset.fillColor;
				if(this.options.datasetFill){
					ctx.fill();
				}
				//Now draw the points over the line
				//A little inefficient double looping, but better than the line
				//lagging behind the point positions
				helpers.each(dataset.points,function(point){
					if (point.hasValue()){
						point.draw();
					}
				});

			},this);

		}

	});





}).call(this);

},{}],2:[function(require,module,exports){
"use strict";

var $ = window.$;
var _ = window._;
var moment = window.moment;
var Chart = require("./../../bower_components/Chart.js/Chart.js");

var chartDataMonth = {
    labels: [],
    datasets: [{
        label: "Player Activity Month chart",
        fillColor: "rgba(220,220,220,0.2)",
        strokeColor: "rgba(220,220,220,1)",
        pointColor: "rgba(220,220,220,1)",
        pointStrokeColor: "#fff",
        pointHighlightFill: "#fff",
        pointHighlightStroke: "rgba(220,220,220,1)",
        data: []
    }]
};
var monthOptions = {
    scaleShowGridLines: false,
    bezierCurve: false,
    bezierCurveTension: 0.4,
    pointDot: true,
    pointDotRadius: 4,
    pointDotStrokeWidth: 1,
    pointHitDetectionRadius: 5,
    datasetStroke: true,
    datasetStrokeWidth: 2,
    datasetFill: true,

    animationSteps: 60,
    scaleFontColor: "#aaa",
    responsive: true,
    maintainAspectRatio: true,
    scaleBeginAtZero: true,

    tooltipTemplate: "<%if (label){%><%=label%> : <%}%><%= value %> games"
};

function updateMonthChartData(activity) {
    chartDataMonth.datasets[0].data = [];
    chartDataMonth.labels = [];

    var lm = moment().utc().startOf("day").subtract(15, "days").add(1, "minute"),
        tsm = lm;
    _.each(activity, function (day) {
        tsm = moment(day.date).startOf("day"); //, "YYYY-MM-DD HH:mm:ss"
        lm.add(1, "days");
        while (lm.isBefore(tsm)) {
            chartDataMonth.labels.push(lm.format("ddd, DD/MM"));
            chartDataMonth.datasets[0].data.push(0);
            lm.add(1, "days");
        }
        chartDataMonth.labels.push(tsm.format("ddd, DD/MM"));
        chartDataMonth.datasets[0].data.push(day.count);
    });

    lm = moment().utc().startOf("day").add(2, "minute");
    tsm.add(1, "days");
    while (tsm.isBefore(lm)) {
        chartDataMonth.labels.push(tsm.format("ddd, DD/MM"));
        chartDataMonth.datasets[0].data.push(0);
        tsm.add(1, "days");
    }

    var ctx = $("#player-activity-month").get(0).getContext("2d");
    var serverHistoryChart = new Chart(ctx).Line(chartDataMonth, monthOptions);
}

var req = $.get("/api/player/activity/" + encodeURIComponent($("#player-name").text()), function (result) {
    updateMonthChartData(result.activity);
});

},{"./../../bower_components/Chart.js/Chart.js":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJib3dlcl9jb21wb25lbnRzL0NoYXJ0LmpzL0NoYXJ0LmpzIiwid2Vic2l0ZS9qcy9wbGF5ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7O0FDeHBIQSxJQUFJLElBQUksT0FBTyxDQUFmO0FBQ0EsSUFBSSxJQUFJLE9BQU8sQ0FBZjtBQUNBLElBQUksU0FBUyxPQUFPLE1BQXBCO0FBQ0EsSUFBSSxRQUFRLFFBQVEsVUFBUixDQUFaOztBQUVBLElBQUksaUJBQWlCO0FBQ2pCLFlBQVEsRUFEUztBQUVqQixjQUFVLENBQ047QUFDSSxlQUFPLDZCQURYO0FBRUksbUJBQVcsdUJBRmY7QUFHSSxxQkFBYSxxQkFIakI7QUFJSSxvQkFBWSxxQkFKaEI7QUFLSSwwQkFBa0IsTUFMdEI7QUFNSSw0QkFBb0IsTUFOeEI7QUFPSSw4QkFBc0IscUJBUDFCO0FBUUksY0FBTTtBQVJWLEtBRE07QUFGTyxDQUFyQjtBQWVBLElBQUksZUFBZTtBQUNmLHdCQUFxQixLQUROO0FBRWYsaUJBQWMsS0FGQztBQUdmLHdCQUFxQixHQUhOO0FBSWYsY0FBVyxJQUpJO0FBS2Ysb0JBQWlCLENBTEY7QUFNZix5QkFBc0IsQ0FOUDtBQU9mLDZCQUEwQixDQVBYO0FBUWYsbUJBQWdCLElBUkQ7QUFTZix3QkFBcUIsQ0FUTjtBQVVmLGlCQUFjLElBVkM7O0FBWWYsb0JBQWdCLEVBWkQ7QUFhZixvQkFBZ0IsTUFiRDtBQWNmLGdCQUFZLElBZEc7QUFlZix5QkFBcUIsSUFmTjtBQWdCZixzQkFBa0IsSUFoQkg7O0FBa0JmLHFCQUFpQjtBQWxCRixDQUFuQjs7QUFxQkEsU0FBUyxvQkFBVCxDQUE4QixRQUE5QixFQUF3QztBQUNwQyxtQkFBZSxRQUFmLENBQXdCLENBQXhCLEVBQTJCLElBQTNCLEdBQWtDLEVBQWxDO0FBQ0EsbUJBQWUsTUFBZixHQUF3QixFQUF4Qjs7QUFFQSxRQUFJLEtBQUssU0FBUyxHQUFULEdBQWUsT0FBZixDQUF1QixLQUF2QixFQUE4QixRQUE5QixDQUF1QyxFQUF2QyxFQUEyQyxNQUEzQyxFQUFtRCxHQUFuRCxDQUF1RCxDQUF2RCxFQUEwRCxRQUExRCxDQUFUO0FBQUEsUUFBOEUsTUFBTSxFQUFwRjtBQUNBLE1BQUUsSUFBRixDQUFPLFFBQVAsRUFBaUIsVUFBVSxHQUFWLEVBQWU7QUFDNUIsY0FBTSxPQUFPLElBQUksSUFBWCxFQUFpQixPQUFqQixDQUF5QixLQUF6QixDQUFOLENBRDRCLENBQ1c7QUFDdkMsV0FBRyxHQUFILENBQU8sQ0FBUCxFQUFVLE1BQVY7QUFDQSxlQUFPLEdBQUcsUUFBSCxDQUFZLEdBQVosQ0FBUCxFQUF5QjtBQUNyQiwyQkFBZSxNQUFmLENBQXNCLElBQXRCLENBQTJCLEdBQUcsTUFBSCxDQUFVLFlBQVYsQ0FBM0I7QUFDQSwyQkFBZSxRQUFmLENBQXdCLENBQXhCLEVBQTJCLElBQTNCLENBQWdDLElBQWhDLENBQXFDLENBQXJDO0FBQ0EsZUFBRyxHQUFILENBQU8sQ0FBUCxFQUFVLE1BQVY7QUFDSDtBQUNELHVCQUFlLE1BQWYsQ0FBc0IsSUFBdEIsQ0FBMkIsSUFBSSxNQUFKLENBQVcsWUFBWCxDQUEzQjtBQUNBLHVCQUFlLFFBQWYsQ0FBd0IsQ0FBeEIsRUFBMkIsSUFBM0IsQ0FBZ0MsSUFBaEMsQ0FBcUMsSUFBSSxLQUF6QztBQUNILEtBVkQ7O0FBWUEsU0FBSyxTQUFTLEdBQVQsR0FBZSxPQUFmLENBQXVCLEtBQXZCLEVBQThCLEdBQTlCLENBQWtDLENBQWxDLEVBQXFDLFFBQXJDLENBQUw7QUFDQSxRQUFJLEdBQUosQ0FBUSxDQUFSLEVBQVcsTUFBWDtBQUNBLFdBQU8sSUFBSSxRQUFKLENBQWEsRUFBYixDQUFQLEVBQXlCO0FBQ3JCLHVCQUFlLE1BQWYsQ0FBc0IsSUFBdEIsQ0FBMkIsSUFBSSxNQUFKLENBQVcsWUFBWCxDQUEzQjtBQUNBLHVCQUFlLFFBQWYsQ0FBd0IsQ0FBeEIsRUFBMkIsSUFBM0IsQ0FBZ0MsSUFBaEMsQ0FBcUMsQ0FBckM7QUFDQSxZQUFJLEdBQUosQ0FBUSxDQUFSLEVBQVcsTUFBWDtBQUNIOztBQUVELFFBQUksTUFBTSxFQUFFLHdCQUFGLEVBQTRCLEdBQTVCLENBQWdDLENBQWhDLEVBQW1DLFVBQW5DLENBQThDLElBQTlDLENBQVY7QUFDQSxRQUFJLHFCQUFxQixJQUFJLEtBQUosQ0FBVSxHQUFWLEVBQWUsSUFBZixDQUFvQixjQUFwQixFQUFvQyxZQUFwQyxDQUF6QjtBQUNIOztBQUVELElBQUksTUFBTSxFQUFFLEdBQUYsQ0FBTSwwQkFBd0IsbUJBQW1CLEVBQUUsY0FBRixFQUFrQixJQUFsQixFQUFuQixDQUE5QixFQUE0RSxVQUFTLE1BQVQsRUFBaUI7QUFDbkcseUJBQXFCLE9BQU8sUUFBNUI7QUFDSCxDQUZTLENBQVYiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyohXG4gKiBDaGFydC5qc1xuICogaHR0cDovL2NoYXJ0anMub3JnL1xuICogVmVyc2lvbjogMS4xLjFcbiAqXG4gKiBDb3B5cmlnaHQgMjAxNSBOaWNrIERvd25pZVxuICogUmVsZWFzZWQgdW5kZXIgdGhlIE1JVCBsaWNlbnNlXG4gKiBodHRwczovL2dpdGh1Yi5jb20vbm5uaWNrL0NoYXJ0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG5cbihmdW5jdGlvbigpe1xuXG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdC8vRGVjbGFyZSByb290IHZhcmlhYmxlIC0gd2luZG93IGluIHRoZSBicm93c2VyLCBnbG9iYWwgb24gdGhlIHNlcnZlclxuXHR2YXIgcm9vdCA9IHRoaXMsXG5cdFx0cHJldmlvdXMgPSByb290LkNoYXJ0O1xuXG5cdC8vT2NjdXB5IHRoZSBnbG9iYWwgdmFyaWFibGUgb2YgQ2hhcnQsIGFuZCBjcmVhdGUgYSBzaW1wbGUgYmFzZSBjbGFzc1xuXHR2YXIgQ2hhcnQgPSBmdW5jdGlvbihjb250ZXh0KXtcblx0XHR2YXIgY2hhcnQgPSB0aGlzO1xuXHRcdHRoaXMuY2FudmFzID0gY29udGV4dC5jYW52YXM7XG5cblx0XHR0aGlzLmN0eCA9IGNvbnRleHQ7XG5cblx0XHQvL1ZhcmlhYmxlcyBnbG9iYWwgdG8gdGhlIGNoYXJ0XG5cdFx0dmFyIGNvbXB1dGVEaW1lbnNpb24gPSBmdW5jdGlvbihlbGVtZW50LGRpbWVuc2lvbilcblx0XHR7XG5cdFx0XHRpZiAoZWxlbWVudFsnb2Zmc2V0JytkaW1lbnNpb25dKVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gZWxlbWVudFsnb2Zmc2V0JytkaW1lbnNpb25dO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZVxuXHRcdFx0e1xuXHRcdFx0XHRyZXR1cm4gZG9jdW1lbnQuZGVmYXVsdFZpZXcuZ2V0Q29tcHV0ZWRTdHlsZShlbGVtZW50KS5nZXRQcm9wZXJ0eVZhbHVlKGRpbWVuc2lvbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHRcdHZhciB3aWR0aCA9IHRoaXMud2lkdGggPSBjb21wdXRlRGltZW5zaW9uKGNvbnRleHQuY2FudmFzLCdXaWR0aCcpIHx8IGNvbnRleHQuY2FudmFzLndpZHRoO1xuXHRcdHZhciBoZWlnaHQgPSB0aGlzLmhlaWdodCA9IGNvbXB1dGVEaW1lbnNpb24oY29udGV4dC5jYW52YXMsJ0hlaWdodCcpIHx8IGNvbnRleHQuY2FudmFzLmhlaWdodDtcblxuXHRcdHRoaXMuYXNwZWN0UmF0aW8gPSB0aGlzLndpZHRoIC8gdGhpcy5oZWlnaHQ7XG5cdFx0Ly9IaWdoIHBpeGVsIGRlbnNpdHkgZGlzcGxheXMgLSBtdWx0aXBseSB0aGUgc2l6ZSBvZiB0aGUgY2FudmFzIGhlaWdodC93aWR0aCBieSB0aGUgZGV2aWNlIHBpeGVsIHJhdGlvLCB0aGVuIHNjYWxlLlxuXHRcdGhlbHBlcnMucmV0aW5hU2NhbGUodGhpcyk7XG5cblx0XHRyZXR1cm4gdGhpcztcblx0fTtcblx0Ly9HbG9iYWxseSBleHBvc2UgdGhlIGRlZmF1bHRzIHRvIGFsbG93IGZvciB1c2VyIHVwZGF0aW5nL2NoYW5naW5nXG5cdENoYXJ0LmRlZmF1bHRzID0ge1xuXHRcdGdsb2JhbDoge1xuXHRcdFx0Ly8gQm9vbGVhbiAtIFdoZXRoZXIgdG8gYW5pbWF0ZSB0aGUgY2hhcnRcblx0XHRcdGFuaW1hdGlvbjogdHJ1ZSxcblxuXHRcdFx0Ly8gTnVtYmVyIC0gTnVtYmVyIG9mIGFuaW1hdGlvbiBzdGVwc1xuXHRcdFx0YW5pbWF0aW9uU3RlcHM6IDYwLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBBbmltYXRpb24gZWFzaW5nIGVmZmVjdFxuXHRcdFx0YW5pbWF0aW9uRWFzaW5nOiBcImVhc2VPdXRRdWFydFwiLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gSWYgd2Ugc2hvdWxkIHNob3cgdGhlIHNjYWxlIGF0IGFsbFxuXHRcdFx0c2hvd1NjYWxlOiB0cnVlLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gSWYgd2Ugd2FudCB0byBvdmVycmlkZSB3aXRoIGEgaGFyZCBjb2RlZCBzY2FsZVxuXHRcdFx0c2NhbGVPdmVycmlkZTogZmFsc2UsXG5cblx0XHRcdC8vICoqIFJlcXVpcmVkIGlmIHNjYWxlT3ZlcnJpZGUgaXMgdHJ1ZSAqKlxuXHRcdFx0Ly8gTnVtYmVyIC0gVGhlIG51bWJlciBvZiBzdGVwcyBpbiBhIGhhcmQgY29kZWQgc2NhbGVcblx0XHRcdHNjYWxlU3RlcHM6IG51bGwsXG5cdFx0XHQvLyBOdW1iZXIgLSBUaGUgdmFsdWUganVtcCBpbiB0aGUgaGFyZCBjb2RlZCBzY2FsZVxuXHRcdFx0c2NhbGVTdGVwV2lkdGg6IG51bGwsXG5cdFx0XHQvLyBOdW1iZXIgLSBUaGUgc2NhbGUgc3RhcnRpbmcgdmFsdWVcblx0XHRcdHNjYWxlU3RhcnRWYWx1ZTogbnVsbCxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gQ29sb3VyIG9mIHRoZSBzY2FsZSBsaW5lXG5cdFx0XHRzY2FsZUxpbmVDb2xvcjogXCJyZ2JhKDAsMCwwLC4xKVwiLFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBQaXhlbCB3aWR0aCBvZiB0aGUgc2NhbGUgbGluZVxuXHRcdFx0c2NhbGVMaW5lV2lkdGg6IDEsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgbGFiZWxzIG9uIHRoZSBzY2FsZVxuXHRcdFx0c2NhbGVTaG93TGFiZWxzOiB0cnVlLFxuXG5cdFx0XHQvLyBJbnRlcnBvbGF0ZWQgSlMgc3RyaW5nIC0gY2FuIGFjY2VzcyB2YWx1ZVxuXHRcdFx0c2NhbGVMYWJlbDogXCI8JT12YWx1ZSU+XCIsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RpY2sgdG8gaW50ZWdlcnMsIGFuZCBub3Qgc2hvdyBhbnkgZmxvYXRzIGV2ZW4gaWYgZHJhd2luZyBzcGFjZSBpcyB0aGVyZVxuXHRcdFx0c2NhbGVJbnRlZ2Vyc09ubHk6IHRydWUsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgc3RhcnQgYXQgemVybywgb3IgYW4gb3JkZXIgb2YgbWFnbml0dWRlIGRvd24gZnJvbSB0aGUgbG93ZXN0IHZhbHVlXG5cdFx0XHRzY2FsZUJlZ2luQXRaZXJvOiBmYWxzZSxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gU2NhbGUgbGFiZWwgZm9udCBkZWNsYXJhdGlvbiBmb3IgdGhlIHNjYWxlIGxhYmVsXG5cdFx0XHRzY2FsZUZvbnRGYW1pbHk6IFwiJ0hlbHZldGljYSBOZXVlJywgJ0hlbHZldGljYScsICdBcmlhbCcsIHNhbnMtc2VyaWZcIixcblxuXHRcdFx0Ly8gTnVtYmVyIC0gU2NhbGUgbGFiZWwgZm9udCBzaXplIGluIHBpeGVsc1xuXHRcdFx0c2NhbGVGb250U2l6ZTogMTIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFNjYWxlIGxhYmVsIGZvbnQgd2VpZ2h0IHN0eWxlXG5cdFx0XHRzY2FsZUZvbnRTdHlsZTogXCJub3JtYWxcIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gU2NhbGUgbGFiZWwgZm9udCBjb2xvdXJcblx0XHRcdHNjYWxlRm9udENvbG9yOiBcIiM2NjZcIixcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIHdoZXRoZXIgb3Igbm90IHRoZSBjaGFydCBzaG91bGQgYmUgcmVzcG9uc2l2ZSBhbmQgcmVzaXplIHdoZW4gdGhlIGJyb3dzZXIgZG9lcy5cblx0XHRcdHJlc3BvbnNpdmU6IGZhbHNlLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gd2hldGhlciB0byBtYWludGFpbiB0aGUgc3RhcnRpbmcgYXNwZWN0IHJhdGlvIG9yIG5vdCB3aGVuIHJlc3BvbnNpdmUsIGlmIHNldCB0byBmYWxzZSwgd2lsbCB0YWtlIHVwIGVudGlyZSBjb250YWluZXJcblx0XHRcdG1haW50YWluQXNwZWN0UmF0aW86IHRydWUsXG5cblx0XHRcdC8vIEJvb2xlYW4gLSBEZXRlcm1pbmVzIHdoZXRoZXIgdG8gZHJhdyB0b29sdGlwcyBvbiB0aGUgY2FudmFzIG9yIG5vdCAtIGF0dGFjaGVzIGV2ZW50cyB0byB0b3VjaG1vdmUgJiBtb3VzZW1vdmVcblx0XHRcdHNob3dUb29sdGlwczogdHJ1ZSxcblxuXHRcdFx0Ly8gQm9vbGVhbiAtIERldGVybWluZXMgd2hldGhlciB0byBkcmF3IGJ1aWx0LWluIHRvb2x0aXAgb3IgY2FsbCBjdXN0b20gdG9vbHRpcCBmdW5jdGlvblxuXHRcdFx0Y3VzdG9tVG9vbHRpcHM6IGZhbHNlLFxuXG5cdFx0XHQvLyBBcnJheSAtIEFycmF5IG9mIHN0cmluZyBuYW1lcyB0byBhdHRhY2ggdG9vbHRpcCBldmVudHNcblx0XHRcdHRvb2x0aXBFdmVudHM6IFtcIm1vdXNlbW92ZVwiLCBcInRvdWNoc3RhcnRcIiwgXCJ0b3VjaG1vdmVcIiwgXCJtb3VzZW91dFwiXSxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCBiYWNrZ3JvdW5kIGNvbG91clxuXHRcdFx0dG9vbHRpcEZpbGxDb2xvcjogXCJyZ2JhKDAsMCwwLDAuOClcIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCBsYWJlbCBmb250IGRlY2xhcmF0aW9uIGZvciB0aGUgc2NhbGUgbGFiZWxcblx0XHRcdHRvb2x0aXBGb250RmFtaWx5OiBcIidIZWx2ZXRpY2EgTmV1ZScsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCBzYW5zLXNlcmlmXCIsXG5cblx0XHRcdC8vIE51bWJlciAtIFRvb2x0aXAgbGFiZWwgZm9udCBzaXplIGluIHBpeGVsc1xuXHRcdFx0dG9vbHRpcEZvbnRTaXplOiAxNCxcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCBmb250IHdlaWdodCBzdHlsZVxuXHRcdFx0dG9vbHRpcEZvbnRTdHlsZTogXCJub3JtYWxcIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gVG9vbHRpcCBsYWJlbCBmb250IGNvbG91clxuXHRcdFx0dG9vbHRpcEZvbnRDb2xvcjogXCIjZmZmXCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFRvb2x0aXAgdGl0bGUgZm9udCBkZWNsYXJhdGlvbiBmb3IgdGhlIHNjYWxlIGxhYmVsXG5cdFx0XHR0b29sdGlwVGl0bGVGb250RmFtaWx5OiBcIidIZWx2ZXRpY2EgTmV1ZScsICdIZWx2ZXRpY2EnLCAnQXJpYWwnLCBzYW5zLXNlcmlmXCIsXG5cblx0XHRcdC8vIE51bWJlciAtIFRvb2x0aXAgdGl0bGUgZm9udCBzaXplIGluIHBpeGVsc1xuXHRcdFx0dG9vbHRpcFRpdGxlRm9udFNpemU6IDE0LFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUb29sdGlwIHRpdGxlIGZvbnQgd2VpZ2h0IHN0eWxlXG5cdFx0XHR0b29sdGlwVGl0bGVGb250U3R5bGU6IFwiYm9sZFwiLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUb29sdGlwIHRpdGxlIGZvbnQgY29sb3VyXG5cdFx0XHR0b29sdGlwVGl0bGVGb250Q29sb3I6IFwiI2ZmZlwiLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUb29sdGlwIHRpdGxlIHRlbXBsYXRlXG5cdFx0XHR0b29sdGlwVGl0bGVUZW1wbGF0ZTogXCI8JT0gbGFiZWwlPlwiLFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBwaXhlbCB3aWR0aCBvZiBwYWRkaW5nIGFyb3VuZCB0b29sdGlwIHRleHRcblx0XHRcdHRvb2x0aXBZUGFkZGluZzogNixcblxuXHRcdFx0Ly8gTnVtYmVyIC0gcGl4ZWwgd2lkdGggb2YgcGFkZGluZyBhcm91bmQgdG9vbHRpcCB0ZXh0XG5cdFx0XHR0b29sdGlwWFBhZGRpbmc6IDYsXG5cblx0XHRcdC8vIE51bWJlciAtIFNpemUgb2YgdGhlIGNhcmV0IG9uIHRoZSB0b29sdGlwXG5cdFx0XHR0b29sdGlwQ2FyZXRTaXplOiA4LFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBQaXhlbCByYWRpdXMgb2YgdGhlIHRvb2x0aXAgYm9yZGVyXG5cdFx0XHR0b29sdGlwQ29ybmVyUmFkaXVzOiA2LFxuXG5cdFx0XHQvLyBOdW1iZXIgLSBQaXhlbCBvZmZzZXQgZnJvbSBwb2ludCB4IHRvIHRvb2x0aXAgZWRnZVxuXHRcdFx0dG9vbHRpcFhPZmZzZXQ6IDEwLFxuXG5cdFx0XHQvLyBTdHJpbmcgLSBUZW1wbGF0ZSBzdHJpbmcgZm9yIHNpbmdsZSB0b29sdGlwc1xuXHRcdFx0dG9vbHRpcFRlbXBsYXRlOiBcIjwlaWYgKGxhYmVsKXslPjwlPWxhYmVsJT46IDwlfSU+PCU9IHZhbHVlICU+XCIsXG5cblx0XHRcdC8vIFN0cmluZyAtIFRlbXBsYXRlIHN0cmluZyBmb3Igc2luZ2xlIHRvb2x0aXBzXG5cdFx0XHRtdWx0aVRvb2x0aXBUZW1wbGF0ZTogXCI8JT0gZGF0YXNldExhYmVsICU+OiA8JT0gdmFsdWUgJT5cIixcblxuXHRcdFx0Ly8gU3RyaW5nIC0gQ29sb3VyIGJlaGluZCB0aGUgbGVnZW5kIGNvbG91ciBibG9ja1xuXHRcdFx0bXVsdGlUb29sdGlwS2V5QmFja2dyb3VuZDogJyNmZmYnLFxuXG5cdFx0XHQvLyBBcnJheSAtIEEgbGlzdCBvZiBjb2xvcnMgdG8gdXNlIGFzIHRoZSBkZWZhdWx0c1xuXHRcdFx0c2VnbWVudENvbG9yRGVmYXVsdDogW1wiI0E2Q0VFM1wiLCBcIiMxRjc4QjRcIiwgXCIjQjJERjhBXCIsIFwiIzMzQTAyQ1wiLCBcIiNGQjlBOTlcIiwgXCIjRTMxQTFDXCIsIFwiI0ZEQkY2RlwiLCBcIiNGRjdGMDBcIiwgXCIjQ0FCMkQ2XCIsIFwiIzZBM0Q5QVwiLCBcIiNCNEI0ODJcIiwgXCIjQjE1OTI4XCIgXSxcblxuXHRcdFx0Ly8gQXJyYXkgLSBBIGxpc3Qgb2YgaGlnaGxpZ2h0IGNvbG9ycyB0byB1c2UgYXMgdGhlIGRlZmF1bHRzXG5cdFx0XHRzZWdtZW50SGlnaGxpZ2h0Q29sb3JEZWZhdWx0czogWyBcIiNDRUY2RkZcIiwgXCIjNDdBMERDXCIsIFwiI0RBRkZCMlwiLCBcIiM1QkM4NTRcIiwgXCIjRkZDMkMxXCIsIFwiI0ZGNDI0NFwiLCBcIiNGRkU3OTdcIiwgXCIjRkZBNzI4XCIsIFwiI0YyREFGRVwiLCBcIiM5MjY1QzJcIiwgXCIjRENEQ0FBXCIsIFwiI0Q5ODE1MFwiIF0sXG5cblx0XHRcdC8vIEZ1bmN0aW9uIC0gV2lsbCBmaXJlIG9uIGFuaW1hdGlvbiBwcm9ncmVzc2lvbi5cblx0XHRcdG9uQW5pbWF0aW9uUHJvZ3Jlc3M6IGZ1bmN0aW9uKCl7fSxcblxuXHRcdFx0Ly8gRnVuY3Rpb24gLSBXaWxsIGZpcmUgb24gYW5pbWF0aW9uIGNvbXBsZXRpb24uXG5cdFx0XHRvbkFuaW1hdGlvbkNvbXBsZXRlOiBmdW5jdGlvbigpe31cblxuXHRcdH1cblx0fTtcblxuXHQvL0NyZWF0ZSBhIGRpY3Rpb25hcnkgb2YgY2hhcnQgdHlwZXMsIHRvIGFsbG93IGZvciBleHRlbnNpb24gb2YgZXhpc3RpbmcgdHlwZXNcblx0Q2hhcnQudHlwZXMgPSB7fTtcblxuXHQvL0dsb2JhbCBDaGFydCBoZWxwZXJzIG9iamVjdCBmb3IgdXRpbGl0eSBtZXRob2RzIGFuZCBjbGFzc2VzXG5cdHZhciBoZWxwZXJzID0gQ2hhcnQuaGVscGVycyA9IHt9O1xuXG5cdFx0Ly8tLSBCYXNpYyBqcyB1dGlsaXR5IG1ldGhvZHNcblx0dmFyIGVhY2ggPSBoZWxwZXJzLmVhY2ggPSBmdW5jdGlvbihsb29wYWJsZSxjYWxsYmFjayxzZWxmKXtcblx0XHRcdHZhciBhZGRpdGlvbmFsQXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMyk7XG5cdFx0XHQvLyBDaGVjayB0byBzZWUgaWYgbnVsbCBvciB1bmRlZmluZWQgZmlyc3RseS5cblx0XHRcdGlmIChsb29wYWJsZSl7XG5cdFx0XHRcdGlmIChsb29wYWJsZS5sZW5ndGggPT09ICtsb29wYWJsZS5sZW5ndGgpe1xuXHRcdFx0XHRcdHZhciBpO1xuXHRcdFx0XHRcdGZvciAoaT0wOyBpPGxvb3BhYmxlLmxlbmd0aDsgaSsrKXtcblx0XHRcdFx0XHRcdGNhbGxiYWNrLmFwcGx5KHNlbGYsW2xvb3BhYmxlW2ldLCBpXS5jb25jYXQoYWRkaXRpb25hbEFyZ3MpKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRmb3IgKHZhciBpdGVtIGluIGxvb3BhYmxlKXtcblx0XHRcdFx0XHRcdGNhbGxiYWNrLmFwcGx5KHNlbGYsW2xvb3BhYmxlW2l0ZW1dLGl0ZW1dLmNvbmNhdChhZGRpdGlvbmFsQXJncykpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Y2xvbmUgPSBoZWxwZXJzLmNsb25lID0gZnVuY3Rpb24ob2JqKXtcblx0XHRcdHZhciBvYmpDbG9uZSA9IHt9O1xuXHRcdFx0ZWFjaChvYmosZnVuY3Rpb24odmFsdWUsa2V5KXtcblx0XHRcdFx0aWYgKG9iai5oYXNPd25Qcm9wZXJ0eShrZXkpKXtcblx0XHRcdFx0XHRvYmpDbG9uZVtrZXldID0gdmFsdWU7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIG9iakNsb25lO1xuXHRcdH0sXG5cdFx0ZXh0ZW5kID0gaGVscGVycy5leHRlbmQgPSBmdW5jdGlvbihiYXNlKXtcblx0XHRcdGVhY2goQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzLDEpLCBmdW5jdGlvbihleHRlbnNpb25PYmplY3QpIHtcblx0XHRcdFx0ZWFjaChleHRlbnNpb25PYmplY3QsZnVuY3Rpb24odmFsdWUsa2V5KXtcblx0XHRcdFx0XHRpZiAoZXh0ZW5zaW9uT2JqZWN0Lmhhc093blByb3BlcnR5KGtleSkpe1xuXHRcdFx0XHRcdFx0YmFzZVtrZXldID0gdmFsdWU7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGJhc2U7XG5cdFx0fSxcblx0XHRtZXJnZSA9IGhlbHBlcnMubWVyZ2UgPSBmdW5jdGlvbihiYXNlLG1hc3Rlcil7XG5cdFx0XHQvL01lcmdlIHByb3BlcnRpZXMgaW4gbGVmdCBvYmplY3Qgb3ZlciB0byBhIHNoYWxsb3cgY2xvbmUgb2Ygb2JqZWN0IHJpZ2h0LlxuXHRcdFx0dmFyIGFyZ3MgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsMCk7XG5cdFx0XHRhcmdzLnVuc2hpZnQoe30pO1xuXHRcdFx0cmV0dXJuIGV4dGVuZC5hcHBseShudWxsLCBhcmdzKTtcblx0XHR9LFxuXHRcdGluZGV4T2YgPSBoZWxwZXJzLmluZGV4T2YgPSBmdW5jdGlvbihhcnJheVRvU2VhcmNoLCBpdGVtKXtcblx0XHRcdGlmIChBcnJheS5wcm90b3R5cGUuaW5kZXhPZikge1xuXHRcdFx0XHRyZXR1cm4gYXJyYXlUb1NlYXJjaC5pbmRleE9mKGl0ZW0pO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBhcnJheVRvU2VhcmNoLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRcdFx0aWYgKGFycmF5VG9TZWFyY2hbaV0gPT09IGl0ZW0pIHJldHVybiBpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAtMTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHdoZXJlID0gaGVscGVycy53aGVyZSA9IGZ1bmN0aW9uKGNvbGxlY3Rpb24sIGZpbHRlckNhbGxiYWNrKXtcblx0XHRcdHZhciBmaWx0ZXJlZCA9IFtdO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2goY29sbGVjdGlvbiwgZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRcdGlmIChmaWx0ZXJDYWxsYmFjayhpdGVtKSl7XG5cdFx0XHRcdFx0ZmlsdGVyZWQucHVzaChpdGVtKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHJldHVybiBmaWx0ZXJlZDtcblx0XHR9LFxuXHRcdGZpbmROZXh0V2hlcmUgPSBoZWxwZXJzLmZpbmROZXh0V2hlcmUgPSBmdW5jdGlvbihhcnJheVRvU2VhcmNoLCBmaWx0ZXJDYWxsYmFjaywgc3RhcnRJbmRleCl7XG5cdFx0XHQvLyBEZWZhdWx0IHRvIHN0YXJ0IG9mIHRoZSBhcnJheVxuXHRcdFx0aWYgKCFzdGFydEluZGV4KXtcblx0XHRcdFx0c3RhcnRJbmRleCA9IC0xO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IHN0YXJ0SW5kZXggKyAxOyBpIDwgYXJyYXlUb1NlYXJjaC5sZW5ndGg7IGkrKykge1xuXHRcdFx0XHR2YXIgY3VycmVudEl0ZW0gPSBhcnJheVRvU2VhcmNoW2ldO1xuXHRcdFx0XHRpZiAoZmlsdGVyQ2FsbGJhY2soY3VycmVudEl0ZW0pKXtcblx0XHRcdFx0XHRyZXR1cm4gY3VycmVudEl0ZW07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdGZpbmRQcmV2aW91c1doZXJlID0gaGVscGVycy5maW5kUHJldmlvdXNXaGVyZSA9IGZ1bmN0aW9uKGFycmF5VG9TZWFyY2gsIGZpbHRlckNhbGxiYWNrLCBzdGFydEluZGV4KXtcblx0XHRcdC8vIERlZmF1bHQgdG8gZW5kIG9mIHRoZSBhcnJheVxuXHRcdFx0aWYgKCFzdGFydEluZGV4KXtcblx0XHRcdFx0c3RhcnRJbmRleCA9IGFycmF5VG9TZWFyY2gubGVuZ3RoO1xuXHRcdFx0fVxuXHRcdFx0Zm9yICh2YXIgaSA9IHN0YXJ0SW5kZXggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0XHR2YXIgY3VycmVudEl0ZW0gPSBhcnJheVRvU2VhcmNoW2ldO1xuXHRcdFx0XHRpZiAoZmlsdGVyQ2FsbGJhY2soY3VycmVudEl0ZW0pKXtcblx0XHRcdFx0XHRyZXR1cm4gY3VycmVudEl0ZW07XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdGluaGVyaXRzID0gaGVscGVycy5pbmhlcml0cyA9IGZ1bmN0aW9uKGV4dGVuc2lvbnMpe1xuXHRcdFx0Ly9CYXNpYyBqYXZhc2NyaXB0IGluaGVyaXRhbmNlIGJhc2VkIG9uIHRoZSBtb2RlbCBjcmVhdGVkIGluIEJhY2tib25lLmpzXG5cdFx0XHR2YXIgcGFyZW50ID0gdGhpcztcblx0XHRcdHZhciBDaGFydEVsZW1lbnQgPSAoZXh0ZW5zaW9ucyAmJiBleHRlbnNpb25zLmhhc093blByb3BlcnR5KFwiY29uc3RydWN0b3JcIikpID8gZXh0ZW5zaW9ucy5jb25zdHJ1Y3RvciA6IGZ1bmN0aW9uKCl7IHJldHVybiBwYXJlbnQuYXBwbHkodGhpcywgYXJndW1lbnRzKTsgfTtcblxuXHRcdFx0dmFyIFN1cnJvZ2F0ZSA9IGZ1bmN0aW9uKCl7IHRoaXMuY29uc3RydWN0b3IgPSBDaGFydEVsZW1lbnQ7fTtcblx0XHRcdFN1cnJvZ2F0ZS5wcm90b3R5cGUgPSBwYXJlbnQucHJvdG90eXBlO1xuXHRcdFx0Q2hhcnRFbGVtZW50LnByb3RvdHlwZSA9IG5ldyBTdXJyb2dhdGUoKTtcblxuXHRcdFx0Q2hhcnRFbGVtZW50LmV4dGVuZCA9IGluaGVyaXRzO1xuXG5cdFx0XHRpZiAoZXh0ZW5zaW9ucykgZXh0ZW5kKENoYXJ0RWxlbWVudC5wcm90b3R5cGUsIGV4dGVuc2lvbnMpO1xuXG5cdFx0XHRDaGFydEVsZW1lbnQuX19zdXBlcl9fID0gcGFyZW50LnByb3RvdHlwZTtcblxuXHRcdFx0cmV0dXJuIENoYXJ0RWxlbWVudDtcblx0XHR9LFxuXHRcdG5vb3AgPSBoZWxwZXJzLm5vb3AgPSBmdW5jdGlvbigpe30sXG5cdFx0dWlkID0gaGVscGVycy51aWQgPSAoZnVuY3Rpb24oKXtcblx0XHRcdHZhciBpZD0wO1xuXHRcdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHJldHVybiBcImNoYXJ0LVwiICsgaWQrKztcblx0XHRcdH07XG5cdFx0fSkoKSxcblx0XHR3YXJuID0gaGVscGVycy53YXJuID0gZnVuY3Rpb24oc3RyKXtcblx0XHRcdC8vTWV0aG9kIGZvciB3YXJuaW5nIG9mIGVycm9yc1xuXHRcdFx0aWYgKHdpbmRvdy5jb25zb2xlICYmIHR5cGVvZiB3aW5kb3cuY29uc29sZS53YXJuID09PSBcImZ1bmN0aW9uXCIpIGNvbnNvbGUud2FybihzdHIpO1xuXHRcdH0sXG5cdFx0YW1kID0gaGVscGVycy5hbWQgPSAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSxcblx0XHQvLy0tIE1hdGggbWV0aG9kc1xuXHRcdGlzTnVtYmVyID0gaGVscGVycy5pc051bWJlciA9IGZ1bmN0aW9uKG4pe1xuXHRcdFx0cmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcblx0XHR9LFxuXHRcdG1heCA9IGhlbHBlcnMubWF4ID0gZnVuY3Rpb24oYXJyYXkpe1xuXHRcdFx0cmV0dXJuIE1hdGgubWF4LmFwcGx5KCBNYXRoLCBhcnJheSApO1xuXHRcdH0sXG5cdFx0bWluID0gaGVscGVycy5taW4gPSBmdW5jdGlvbihhcnJheSl7XG5cdFx0XHRyZXR1cm4gTWF0aC5taW4uYXBwbHkoIE1hdGgsIGFycmF5ICk7XG5cdFx0fSxcblx0XHRjYXAgPSBoZWxwZXJzLmNhcCA9IGZ1bmN0aW9uKHZhbHVlVG9DYXAsbWF4VmFsdWUsbWluVmFsdWUpe1xuXHRcdFx0aWYoaXNOdW1iZXIobWF4VmFsdWUpKSB7XG5cdFx0XHRcdGlmKCB2YWx1ZVRvQ2FwID4gbWF4VmFsdWUgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIG1heFZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRlbHNlIGlmKGlzTnVtYmVyKG1pblZhbHVlKSl7XG5cdFx0XHRcdGlmICggdmFsdWVUb0NhcCA8IG1pblZhbHVlICl7XG5cdFx0XHRcdFx0cmV0dXJuIG1pblZhbHVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdmFsdWVUb0NhcDtcblx0XHR9LFxuXHRcdGdldERlY2ltYWxQbGFjZXMgPSBoZWxwZXJzLmdldERlY2ltYWxQbGFjZXMgPSBmdW5jdGlvbihudW0pe1xuXHRcdFx0aWYgKG51bSUxIT09MCAmJiBpc051bWJlcihudW0pKXtcblx0XHRcdFx0dmFyIHMgPSBudW0udG9TdHJpbmcoKTtcblx0XHRcdFx0aWYocy5pbmRleE9mKFwiZS1cIikgPCAwKXtcblx0XHRcdFx0XHQvLyBubyBleHBvbmVudCwgZS5nLiAwLjAxXG5cdFx0XHRcdFx0cmV0dXJuIHMuc3BsaXQoXCIuXCIpWzFdLmxlbmd0aDtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlIGlmKHMuaW5kZXhPZihcIi5cIikgPCAwKSB7XG5cdFx0XHRcdFx0Ly8gbm8gZGVjaW1hbCBwb2ludCwgZS5nLiAxZS05XG5cdFx0XHRcdFx0cmV0dXJuIHBhcnNlSW50KHMuc3BsaXQoXCJlLVwiKVsxXSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSB7XG5cdFx0XHRcdFx0Ly8gZXhwb25lbnQgYW5kIGRlY2ltYWwgcG9pbnQsIGUuZy4gMS4yM2UtOVxuXHRcdFx0XHRcdHZhciBwYXJ0cyA9IHMuc3BsaXQoXCIuXCIpWzFdLnNwbGl0KFwiZS1cIik7XG5cdFx0XHRcdFx0cmV0dXJuIHBhcnRzWzBdLmxlbmd0aCArIHBhcnNlSW50KHBhcnRzWzFdKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZSB7XG5cdFx0XHRcdHJldHVybiAwO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0dG9SYWRpYW5zID0gaGVscGVycy5yYWRpYW5zID0gZnVuY3Rpb24oZGVncmVlcyl7XG5cdFx0XHRyZXR1cm4gZGVncmVlcyAqIChNYXRoLlBJLzE4MCk7XG5cdFx0fSxcblx0XHQvLyBHZXRzIHRoZSBhbmdsZSBmcm9tIHZlcnRpY2FsIHVwcmlnaHQgdG8gdGhlIHBvaW50IGFib3V0IGEgY2VudHJlLlxuXHRcdGdldEFuZ2xlRnJvbVBvaW50ID0gaGVscGVycy5nZXRBbmdsZUZyb21Qb2ludCA9IGZ1bmN0aW9uKGNlbnRyZVBvaW50LCBhbmdsZVBvaW50KXtcblx0XHRcdHZhciBkaXN0YW5jZUZyb21YQ2VudGVyID0gYW5nbGVQb2ludC54IC0gY2VudHJlUG9pbnQueCxcblx0XHRcdFx0ZGlzdGFuY2VGcm9tWUNlbnRlciA9IGFuZ2xlUG9pbnQueSAtIGNlbnRyZVBvaW50LnksXG5cdFx0XHRcdHJhZGlhbERpc3RhbmNlRnJvbUNlbnRlciA9IE1hdGguc3FydCggZGlzdGFuY2VGcm9tWENlbnRlciAqIGRpc3RhbmNlRnJvbVhDZW50ZXIgKyBkaXN0YW5jZUZyb21ZQ2VudGVyICogZGlzdGFuY2VGcm9tWUNlbnRlcik7XG5cblxuXHRcdFx0dmFyIGFuZ2xlID0gTWF0aC5QSSAqIDIgKyBNYXRoLmF0YW4yKGRpc3RhbmNlRnJvbVlDZW50ZXIsIGRpc3RhbmNlRnJvbVhDZW50ZXIpO1xuXG5cdFx0XHQvL0lmIHRoZSBzZWdtZW50IGlzIGluIHRoZSB0b3AgbGVmdCBxdWFkcmFudCwgd2UgbmVlZCB0byBhZGQgYW5vdGhlciByb3RhdGlvbiB0byB0aGUgYW5nbGVcblx0XHRcdGlmIChkaXN0YW5jZUZyb21YQ2VudGVyIDwgMCAmJiBkaXN0YW5jZUZyb21ZQ2VudGVyIDwgMCl7XG5cdFx0XHRcdGFuZ2xlICs9IE1hdGguUEkqMjtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0YW5nbGU6IGFuZ2xlLFxuXHRcdFx0XHRkaXN0YW5jZTogcmFkaWFsRGlzdGFuY2VGcm9tQ2VudGVyXG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0YWxpYXNQaXhlbCA9IGhlbHBlcnMuYWxpYXNQaXhlbCA9IGZ1bmN0aW9uKHBpeGVsV2lkdGgpe1xuXHRcdFx0cmV0dXJuIChwaXhlbFdpZHRoICUgMiA9PT0gMCkgPyAwIDogMC41O1xuXHRcdH0sXG5cdFx0c3BsaW5lQ3VydmUgPSBoZWxwZXJzLnNwbGluZUN1cnZlID0gZnVuY3Rpb24oRmlyc3RQb2ludCxNaWRkbGVQb2ludCxBZnRlclBvaW50LHQpe1xuXHRcdFx0Ly9Qcm9wcyB0byBSb2IgU3BlbmNlciBhdCBzY2FsZWQgaW5ub3ZhdGlvbiBmb3IgaGlzIHBvc3Qgb24gc3BsaW5pbmcgYmV0d2VlbiBwb2ludHNcblx0XHRcdC8vaHR0cDovL3NjYWxlZGlubm92YXRpb24uY29tL2FuYWx5dGljcy9zcGxpbmVzL2Fib3V0U3BsaW5lcy5odG1sXG5cdFx0XHR2YXIgZDAxPU1hdGguc3FydChNYXRoLnBvdyhNaWRkbGVQb2ludC54LUZpcnN0UG9pbnQueCwyKStNYXRoLnBvdyhNaWRkbGVQb2ludC55LUZpcnN0UG9pbnQueSwyKSksXG5cdFx0XHRcdGQxMj1NYXRoLnNxcnQoTWF0aC5wb3coQWZ0ZXJQb2ludC54LU1pZGRsZVBvaW50LngsMikrTWF0aC5wb3coQWZ0ZXJQb2ludC55LU1pZGRsZVBvaW50LnksMikpLFxuXHRcdFx0XHRmYT10KmQwMS8oZDAxK2QxMiksLy8gc2NhbGluZyBmYWN0b3IgZm9yIHRyaWFuZ2xlIFRhXG5cdFx0XHRcdGZiPXQqZDEyLyhkMDErZDEyKTtcblx0XHRcdHJldHVybiB7XG5cdFx0XHRcdGlubmVyIDoge1xuXHRcdFx0XHRcdHggOiBNaWRkbGVQb2ludC54LWZhKihBZnRlclBvaW50LngtRmlyc3RQb2ludC54KSxcblx0XHRcdFx0XHR5IDogTWlkZGxlUG9pbnQueS1mYSooQWZ0ZXJQb2ludC55LUZpcnN0UG9pbnQueSlcblx0XHRcdFx0fSxcblx0XHRcdFx0b3V0ZXIgOiB7XG5cdFx0XHRcdFx0eDogTWlkZGxlUG9pbnQueCtmYiooQWZ0ZXJQb2ludC54LUZpcnN0UG9pbnQueCksXG5cdFx0XHRcdFx0eSA6IE1pZGRsZVBvaW50LnkrZmIqKEFmdGVyUG9pbnQueS1GaXJzdFBvaW50LnkpXG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fSxcblx0XHRjYWxjdWxhdGVPcmRlck9mTWFnbml0dWRlID0gaGVscGVycy5jYWxjdWxhdGVPcmRlck9mTWFnbml0dWRlID0gZnVuY3Rpb24odmFsKXtcblx0XHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgubG9nKHZhbCkgLyBNYXRoLkxOMTApO1xuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlU2NhbGVSYW5nZSA9IGhlbHBlcnMuY2FsY3VsYXRlU2NhbGVSYW5nZSA9IGZ1bmN0aW9uKHZhbHVlc0FycmF5LCBkcmF3aW5nU2l6ZSwgdGV4dFNpemUsIHN0YXJ0RnJvbVplcm8sIGludGVnZXJzT25seSl7XG5cblx0XHRcdC8vU2V0IGEgbWluaW11bSBzdGVwIG9mIHR3byAtIGEgcG9pbnQgYXQgdGhlIHRvcCBvZiB0aGUgZ3JhcGgsIGFuZCBhIHBvaW50IGF0IHRoZSBiYXNlXG5cdFx0XHR2YXIgbWluU3RlcHMgPSAyLFxuXHRcdFx0XHRtYXhTdGVwcyA9IE1hdGguZmxvb3IoZHJhd2luZ1NpemUvKHRleHRTaXplICogMS41KSksXG5cdFx0XHRcdHNraXBGaXR0aW5nID0gKG1pblN0ZXBzID49IG1heFN0ZXBzKTtcblxuXHRcdFx0Ly8gRmlsdGVyIG91dCBudWxsIHZhbHVlcyBzaW5jZSB0aGVzZSB3b3VsZCBtaW4oKSB0byB6ZXJvXG5cdFx0XHR2YXIgdmFsdWVzID0gW107XG5cdFx0XHRlYWNoKHZhbHVlc0FycmF5LCBmdW5jdGlvbiggdiApe1xuXHRcdFx0XHR2ID09IG51bGwgfHwgdmFsdWVzLnB1c2goIHYgKTtcblx0XHRcdH0pO1xuXHRcdFx0dmFyIG1pblZhbHVlID0gbWluKHZhbHVlcyksXG5cdFx0XHQgICAgbWF4VmFsdWUgPSBtYXgodmFsdWVzKTtcblxuXHRcdFx0Ly8gV2UgbmVlZCBzb21lIGRlZ3JlZSBvZiBzZXBhcmF0aW9uIGhlcmUgdG8gY2FsY3VsYXRlIHRoZSBzY2FsZXMgaWYgYWxsIHRoZSB2YWx1ZXMgYXJlIHRoZSBzYW1lXG5cdFx0XHQvLyBBZGRpbmcvbWludXNpbmcgMC41IHdpbGwgZ2l2ZSB1cyBhIHJhbmdlIG9mIDEuXG5cdFx0XHRpZiAobWF4VmFsdWUgPT09IG1pblZhbHVlKXtcblx0XHRcdFx0bWF4VmFsdWUgKz0gMC41O1xuXHRcdFx0XHQvLyBTbyB3ZSBkb24ndCBlbmQgdXAgd2l0aCBhIGdyYXBoIHdpdGggYSBuZWdhdGl2ZSBzdGFydCB2YWx1ZSBpZiB3ZSd2ZSBzYWlkIGFsd2F5cyBzdGFydCBmcm9tIHplcm9cblx0XHRcdFx0aWYgKG1pblZhbHVlID49IDAuNSAmJiAhc3RhcnRGcm9tWmVybyl7XG5cdFx0XHRcdFx0bWluVmFsdWUgLT0gMC41O1xuXHRcdFx0XHR9XG5cdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0Ly8gTWFrZSB1cCBhIHdob2xlIG51bWJlciBhYm92ZSB0aGUgdmFsdWVzXG5cdFx0XHRcdFx0bWF4VmFsdWUgKz0gMC41O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHZhclx0dmFsdWVSYW5nZSA9IE1hdGguYWJzKG1heFZhbHVlIC0gbWluVmFsdWUpLFxuXHRcdFx0XHRyYW5nZU9yZGVyT2ZNYWduaXR1ZGUgPSBjYWxjdWxhdGVPcmRlck9mTWFnbml0dWRlKHZhbHVlUmFuZ2UpLFxuXHRcdFx0XHRncmFwaE1heCA9IE1hdGguY2VpbChtYXhWYWx1ZSAvICgxICogTWF0aC5wb3coMTAsIHJhbmdlT3JkZXJPZk1hZ25pdHVkZSkpKSAqIE1hdGgucG93KDEwLCByYW5nZU9yZGVyT2ZNYWduaXR1ZGUpLFxuXHRcdFx0XHRncmFwaE1pbiA9IChzdGFydEZyb21aZXJvKSA/IDAgOiBNYXRoLmZsb29yKG1pblZhbHVlIC8gKDEgKiBNYXRoLnBvdygxMCwgcmFuZ2VPcmRlck9mTWFnbml0dWRlKSkpICogTWF0aC5wb3coMTAsIHJhbmdlT3JkZXJPZk1hZ25pdHVkZSksXG5cdFx0XHRcdGdyYXBoUmFuZ2UgPSBncmFwaE1heCAtIGdyYXBoTWluLFxuXHRcdFx0XHRzdGVwVmFsdWUgPSBNYXRoLnBvdygxMCwgcmFuZ2VPcmRlck9mTWFnbml0dWRlKSxcblx0XHRcdFx0bnVtYmVyT2ZTdGVwcyA9IE1hdGgucm91bmQoZ3JhcGhSYW5nZSAvIHN0ZXBWYWx1ZSk7XG5cblx0XHRcdC8vSWYgd2UgaGF2ZSBtb3JlIHNwYWNlIG9uIHRoZSBncmFwaCB3ZSdsbCB1c2UgaXQgdG8gZ2l2ZSBtb3JlIGRlZmluaXRpb24gdG8gdGhlIGRhdGFcblx0XHRcdHdoaWxlKChudW1iZXJPZlN0ZXBzID4gbWF4U3RlcHMgfHwgKG51bWJlck9mU3RlcHMgKiAyKSA8IG1heFN0ZXBzKSAmJiAhc2tpcEZpdHRpbmcpIHtcblx0XHRcdFx0aWYobnVtYmVyT2ZTdGVwcyA+IG1heFN0ZXBzKXtcblx0XHRcdFx0XHRzdGVwVmFsdWUgKj0yO1xuXHRcdFx0XHRcdG51bWJlck9mU3RlcHMgPSBNYXRoLnJvdW5kKGdyYXBoUmFuZ2Uvc3RlcFZhbHVlKTtcblx0XHRcdFx0XHQvLyBEb24ndCBldmVyIGRlYWwgd2l0aCBhIGRlY2ltYWwgbnVtYmVyIG9mIHN0ZXBzIC0gY2FuY2VsIGZpdHRpbmcgYW5kIGp1c3QgdXNlIHRoZSBtaW5pbXVtIG51bWJlciBvZiBzdGVwcy5cblx0XHRcdFx0XHRpZiAobnVtYmVyT2ZTdGVwcyAlIDEgIT09IDApe1xuXHRcdFx0XHRcdFx0c2tpcEZpdHRpbmcgPSB0cnVlO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0XHQvL1dlIGNhbiBmaXQgaW4gZG91YmxlIHRoZSBhbW91bnQgb2Ygc2NhbGUgcG9pbnRzIG9uIHRoZSBzY2FsZVxuXHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdC8vSWYgdXNlciBoYXMgZGVjbGFyZWQgaW50cyBvbmx5LCBhbmQgdGhlIHN0ZXAgdmFsdWUgaXNuJ3QgYSBkZWNpbWFsXG5cdFx0XHRcdFx0aWYgKGludGVnZXJzT25seSAmJiByYW5nZU9yZGVyT2ZNYWduaXR1ZGUgPj0gMCl7XG5cdFx0XHRcdFx0XHQvL0lmIHRoZSB1c2VyIGhhcyBzYWlkIGludGVnZXJzIG9ubHksIHdlIG5lZWQgdG8gY2hlY2sgdGhhdCBtYWtpbmcgdGhlIHNjYWxlIG1vcmUgZ3JhbnVsYXIgd291bGRuJ3QgbWFrZSBpdCBhIGZsb2F0XG5cdFx0XHRcdFx0XHRpZihzdGVwVmFsdWUvMiAlIDEgPT09IDApe1xuXHRcdFx0XHRcdFx0XHRzdGVwVmFsdWUgLz0yO1xuXHRcdFx0XHRcdFx0XHRudW1iZXJPZlN0ZXBzID0gTWF0aC5yb3VuZChncmFwaFJhbmdlL3N0ZXBWYWx1ZSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHQvL0lmIGl0IHdvdWxkIG1ha2UgaXQgYSBmbG9hdCBicmVhayBvdXQgb2YgdGhlIGxvb3Bcblx0XHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHQvL0lmIHRoZSBzY2FsZSBkb2Vzbid0IGhhdmUgdG8gYmUgYW4gaW50LCBtYWtlIHRoZSBzY2FsZSBtb3JlIGdyYW51bGFyIGFueXdheS5cblx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0c3RlcFZhbHVlIC89Mjtcblx0XHRcdFx0XHRcdG51bWJlck9mU3RlcHMgPSBNYXRoLnJvdW5kKGdyYXBoUmFuZ2Uvc3RlcFZhbHVlKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0XHRpZiAoc2tpcEZpdHRpbmcpe1xuXHRcdFx0XHRudW1iZXJPZlN0ZXBzID0gbWluU3RlcHM7XG5cdFx0XHRcdHN0ZXBWYWx1ZSA9IGdyYXBoUmFuZ2UgLyBudW1iZXJPZlN0ZXBzO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRzdGVwcyA6IG51bWJlck9mU3RlcHMsXG5cdFx0XHRcdHN0ZXBWYWx1ZSA6IHN0ZXBWYWx1ZSxcblx0XHRcdFx0bWluIDogZ3JhcGhNaW4sXG5cdFx0XHRcdG1heFx0OiBncmFwaE1pbiArIChudW1iZXJPZlN0ZXBzICogc3RlcFZhbHVlKVxuXHRcdFx0fTtcblxuXHRcdH0sXG5cdFx0LyoganNoaW50IGlnbm9yZTpzdGFydCAqL1xuXHRcdC8vIEJsb3dzIHVwIGpzaGludCBlcnJvcnMgYmFzZWQgb24gdGhlIG5ldyBGdW5jdGlvbiBjb25zdHJ1Y3RvclxuXHRcdC8vVGVtcGxhdGluZyBtZXRob2RzXG5cdFx0Ly9KYXZhc2NyaXB0IG1pY3JvIHRlbXBsYXRpbmcgYnkgSm9obiBSZXNpZyAtIHNvdXJjZSBhdCBodHRwOi8vZWpvaG4ub3JnL2Jsb2cvamF2YXNjcmlwdC1taWNyby10ZW1wbGF0aW5nL1xuXHRcdHRlbXBsYXRlID0gaGVscGVycy50ZW1wbGF0ZSA9IGZ1bmN0aW9uKHRlbXBsYXRlU3RyaW5nLCB2YWx1ZXNPYmplY3Qpe1xuXG5cdFx0XHQvLyBJZiB0ZW1wbGF0ZVN0cmluZyBpcyBmdW5jdGlvbiByYXRoZXIgdGhhbiBzdHJpbmctdGVtcGxhdGUgLSBjYWxsIHRoZSBmdW5jdGlvbiBmb3IgdmFsdWVzT2JqZWN0XG5cblx0XHRcdGlmKHRlbXBsYXRlU3RyaW5nIGluc3RhbmNlb2YgRnVuY3Rpb24pe1xuXHRcdFx0IFx0cmV0dXJuIHRlbXBsYXRlU3RyaW5nKHZhbHVlc09iamVjdCk7XG5cdFx0IFx0fVxuXG5cdFx0XHR2YXIgY2FjaGUgPSB7fTtcblx0XHRcdGZ1bmN0aW9uIHRtcGwoc3RyLCBkYXRhKXtcblx0XHRcdFx0Ly8gRmlndXJlIG91dCBpZiB3ZSdyZSBnZXR0aW5nIGEgdGVtcGxhdGUsIG9yIGlmIHdlIG5lZWQgdG9cblx0XHRcdFx0Ly8gbG9hZCB0aGUgdGVtcGxhdGUgLSBhbmQgYmUgc3VyZSB0byBjYWNoZSB0aGUgcmVzdWx0LlxuXHRcdFx0XHR2YXIgZm4gPSAhL1xcVy8udGVzdChzdHIpID9cblx0XHRcdFx0Y2FjaGVbc3RyXSA9IGNhY2hlW3N0cl0gOlxuXG5cdFx0XHRcdC8vIEdlbmVyYXRlIGEgcmV1c2FibGUgZnVuY3Rpb24gdGhhdCB3aWxsIHNlcnZlIGFzIGEgdGVtcGxhdGVcblx0XHRcdFx0Ly8gZ2VuZXJhdG9yIChhbmQgd2hpY2ggd2lsbCBiZSBjYWNoZWQpLlxuXHRcdFx0XHRuZXcgRnVuY3Rpb24oXCJvYmpcIixcblx0XHRcdFx0XHRcInZhciBwPVtdLHByaW50PWZ1bmN0aW9uKCl7cC5wdXNoLmFwcGx5KHAsYXJndW1lbnRzKTt9O1wiICtcblxuXHRcdFx0XHRcdC8vIEludHJvZHVjZSB0aGUgZGF0YSBhcyBsb2NhbCB2YXJpYWJsZXMgdXNpbmcgd2l0aCgpe31cblx0XHRcdFx0XHRcIndpdGgob2JqKXtwLnB1c2goJ1wiICtcblxuXHRcdFx0XHRcdC8vIENvbnZlcnQgdGhlIHRlbXBsYXRlIGludG8gcHVyZSBKYXZhU2NyaXB0XG5cdFx0XHRcdFx0c3RyXG5cdFx0XHRcdFx0XHQucmVwbGFjZSgvW1xcclxcdFxcbl0vZywgXCIgXCIpXG5cdFx0XHRcdFx0XHQuc3BsaXQoXCI8JVwiKS5qb2luKFwiXFx0XCIpXG5cdFx0XHRcdFx0XHQucmVwbGFjZSgvKChefCU+KVteXFx0XSopJy9nLCBcIiQxXFxyXCIpXG5cdFx0XHRcdFx0XHQucmVwbGFjZSgvXFx0PSguKj8pJT4vZywgXCInLCQxLCdcIilcblx0XHRcdFx0XHRcdC5zcGxpdChcIlxcdFwiKS5qb2luKFwiJyk7XCIpXG5cdFx0XHRcdFx0XHQuc3BsaXQoXCIlPlwiKS5qb2luKFwicC5wdXNoKCdcIilcblx0XHRcdFx0XHRcdC5zcGxpdChcIlxcclwiKS5qb2luKFwiXFxcXCdcIikgK1xuXHRcdFx0XHRcdFwiJyk7fXJldHVybiBwLmpvaW4oJycpO1wiXG5cdFx0XHRcdCk7XG5cblx0XHRcdFx0Ly8gUHJvdmlkZSBzb21lIGJhc2ljIGN1cnJ5aW5nIHRvIHRoZSB1c2VyXG5cdFx0XHRcdHJldHVybiBkYXRhID8gZm4oIGRhdGEgKSA6IGZuO1xuXHRcdFx0fVxuXHRcdFx0cmV0dXJuIHRtcGwodGVtcGxhdGVTdHJpbmcsdmFsdWVzT2JqZWN0KTtcblx0XHR9LFxuXHRcdC8qIGpzaGludCBpZ25vcmU6ZW5kICovXG5cdFx0Z2VuZXJhdGVMYWJlbHMgPSBoZWxwZXJzLmdlbmVyYXRlTGFiZWxzID0gZnVuY3Rpb24odGVtcGxhdGVTdHJpbmcsbnVtYmVyT2ZTdGVwcyxncmFwaE1pbixzdGVwVmFsdWUpe1xuXHRcdFx0dmFyIGxhYmVsc0FycmF5ID0gbmV3IEFycmF5KG51bWJlck9mU3RlcHMpO1xuXHRcdFx0aWYgKHRlbXBsYXRlU3RyaW5nKXtcblx0XHRcdFx0ZWFjaChsYWJlbHNBcnJheSxmdW5jdGlvbih2YWwsaW5kZXgpe1xuXHRcdFx0XHRcdGxhYmVsc0FycmF5W2luZGV4XSA9IHRlbXBsYXRlKHRlbXBsYXRlU3RyaW5nLHt2YWx1ZTogKGdyYXBoTWluICsgKHN0ZXBWYWx1ZSooaW5kZXgrMSkpKX0pO1xuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHRcdHJldHVybiBsYWJlbHNBcnJheTtcblx0XHR9LFxuXHRcdC8vLS1BbmltYXRpb24gbWV0aG9kc1xuXHRcdC8vRWFzaW5nIGZ1bmN0aW9ucyBhZGFwdGVkIGZyb20gUm9iZXJ0IFBlbm5lcidzIGVhc2luZyBlcXVhdGlvbnNcblx0XHQvL2h0dHA6Ly93d3cucm9iZXJ0cGVubmVyLmNvbS9lYXNpbmcvXG5cdFx0ZWFzaW5nRWZmZWN0cyA9IGhlbHBlcnMuZWFzaW5nRWZmZWN0cyA9IHtcblx0XHRcdGxpbmVhcjogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIHQ7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluUXVhZDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIHQgKiB0O1xuXHRcdFx0fSxcblx0XHRcdGVhc2VPdXRRdWFkOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gLTEgKiB0ICogKHQgLSAyKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRRdWFkOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogdCAqIHQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIC0xIC8gMiAqICgoLS10KSAqICh0IC0gMikgLSAxKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5DdWJpYzogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIHQgKiB0ICogdDtcblx0XHRcdH0sXG5cdFx0XHRlYXNlT3V0Q3ViaWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAxICogKCh0ID0gdCAvIDEgLSAxKSAqIHQgKiB0ICsgMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0Q3ViaWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICgodCAvPSAxIC8gMikgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gMSAvIDIgKiB0ICogdCAqIHQ7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIDEgLyAyICogKCh0IC09IDIpICogdCAqIHQgKyAyKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5RdWFydDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIHQgKiB0ICogdCAqIHQ7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dFF1YXJ0OiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gLTEgKiAoKHQgPSB0IC8gMSAtIDEpICogdCAqIHQgKiB0IC0gMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0UXVhcnQ6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICgodCAvPSAxIC8gMikgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gMSAvIDIgKiB0ICogdCAqIHQgKiB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAtMSAvIDIgKiAoKHQgLT0gMikgKiB0ICogdCAqIHQgLSAyKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5RdWludDogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIDEgKiAodCAvPSAxKSAqIHQgKiB0ICogdCAqIHQ7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dFF1aW50OiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gMSAqICgodCA9IHQgLyAxIC0gMSkgKiB0ICogdCAqIHQgKiB0ICsgMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0UXVpbnQ6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICgodCAvPSAxIC8gMikgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gMSAvIDIgKiB0ICogdCAqIHQgKiB0ICogdDtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gMSAvIDIgKiAoKHQgLT0gMikgKiB0ICogdCAqIHQgKiB0ICsgMik7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluU2luZTogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIC0xICogTWF0aC5jb3ModCAvIDEgKiAoTWF0aC5QSSAvIDIpKSArIDE7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dFNpbmU6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHJldHVybiAxICogTWF0aC5zaW4odCAvIDEgKiAoTWF0aC5QSSAvIDIpKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRTaW5lOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gLTEgLyAyICogKE1hdGguY29zKE1hdGguUEkgKiB0IC8gMSkgLSAxKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5FeHBvOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gKHQgPT09IDApID8gMSA6IDEgKiBNYXRoLnBvdygyLCAxMCAqICh0IC8gMSAtIDEpKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlT3V0RXhwbzogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuICh0ID09PSAxKSA/IDEgOiAxICogKC1NYXRoLnBvdygyLCAtMTAgKiB0IC8gMSkgKyAxKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5PdXRFeHBvOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRpZiAodCA9PT0gMCl7XG5cdFx0XHRcdFx0cmV0dXJuIDA7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHQgPT09IDEpe1xuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICgodCAvPSAxIC8gMikgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gMSAvIDIgKiBNYXRoLnBvdygyLCAxMCAqICh0IC0gMSkpO1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAxIC8gMiAqICgtTWF0aC5wb3coMiwgLTEwICogLS10KSArIDIpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbkNpcmM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICh0ID49IDEpe1xuXHRcdFx0XHRcdHJldHVybiB0O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiAtMSAqIChNYXRoLnNxcnQoMSAtICh0IC89IDEpICogdCkgLSAxKTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlT3V0Q2lyYzogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0cmV0dXJuIDEgKiBNYXRoLnNxcnQoMSAtICh0ID0gdCAvIDEgLSAxKSAqIHQpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dENpcmM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdGlmICgodCAvPSAxIC8gMikgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gLTEgLyAyICogKE1hdGguc3FydCgxIC0gdCAqIHQpIC0gMSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0cmV0dXJuIDEgLyAyICogKE1hdGguc3FydCgxIC0gKHQgLT0gMikgKiB0KSArIDEpO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbkVsYXN0aWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHZhciBzID0gMS43MDE1ODtcblx0XHRcdFx0dmFyIHAgPSAwO1xuXHRcdFx0XHR2YXIgYSA9IDE7XG5cdFx0XHRcdGlmICh0ID09PSAwKXtcblx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoKHQgLz0gMSkgPT0gMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFwKXtcblx0XHRcdFx0XHRwID0gMSAqIDAuMztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoYSA8IE1hdGguYWJzKDEpKSB7XG5cdFx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0XHR9IGVsc2V7XG5cdFx0XHRcdFx0cyA9IHAgLyAoMiAqIE1hdGguUEkpICogTWF0aC5hc2luKDEgLyBhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gLShhICogTWF0aC5wb3coMiwgMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIDEgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dEVsYXN0aWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHZhciBzID0gMS43MDE1ODtcblx0XHRcdFx0dmFyIHAgPSAwO1xuXHRcdFx0XHR2YXIgYSA9IDE7XG5cdFx0XHRcdGlmICh0ID09PSAwKXtcblx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoKHQgLz0gMSkgPT0gMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDE7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKCFwKXtcblx0XHRcdFx0XHRwID0gMSAqIDAuMztcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoYSA8IE1hdGguYWJzKDEpKSB7XG5cdFx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0XHR9IGVsc2V7XG5cdFx0XHRcdFx0cyA9IHAgLyAoMiAqIE1hdGguUEkpICogTWF0aC5hc2luKDEgLyBhKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqIHQpICogTWF0aC5zaW4oKHQgKiAxIC0gcykgKiAoMiAqIE1hdGguUEkpIC8gcCkgKyAxO1xuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dEVsYXN0aWM6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHZhciBzID0gMS43MDE1ODtcblx0XHRcdFx0dmFyIHAgPSAwO1xuXHRcdFx0XHR2YXIgYSA9IDE7XG5cdFx0XHRcdGlmICh0ID09PSAwKXtcblx0XHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpID09IDIpe1xuXHRcdFx0XHRcdHJldHVybiAxO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmICghcCl7XG5cdFx0XHRcdFx0cCA9IDEgKiAoMC4zICogMS41KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRpZiAoYSA8IE1hdGguYWJzKDEpKSB7XG5cdFx0XHRcdFx0YSA9IDE7XG5cdFx0XHRcdFx0cyA9IHAgLyA0O1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHMgPSBwIC8gKDIgKiBNYXRoLlBJKSAqIE1hdGguYXNpbigxIC8gYSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHQgPCAxKXtcblx0XHRcdFx0XHRyZXR1cm4gLTAuNSAqIChhICogTWF0aC5wb3coMiwgMTAgKiAodCAtPSAxKSkgKiBNYXRoLnNpbigodCAqIDEgLSBzKSAqICgyICogTWF0aC5QSSkgLyBwKSk7fVxuXHRcdFx0XHRyZXR1cm4gYSAqIE1hdGgucG93KDIsIC0xMCAqICh0IC09IDEpKSAqIE1hdGguc2luKCh0ICogMSAtIHMpICogKDIgKiBNYXRoLlBJKSAvIHApICogMC41ICsgMTtcblx0XHRcdH0sXG5cdFx0XHRlYXNlSW5CYWNrOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHR2YXIgcyA9IDEuNzAxNTg7XG5cdFx0XHRcdHJldHVybiAxICogKHQgLz0gMSkgKiB0ICogKChzICsgMSkgKiB0IC0gcyk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dEJhY2s6IGZ1bmN0aW9uICh0KSB7XG5cdFx0XHRcdHZhciBzID0gMS43MDE1ODtcblx0XHRcdFx0cmV0dXJuIDEgKiAoKHQgPSB0IC8gMSAtIDEpICogdCAqICgocyArIDEpICogdCArIHMpICsgMSk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluT3V0QmFjazogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0dmFyIHMgPSAxLjcwMTU4O1xuXHRcdFx0XHRpZiAoKHQgLz0gMSAvIDIpIDwgMSl7XG5cdFx0XHRcdFx0cmV0dXJuIDEgLyAyICogKHQgKiB0ICogKCgocyAqPSAoMS41MjUpKSArIDEpICogdCAtIHMpKTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gMSAvIDIgKiAoKHQgLT0gMikgKiB0ICogKCgocyAqPSAoMS41MjUpKSArIDEpICogdCArIHMpICsgMik7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZUluQm91bmNlOiBmdW5jdGlvbiAodCkge1xuXHRcdFx0XHRyZXR1cm4gMSAtIGVhc2luZ0VmZmVjdHMuZWFzZU91dEJvdW5jZSgxIC0gdCk7XG5cdFx0XHR9LFxuXHRcdFx0ZWFzZU91dEJvdW5jZTogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0aWYgKCh0IC89IDEpIDwgKDEgLyAyLjc1KSkge1xuXHRcdFx0XHRcdHJldHVybiAxICogKDcuNTYyNSAqIHQgKiB0KTtcblx0XHRcdFx0fSBlbHNlIGlmICh0IDwgKDIgLyAyLjc1KSkge1xuXHRcdFx0XHRcdHJldHVybiAxICogKDcuNTYyNSAqICh0IC09ICgxLjUgLyAyLjc1KSkgKiB0ICsgMC43NSk7XG5cdFx0XHRcdH0gZWxzZSBpZiAodCA8ICgyLjUgLyAyLjc1KSkge1xuXHRcdFx0XHRcdHJldHVybiAxICogKDcuNTYyNSAqICh0IC09ICgyLjI1IC8gMi43NSkpICogdCArIDAuOTM3NSk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0cmV0dXJuIDEgKiAoNy41NjI1ICogKHQgLT0gKDIuNjI1IC8gMi43NSkpICogdCArIDAuOTg0Mzc1KTtcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdGVhc2VJbk91dEJvdW5jZTogZnVuY3Rpb24gKHQpIHtcblx0XHRcdFx0aWYgKHQgPCAxIC8gMil7XG5cdFx0XHRcdFx0cmV0dXJuIGVhc2luZ0VmZmVjdHMuZWFzZUluQm91bmNlKHQgKiAyKSAqIDAuNTtcblx0XHRcdFx0fVxuXHRcdFx0XHRyZXR1cm4gZWFzaW5nRWZmZWN0cy5lYXNlT3V0Qm91bmNlKHQgKiAyIC0gMSkgKiAwLjUgKyAxICogMC41O1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly9SZXF1ZXN0IGFuaW1hdGlvbiBwb2x5ZmlsbCAtIGh0dHA6Ly93d3cucGF1bGlyaXNoLmNvbS8yMDExL3JlcXVlc3RhbmltYXRpb25mcmFtZS1mb3Itc21hcnQtYW5pbWF0aW5nL1xuXHRcdHJlcXVlc3RBbmltRnJhbWUgPSBoZWxwZXJzLnJlcXVlc3RBbmltRnJhbWUgPSAoZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdHdpbmRvdy53ZWJraXRSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93Lm1velJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0XHR3aW5kb3cub1JlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0XHR3aW5kb3cubXNSZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0ZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0XHRyZXR1cm4gd2luZG93LnNldFRpbWVvdXQoY2FsbGJhY2ssIDEwMDAgLyA2MCk7XG5cdFx0XHRcdH07XG5cdFx0fSkoKSxcblx0XHRjYW5jZWxBbmltRnJhbWUgPSBoZWxwZXJzLmNhbmNlbEFuaW1GcmFtZSA9IChmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZSB8fFxuXHRcdFx0XHR3aW5kb3cud2Via2l0Q2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93Lm1vekNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8XG5cdFx0XHRcdHdpbmRvdy5vQ2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0d2luZG93Lm1zQ2FuY2VsQW5pbWF0aW9uRnJhbWUgfHxcblx0XHRcdFx0ZnVuY3Rpb24oY2FsbGJhY2spIHtcblx0XHRcdFx0XHRyZXR1cm4gd2luZG93LmNsZWFyVGltZW91dChjYWxsYmFjaywgMTAwMCAvIDYwKTtcblx0XHRcdFx0fTtcblx0XHR9KSgpLFxuXHRcdGFuaW1hdGlvbkxvb3AgPSBoZWxwZXJzLmFuaW1hdGlvbkxvb3AgPSBmdW5jdGlvbihjYWxsYmFjayx0b3RhbFN0ZXBzLGVhc2luZ1N0cmluZyxvblByb2dyZXNzLG9uQ29tcGxldGUsY2hhcnRJbnN0YW5jZSl7XG5cblx0XHRcdHZhciBjdXJyZW50U3RlcCA9IDAsXG5cdFx0XHRcdGVhc2luZ0Z1bmN0aW9uID0gZWFzaW5nRWZmZWN0c1tlYXNpbmdTdHJpbmddIHx8IGVhc2luZ0VmZmVjdHMubGluZWFyO1xuXG5cdFx0XHR2YXIgYW5pbWF0aW9uRnJhbWUgPSBmdW5jdGlvbigpe1xuXHRcdFx0XHRjdXJyZW50U3RlcCsrO1xuXHRcdFx0XHR2YXIgc3RlcERlY2ltYWwgPSBjdXJyZW50U3RlcC90b3RhbFN0ZXBzO1xuXHRcdFx0XHR2YXIgZWFzZURlY2ltYWwgPSBlYXNpbmdGdW5jdGlvbihzdGVwRGVjaW1hbCk7XG5cblx0XHRcdFx0Y2FsbGJhY2suY2FsbChjaGFydEluc3RhbmNlLGVhc2VEZWNpbWFsLHN0ZXBEZWNpbWFsLCBjdXJyZW50U3RlcCk7XG5cdFx0XHRcdG9uUHJvZ3Jlc3MuY2FsbChjaGFydEluc3RhbmNlLGVhc2VEZWNpbWFsLHN0ZXBEZWNpbWFsKTtcblx0XHRcdFx0aWYgKGN1cnJlbnRTdGVwIDwgdG90YWxTdGVwcyl7XG5cdFx0XHRcdFx0Y2hhcnRJbnN0YW5jZS5hbmltYXRpb25GcmFtZSA9IHJlcXVlc3RBbmltRnJhbWUoYW5pbWF0aW9uRnJhbWUpO1xuXHRcdFx0XHR9IGVsc2V7XG5cdFx0XHRcdFx0b25Db21wbGV0ZS5hcHBseShjaGFydEluc3RhbmNlKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHRcdHJlcXVlc3RBbmltRnJhbWUoYW5pbWF0aW9uRnJhbWUpO1xuXHRcdH0sXG5cdFx0Ly8tLSBET00gbWV0aG9kc1xuXHRcdGdldFJlbGF0aXZlUG9zaXRpb24gPSBoZWxwZXJzLmdldFJlbGF0aXZlUG9zaXRpb24gPSBmdW5jdGlvbihldnQpe1xuXHRcdFx0dmFyIG1vdXNlWCwgbW91c2VZO1xuXHRcdFx0dmFyIGUgPSBldnQub3JpZ2luYWxFdmVudCB8fCBldnQsXG5cdFx0XHRcdGNhbnZhcyA9IGV2dC5jdXJyZW50VGFyZ2V0IHx8IGV2dC5zcmNFbGVtZW50LFxuXHRcdFx0XHRib3VuZGluZ1JlY3QgPSBjYW52YXMuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG5cblx0XHRcdGlmIChlLnRvdWNoZXMpe1xuXHRcdFx0XHRtb3VzZVggPSBlLnRvdWNoZXNbMF0uY2xpZW50WCAtIGJvdW5kaW5nUmVjdC5sZWZ0O1xuXHRcdFx0XHRtb3VzZVkgPSBlLnRvdWNoZXNbMF0uY2xpZW50WSAtIGJvdW5kaW5nUmVjdC50b3A7XG5cblx0XHRcdH1cblx0XHRcdGVsc2V7XG5cdFx0XHRcdG1vdXNlWCA9IGUuY2xpZW50WCAtIGJvdW5kaW5nUmVjdC5sZWZ0O1xuXHRcdFx0XHRtb3VzZVkgPSBlLmNsaWVudFkgLSBib3VuZGluZ1JlY3QudG9wO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4IDogbW91c2VYLFxuXHRcdFx0XHR5IDogbW91c2VZXG5cdFx0XHR9O1xuXG5cdFx0fSxcblx0XHRhZGRFdmVudCA9IGhlbHBlcnMuYWRkRXZlbnQgPSBmdW5jdGlvbihub2RlLGV2ZW50VHlwZSxtZXRob2Qpe1xuXHRcdFx0aWYgKG5vZGUuYWRkRXZlbnRMaXN0ZW5lcil7XG5cdFx0XHRcdG5vZGUuYWRkRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsbWV0aG9kKTtcblx0XHRcdH0gZWxzZSBpZiAobm9kZS5hdHRhY2hFdmVudCl7XG5cdFx0XHRcdG5vZGUuYXR0YWNoRXZlbnQoXCJvblwiK2V2ZW50VHlwZSwgbWV0aG9kKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdG5vZGVbXCJvblwiK2V2ZW50VHlwZV0gPSBtZXRob2Q7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZW1vdmVFdmVudCA9IGhlbHBlcnMucmVtb3ZlRXZlbnQgPSBmdW5jdGlvbihub2RlLCBldmVudFR5cGUsIGhhbmRsZXIpe1xuXHRcdFx0aWYgKG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcil7XG5cdFx0XHRcdG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcihldmVudFR5cGUsIGhhbmRsZXIsIGZhbHNlKTtcblx0XHRcdH0gZWxzZSBpZiAobm9kZS5kZXRhY2hFdmVudCl7XG5cdFx0XHRcdG5vZGUuZGV0YWNoRXZlbnQoXCJvblwiK2V2ZW50VHlwZSxoYW5kbGVyKTtcblx0XHRcdH0gZWxzZXtcblx0XHRcdFx0bm9kZVtcIm9uXCIgKyBldmVudFR5cGVdID0gbm9vcDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGJpbmRFdmVudHMgPSBoZWxwZXJzLmJpbmRFdmVudHMgPSBmdW5jdGlvbihjaGFydEluc3RhbmNlLCBhcnJheU9mRXZlbnRzLCBoYW5kbGVyKXtcblx0XHRcdC8vIENyZWF0ZSB0aGUgZXZlbnRzIG9iamVjdCBpZiBpdCdzIG5vdCBhbHJlYWR5IHByZXNlbnRcblx0XHRcdGlmICghY2hhcnRJbnN0YW5jZS5ldmVudHMpIGNoYXJ0SW5zdGFuY2UuZXZlbnRzID0ge307XG5cblx0XHRcdGVhY2goYXJyYXlPZkV2ZW50cyxmdW5jdGlvbihldmVudE5hbWUpe1xuXHRcdFx0XHRjaGFydEluc3RhbmNlLmV2ZW50c1tldmVudE5hbWVdID0gZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRoYW5kbGVyLmFwcGx5KGNoYXJ0SW5zdGFuY2UsIGFyZ3VtZW50cyk7XG5cdFx0XHRcdH07XG5cdFx0XHRcdGFkZEV2ZW50KGNoYXJ0SW5zdGFuY2UuY2hhcnQuY2FudmFzLGV2ZW50TmFtZSxjaGFydEluc3RhbmNlLmV2ZW50c1tldmVudE5hbWVdKTtcblx0XHRcdH0pO1xuXHRcdH0sXG5cdFx0dW5iaW5kRXZlbnRzID0gaGVscGVycy51bmJpbmRFdmVudHMgPSBmdW5jdGlvbiAoY2hhcnRJbnN0YW5jZSwgYXJyYXlPZkV2ZW50cykge1xuXHRcdFx0ZWFjaChhcnJheU9mRXZlbnRzLCBmdW5jdGlvbihoYW5kbGVyLGV2ZW50TmFtZSl7XG5cdFx0XHRcdHJlbW92ZUV2ZW50KGNoYXJ0SW5zdGFuY2UuY2hhcnQuY2FudmFzLCBldmVudE5hbWUsIGhhbmRsZXIpO1xuXHRcdFx0fSk7XG5cdFx0fSxcblx0XHRnZXRNYXhpbXVtV2lkdGggPSBoZWxwZXJzLmdldE1heGltdW1XaWR0aCA9IGZ1bmN0aW9uKGRvbU5vZGUpe1xuXHRcdFx0dmFyIGNvbnRhaW5lciA9IGRvbU5vZGUucGFyZW50Tm9kZSxcblx0XHRcdCAgICBwYWRkaW5nID0gcGFyc2VJbnQoZ2V0U3R5bGUoY29udGFpbmVyLCAncGFkZGluZy1sZWZ0JykpICsgcGFyc2VJbnQoZ2V0U3R5bGUoY29udGFpbmVyLCAncGFkZGluZy1yaWdodCcpKTtcblx0XHRcdC8vIFRPRE8gPSBjaGVjayBjcm9zcyBicm93c2VyIHN0dWZmIHdpdGggdGhpcy5cblx0XHRcdHJldHVybiBjb250YWluZXIgPyBjb250YWluZXIuY2xpZW50V2lkdGggLSBwYWRkaW5nIDogMDtcblx0XHR9LFxuXHRcdGdldE1heGltdW1IZWlnaHQgPSBoZWxwZXJzLmdldE1heGltdW1IZWlnaHQgPSBmdW5jdGlvbihkb21Ob2RlKXtcblx0XHRcdHZhciBjb250YWluZXIgPSBkb21Ob2RlLnBhcmVudE5vZGUsXG5cdFx0XHQgICAgcGFkZGluZyA9IHBhcnNlSW50KGdldFN0eWxlKGNvbnRhaW5lciwgJ3BhZGRpbmctYm90dG9tJykpICsgcGFyc2VJbnQoZ2V0U3R5bGUoY29udGFpbmVyLCAncGFkZGluZy10b3AnKSk7XG5cdFx0XHQvLyBUT0RPID0gY2hlY2sgY3Jvc3MgYnJvd3NlciBzdHVmZiB3aXRoIHRoaXMuXG5cdFx0XHRyZXR1cm4gY29udGFpbmVyID8gY29udGFpbmVyLmNsaWVudEhlaWdodCAtIHBhZGRpbmcgOiAwO1xuXHRcdH0sXG5cdFx0Z2V0U3R5bGUgPSBoZWxwZXJzLmdldFN0eWxlID0gZnVuY3Rpb24gKGVsLCBwcm9wZXJ0eSkge1xuXHRcdFx0cmV0dXJuIGVsLmN1cnJlbnRTdHlsZSA/XG5cdFx0XHRcdGVsLmN1cnJlbnRTdHlsZVtwcm9wZXJ0eV0gOlxuXHRcdFx0XHRkb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKGVsLCBudWxsKS5nZXRQcm9wZXJ0eVZhbHVlKHByb3BlcnR5KTtcblx0XHR9LFxuXHRcdGdldE1heGltdW1TaXplID0gaGVscGVycy5nZXRNYXhpbXVtU2l6ZSA9IGhlbHBlcnMuZ2V0TWF4aW11bVdpZHRoLCAvLyBsZWdhY3kgc3VwcG9ydFxuXHRcdHJldGluYVNjYWxlID0gaGVscGVycy5yZXRpbmFTY2FsZSA9IGZ1bmN0aW9uKGNoYXJ0KXtcblx0XHRcdHZhciBjdHggPSBjaGFydC5jdHgsXG5cdFx0XHRcdHdpZHRoID0gY2hhcnQuY2FudmFzLndpZHRoLFxuXHRcdFx0XHRoZWlnaHQgPSBjaGFydC5jYW52YXMuaGVpZ2h0O1xuXG5cdFx0XHRpZiAod2luZG93LmRldmljZVBpeGVsUmF0aW8pIHtcblx0XHRcdFx0Y3R4LmNhbnZhcy5zdHlsZS53aWR0aCA9IHdpZHRoICsgXCJweFwiO1xuXHRcdFx0XHRjdHguY2FudmFzLnN0eWxlLmhlaWdodCA9IGhlaWdodCArIFwicHhcIjtcblx0XHRcdFx0Y3R4LmNhbnZhcy5oZWlnaHQgPSBoZWlnaHQgKiB3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbztcblx0XHRcdFx0Y3R4LmNhbnZhcy53aWR0aCA9IHdpZHRoICogd2luZG93LmRldmljZVBpeGVsUmF0aW87XG5cdFx0XHRcdGN0eC5zY2FsZSh3aW5kb3cuZGV2aWNlUGl4ZWxSYXRpbywgd2luZG93LmRldmljZVBpeGVsUmF0aW8pO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Ly8tLSBDYW52YXMgbWV0aG9kc1xuXHRcdGNsZWFyID0gaGVscGVycy5jbGVhciA9IGZ1bmN0aW9uKGNoYXJ0KXtcblx0XHRcdGNoYXJ0LmN0eC5jbGVhclJlY3QoMCwwLGNoYXJ0LndpZHRoLGNoYXJ0LmhlaWdodCk7XG5cdFx0fSxcblx0XHRmb250U3RyaW5nID0gaGVscGVycy5mb250U3RyaW5nID0gZnVuY3Rpb24ocGl4ZWxTaXplLGZvbnRTdHlsZSxmb250RmFtaWx5KXtcblx0XHRcdHJldHVybiBmb250U3R5bGUgKyBcIiBcIiArIHBpeGVsU2l6ZStcInB4IFwiICsgZm9udEZhbWlseTtcblx0XHR9LFxuXHRcdGxvbmdlc3RUZXh0ID0gaGVscGVycy5sb25nZXN0VGV4dCA9IGZ1bmN0aW9uKGN0eCxmb250LGFycmF5T2ZTdHJpbmdzKXtcblx0XHRcdGN0eC5mb250ID0gZm9udDtcblx0XHRcdHZhciBsb25nZXN0ID0gMDtcblx0XHRcdGVhY2goYXJyYXlPZlN0cmluZ3MsZnVuY3Rpb24oc3RyaW5nKXtcblx0XHRcdFx0dmFyIHRleHRXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dChzdHJpbmcpLndpZHRoO1xuXHRcdFx0XHRsb25nZXN0ID0gKHRleHRXaWR0aCA+IGxvbmdlc3QpID8gdGV4dFdpZHRoIDogbG9uZ2VzdDtcblx0XHRcdH0pO1xuXHRcdFx0cmV0dXJuIGxvbmdlc3Q7XG5cdFx0fSxcblx0XHRkcmF3Um91bmRlZFJlY3RhbmdsZSA9IGhlbHBlcnMuZHJhd1JvdW5kZWRSZWN0YW5nbGUgPSBmdW5jdGlvbihjdHgseCx5LHdpZHRoLGhlaWdodCxyYWRpdXMpe1xuXHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0Y3R4Lm1vdmVUbyh4ICsgcmFkaXVzLCB5KTtcblx0XHRcdGN0eC5saW5lVG8oeCArIHdpZHRoIC0gcmFkaXVzLCB5KTtcblx0XHRcdGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSwgeCArIHdpZHRoLCB5ICsgcmFkaXVzKTtcblx0XHRcdGN0eC5saW5lVG8oeCArIHdpZHRoLCB5ICsgaGVpZ2h0IC0gcmFkaXVzKTtcblx0XHRcdGN0eC5xdWFkcmF0aWNDdXJ2ZVRvKHggKyB3aWR0aCwgeSArIGhlaWdodCwgeCArIHdpZHRoIC0gcmFkaXVzLCB5ICsgaGVpZ2h0KTtcblx0XHRcdGN0eC5saW5lVG8oeCArIHJhZGl1cywgeSArIGhlaWdodCk7XG5cdFx0XHRjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5ICsgaGVpZ2h0LCB4LCB5ICsgaGVpZ2h0IC0gcmFkaXVzKTtcblx0XHRcdGN0eC5saW5lVG8oeCwgeSArIHJhZGl1cyk7XG5cdFx0XHRjdHgucXVhZHJhdGljQ3VydmVUbyh4LCB5LCB4ICsgcmFkaXVzLCB5KTtcblx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHR9O1xuXG5cblx0Ly9TdG9yZSBhIHJlZmVyZW5jZSB0byBlYWNoIGluc3RhbmNlIC0gYWxsb3dpbmcgdXMgdG8gZ2xvYmFsbHkgcmVzaXplIGNoYXJ0IGluc3RhbmNlcyBvbiB3aW5kb3cgcmVzaXplLlxuXHQvL0Rlc3Ryb3kgbWV0aG9kIG9uIHRoZSBjaGFydCB3aWxsIHJlbW92ZSB0aGUgaW5zdGFuY2Ugb2YgdGhlIGNoYXJ0IGZyb20gdGhpcyByZWZlcmVuY2UuXG5cdENoYXJ0Lmluc3RhbmNlcyA9IHt9O1xuXG5cdENoYXJ0LlR5cGUgPSBmdW5jdGlvbihkYXRhLG9wdGlvbnMsY2hhcnQpe1xuXHRcdHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG5cdFx0dGhpcy5jaGFydCA9IGNoYXJ0O1xuXHRcdHRoaXMuaWQgPSB1aWQoKTtcblx0XHQvL0FkZCB0aGUgY2hhcnQgaW5zdGFuY2UgdG8gdGhlIGdsb2JhbCBuYW1lc3BhY2Vcblx0XHRDaGFydC5pbnN0YW5jZXNbdGhpcy5pZF0gPSB0aGlzO1xuXG5cdFx0Ly8gSW5pdGlhbGl6ZSBpcyBhbHdheXMgY2FsbGVkIHdoZW4gYSBjaGFydCB0eXBlIGlzIGNyZWF0ZWRcblx0XHQvLyBCeSBkZWZhdWx0IGl0IGlzIGEgbm8gb3AsIGJ1dCBpdCBzaG91bGQgYmUgZXh0ZW5kZWRcblx0XHRpZiAob3B0aW9ucy5yZXNwb25zaXZlKXtcblx0XHRcdHRoaXMucmVzaXplKCk7XG5cdFx0fVxuXHRcdHRoaXMuaW5pdGlhbGl6ZS5jYWxsKHRoaXMsZGF0YSk7XG5cdH07XG5cblx0Ly9Db3JlIG1ldGhvZHMgdGhhdCdsbCBiZSBhIHBhcnQgb2YgZXZlcnkgY2hhcnQgdHlwZVxuXHRleHRlbmQoQ2hhcnQuVHlwZS5wcm90b3R5cGUse1xuXHRcdGluaXRpYWxpemUgOiBmdW5jdGlvbigpe3JldHVybiB0aGlzO30sXG5cdFx0Y2xlYXIgOiBmdW5jdGlvbigpe1xuXHRcdFx0Y2xlYXIodGhpcy5jaGFydCk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHN0b3AgOiBmdW5jdGlvbigpe1xuXHRcdFx0Ly8gU3RvcHMgYW55IGN1cnJlbnQgYW5pbWF0aW9uIGxvb3Agb2NjdXJpbmdcblx0XHRcdENoYXJ0LmFuaW1hdGlvblNlcnZpY2UuY2FuY2VsQW5pbWF0aW9uKHRoaXMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHRyZXNpemUgOiBmdW5jdGlvbihjYWxsYmFjayl7XG5cdFx0XHR0aGlzLnN0b3AoKTtcblx0XHRcdHZhciBjYW52YXMgPSB0aGlzLmNoYXJ0LmNhbnZhcyxcblx0XHRcdFx0bmV3V2lkdGggPSBnZXRNYXhpbXVtV2lkdGgodGhpcy5jaGFydC5jYW52YXMpLFxuXHRcdFx0XHRuZXdIZWlnaHQgPSB0aGlzLm9wdGlvbnMubWFpbnRhaW5Bc3BlY3RSYXRpbyA/IG5ld1dpZHRoIC8gdGhpcy5jaGFydC5hc3BlY3RSYXRpbyA6IGdldE1heGltdW1IZWlnaHQodGhpcy5jaGFydC5jYW52YXMpO1xuXG5cdFx0XHRjYW52YXMud2lkdGggPSB0aGlzLmNoYXJ0LndpZHRoID0gbmV3V2lkdGg7XG5cdFx0XHRjYW52YXMuaGVpZ2h0ID0gdGhpcy5jaGFydC5oZWlnaHQgPSBuZXdIZWlnaHQ7XG5cblx0XHRcdHJldGluYVNjYWxlKHRoaXMuY2hhcnQpO1xuXG5cdFx0XHRpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpe1xuXHRcdFx0XHRjYWxsYmFjay5hcHBseSh0aGlzLCBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cdFx0cmVmbG93IDogbm9vcCxcblx0XHRyZW5kZXIgOiBmdW5jdGlvbihyZWZsb3cpe1xuXHRcdFx0aWYgKHJlZmxvdyl7XG5cdFx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uICYmICFyZWZsb3cpe1xuXHRcdFx0XHR2YXIgYW5pbWF0aW9uID0gbmV3IENoYXJ0LkFuaW1hdGlvbigpO1xuXHRcdFx0XHRhbmltYXRpb24ubnVtU3RlcHMgPSB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uU3RlcHM7XG5cdFx0XHRcdGFuaW1hdGlvbi5lYXNpbmcgPSB0aGlzLm9wdGlvbnMuYW5pbWF0aW9uRWFzaW5nO1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gcmVuZGVyIGZ1bmN0aW9uXG5cdFx0XHRcdGFuaW1hdGlvbi5yZW5kZXIgPSBmdW5jdGlvbihjaGFydEluc3RhbmNlLCBhbmltYXRpb25PYmplY3QpIHtcblx0XHRcdFx0XHR2YXIgZWFzaW5nRnVuY3Rpb24gPSBoZWxwZXJzLmVhc2luZ0VmZmVjdHNbYW5pbWF0aW9uT2JqZWN0LmVhc2luZ107XG5cdFx0XHRcdFx0dmFyIHN0ZXBEZWNpbWFsID0gYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwIC8gYW5pbWF0aW9uT2JqZWN0Lm51bVN0ZXBzO1xuXHRcdFx0XHRcdHZhciBlYXNlRGVjaW1hbCA9IGVhc2luZ0Z1bmN0aW9uKHN0ZXBEZWNpbWFsKTtcblx0XHRcdFx0XHRcblx0XHRcdFx0XHRjaGFydEluc3RhbmNlLmRyYXcoZWFzZURlY2ltYWwsIHN0ZXBEZWNpbWFsLCBhbmltYXRpb25PYmplY3QuY3VycmVudFN0ZXApO1xuXHRcdFx0XHR9O1xuXHRcdFx0XHRcblx0XHRcdFx0Ly8gdXNlciBldmVudHNcblx0XHRcdFx0YW5pbWF0aW9uLm9uQW5pbWF0aW9uUHJvZ3Jlc3MgPSB0aGlzLm9wdGlvbnMub25BbmltYXRpb25Qcm9ncmVzcztcblx0XHRcdFx0YW5pbWF0aW9uLm9uQW5pbWF0aW9uQ29tcGxldGUgPSB0aGlzLm9wdGlvbnMub25BbmltYXRpb25Db21wbGV0ZTtcblx0XHRcdFx0XG5cdFx0XHRcdENoYXJ0LmFuaW1hdGlvblNlcnZpY2UuYWRkQW5pbWF0aW9uKHRoaXMsIGFuaW1hdGlvbik7XG5cdFx0XHR9XG5cdFx0XHRlbHNle1xuXHRcdFx0XHR0aGlzLmRyYXcoKTtcblx0XHRcdFx0dGhpcy5vcHRpb25zLm9uQW5pbWF0aW9uQ29tcGxldGUuY2FsbCh0aGlzKTtcblx0XHRcdH1cblx0XHRcdHJldHVybiB0aGlzO1xuXHRcdH0sXG5cdFx0Z2VuZXJhdGVMZWdlbmQgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIGhlbHBlcnMudGVtcGxhdGUodGhpcy5vcHRpb25zLmxlZ2VuZFRlbXBsYXRlLCB0aGlzKTtcblx0XHR9LFxuXHRcdGRlc3Ryb3kgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zdG9wKCk7XG5cdFx0XHR0aGlzLmNsZWFyKCk7XG5cdFx0XHR1bmJpbmRFdmVudHModGhpcywgdGhpcy5ldmVudHMpO1xuXHRcdFx0dmFyIGNhbnZhcyA9IHRoaXMuY2hhcnQuY2FudmFzO1xuXG5cdFx0XHQvLyBSZXNldCBjYW52YXMgaGVpZ2h0L3dpZHRoIGF0dHJpYnV0ZXMgc3RhcnRzIGEgZnJlc2ggd2l0aCB0aGUgY2FudmFzIGNvbnRleHRcblx0XHRcdGNhbnZhcy53aWR0aCA9IHRoaXMuY2hhcnQud2lkdGg7XG5cdFx0XHRjYW52YXMuaGVpZ2h0ID0gdGhpcy5jaGFydC5oZWlnaHQ7XG5cblx0XHRcdC8vIDwgSUU5IGRvZXNuJ3Qgc3VwcG9ydCByZW1vdmVQcm9wZXJ0eVxuXHRcdFx0aWYgKGNhbnZhcy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSkge1xuXHRcdFx0XHRjYW52YXMuc3R5bGUucmVtb3ZlUHJvcGVydHkoJ3dpZHRoJyk7XG5cdFx0XHRcdGNhbnZhcy5zdHlsZS5yZW1vdmVQcm9wZXJ0eSgnaGVpZ2h0Jyk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRjYW52YXMuc3R5bGUucmVtb3ZlQXR0cmlidXRlKCd3aWR0aCcpO1xuXHRcdFx0XHRjYW52YXMuc3R5bGUucmVtb3ZlQXR0cmlidXRlKCdoZWlnaHQnKTtcblx0XHRcdH1cblxuXHRcdFx0ZGVsZXRlIENoYXJ0Lmluc3RhbmNlc1t0aGlzLmlkXTtcblx0XHR9LFxuXHRcdHNob3dUb29sdGlwIDogZnVuY3Rpb24oQ2hhcnRFbGVtZW50cywgZm9yY2VSZWRyYXcpe1xuXHRcdFx0Ly8gT25seSByZWRyYXcgdGhlIGNoYXJ0IGlmIHdlJ3ZlIGFjdHVhbGx5IGNoYW5nZWQgd2hhdCB3ZSdyZSBob3ZlcmluZyBvbi5cblx0XHRcdGlmICh0eXBlb2YgdGhpcy5hY3RpdmVFbGVtZW50cyA9PT0gJ3VuZGVmaW5lZCcpIHRoaXMuYWN0aXZlRWxlbWVudHMgPSBbXTtcblxuXHRcdFx0dmFyIGlzQ2hhbmdlZCA9IChmdW5jdGlvbihFbGVtZW50cyl7XG5cdFx0XHRcdHZhciBjaGFuZ2VkID0gZmFsc2U7XG5cblx0XHRcdFx0aWYgKEVsZW1lbnRzLmxlbmd0aCAhPT0gdGhpcy5hY3RpdmVFbGVtZW50cy5sZW5ndGgpe1xuXHRcdFx0XHRcdGNoYW5nZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHJldHVybiBjaGFuZ2VkO1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0ZWFjaChFbGVtZW50cywgZnVuY3Rpb24oZWxlbWVudCwgaW5kZXgpe1xuXHRcdFx0XHRcdGlmIChlbGVtZW50ICE9PSB0aGlzLmFjdGl2ZUVsZW1lbnRzW2luZGV4XSl7XG5cdFx0XHRcdFx0XHRjaGFuZ2VkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0XHRyZXR1cm4gY2hhbmdlZDtcblx0XHRcdH0pLmNhbGwodGhpcywgQ2hhcnRFbGVtZW50cyk7XG5cblx0XHRcdGlmICghaXNDaGFuZ2VkICYmICFmb3JjZVJlZHJhdyl7XG5cdFx0XHRcdHJldHVybjtcblx0XHRcdH1cblx0XHRcdGVsc2V7XG5cdFx0XHRcdHRoaXMuYWN0aXZlRWxlbWVudHMgPSBDaGFydEVsZW1lbnRzO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5kcmF3KCk7XG5cdFx0XHRpZih0aGlzLm9wdGlvbnMuY3VzdG9tVG9vbHRpcHMpe1xuXHRcdFx0XHR0aGlzLm9wdGlvbnMuY3VzdG9tVG9vbHRpcHMoZmFsc2UpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKENoYXJ0RWxlbWVudHMubGVuZ3RoID4gMCl7XG5cdFx0XHRcdC8vIElmIHdlIGhhdmUgbXVsdGlwbGUgZGF0YXNldHMsIHNob3cgYSBNdWx0aVRvb2x0aXAgZm9yIGFsbCBvZiB0aGUgZGF0YSBwb2ludHMgYXQgdGhhdCBpbmRleFxuXHRcdFx0XHRpZiAodGhpcy5kYXRhc2V0cyAmJiB0aGlzLmRhdGFzZXRzLmxlbmd0aCA+IDEpIHtcblx0XHRcdFx0XHR2YXIgZGF0YUFycmF5LFxuXHRcdFx0XHRcdFx0ZGF0YUluZGV4O1xuXG5cdFx0XHRcdFx0Zm9yICh2YXIgaSA9IHRoaXMuZGF0YXNldHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRcdGRhdGFBcnJheSA9IHRoaXMuZGF0YXNldHNbaV0ucG9pbnRzIHx8IHRoaXMuZGF0YXNldHNbaV0uYmFycyB8fCB0aGlzLmRhdGFzZXRzW2ldLnNlZ21lbnRzO1xuXHRcdFx0XHRcdFx0ZGF0YUluZGV4ID0gaW5kZXhPZihkYXRhQXJyYXksIENoYXJ0RWxlbWVudHNbMF0pO1xuXHRcdFx0XHRcdFx0aWYgKGRhdGFJbmRleCAhPT0gLTEpe1xuXHRcdFx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dmFyIHRvb2x0aXBMYWJlbHMgPSBbXSxcblx0XHRcdFx0XHRcdHRvb2x0aXBDb2xvcnMgPSBbXSxcblx0XHRcdFx0XHRcdG1lZGlhblBvc2l0aW9uID0gKGZ1bmN0aW9uKGluZGV4KSB7XG5cblx0XHRcdFx0XHRcdFx0Ly8gR2V0IGFsbCB0aGUgcG9pbnRzIGF0IHRoYXQgcGFydGljdWxhciBpbmRleFxuXHRcdFx0XHRcdFx0XHR2YXIgRWxlbWVudHMgPSBbXSxcblx0XHRcdFx0XHRcdFx0XHRkYXRhQ29sbGVjdGlvbixcblx0XHRcdFx0XHRcdFx0XHR4UG9zaXRpb25zID0gW10sXG5cdFx0XHRcdFx0XHRcdFx0eVBvc2l0aW9ucyA9IFtdLFxuXHRcdFx0XHRcdFx0XHRcdHhNYXgsXG5cdFx0XHRcdFx0XHRcdFx0eU1heCxcblx0XHRcdFx0XHRcdFx0XHR4TWluLFxuXHRcdFx0XHRcdFx0XHRcdHlNaW47XG5cdFx0XHRcdFx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLCBmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0XHRcdFx0XHRkYXRhQ29sbGVjdGlvbiA9IGRhdGFzZXQucG9pbnRzIHx8IGRhdGFzZXQuYmFycyB8fCBkYXRhc2V0LnNlZ21lbnRzO1xuXHRcdFx0XHRcdFx0XHRcdGlmIChkYXRhQ29sbGVjdGlvbltkYXRhSW5kZXhdICYmIGRhdGFDb2xsZWN0aW9uW2RhdGFJbmRleF0uaGFzVmFsdWUoKSl7XG5cdFx0XHRcdFx0XHRcdFx0XHRFbGVtZW50cy5wdXNoKGRhdGFDb2xsZWN0aW9uW2RhdGFJbmRleF0pO1xuXHRcdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0fSk7XG5cblx0XHRcdFx0XHRcdFx0aGVscGVycy5lYWNoKEVsZW1lbnRzLCBmdW5jdGlvbihlbGVtZW50KSB7XG5cdFx0XHRcdFx0XHRcdFx0eFBvc2l0aW9ucy5wdXNoKGVsZW1lbnQueCk7XG5cdFx0XHRcdFx0XHRcdFx0eVBvc2l0aW9ucy5wdXNoKGVsZW1lbnQueSk7XG5cblxuXHRcdFx0XHRcdFx0XHRcdC8vSW5jbHVkZSBhbnkgY29sb3VyIGluZm9ybWF0aW9uIGFib3V0IHRoZSBlbGVtZW50XG5cdFx0XHRcdFx0XHRcdFx0dG9vbHRpcExhYmVscy5wdXNoKGhlbHBlcnMudGVtcGxhdGUodGhpcy5vcHRpb25zLm11bHRpVG9vbHRpcFRlbXBsYXRlLCBlbGVtZW50KSk7XG5cdFx0XHRcdFx0XHRcdFx0dG9vbHRpcENvbG9ycy5wdXNoKHtcblx0XHRcdFx0XHRcdFx0XHRcdGZpbGw6IGVsZW1lbnQuX3NhdmVkLmZpbGxDb2xvciB8fCBlbGVtZW50LmZpbGxDb2xvcixcblx0XHRcdFx0XHRcdFx0XHRcdHN0cm9rZTogZWxlbWVudC5fc2F2ZWQuc3Ryb2tlQ29sb3IgfHwgZWxlbWVudC5zdHJva2VDb2xvclxuXHRcdFx0XHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRcdFx0XHRcdHlNaW4gPSBtaW4oeVBvc2l0aW9ucyk7XG5cdFx0XHRcdFx0XHRcdHlNYXggPSBtYXgoeVBvc2l0aW9ucyk7XG5cblx0XHRcdFx0XHRcdFx0eE1pbiA9IG1pbih4UG9zaXRpb25zKTtcblx0XHRcdFx0XHRcdFx0eE1heCA9IG1heCh4UG9zaXRpb25zKTtcblxuXHRcdFx0XHRcdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHRcdFx0XHRcdHg6ICh4TWluID4gdGhpcy5jaGFydC53aWR0aC8yKSA/IHhNaW4gOiB4TWF4LFxuXHRcdFx0XHRcdFx0XHRcdHk6ICh5TWluICsgeU1heCkvMlxuXHRcdFx0XHRcdFx0XHR9O1xuXHRcdFx0XHRcdFx0fSkuY2FsbCh0aGlzLCBkYXRhSW5kZXgpO1xuXG5cdFx0XHRcdFx0bmV3IENoYXJ0Lk11bHRpVG9vbHRpcCh7XG5cdFx0XHRcdFx0XHR4OiBtZWRpYW5Qb3NpdGlvbi54LFxuXHRcdFx0XHRcdFx0eTogbWVkaWFuUG9zaXRpb24ueSxcblx0XHRcdFx0XHRcdHhQYWRkaW5nOiB0aGlzLm9wdGlvbnMudG9vbHRpcFhQYWRkaW5nLFxuXHRcdFx0XHRcdFx0eVBhZGRpbmc6IHRoaXMub3B0aW9ucy50b29sdGlwWVBhZGRpbmcsXG5cdFx0XHRcdFx0XHR4T2Zmc2V0OiB0aGlzLm9wdGlvbnMudG9vbHRpcFhPZmZzZXQsXG5cdFx0XHRcdFx0XHRmaWxsQ29sb3I6IHRoaXMub3B0aW9ucy50b29sdGlwRmlsbENvbG9yLFxuXHRcdFx0XHRcdFx0dGV4dENvbG9yOiB0aGlzLm9wdGlvbnMudG9vbHRpcEZvbnRDb2xvcixcblx0XHRcdFx0XHRcdGZvbnRGYW1pbHk6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udEZhbWlseSxcblx0XHRcdFx0XHRcdGZvbnRTdHlsZTogdGhpcy5vcHRpb25zLnRvb2x0aXBGb250U3R5bGUsXG5cdFx0XHRcdFx0XHRmb250U2l6ZTogdGhpcy5vcHRpb25zLnRvb2x0aXBGb250U2l6ZSxcblx0XHRcdFx0XHRcdHRpdGxlVGV4dENvbG9yOiB0aGlzLm9wdGlvbnMudG9vbHRpcFRpdGxlRm9udENvbG9yLFxuXHRcdFx0XHRcdFx0dGl0bGVGb250RmFtaWx5OiB0aGlzLm9wdGlvbnMudG9vbHRpcFRpdGxlRm9udEZhbWlseSxcblx0XHRcdFx0XHRcdHRpdGxlRm9udFN0eWxlOiB0aGlzLm9wdGlvbnMudG9vbHRpcFRpdGxlRm9udFN0eWxlLFxuXHRcdFx0XHRcdFx0dGl0bGVGb250U2l6ZTogdGhpcy5vcHRpb25zLnRvb2x0aXBUaXRsZUZvbnRTaXplLFxuXHRcdFx0XHRcdFx0Y29ybmVyUmFkaXVzOiB0aGlzLm9wdGlvbnMudG9vbHRpcENvcm5lclJhZGl1cyxcblx0XHRcdFx0XHRcdGxhYmVsczogdG9vbHRpcExhYmVscyxcblx0XHRcdFx0XHRcdGxlZ2VuZENvbG9yczogdG9vbHRpcENvbG9ycyxcblx0XHRcdFx0XHRcdGxlZ2VuZENvbG9yQmFja2dyb3VuZCA6IHRoaXMub3B0aW9ucy5tdWx0aVRvb2x0aXBLZXlCYWNrZ3JvdW5kLFxuXHRcdFx0XHRcdFx0dGl0bGU6IHRlbXBsYXRlKHRoaXMub3B0aW9ucy50b29sdGlwVGl0bGVUZW1wbGF0ZSxDaGFydEVsZW1lbnRzWzBdKSxcblx0XHRcdFx0XHRcdGNoYXJ0OiB0aGlzLmNoYXJ0LFxuXHRcdFx0XHRcdFx0Y3R4OiB0aGlzLmNoYXJ0LmN0eCxcblx0XHRcdFx0XHRcdGN1c3RvbTogdGhpcy5vcHRpb25zLmN1c3RvbVRvb2x0aXBzXG5cdFx0XHRcdFx0fSkuZHJhdygpO1xuXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0ZWFjaChDaGFydEVsZW1lbnRzLCBmdW5jdGlvbihFbGVtZW50KSB7XG5cdFx0XHRcdFx0XHR2YXIgdG9vbHRpcFBvc2l0aW9uID0gRWxlbWVudC50b29sdGlwUG9zaXRpb24oKTtcblx0XHRcdFx0XHRcdG5ldyBDaGFydC5Ub29sdGlwKHtcblx0XHRcdFx0XHRcdFx0eDogTWF0aC5yb3VuZCh0b29sdGlwUG9zaXRpb24ueCksXG5cdFx0XHRcdFx0XHRcdHk6IE1hdGgucm91bmQodG9vbHRpcFBvc2l0aW9uLnkpLFxuXHRcdFx0XHRcdFx0XHR4UGFkZGluZzogdGhpcy5vcHRpb25zLnRvb2x0aXBYUGFkZGluZyxcblx0XHRcdFx0XHRcdFx0eVBhZGRpbmc6IHRoaXMub3B0aW9ucy50b29sdGlwWVBhZGRpbmcsXG5cdFx0XHRcdFx0XHRcdGZpbGxDb2xvcjogdGhpcy5vcHRpb25zLnRvb2x0aXBGaWxsQ29sb3IsXG5cdFx0XHRcdFx0XHRcdHRleHRDb2xvcjogdGhpcy5vcHRpb25zLnRvb2x0aXBGb250Q29sb3IsXG5cdFx0XHRcdFx0XHRcdGZvbnRGYW1pbHk6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udEZhbWlseSxcblx0XHRcdFx0XHRcdFx0Zm9udFN0eWxlOiB0aGlzLm9wdGlvbnMudG9vbHRpcEZvbnRTdHlsZSxcblx0XHRcdFx0XHRcdFx0Zm9udFNpemU6IHRoaXMub3B0aW9ucy50b29sdGlwRm9udFNpemUsXG5cdFx0XHRcdFx0XHRcdGNhcmV0SGVpZ2h0OiB0aGlzLm9wdGlvbnMudG9vbHRpcENhcmV0U2l6ZSxcblx0XHRcdFx0XHRcdFx0Y29ybmVyUmFkaXVzOiB0aGlzLm9wdGlvbnMudG9vbHRpcENvcm5lclJhZGl1cyxcblx0XHRcdFx0XHRcdFx0dGV4dDogdGVtcGxhdGUodGhpcy5vcHRpb25zLnRvb2x0aXBUZW1wbGF0ZSwgRWxlbWVudCksXG5cdFx0XHRcdFx0XHRcdGNoYXJ0OiB0aGlzLmNoYXJ0LFxuXHRcdFx0XHRcdFx0XHRjdXN0b206IHRoaXMub3B0aW9ucy5jdXN0b21Ub29sdGlwc1xuXHRcdFx0XHRcdFx0fSkuZHJhdygpO1xuXHRcdFx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHRvQmFzZTY0SW1hZ2UgOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHRoaXMuY2hhcnQuY2FudmFzLnRvRGF0YVVSTC5hcHBseSh0aGlzLmNoYXJ0LmNhbnZhcywgYXJndW1lbnRzKTtcblx0XHR9XG5cdH0pO1xuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kID0gZnVuY3Rpb24oZXh0ZW5zaW9ucyl7XG5cblx0XHR2YXIgcGFyZW50ID0gdGhpcztcblxuXHRcdHZhciBDaGFydFR5cGUgPSBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIHBhcmVudC5hcHBseSh0aGlzLGFyZ3VtZW50cyk7XG5cdFx0fTtcblxuXHRcdC8vQ29weSB0aGUgcHJvdG90eXBlIG9iamVjdCBvZiB0aGUgdGhpcyBjbGFzc1xuXHRcdENoYXJ0VHlwZS5wcm90b3R5cGUgPSBjbG9uZShwYXJlbnQucHJvdG90eXBlKTtcblx0XHQvL05vdyBvdmVyd3JpdGUgc29tZSBvZiB0aGUgcHJvcGVydGllcyBpbiB0aGUgYmFzZSBjbGFzcyB3aXRoIHRoZSBuZXcgZXh0ZW5zaW9uc1xuXHRcdGV4dGVuZChDaGFydFR5cGUucHJvdG90eXBlLCBleHRlbnNpb25zKTtcblxuXHRcdENoYXJ0VHlwZS5leHRlbmQgPSBDaGFydC5UeXBlLmV4dGVuZDtcblxuXHRcdGlmIChleHRlbnNpb25zLm5hbWUgfHwgcGFyZW50LnByb3RvdHlwZS5uYW1lKXtcblxuXHRcdFx0dmFyIGNoYXJ0TmFtZSA9IGV4dGVuc2lvbnMubmFtZSB8fCBwYXJlbnQucHJvdG90eXBlLm5hbWU7XG5cdFx0XHQvL0Fzc2lnbiBhbnkgcG90ZW50aWFsIGRlZmF1bHQgdmFsdWVzIG9mIHRoZSBuZXcgY2hhcnQgdHlwZVxuXG5cdFx0XHQvL0lmIG5vbmUgYXJlIGRlZmluZWQsIHdlJ2xsIHVzZSBhIGNsb25lIG9mIHRoZSBjaGFydCB0eXBlIHRoaXMgaXMgYmVpbmcgZXh0ZW5kZWQgZnJvbS5cblx0XHRcdC8vSS5lLiBpZiB3ZSBleHRlbmQgYSBsaW5lIGNoYXJ0LCB3ZSdsbCB1c2UgdGhlIGRlZmF1bHRzIGZyb20gdGhlIGxpbmUgY2hhcnQgaWYgb3VyIG5ldyBjaGFydFxuXHRcdFx0Ly9kb2Vzbid0IGRlZmluZSBzb21lIGRlZmF1bHRzIG9mIHRoZWlyIG93bi5cblxuXHRcdFx0dmFyIGJhc2VEZWZhdWx0cyA9IChDaGFydC5kZWZhdWx0c1twYXJlbnQucHJvdG90eXBlLm5hbWVdKSA/IGNsb25lKENoYXJ0LmRlZmF1bHRzW3BhcmVudC5wcm90b3R5cGUubmFtZV0pIDoge307XG5cblx0XHRcdENoYXJ0LmRlZmF1bHRzW2NoYXJ0TmFtZV0gPSBleHRlbmQoYmFzZURlZmF1bHRzLGV4dGVuc2lvbnMuZGVmYXVsdHMpO1xuXG5cdFx0XHRDaGFydC50eXBlc1tjaGFydE5hbWVdID0gQ2hhcnRUeXBlO1xuXG5cdFx0XHQvL1JlZ2lzdGVyIHRoaXMgbmV3IGNoYXJ0IHR5cGUgaW4gdGhlIENoYXJ0IHByb3RvdHlwZVxuXHRcdFx0Q2hhcnQucHJvdG90eXBlW2NoYXJ0TmFtZV0gPSBmdW5jdGlvbihkYXRhLG9wdGlvbnMpe1xuXHRcdFx0XHR2YXIgY29uZmlnID0gbWVyZ2UoQ2hhcnQuZGVmYXVsdHMuZ2xvYmFsLCBDaGFydC5kZWZhdWx0c1tjaGFydE5hbWVdLCBvcHRpb25zIHx8IHt9KTtcblx0XHRcdFx0cmV0dXJuIG5ldyBDaGFydFR5cGUoZGF0YSxjb25maWcsdGhpcyk7XG5cdFx0XHR9O1xuXHRcdH0gZWxzZXtcblx0XHRcdHdhcm4oXCJOYW1lIG5vdCBwcm92aWRlZCBmb3IgdGhpcyBjaGFydCwgc28gaXQgaGFzbid0IGJlZW4gcmVnaXN0ZXJlZFwiKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudDtcblx0fTtcblxuXHRDaGFydC5FbGVtZW50ID0gZnVuY3Rpb24oY29uZmlndXJhdGlvbil7XG5cdFx0ZXh0ZW5kKHRoaXMsY29uZmlndXJhdGlvbik7XG5cdFx0dGhpcy5pbml0aWFsaXplLmFwcGx5KHRoaXMsYXJndW1lbnRzKTtcblx0XHR0aGlzLnNhdmUoKTtcblx0fTtcblx0ZXh0ZW5kKENoYXJ0LkVsZW1lbnQucHJvdG90eXBlLHtcblx0XHRpbml0aWFsaXplIDogZnVuY3Rpb24oKXt9LFxuXHRcdHJlc3RvcmUgOiBmdW5jdGlvbihwcm9wcyl7XG5cdFx0XHRpZiAoIXByb3BzKXtcblx0XHRcdFx0ZXh0ZW5kKHRoaXMsdGhpcy5fc2F2ZWQpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZWFjaChwcm9wcyxmdW5jdGlvbihrZXkpe1xuXHRcdFx0XHRcdHRoaXNba2V5XSA9IHRoaXMuX3NhdmVkW2tleV07XG5cdFx0XHRcdH0sdGhpcyk7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHNhdmUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5fc2F2ZWQgPSBjbG9uZSh0aGlzKTtcblx0XHRcdGRlbGV0ZSB0aGlzLl9zYXZlZC5fc2F2ZWQ7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKG5ld1Byb3BzKXtcblx0XHRcdGVhY2gobmV3UHJvcHMsZnVuY3Rpb24odmFsdWUsa2V5KXtcblx0XHRcdFx0dGhpcy5fc2F2ZWRba2V5XSA9IHRoaXNba2V5XTtcblx0XHRcdFx0dGhpc1trZXldID0gdmFsdWU7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0cmV0dXJuIHRoaXM7XG5cdFx0fSxcblx0XHR0cmFuc2l0aW9uIDogZnVuY3Rpb24ocHJvcHMsZWFzZSl7XG5cdFx0XHRlYWNoKHByb3BzLGZ1bmN0aW9uKHZhbHVlLGtleSl7XG5cdFx0XHRcdHRoaXNba2V5XSA9ICgodmFsdWUgLSB0aGlzLl9zYXZlZFtrZXldKSAqIGVhc2UpICsgdGhpcy5fc2F2ZWRba2V5XTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0XHRyZXR1cm4gdGhpcztcblx0XHR9LFxuXHRcdHRvb2x0aXBQb3NpdGlvbiA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4IDogdGhpcy54LFxuXHRcdFx0XHR5IDogdGhpcy55XG5cdFx0XHR9O1xuXHRcdH0sXG5cdFx0aGFzVmFsdWU6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gaXNOdW1iZXIodGhpcy52YWx1ZSk7XG5cdFx0fVxuXHR9KTtcblxuXHRDaGFydC5FbGVtZW50LmV4dGVuZCA9IGluaGVyaXRzO1xuXG5cblx0Q2hhcnQuUG9pbnQgPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0ZGlzcGxheTogdHJ1ZSxcblx0XHRpblJhbmdlOiBmdW5jdGlvbihjaGFydFgsY2hhcnRZKXtcblx0XHRcdHZhciBoaXREZXRlY3Rpb25SYW5nZSA9IHRoaXMuaGl0RGV0ZWN0aW9uUmFkaXVzICsgdGhpcy5yYWRpdXM7XG5cdFx0XHRyZXR1cm4gKChNYXRoLnBvdyhjaGFydFgtdGhpcy54LCAyKStNYXRoLnBvdyhjaGFydFktdGhpcy55LCAyKSkgPCBNYXRoLnBvdyhoaXREZXRlY3Rpb25SYW5nZSwyKSk7XG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oKXtcblx0XHRcdGlmICh0aGlzLmRpc3BsYXkpe1xuXHRcdFx0XHR2YXIgY3R4ID0gdGhpcy5jdHg7XG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblxuXHRcdFx0XHRjdHguYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLnJhZGl1cywgMCwgTWF0aC5QSSoyKTtcblx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc3Ryb2tlQ29sb3I7XG5cdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLnN0cm9rZVdpZHRoO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcblxuXHRcdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHR9XG5cblxuXHRcdFx0Ly9RdWljayBkZWJ1ZyBmb3IgYmV6aWVyIGN1cnZlIHNwbGluaW5nXG5cdFx0XHQvL0hpZ2hsaWdodHMgY29udHJvbCBwb2ludHMgYW5kIHRoZSBsaW5lIGJldHdlZW4gdGhlbS5cblx0XHRcdC8vSGFuZHkgZm9yIGRldiAtIHN0cmlwcGVkIGluIHRoZSBtaW4gdmVyc2lvbi5cblxuXHRcdFx0Ly8gY3R4LnNhdmUoKTtcblx0XHRcdC8vIGN0eC5maWxsU3R5bGUgPSBcImJsYWNrXCI7XG5cdFx0XHQvLyBjdHguc3Ryb2tlU3R5bGUgPSBcImJsYWNrXCJcblx0XHRcdC8vIGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdC8vIGN0eC5hcmModGhpcy5jb250cm9sUG9pbnRzLmlubmVyLngsdGhpcy5jb250cm9sUG9pbnRzLmlubmVyLnksIDIsIDAsIE1hdGguUEkqMik7XG5cdFx0XHQvLyBjdHguZmlsbCgpO1xuXG5cdFx0XHQvLyBjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHQvLyBjdHguYXJjKHRoaXMuY29udHJvbFBvaW50cy5vdXRlci54LHRoaXMuY29udHJvbFBvaW50cy5vdXRlci55LCAyLCAwLCBNYXRoLlBJKjIpO1xuXHRcdFx0Ly8gY3R4LmZpbGwoKTtcblxuXHRcdFx0Ly8gY3R4Lm1vdmVUbyh0aGlzLmNvbnRyb2xQb2ludHMuaW5uZXIueCx0aGlzLmNvbnRyb2xQb2ludHMuaW5uZXIueSk7XG5cdFx0XHQvLyBjdHgubGluZVRvKHRoaXMueCwgdGhpcy55KTtcblx0XHRcdC8vIGN0eC5saW5lVG8odGhpcy5jb250cm9sUG9pbnRzLm91dGVyLngsdGhpcy5jb250cm9sUG9pbnRzLm91dGVyLnkpO1xuXHRcdFx0Ly8gY3R4LnN0cm9rZSgpO1xuXG5cdFx0XHQvLyBjdHgucmVzdG9yZSgpO1xuXG5cblxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuQXJjID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGluUmFuZ2UgOiBmdW5jdGlvbihjaGFydFgsY2hhcnRZKXtcblxuXHRcdFx0dmFyIHBvaW50UmVsYXRpdmVQb3NpdGlvbiA9IGhlbHBlcnMuZ2V0QW5nbGVGcm9tUG9pbnQodGhpcywge1xuXHRcdFx0XHR4OiBjaGFydFgsXG5cdFx0XHRcdHk6IGNoYXJ0WVxuXHRcdFx0fSk7XG5cblx0XHRcdC8vIE5vcm1hbGl6ZSBhbGwgYW5nbGVzIHRvIDAgLSAyKlBJICgwIC0gMzYwwrApXG5cdFx0XHR2YXIgcG9pbnRSZWxhdGl2ZUFuZ2xlID0gcG9pbnRSZWxhdGl2ZVBvc2l0aW9uLmFuZ2xlICUgKE1hdGguUEkgKiAyKSxcblx0XHRcdCAgICBzdGFydEFuZ2xlID0gKE1hdGguUEkgKiAyICsgdGhpcy5zdGFydEFuZ2xlKSAlIChNYXRoLlBJICogMiksXG5cdFx0XHQgICAgZW5kQW5nbGUgPSAoTWF0aC5QSSAqIDIgKyB0aGlzLmVuZEFuZ2xlKSAlIChNYXRoLlBJICogMikgfHwgMzYwO1xuXG5cdFx0XHQvLyBDYWxjdWxhdGUgd2V0aGVyIHRoZSBwb2ludFJlbGF0aXZlQW5nbGUgaXMgYmV0d2VlbiB0aGUgc3RhcnQgYW5kIHRoZSBlbmQgYW5nbGVcblx0XHRcdHZhciBiZXR3ZWVuQW5nbGVzID0gKGVuZEFuZ2xlIDwgc3RhcnRBbmdsZSkgP1xuXHRcdFx0XHRwb2ludFJlbGF0aXZlQW5nbGUgPD0gZW5kQW5nbGUgfHwgcG9pbnRSZWxhdGl2ZUFuZ2xlID49IHN0YXJ0QW5nbGU6XG5cdFx0XHRcdHBvaW50UmVsYXRpdmVBbmdsZSA+PSBzdGFydEFuZ2xlICYmIHBvaW50UmVsYXRpdmVBbmdsZSA8PSBlbmRBbmdsZTtcblxuXHRcdFx0Ly9DaGVjayBpZiB3aXRoaW4gdGhlIHJhbmdlIG9mIHRoZSBvcGVuL2Nsb3NlIGFuZ2xlXG5cdFx0XHR2YXIgd2l0aGluUmFkaXVzID0gKHBvaW50UmVsYXRpdmVQb3NpdGlvbi5kaXN0YW5jZSA+PSB0aGlzLmlubmVyUmFkaXVzICYmIHBvaW50UmVsYXRpdmVQb3NpdGlvbi5kaXN0YW5jZSA8PSB0aGlzLm91dGVyUmFkaXVzKTtcblxuXHRcdFx0cmV0dXJuIChiZXR3ZWVuQW5nbGVzICYmIHdpdGhpblJhZGl1cyk7XG5cdFx0XHQvL0Vuc3VyZSB3aXRoaW4gdGhlIG91dHNpZGUgb2YgdGhlIGFyYyBjZW50cmUsIGJ1dCBpbnNpZGUgYXJjIG91dGVyXG5cdFx0fSxcblx0XHR0b29sdGlwUG9zaXRpb24gOiBmdW5jdGlvbigpe1xuXHRcdFx0dmFyIGNlbnRyZUFuZ2xlID0gdGhpcy5zdGFydEFuZ2xlICsgKCh0aGlzLmVuZEFuZ2xlIC0gdGhpcy5zdGFydEFuZ2xlKSAvIDIpLFxuXHRcdFx0XHRyYW5nZUZyb21DZW50cmUgPSAodGhpcy5vdXRlclJhZGl1cyAtIHRoaXMuaW5uZXJSYWRpdXMpIC8gMiArIHRoaXMuaW5uZXJSYWRpdXM7XG5cdFx0XHRyZXR1cm4ge1xuXHRcdFx0XHR4IDogdGhpcy54ICsgKE1hdGguY29zKGNlbnRyZUFuZ2xlKSAqIHJhbmdlRnJvbUNlbnRyZSksXG5cdFx0XHRcdHkgOiB0aGlzLnkgKyAoTWF0aC5zaW4oY2VudHJlQW5nbGUpICogcmFuZ2VGcm9tQ2VudHJlKVxuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbihhbmltYXRpb25QZXJjZW50KXtcblxuXHRcdFx0dmFyIGVhc2luZ0RlY2ltYWwgPSBhbmltYXRpb25QZXJjZW50IHx8IDE7XG5cblx0XHRcdHZhciBjdHggPSB0aGlzLmN0eDtcblxuXHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXG5cdFx0XHRjdHguYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLm91dGVyUmFkaXVzIDwgMCA/IDAgOiB0aGlzLm91dGVyUmFkaXVzLCB0aGlzLnN0YXJ0QW5nbGUsIHRoaXMuZW5kQW5nbGUpO1xuXG4gICAgICAgICAgICBjdHguYXJjKHRoaXMueCwgdGhpcy55LCB0aGlzLmlubmVyUmFkaXVzIDwgMCA/IDAgOiB0aGlzLmlubmVyUmFkaXVzLCB0aGlzLmVuZEFuZ2xlLCB0aGlzLnN0YXJ0QW5nbGUsIHRydWUpO1xuXG5cdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLnN0cm9rZUNvbG9yO1xuXHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMuc3Ryb2tlV2lkdGg7XG5cblx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcblxuXHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdGN0eC5saW5lSm9pbiA9ICdiZXZlbCc7XG5cblx0XHRcdGlmICh0aGlzLnNob3dTdHJva2Upe1xuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHRDaGFydC5SZWN0YW5nbGUgPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgY3R4ID0gdGhpcy5jdHgsXG5cdFx0XHRcdGhhbGZXaWR0aCA9IHRoaXMud2lkdGgvMixcblx0XHRcdFx0bGVmdFggPSB0aGlzLnggLSBoYWxmV2lkdGgsXG5cdFx0XHRcdHJpZ2h0WCA9IHRoaXMueCArIGhhbGZXaWR0aCxcblx0XHRcdFx0dG9wID0gdGhpcy5iYXNlIC0gKHRoaXMuYmFzZSAtIHRoaXMueSksXG5cdFx0XHRcdGhhbGZTdHJva2UgPSB0aGlzLnN0cm9rZVdpZHRoIC8gMjtcblxuXHRcdFx0Ly8gQ2FudmFzIGRvZXNuJ3QgYWxsb3cgdXMgdG8gc3Ryb2tlIGluc2lkZSB0aGUgd2lkdGggc28gd2UgY2FuXG5cdFx0XHQvLyBhZGp1c3QgdGhlIHNpemVzIHRvIGZpdCBpZiB3ZSdyZSBzZXR0aW5nIGEgc3Ryb2tlIG9uIHRoZSBsaW5lXG5cdFx0XHRpZiAodGhpcy5zaG93U3Ryb2tlKXtcblx0XHRcdFx0bGVmdFggKz0gaGFsZlN0cm9rZTtcblx0XHRcdFx0cmlnaHRYIC09IGhhbGZTdHJva2U7XG5cdFx0XHRcdHRvcCArPSBoYWxmU3Ryb2tlO1xuXHRcdFx0fVxuXG5cdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cblx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmZpbGxDb2xvcjtcblx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuc3Ryb2tlQ29sb3I7XG5cdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5zdHJva2VXaWR0aDtcblxuXHRcdFx0Ly8gSXQnZCBiZSBuaWNlIHRvIGtlZXAgdGhpcyBjbGFzcyB0b3RhbGx5IGdlbmVyaWMgdG8gYW55IHJlY3RhbmdsZVxuXHRcdFx0Ly8gYW5kIHNpbXBseSBzcGVjaWZ5IHdoaWNoIGJvcmRlciB0byBtaXNzIG91dC5cblx0XHRcdGN0eC5tb3ZlVG8obGVmdFgsIHRoaXMuYmFzZSk7XG5cdFx0XHRjdHgubGluZVRvKGxlZnRYLCB0b3ApO1xuXHRcdFx0Y3R4LmxpbmVUbyhyaWdodFgsIHRvcCk7XG5cdFx0XHRjdHgubGluZVRvKHJpZ2h0WCwgdGhpcy5iYXNlKTtcblx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRpZiAodGhpcy5zaG93U3Ryb2tlKXtcblx0XHRcdFx0Y3R4LnN0cm9rZSgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0aGVpZ2h0IDogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiB0aGlzLmJhc2UgLSB0aGlzLnk7XG5cdFx0fSxcblx0XHRpblJhbmdlIDogZnVuY3Rpb24oY2hhcnRYLGNoYXJ0WSl7XG5cdFx0XHRyZXR1cm4gKGNoYXJ0WCA+PSB0aGlzLnggLSB0aGlzLndpZHRoLzIgJiYgY2hhcnRYIDw9IHRoaXMueCArIHRoaXMud2lkdGgvMikgJiYgKGNoYXJ0WSA+PSB0aGlzLnkgJiYgY2hhcnRZIDw9IHRoaXMuYmFzZSk7XG5cdFx0fVxuXHR9KTtcblxuXHRDaGFydC5BbmltYXRpb24gPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0Y3VycmVudFN0ZXA6IG51bGwsIC8vIHRoZSBjdXJyZW50IGFuaW1hdGlvbiBzdGVwXG5cdFx0bnVtU3RlcHM6IDYwLCAvLyBkZWZhdWx0IG51bWJlciBvZiBzdGVwc1xuXHRcdGVhc2luZzogXCJcIiwgLy8gdGhlIGVhc2luZyB0byB1c2UgZm9yIHRoaXMgYW5pbWF0aW9uXG5cdFx0cmVuZGVyOiBudWxsLCAvLyByZW5kZXIgZnVuY3Rpb24gdXNlZCBieSB0aGUgYW5pbWF0aW9uIHNlcnZpY2Vcblx0XHRcblx0XHRvbkFuaW1hdGlvblByb2dyZXNzOiBudWxsLCAvLyB1c2VyIHNwZWNpZmllZCBjYWxsYmFjayB0byBmaXJlIG9uIGVhY2ggc3RlcCBvZiB0aGUgYW5pbWF0aW9uIFxuXHRcdG9uQW5pbWF0aW9uQ29tcGxldGU6IG51bGwsIC8vIHVzZXIgc3BlY2lmaWVkIGNhbGxiYWNrIHRvIGZpcmUgd2hlbiB0aGUgYW5pbWF0aW9uIGZpbmlzaGVzXG5cdH0pO1xuXHRcblx0Q2hhcnQuVG9vbHRpcCA9IENoYXJ0LkVsZW1lbnQuZXh0ZW5kKHtcblx0XHRkcmF3IDogZnVuY3Rpb24oKXtcblxuXHRcdFx0dmFyIGN0eCA9IHRoaXMuY2hhcnQuY3R4O1xuXG5cdFx0XHRjdHguZm9udCA9IGZvbnRTdHJpbmcodGhpcy5mb250U2l6ZSx0aGlzLmZvbnRTdHlsZSx0aGlzLmZvbnRGYW1pbHkpO1xuXG5cdFx0XHR0aGlzLnhBbGlnbiA9IFwiY2VudGVyXCI7XG5cdFx0XHR0aGlzLnlBbGlnbiA9IFwiYWJvdmVcIjtcblxuXHRcdFx0Ly9EaXN0YW5jZSBiZXR3ZWVuIHRoZSBhY3R1YWwgZWxlbWVudC55IHBvc2l0aW9uIGFuZCB0aGUgc3RhcnQgb2YgdGhlIHRvb2x0aXAgY2FyZXRcblx0XHRcdHZhciBjYXJldFBhZGRpbmcgPSB0aGlzLmNhcmV0UGFkZGluZyA9IDI7XG5cblx0XHRcdHZhciB0b29sdGlwV2lkdGggPSBjdHgubWVhc3VyZVRleHQodGhpcy50ZXh0KS53aWR0aCArIDIqdGhpcy54UGFkZGluZyxcblx0XHRcdFx0dG9vbHRpcFJlY3RIZWlnaHQgPSB0aGlzLmZvbnRTaXplICsgMip0aGlzLnlQYWRkaW5nLFxuXHRcdFx0XHR0b29sdGlwSGVpZ2h0ID0gdG9vbHRpcFJlY3RIZWlnaHQgKyB0aGlzLmNhcmV0SGVpZ2h0ICsgY2FyZXRQYWRkaW5nO1xuXG5cdFx0XHRpZiAodGhpcy54ICsgdG9vbHRpcFdpZHRoLzIgPnRoaXMuY2hhcnQud2lkdGgpe1xuXHRcdFx0XHR0aGlzLnhBbGlnbiA9IFwibGVmdFwiO1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnggLSB0b29sdGlwV2lkdGgvMiA8IDApe1xuXHRcdFx0XHR0aGlzLnhBbGlnbiA9IFwicmlnaHRcIjtcblx0XHRcdH1cblxuXHRcdFx0aWYgKHRoaXMueSAtIHRvb2x0aXBIZWlnaHQgPCAwKXtcblx0XHRcdFx0dGhpcy55QWxpZ24gPSBcImJlbG93XCI7XG5cdFx0XHR9XG5cblxuXHRcdFx0dmFyIHRvb2x0aXBYID0gdGhpcy54IC0gdG9vbHRpcFdpZHRoLzIsXG5cdFx0XHRcdHRvb2x0aXBZID0gdGhpcy55IC0gdG9vbHRpcEhlaWdodDtcblxuXHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbENvbG9yO1xuXG5cdFx0XHQvLyBDdXN0b20gVG9vbHRpcHNcblx0XHRcdGlmKHRoaXMuY3VzdG9tKXtcblx0XHRcdFx0dGhpcy5jdXN0b20odGhpcyk7XG5cdFx0XHR9XG5cdFx0XHRlbHNle1xuXHRcdFx0XHRzd2l0Y2godGhpcy55QWxpZ24pXG5cdFx0XHRcdHtcblx0XHRcdFx0Y2FzZSBcImFib3ZlXCI6XG5cdFx0XHRcdFx0Ly9EcmF3IGEgY2FyZXQgYWJvdmUgdGhlIHgveVxuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHRoaXMueCx0aGlzLnkgLSBjYXJldFBhZGRpbmcpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8odGhpcy54ICsgdGhpcy5jYXJldEhlaWdodCwgdGhpcy55IC0gKGNhcmV0UGFkZGluZyArIHRoaXMuY2FyZXRIZWlnaHQpKTtcblx0XHRcdFx0XHRjdHgubGluZVRvKHRoaXMueCAtIHRoaXMuY2FyZXRIZWlnaHQsIHRoaXMueSAtIChjYXJldFBhZGRpbmcgKyB0aGlzLmNhcmV0SGVpZ2h0KSk7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJiZWxvd1wiOlxuXHRcdFx0XHRcdHRvb2x0aXBZID0gdGhpcy55ICsgY2FyZXRQYWRkaW5nICsgdGhpcy5jYXJldEhlaWdodDtcblx0XHRcdFx0XHQvL0RyYXcgYSBjYXJldCBiZWxvdyB0aGUgeC95XG5cdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5tb3ZlVG8odGhpcy54LCB0aGlzLnkgKyBjYXJldFBhZGRpbmcpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8odGhpcy54ICsgdGhpcy5jYXJldEhlaWdodCwgdGhpcy55ICsgY2FyZXRQYWRkaW5nICsgdGhpcy5jYXJldEhlaWdodCk7XG5cdFx0XHRcdFx0Y3R4LmxpbmVUbyh0aGlzLnggLSB0aGlzLmNhcmV0SGVpZ2h0LCB0aGlzLnkgKyBjYXJldFBhZGRpbmcgKyB0aGlzLmNhcmV0SGVpZ2h0KTtcblx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdFx0XHRicmVhaztcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHN3aXRjaCh0aGlzLnhBbGlnbilcblx0XHRcdFx0e1xuXHRcdFx0XHRjYXNlIFwibGVmdFwiOlxuXHRcdFx0XHRcdHRvb2x0aXBYID0gdGhpcy54IC0gdG9vbHRpcFdpZHRoICsgKHRoaXMuY29ybmVyUmFkaXVzICsgdGhpcy5jYXJldEhlaWdodCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdGNhc2UgXCJyaWdodFwiOlxuXHRcdFx0XHRcdHRvb2x0aXBYID0gdGhpcy54IC0gKHRoaXMuY29ybmVyUmFkaXVzICsgdGhpcy5jYXJldEhlaWdodCk7XG5cdFx0XHRcdFx0YnJlYWs7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRkcmF3Um91bmRlZFJlY3RhbmdsZShjdHgsdG9vbHRpcFgsdG9vbHRpcFksdG9vbHRpcFdpZHRoLHRvb2x0aXBSZWN0SGVpZ2h0LHRoaXMuY29ybmVyUmFkaXVzKTtcblxuXHRcdFx0XHRjdHguZmlsbCgpO1xuXG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLnRleHRDb2xvcjtcblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IFwiY2VudGVyXCI7XG5cdFx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xuXHRcdFx0XHRjdHguZmlsbFRleHQodGhpcy50ZXh0LCB0b29sdGlwWCArIHRvb2x0aXBXaWR0aC8yLCB0b29sdGlwWSArIHRvb2x0aXBSZWN0SGVpZ2h0LzIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuTXVsdGlUb29sdGlwID0gQ2hhcnQuRWxlbWVudC5leHRlbmQoe1xuXHRcdGluaXRpYWxpemUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5mb250ID0gZm9udFN0cmluZyh0aGlzLmZvbnRTaXplLHRoaXMuZm9udFN0eWxlLHRoaXMuZm9udEZhbWlseSk7XG5cblx0XHRcdHRoaXMudGl0bGVGb250ID0gZm9udFN0cmluZyh0aGlzLnRpdGxlRm9udFNpemUsdGhpcy50aXRsZUZvbnRTdHlsZSx0aGlzLnRpdGxlRm9udEZhbWlseSk7XG5cblx0XHRcdHRoaXMudGl0bGVIZWlnaHQgPSB0aGlzLnRpdGxlID8gdGhpcy50aXRsZUZvbnRTaXplICogMS41IDogMDtcblx0XHRcdHRoaXMuaGVpZ2h0ID0gKHRoaXMubGFiZWxzLmxlbmd0aCAqIHRoaXMuZm9udFNpemUpICsgKCh0aGlzLmxhYmVscy5sZW5ndGgtMSkgKiAodGhpcy5mb250U2l6ZS8yKSkgKyAodGhpcy55UGFkZGluZyoyKSArIHRoaXMudGl0bGVIZWlnaHQ7XG5cblx0XHRcdHRoaXMuY3R4LmZvbnQgPSB0aGlzLnRpdGxlRm9udDtcblxuXHRcdFx0dmFyIHRpdGxlV2lkdGggPSB0aGlzLmN0eC5tZWFzdXJlVGV4dCh0aGlzLnRpdGxlKS53aWR0aCxcblx0XHRcdFx0Ly9MYWJlbCBoYXMgYSBsZWdlbmQgc3F1YXJlIGFzIHdlbGwgc28gYWNjb3VudCBmb3IgdGhpcy5cblx0XHRcdFx0bGFiZWxXaWR0aCA9IGxvbmdlc3RUZXh0KHRoaXMuY3R4LHRoaXMuZm9udCx0aGlzLmxhYmVscykgKyB0aGlzLmZvbnRTaXplICsgMyxcblx0XHRcdFx0bG9uZ2VzdFRleHRXaWR0aCA9IG1heChbbGFiZWxXaWR0aCx0aXRsZVdpZHRoXSk7XG5cblx0XHRcdHRoaXMud2lkdGggPSBsb25nZXN0VGV4dFdpZHRoICsgKHRoaXMueFBhZGRpbmcqMik7XG5cblxuXHRcdFx0dmFyIGhhbGZIZWlnaHQgPSB0aGlzLmhlaWdodC8yO1xuXG5cdFx0XHQvL0NoZWNrIHRvIGVuc3VyZSB0aGUgaGVpZ2h0IHdpbGwgZml0IG9uIHRoZSBjYW52YXNcblx0XHRcdGlmICh0aGlzLnkgLSBoYWxmSGVpZ2h0IDwgMCApe1xuXHRcdFx0XHR0aGlzLnkgPSBoYWxmSGVpZ2h0O1xuXHRcdFx0fSBlbHNlIGlmICh0aGlzLnkgKyBoYWxmSGVpZ2h0ID4gdGhpcy5jaGFydC5oZWlnaHQpe1xuXHRcdFx0XHR0aGlzLnkgPSB0aGlzLmNoYXJ0LmhlaWdodCAtIGhhbGZIZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHRcdC8vRGVjaWRlIHdoZXRoZXIgdG8gYWxpZ24gbGVmdCBvciByaWdodCBiYXNlZCBvbiBwb3NpdGlvbiBvbiBjYW52YXNcblx0XHRcdGlmICh0aGlzLnggPiB0aGlzLmNoYXJ0LndpZHRoLzIpe1xuXHRcdFx0XHR0aGlzLnggLT0gdGhpcy54T2Zmc2V0ICsgdGhpcy53aWR0aDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMueCArPSB0aGlzLnhPZmZzZXQ7XG5cdFx0XHR9XG5cblxuXHRcdH0sXG5cdFx0Z2V0TGluZUhlaWdodCA6IGZ1bmN0aW9uKGluZGV4KXtcblx0XHRcdHZhciBiYXNlTGluZUhlaWdodCA9IHRoaXMueSAtICh0aGlzLmhlaWdodC8yKSArIHRoaXMueVBhZGRpbmcsXG5cdFx0XHRcdGFmdGVyVGl0bGVJbmRleCA9IGluZGV4LTE7XG5cblx0XHRcdC8vSWYgdGhlIGluZGV4IGlzIHplcm8sIHdlJ3JlIGdldHRpbmcgdGhlIHRpdGxlXG5cdFx0XHRpZiAoaW5kZXggPT09IDApe1xuXHRcdFx0XHRyZXR1cm4gYmFzZUxpbmVIZWlnaHQgKyB0aGlzLnRpdGxlSGVpZ2h0IC8gMztcblx0XHRcdH0gZWxzZXtcblx0XHRcdFx0cmV0dXJuIGJhc2VMaW5lSGVpZ2h0ICsgKCh0aGlzLmZvbnRTaXplICogMS41ICogYWZ0ZXJUaXRsZUluZGV4KSArIHRoaXMuZm9udFNpemUgLyAyKSArIHRoaXMudGl0bGVIZWlnaHQ7XG5cdFx0XHR9XG5cblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbigpe1xuXHRcdFx0Ly8gQ3VzdG9tIFRvb2x0aXBzXG5cdFx0XHRpZih0aGlzLmN1c3RvbSl7XG5cdFx0XHRcdHRoaXMuY3VzdG9tKHRoaXMpO1xuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0ZHJhd1JvdW5kZWRSZWN0YW5nbGUodGhpcy5jdHgsdGhpcy54LHRoaXMueSAtIHRoaXMuaGVpZ2h0LzIsdGhpcy53aWR0aCx0aGlzLmhlaWdodCx0aGlzLmNvcm5lclJhZGl1cyk7XG5cdFx0XHRcdHZhciBjdHggPSB0aGlzLmN0eDtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuZmlsbENvbG9yO1xuXHRcdFx0XHRjdHguZmlsbCgpO1xuXHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IFwibGVmdFwiO1xuXHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gXCJtaWRkbGVcIjtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMudGl0bGVUZXh0Q29sb3I7XG5cdFx0XHRcdGN0eC5mb250ID0gdGhpcy50aXRsZUZvbnQ7XG5cblx0XHRcdFx0Y3R4LmZpbGxUZXh0KHRoaXMudGl0bGUsdGhpcy54ICsgdGhpcy54UGFkZGluZywgdGhpcy5nZXRMaW5lSGVpZ2h0KDApKTtcblxuXHRcdFx0XHRjdHguZm9udCA9IHRoaXMuZm9udDtcblx0XHRcdFx0aGVscGVycy5lYWNoKHRoaXMubGFiZWxzLGZ1bmN0aW9uKGxhYmVsLGluZGV4KXtcblx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy50ZXh0Q29sb3I7XG5cdFx0XHRcdFx0Y3R4LmZpbGxUZXh0KGxhYmVsLHRoaXMueCArIHRoaXMueFBhZGRpbmcgKyB0aGlzLmZvbnRTaXplICsgMywgdGhpcy5nZXRMaW5lSGVpZ2h0KGluZGV4ICsgMSkpO1xuXG5cdFx0XHRcdFx0Ly9BIGJpdCBnbmFybHksIGJ1dCBjbGVhcmluZyB0aGlzIHJlY3RhbmdsZSBicmVha3Mgd2hlbiB1c2luZyBleHBsb3JlcmNhbnZhcyAoY2xlYXJzIHdob2xlIGNhbnZhcylcblx0XHRcdFx0XHQvL2N0eC5jbGVhclJlY3QodGhpcy54ICsgdGhpcy54UGFkZGluZywgdGhpcy5nZXRMaW5lSGVpZ2h0KGluZGV4ICsgMSkgLSB0aGlzLmZvbnRTaXplLzIsIHRoaXMuZm9udFNpemUsIHRoaXMuZm9udFNpemUpO1xuXHRcdFx0XHRcdC8vSW5zdGVhZCB3ZSdsbCBtYWtlIGEgd2hpdGUgZmlsbGVkIGJsb2NrIHRvIHB1dCB0aGUgbGVnZW5kQ29sb3VyIHBhbGV0dGUgb3Zlci5cblxuXHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLmxlZ2VuZENvbG9yQmFja2dyb3VuZDtcblx0XHRcdFx0XHRjdHguZmlsbFJlY3QodGhpcy54ICsgdGhpcy54UGFkZGluZywgdGhpcy5nZXRMaW5lSGVpZ2h0KGluZGV4ICsgMSkgLSB0aGlzLmZvbnRTaXplLzIsIHRoaXMuZm9udFNpemUsIHRoaXMuZm9udFNpemUpO1xuXG5cdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMubGVnZW5kQ29sb3JzW2luZGV4XS5maWxsO1xuXHRcdFx0XHRcdGN0eC5maWxsUmVjdCh0aGlzLnggKyB0aGlzLnhQYWRkaW5nLCB0aGlzLmdldExpbmVIZWlnaHQoaW5kZXggKyAxKSAtIHRoaXMuZm9udFNpemUvMiwgdGhpcy5mb250U2l6ZSwgdGhpcy5mb250U2l6ZSk7XG5cblxuXHRcdFx0XHR9LHRoaXMpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuU2NhbGUgPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0aW5pdGlhbGl6ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLmZpdCgpO1xuXHRcdH0sXG5cdFx0YnVpbGRZTGFiZWxzIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMueUxhYmVscyA9IFtdO1xuXG5cdFx0XHR2YXIgc3RlcERlY2ltYWxQbGFjZXMgPSBnZXREZWNpbWFsUGxhY2VzKHRoaXMuc3RlcFZhbHVlKTtcblxuXHRcdFx0Zm9yICh2YXIgaT0wOyBpPD10aGlzLnN0ZXBzOyBpKyspe1xuXHRcdFx0XHR0aGlzLnlMYWJlbHMucHVzaCh0ZW1wbGF0ZSh0aGlzLnRlbXBsYXRlU3RyaW5nLHt2YWx1ZToodGhpcy5taW4gKyAoaSAqIHRoaXMuc3RlcFZhbHVlKSkudG9GaXhlZChzdGVwRGVjaW1hbFBsYWNlcyl9KSk7XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnlMYWJlbFdpZHRoID0gKHRoaXMuZGlzcGxheSAmJiB0aGlzLnNob3dMYWJlbHMpID8gbG9uZ2VzdFRleHQodGhpcy5jdHgsdGhpcy5mb250LHRoaXMueUxhYmVscykgKyAxMCA6IDA7XG5cdFx0fSxcblx0XHRhZGRYTGFiZWwgOiBmdW5jdGlvbihsYWJlbCl7XG5cdFx0XHR0aGlzLnhMYWJlbHMucHVzaChsYWJlbCk7XG5cdFx0XHR0aGlzLnZhbHVlc0NvdW50Kys7XG5cdFx0XHR0aGlzLmZpdCgpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlWExhYmVsIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMueExhYmVscy5zaGlmdCgpO1xuXHRcdFx0dGhpcy52YWx1ZXNDb3VudC0tO1xuXHRcdFx0dGhpcy5maXQoKTtcblx0XHR9LFxuXHRcdC8vIEZpdHRpbmcgbG9vcCB0byByb3RhdGUgeCBMYWJlbHMgYW5kIGZpZ3VyZSBvdXQgd2hhdCBmaXRzIHRoZXJlLCBhbmQgYWxzbyBjYWxjdWxhdGUgaG93IG1hbnkgWSBzdGVwcyB0byB1c2Vcblx0XHRmaXQ6IGZ1bmN0aW9uKCl7XG5cdFx0XHQvLyBGaXJzdCB3ZSBuZWVkIHRoZSB3aWR0aCBvZiB0aGUgeUxhYmVscywgYXNzdW1pbmcgdGhlIHhMYWJlbHMgYXJlbid0IHJvdGF0ZWRcblxuXHRcdFx0Ly8gVG8gZG8gdGhhdCB3ZSBuZWVkIHRoZSBiYXNlIGxpbmUgYXQgdGhlIHRvcCBhbmQgYmFzZSBvZiB0aGUgY2hhcnQsIGFzc3VtaW5nIHRoZXJlIGlzIG5vIHggbGFiZWwgcm90YXRpb25cblx0XHRcdHRoaXMuc3RhcnRQb2ludCA9ICh0aGlzLmRpc3BsYXkpID8gdGhpcy5mb250U2l6ZSA6IDA7XG5cdFx0XHR0aGlzLmVuZFBvaW50ID0gKHRoaXMuZGlzcGxheSkgPyB0aGlzLmhlaWdodCAtICh0aGlzLmZvbnRTaXplICogMS41KSAtIDUgOiB0aGlzLmhlaWdodDsgLy8gLTUgdG8gcGFkIGxhYmVsc1xuXG5cdFx0XHQvLyBBcHBseSBwYWRkaW5nIHNldHRpbmdzIHRvIHRoZSBzdGFydCBhbmQgZW5kIHBvaW50LlxuXHRcdFx0dGhpcy5zdGFydFBvaW50ICs9IHRoaXMucGFkZGluZztcblx0XHRcdHRoaXMuZW5kUG9pbnQgLT0gdGhpcy5wYWRkaW5nO1xuXG5cdFx0XHQvLyBDYWNoZSB0aGUgc3RhcnRpbmcgZW5kcG9pbnQsIGV4Y2x1ZGluZyB0aGUgc3BhY2UgZm9yIHggbGFiZWxzXG5cdFx0XHR2YXIgY2FjaGVkRW5kUG9pbnQgPSB0aGlzLmVuZFBvaW50O1xuXG5cdFx0XHQvLyBDYWNoZSB0aGUgc3RhcnRpbmcgaGVpZ2h0LCBzbyBjYW4gZGV0ZXJtaW5lIGlmIHdlIG5lZWQgdG8gcmVjYWxjdWxhdGUgdGhlIHNjYWxlIHlBeGlzXG5cdFx0XHR2YXIgY2FjaGVkSGVpZ2h0ID0gdGhpcy5lbmRQb2ludCAtIHRoaXMuc3RhcnRQb2ludCxcblx0XHRcdFx0Y2FjaGVkWUxhYmVsV2lkdGg7XG5cblx0XHRcdC8vIEJ1aWxkIHRoZSBjdXJyZW50IHlMYWJlbHMgc28gd2UgaGF2ZSBhbiBpZGVhIG9mIHdoYXQgc2l6ZSB0aGV5J2xsIGJlIHRvIHN0YXJ0XG5cdFx0XHQvKlxuXHRcdFx0ICpcdFRoaXMgc2V0cyB3aGF0IGlzIHJldHVybmVkIGZyb20gY2FsY3VsYXRlU2NhbGVSYW5nZSBhcyBzdGF0aWMgcHJvcGVydGllcyBvZiB0aGlzIGNsYXNzOlxuXHRcdFx0ICpcblx0XHRcdFx0dGhpcy5zdGVwcztcblx0XHRcdFx0dGhpcy5zdGVwVmFsdWU7XG5cdFx0XHRcdHRoaXMubWluO1xuXHRcdFx0XHR0aGlzLm1heDtcblx0XHRcdCAqXG5cdFx0XHQgKi9cblx0XHRcdHRoaXMuY2FsY3VsYXRlWVJhbmdlKGNhY2hlZEhlaWdodCk7XG5cblx0XHRcdC8vIFdpdGggdGhlc2UgcHJvcGVydGllcyBzZXQgd2UgY2FuIG5vdyBidWlsZCB0aGUgYXJyYXkgb2YgeUxhYmVsc1xuXHRcdFx0Ly8gYW5kIGFsc28gdGhlIHdpZHRoIG9mIHRoZSBsYXJnZXN0IHlMYWJlbFxuXHRcdFx0dGhpcy5idWlsZFlMYWJlbHMoKTtcblxuXHRcdFx0dGhpcy5jYWxjdWxhdGVYTGFiZWxSb3RhdGlvbigpO1xuXG5cdFx0XHR3aGlsZSgoY2FjaGVkSGVpZ2h0ID4gdGhpcy5lbmRQb2ludCAtIHRoaXMuc3RhcnRQb2ludCkpe1xuXHRcdFx0XHRjYWNoZWRIZWlnaHQgPSB0aGlzLmVuZFBvaW50IC0gdGhpcy5zdGFydFBvaW50O1xuXHRcdFx0XHRjYWNoZWRZTGFiZWxXaWR0aCA9IHRoaXMueUxhYmVsV2lkdGg7XG5cblx0XHRcdFx0dGhpcy5jYWxjdWxhdGVZUmFuZ2UoY2FjaGVkSGVpZ2h0KTtcblx0XHRcdFx0dGhpcy5idWlsZFlMYWJlbHMoKTtcblxuXHRcdFx0XHQvLyBPbmx5IGdvIHRocm91Z2ggdGhlIHhMYWJlbCBsb29wIGFnYWluIGlmIHRoZSB5TGFiZWwgd2lkdGggaGFzIGNoYW5nZWRcblx0XHRcdFx0aWYgKGNhY2hlZFlMYWJlbFdpZHRoIDwgdGhpcy55TGFiZWxXaWR0aCl7XG5cdFx0XHRcdFx0dGhpcy5lbmRQb2ludCA9IGNhY2hlZEVuZFBvaW50O1xuXHRcdFx0XHRcdHRoaXMuY2FsY3VsYXRlWExhYmVsUm90YXRpb24oKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXG5cdFx0fSxcblx0XHRjYWxjdWxhdGVYTGFiZWxSb3RhdGlvbiA6IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL0dldCB0aGUgd2lkdGggb2YgZWFjaCBncmlkIGJ5IGNhbGN1bGF0aW5nIHRoZSBkaWZmZXJlbmNlXG5cdFx0XHQvL2JldHdlZW4geCBvZmZzZXRzIGJldHdlZW4gMCBhbmQgMS5cblxuXHRcdFx0dGhpcy5jdHguZm9udCA9IHRoaXMuZm9udDtcblxuXHRcdFx0dmFyIGZpcnN0V2lkdGggPSB0aGlzLmN0eC5tZWFzdXJlVGV4dCh0aGlzLnhMYWJlbHNbMF0pLndpZHRoLFxuXHRcdFx0XHRsYXN0V2lkdGggPSB0aGlzLmN0eC5tZWFzdXJlVGV4dCh0aGlzLnhMYWJlbHNbdGhpcy54TGFiZWxzLmxlbmd0aCAtIDFdKS53aWR0aCxcblx0XHRcdFx0Zmlyc3RSb3RhdGVkLFxuXHRcdFx0XHRsYXN0Um90YXRlZDtcblxuXG5cdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdSaWdodCA9IGxhc3RXaWR0aC8yICsgMztcblx0XHRcdHRoaXMueFNjYWxlUGFkZGluZ0xlZnQgPSAoZmlyc3RXaWR0aC8yID4gdGhpcy55TGFiZWxXaWR0aCkgPyBmaXJzdFdpZHRoLzIgOiB0aGlzLnlMYWJlbFdpZHRoO1xuXG5cdFx0XHR0aGlzLnhMYWJlbFJvdGF0aW9uID0gMDtcblx0XHRcdGlmICh0aGlzLmRpc3BsYXkpe1xuXHRcdFx0XHR2YXIgb3JpZ2luYWxMYWJlbFdpZHRoID0gbG9uZ2VzdFRleHQodGhpcy5jdHgsdGhpcy5mb250LHRoaXMueExhYmVscyksXG5cdFx0XHRcdFx0Y29zUm90YXRpb24sXG5cdFx0XHRcdFx0Zmlyc3RSb3RhdGVkV2lkdGg7XG5cdFx0XHRcdHRoaXMueExhYmVsV2lkdGggPSBvcmlnaW5hbExhYmVsV2lkdGg7XG5cdFx0XHRcdC8vQWxsb3cgMyBwaXhlbHMgeDIgcGFkZGluZyBlaXRoZXIgc2lkZSBmb3IgbGFiZWwgcmVhZGFiaWxpdHlcblx0XHRcdFx0dmFyIHhHcmlkV2lkdGggPSBNYXRoLmZsb29yKHRoaXMuY2FsY3VsYXRlWCgxKSAtIHRoaXMuY2FsY3VsYXRlWCgwKSkgLSA2O1xuXG5cdFx0XHRcdC8vTWF4IGxhYmVsIHJvdGF0ZSBzaG91bGQgYmUgOTAgLSBhbHNvIGFjdCBhcyBhIGxvb3AgY291bnRlclxuXHRcdFx0XHR3aGlsZSAoKHRoaXMueExhYmVsV2lkdGggPiB4R3JpZFdpZHRoICYmIHRoaXMueExhYmVsUm90YXRpb24gPT09IDApIHx8ICh0aGlzLnhMYWJlbFdpZHRoID4geEdyaWRXaWR0aCAmJiB0aGlzLnhMYWJlbFJvdGF0aW9uIDw9IDkwICYmIHRoaXMueExhYmVsUm90YXRpb24gPiAwKSl7XG5cdFx0XHRcdFx0Y29zUm90YXRpb24gPSBNYXRoLmNvcyh0b1JhZGlhbnModGhpcy54TGFiZWxSb3RhdGlvbikpO1xuXG5cdFx0XHRcdFx0Zmlyc3RSb3RhdGVkID0gY29zUm90YXRpb24gKiBmaXJzdFdpZHRoO1xuXHRcdFx0XHRcdGxhc3RSb3RhdGVkID0gY29zUm90YXRpb24gKiBsYXN0V2lkdGg7XG5cblx0XHRcdFx0XHQvLyBXZSdyZSByaWdodCBhbGlnbmluZyB0aGUgdGV4dCBub3cuXG5cdFx0XHRcdFx0aWYgKGZpcnN0Um90YXRlZCArIHRoaXMuZm9udFNpemUgLyAyID4gdGhpcy55TGFiZWxXaWR0aCl7XG5cdFx0XHRcdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdMZWZ0ID0gZmlyc3RSb3RhdGVkICsgdGhpcy5mb250U2l6ZSAvIDI7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdHRoaXMueFNjYWxlUGFkZGluZ1JpZ2h0ID0gdGhpcy5mb250U2l6ZS8yO1xuXG5cblx0XHRcdFx0XHR0aGlzLnhMYWJlbFJvdGF0aW9uKys7XG5cdFx0XHRcdFx0dGhpcy54TGFiZWxXaWR0aCA9IGNvc1JvdGF0aW9uICogb3JpZ2luYWxMYWJlbFdpZHRoO1xuXG5cdFx0XHRcdH1cblx0XHRcdFx0aWYgKHRoaXMueExhYmVsUm90YXRpb24gPiAwKXtcblx0XHRcdFx0XHR0aGlzLmVuZFBvaW50IC09IE1hdGguc2luKHRvUmFkaWFucyh0aGlzLnhMYWJlbFJvdGF0aW9uKSkqb3JpZ2luYWxMYWJlbFdpZHRoICsgMztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0ZWxzZXtcblx0XHRcdFx0dGhpcy54TGFiZWxXaWR0aCA9IDA7XG5cdFx0XHRcdHRoaXMueFNjYWxlUGFkZGluZ1JpZ2h0ID0gdGhpcy5wYWRkaW5nO1xuXHRcdFx0XHR0aGlzLnhTY2FsZVBhZGRpbmdMZWZ0ID0gdGhpcy5wYWRkaW5nO1xuXHRcdFx0fVxuXG5cdFx0fSxcblx0XHQvLyBOZWVkcyB0byBiZSBvdmVyaWRkZW4gaW4gZWFjaCBDaGFydCB0eXBlXG5cdFx0Ly8gT3RoZXJ3aXNlIHdlIG5lZWQgdG8gcGFzcyBhbGwgdGhlIGRhdGEgaW50byB0aGUgc2NhbGUgY2xhc3Ncblx0XHRjYWxjdWxhdGVZUmFuZ2U6IG5vb3AsXG5cdFx0ZHJhd2luZ0FyZWE6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gdGhpcy5zdGFydFBvaW50IC0gdGhpcy5lbmRQb2ludDtcblx0XHR9LFxuXHRcdGNhbGN1bGF0ZVkgOiBmdW5jdGlvbih2YWx1ZSl7XG5cdFx0XHR2YXIgc2NhbGluZ0ZhY3RvciA9IHRoaXMuZHJhd2luZ0FyZWEoKSAvICh0aGlzLm1pbiAtIHRoaXMubWF4KTtcblx0XHRcdHJldHVybiB0aGlzLmVuZFBvaW50IC0gKHNjYWxpbmdGYWN0b3IgKiAodmFsdWUgLSB0aGlzLm1pbikpO1xuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlWCA6IGZ1bmN0aW9uKGluZGV4KXtcblx0XHRcdHZhciBpc1JvdGF0ZWQgPSAodGhpcy54TGFiZWxSb3RhdGlvbiA+IDApLFxuXHRcdFx0XHQvLyBpbm5lcldpZHRoID0gKHRoaXMub2Zmc2V0R3JpZExpbmVzKSA/IHRoaXMud2lkdGggLSBvZmZzZXRMZWZ0IC0gdGhpcy5wYWRkaW5nIDogdGhpcy53aWR0aCAtIChvZmZzZXRMZWZ0ICsgaGFsZkxhYmVsV2lkdGggKiAyKSAtIHRoaXMucGFkZGluZyxcblx0XHRcdFx0aW5uZXJXaWR0aCA9IHRoaXMud2lkdGggLSAodGhpcy54U2NhbGVQYWRkaW5nTGVmdCArIHRoaXMueFNjYWxlUGFkZGluZ1JpZ2h0KSxcblx0XHRcdFx0dmFsdWVXaWR0aCA9IGlubmVyV2lkdGgvTWF0aC5tYXgoKHRoaXMudmFsdWVzQ291bnQgLSAoKHRoaXMub2Zmc2V0R3JpZExpbmVzKSA/IDAgOiAxKSksIDEpLFxuXHRcdFx0XHR2YWx1ZU9mZnNldCA9ICh2YWx1ZVdpZHRoICogaW5kZXgpICsgdGhpcy54U2NhbGVQYWRkaW5nTGVmdDtcblxuXHRcdFx0aWYgKHRoaXMub2Zmc2V0R3JpZExpbmVzKXtcblx0XHRcdFx0dmFsdWVPZmZzZXQgKz0gKHZhbHVlV2lkdGgvMik7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBNYXRoLnJvdW5kKHZhbHVlT2Zmc2V0KTtcblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKG5ld1Byb3BzKXtcblx0XHRcdGhlbHBlcnMuZXh0ZW5kKHRoaXMsIG5ld1Byb3BzKTtcblx0XHRcdHRoaXMuZml0KCk7XG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oKXtcblx0XHRcdHZhciBjdHggPSB0aGlzLmN0eCxcblx0XHRcdFx0eUxhYmVsR2FwID0gKHRoaXMuZW5kUG9pbnQgLSB0aGlzLnN0YXJ0UG9pbnQpIC8gdGhpcy5zdGVwcyxcblx0XHRcdFx0eFN0YXJ0ID0gTWF0aC5yb3VuZCh0aGlzLnhTY2FsZVBhZGRpbmdMZWZ0KTtcblx0XHRcdGlmICh0aGlzLmRpc3BsYXkpe1xuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy50ZXh0Q29sb3I7XG5cdFx0XHRcdGN0eC5mb250ID0gdGhpcy5mb250O1xuXHRcdFx0XHRlYWNoKHRoaXMueUxhYmVscyxmdW5jdGlvbihsYWJlbFN0cmluZyxpbmRleCl7XG5cdFx0XHRcdFx0dmFyIHlMYWJlbENlbnRlciA9IHRoaXMuZW5kUG9pbnQgLSAoeUxhYmVsR2FwICogaW5kZXgpLFxuXHRcdFx0XHRcdFx0bGluZVBvc2l0aW9uWSA9IE1hdGgucm91bmQoeUxhYmVsQ2VudGVyKSxcblx0XHRcdFx0XHRcdGRyYXdIb3Jpem9udGFsTGluZSA9IHRoaXMuc2hvd0hvcml6b250YWxMaW5lcztcblxuXHRcdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSBcInJpZ2h0XCI7XG5cdFx0XHRcdFx0Y3R4LnRleHRCYXNlbGluZSA9IFwibWlkZGxlXCI7XG5cdFx0XHRcdFx0aWYgKHRoaXMuc2hvd0xhYmVscyl7XG5cdFx0XHRcdFx0XHRjdHguZmlsbFRleHQobGFiZWxTdHJpbmcseFN0YXJ0IC0gMTAseUxhYmVsQ2VudGVyKTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHQvLyBUaGlzIGlzIFggYXhpcywgc28gZHJhdyBpdFxuXHRcdFx0XHRcdGlmIChpbmRleCA9PT0gMCAmJiAhZHJhd0hvcml6b250YWxMaW5lKXtcblx0XHRcdFx0XHRcdGRyYXdIb3Jpem9udGFsTGluZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGRyYXdIb3Jpem9udGFsTGluZSl7XG5cdFx0XHRcdFx0XHRjdHguYmVnaW5QYXRoKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGluZGV4ID4gMCl7XG5cdFx0XHRcdFx0XHQvLyBUaGlzIGlzIGEgZ3JpZCBsaW5lIGluIHRoZSBjZW50cmUsIHNvIGRyb3AgdGhhdFxuXHRcdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMuZ3JpZExpbmVXaWR0aDtcblx0XHRcdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMuZ3JpZExpbmVDb2xvcjtcblx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyB0aGUgZmlyc3QgbGluZSBvbiB0aGUgc2NhbGVcblx0XHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLmxpbmVXaWR0aDtcblx0XHRcdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMubGluZUNvbG9yO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGxpbmVQb3NpdGlvblkgKz0gaGVscGVycy5hbGlhc1BpeGVsKGN0eC5saW5lV2lkdGgpO1xuXG5cdFx0XHRcdFx0aWYoZHJhd0hvcml6b250YWxMaW5lKXtcblx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8oeFN0YXJ0LCBsaW5lUG9zaXRpb25ZKTtcblx0XHRcdFx0XHRcdGN0eC5saW5lVG8odGhpcy53aWR0aCwgbGluZVBvc2l0aW9uWSk7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xuXHRcdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IHRoaXMubGluZUNvbG9yO1xuXHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRjdHgubW92ZVRvKHhTdGFydCAtIDUsIGxpbmVQb3NpdGlvblkpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8oeFN0YXJ0LCBsaW5lUG9zaXRpb25ZKTtcblx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXG5cdFx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdFx0ZWFjaCh0aGlzLnhMYWJlbHMsZnVuY3Rpb24obGFiZWwsaW5kZXgpe1xuXHRcdFx0XHRcdHZhciB4UG9zID0gdGhpcy5jYWxjdWxhdGVYKGluZGV4KSArIGFsaWFzUGl4ZWwodGhpcy5saW5lV2lkdGgpLFxuXHRcdFx0XHRcdFx0Ly8gQ2hlY2sgdG8gc2VlIGlmIGxpbmUvYmFyIGhlcmUgYW5kIGRlY2lkZSB3aGVyZSB0byBwbGFjZSB0aGUgbGluZVxuXHRcdFx0XHRcdFx0bGluZVBvcyA9IHRoaXMuY2FsY3VsYXRlWChpbmRleCAtICh0aGlzLm9mZnNldEdyaWRMaW5lcyA/IDAuNSA6IDApKSArIGFsaWFzUGl4ZWwodGhpcy5saW5lV2lkdGgpLFxuXHRcdFx0XHRcdFx0aXNSb3RhdGVkID0gKHRoaXMueExhYmVsUm90YXRpb24gPiAwKSxcblx0XHRcdFx0XHRcdGRyYXdWZXJ0aWNhbExpbmUgPSB0aGlzLnNob3dWZXJ0aWNhbExpbmVzO1xuXG5cdFx0XHRcdFx0Ly8gVGhpcyBpcyBZIGF4aXMsIHNvIGRyYXcgaXRcblx0XHRcdFx0XHRpZiAoaW5kZXggPT09IDAgJiYgIWRyYXdWZXJ0aWNhbExpbmUpe1xuXHRcdFx0XHRcdFx0ZHJhd1ZlcnRpY2FsTGluZSA9IHRydWU7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0aWYgKGRyYXdWZXJ0aWNhbExpbmUpe1xuXHRcdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdGlmIChpbmRleCA+IDApe1xuXHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyBhIGdyaWQgbGluZSBpbiB0aGUgY2VudHJlLCBzbyBkcm9wIHRoYXRcblx0XHRcdFx0XHRcdGN0eC5saW5lV2lkdGggPSB0aGlzLmdyaWRMaW5lV2lkdGg7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmdyaWRMaW5lQ29sb3I7XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdC8vIFRoaXMgaXMgdGhlIGZpcnN0IGxpbmUgb24gdGhlIHNjYWxlXG5cdFx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmxpbmVDb2xvcjtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRpZiAoZHJhd1ZlcnRpY2FsTGluZSl7XG5cdFx0XHRcdFx0XHRjdHgubW92ZVRvKGxpbmVQb3MsdGhpcy5lbmRQb2ludCk7XG5cdFx0XHRcdFx0XHRjdHgubGluZVRvKGxpbmVQb3MsdGhpcy5zdGFydFBvaW50IC0gMyk7XG5cdFx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cdFx0XHRcdFx0fVxuXG5cblx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5saW5lV2lkdGg7XG5cdFx0XHRcdFx0Y3R4LnN0cm9rZVN0eWxlID0gdGhpcy5saW5lQ29sb3I7XG5cblxuXHRcdFx0XHRcdC8vIFNtYWxsIGxpbmVzIGF0IHRoZSBib3R0b20gb2YgdGhlIGJhc2UgZ3JpZCBsaW5lXG5cdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5tb3ZlVG8obGluZVBvcyx0aGlzLmVuZFBvaW50KTtcblx0XHRcdFx0XHRjdHgubGluZVRvKGxpbmVQb3MsdGhpcy5lbmRQb2ludCArIDUpO1xuXHRcdFx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHRcdFx0XHRjdHguY2xvc2VQYXRoKCk7XG5cblx0XHRcdFx0XHRjdHguc2F2ZSgpO1xuXHRcdFx0XHRcdGN0eC50cmFuc2xhdGUoeFBvcywoaXNSb3RhdGVkKSA/IHRoaXMuZW5kUG9pbnQgKyAxMiA6IHRoaXMuZW5kUG9pbnQgKyA4KTtcblx0XHRcdFx0XHRjdHgucm90YXRlKHRvUmFkaWFucyh0aGlzLnhMYWJlbFJvdGF0aW9uKSotMSk7XG5cdFx0XHRcdFx0Y3R4LmZvbnQgPSB0aGlzLmZvbnQ7XG5cdFx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IChpc1JvdGF0ZWQpID8gXCJyaWdodFwiIDogXCJjZW50ZXJcIjtcblx0XHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gKGlzUm90YXRlZCkgPyBcIm1pZGRsZVwiIDogXCJ0b3BcIjtcblx0XHRcdFx0XHRjdHguZmlsbFRleHQobGFiZWwsIDAsIDApO1xuXHRcdFx0XHRcdGN0eC5yZXN0b3JlKCk7XG5cdFx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdH1cblx0XHR9XG5cblx0fSk7XG5cblx0Q2hhcnQuUmFkaWFsU2NhbGUgPSBDaGFydC5FbGVtZW50LmV4dGVuZCh7XG5cdFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2l6ZSA9IG1pbihbdGhpcy5oZWlnaHQsIHRoaXMud2lkdGhdKTtcblx0XHRcdHRoaXMuZHJhd2luZ0FyZWEgPSAodGhpcy5kaXNwbGF5KSA/ICh0aGlzLnNpemUvMikgLSAodGhpcy5mb250U2l6ZS8yICsgdGhpcy5iYWNrZHJvcFBhZGRpbmdZKSA6ICh0aGlzLnNpemUvMik7XG5cdFx0fSxcblx0XHRjYWxjdWxhdGVDZW50ZXJPZmZzZXQ6IGZ1bmN0aW9uKHZhbHVlKXtcblx0XHRcdC8vIFRha2UgaW50byBhY2NvdW50IGhhbGYgZm9udCBzaXplICsgdGhlIHlQYWRkaW5nIG9mIHRoZSB0b3AgdmFsdWVcblx0XHRcdHZhciBzY2FsaW5nRmFjdG9yID0gdGhpcy5kcmF3aW5nQXJlYSAvICh0aGlzLm1heCAtIHRoaXMubWluKTtcblxuXHRcdFx0cmV0dXJuICh2YWx1ZSAtIHRoaXMubWluKSAqIHNjYWxpbmdGYWN0b3I7XG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbigpe1xuXHRcdFx0aWYgKCF0aGlzLmxpbmVBcmMpe1xuXHRcdFx0XHR0aGlzLnNldFNjYWxlU2l6ZSgpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0dGhpcy5kcmF3aW5nQXJlYSA9ICh0aGlzLmRpc3BsYXkpID8gKHRoaXMuc2l6ZS8yKSAtICh0aGlzLmZvbnRTaXplLzIgKyB0aGlzLmJhY2tkcm9wUGFkZGluZ1kpIDogKHRoaXMuc2l6ZS8yKTtcblx0XHRcdH1cblx0XHRcdHRoaXMuYnVpbGRZTGFiZWxzKCk7XG5cdFx0fSxcblx0XHRidWlsZFlMYWJlbHM6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnlMYWJlbHMgPSBbXTtcblxuXHRcdFx0dmFyIHN0ZXBEZWNpbWFsUGxhY2VzID0gZ2V0RGVjaW1hbFBsYWNlcyh0aGlzLnN0ZXBWYWx1ZSk7XG5cblx0XHRcdGZvciAodmFyIGk9MDsgaTw9dGhpcy5zdGVwczsgaSsrKXtcblx0XHRcdFx0dGhpcy55TGFiZWxzLnB1c2godGVtcGxhdGUodGhpcy50ZW1wbGF0ZVN0cmluZyx7dmFsdWU6KHRoaXMubWluICsgKGkgKiB0aGlzLnN0ZXBWYWx1ZSkpLnRvRml4ZWQoc3RlcERlY2ltYWxQbGFjZXMpfSkpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Z2V0Q2lyY3VtZmVyZW5jZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRyZXR1cm4gKChNYXRoLlBJKjIpIC8gdGhpcy52YWx1ZXNDb3VudCk7XG5cdFx0fSxcblx0XHRzZXRTY2FsZVNpemU6IGZ1bmN0aW9uKCl7XG5cdFx0XHQvKlxuXHRcdFx0ICogUmlnaHQsIHRoaXMgaXMgcmVhbGx5IGNvbmZ1c2luZyBhbmQgdGhlcmUgaXMgYSBsb3Qgb2YgbWF0aHMgZ29pbmcgb24gaGVyZVxuXHRcdFx0ICogVGhlIGdpc3Qgb2YgdGhlIHByb2JsZW0gaXMgaGVyZTogaHR0cHM6Ly9naXN0LmdpdGh1Yi5jb20vbm5uaWNrLzY5NmNjOWM1NWY0YjBiZWI4ZmU5XG5cdFx0XHQgKlxuXHRcdFx0ICogUmVhY3Rpb246IGh0dHBzOi8vZGwuZHJvcGJveHVzZXJjb250ZW50LmNvbS91LzM0NjAxMzYzL3Rvb211Y2hzY2llbmNlLmdpZlxuXHRcdFx0ICpcblx0XHRcdCAqIFNvbHV0aW9uOlxuXHRcdFx0ICpcblx0XHRcdCAqIFdlIGFzc3VtZSB0aGUgcmFkaXVzIG9mIHRoZSBwb2x5Z29uIGlzIGhhbGYgdGhlIHNpemUgb2YgdGhlIGNhbnZhcyBhdCBmaXJzdFxuXHRcdFx0ICogYXQgZWFjaCBpbmRleCB3ZSBjaGVjayBpZiB0aGUgdGV4dCBvdmVybGFwcy5cblx0XHRcdCAqXG5cdFx0XHQgKiBXaGVyZSBpdCBkb2VzLCB3ZSBzdG9yZSB0aGF0IGFuZ2xlIGFuZCB0aGF0IGluZGV4LlxuXHRcdFx0ICpcblx0XHRcdCAqIEFmdGVyIGZpbmRpbmcgdGhlIGxhcmdlc3QgaW5kZXggYW5kIGFuZ2xlIHdlIGNhbGN1bGF0ZSBob3cgbXVjaCB3ZSBuZWVkIHRvIHJlbW92ZVxuXHRcdFx0ICogZnJvbSB0aGUgc2hhcGUgcmFkaXVzIHRvIG1vdmUgdGhlIHBvaW50IGlud2FyZHMgYnkgdGhhdCB4LlxuXHRcdFx0ICpcblx0XHRcdCAqIFdlIGF2ZXJhZ2UgdGhlIGxlZnQgYW5kIHJpZ2h0IGRpc3RhbmNlcyB0byBnZXQgdGhlIG1heGltdW0gc2hhcGUgcmFkaXVzIHRoYXQgY2FuIGZpdCBpbiB0aGUgYm94XG5cdFx0XHQgKiBhbG9uZyB3aXRoIGxhYmVscy5cblx0XHRcdCAqXG5cdFx0XHQgKiBPbmNlIHdlIGhhdmUgdGhhdCwgd2UgY2FuIGZpbmQgdGhlIGNlbnRyZSBwb2ludCBmb3IgdGhlIGNoYXJ0LCBieSB0YWtpbmcgdGhlIHggdGV4dCBwcm90cnVzaW9uXG5cdFx0XHQgKiBvbiBlYWNoIHNpZGUsIHJlbW92aW5nIHRoYXQgZnJvbSB0aGUgc2l6ZSwgaGFsdmluZyBpdCBhbmQgYWRkaW5nIHRoZSBsZWZ0IHggcHJvdHJ1c2lvbiB3aWR0aC5cblx0XHRcdCAqXG5cdFx0XHQgKiBUaGlzIHdpbGwgbWVhbiB3ZSBoYXZlIGEgc2hhcGUgZml0dGVkIHRvIHRoZSBjYW52YXMsIGFzIGxhcmdlIGFzIGl0IGNhbiBiZSB3aXRoIHRoZSBsYWJlbHNcblx0XHRcdCAqIGFuZCBwb3NpdGlvbiBpdCBpbiB0aGUgbW9zdCBzcGFjZSBlZmZpY2llbnQgbWFubmVyXG5cdFx0XHQgKlxuXHRcdFx0ICogaHR0cHM6Ly9kbC5kcm9wYm94dXNlcmNvbnRlbnQuY29tL3UvMzQ2MDEzNjMveWVhaHNjaWVuY2UuZ2lmXG5cdFx0XHQgKi9cblxuXG5cdFx0XHQvLyBHZXQgbWF4aW11bSByYWRpdXMgb2YgdGhlIHBvbHlnb24uIEVpdGhlciBoYWxmIHRoZSBoZWlnaHQgKG1pbnVzIHRoZSB0ZXh0IHdpZHRoKSBvciBoYWxmIHRoZSB3aWR0aC5cblx0XHRcdC8vIFVzZSB0aGlzIHRvIGNhbGN1bGF0ZSB0aGUgb2Zmc2V0ICsgY2hhbmdlLiAtIE1ha2Ugc3VyZSBML1IgcHJvdHJ1c2lvbiBpcyBhdCBsZWFzdCAwIHRvIHN0b3AgaXNzdWVzIHdpdGggY2VudHJlIHBvaW50c1xuXHRcdFx0dmFyIGxhcmdlc3RQb3NzaWJsZVJhZGl1cyA9IG1pbihbKHRoaXMuaGVpZ2h0LzIgLSB0aGlzLnBvaW50TGFiZWxGb250U2l6ZSAtIDUpLCB0aGlzLndpZHRoLzJdKSxcblx0XHRcdFx0cG9pbnRQb3NpdGlvbixcblx0XHRcdFx0aSxcblx0XHRcdFx0dGV4dFdpZHRoLFxuXHRcdFx0XHRoYWxmVGV4dFdpZHRoLFxuXHRcdFx0XHRmdXJ0aGVzdFJpZ2h0ID0gdGhpcy53aWR0aCxcblx0XHRcdFx0ZnVydGhlc3RSaWdodEluZGV4LFxuXHRcdFx0XHRmdXJ0aGVzdFJpZ2h0QW5nbGUsXG5cdFx0XHRcdGZ1cnRoZXN0TGVmdCA9IDAsXG5cdFx0XHRcdGZ1cnRoZXN0TGVmdEluZGV4LFxuXHRcdFx0XHRmdXJ0aGVzdExlZnRBbmdsZSxcblx0XHRcdFx0eFByb3RydXNpb25MZWZ0LFxuXHRcdFx0XHR4UHJvdHJ1c2lvblJpZ2h0LFxuXHRcdFx0XHRyYWRpdXNSZWR1Y3Rpb25SaWdodCxcblx0XHRcdFx0cmFkaXVzUmVkdWN0aW9uTGVmdCxcblx0XHRcdFx0bWF4V2lkdGhSYWRpdXM7XG5cdFx0XHR0aGlzLmN0eC5mb250ID0gZm9udFN0cmluZyh0aGlzLnBvaW50TGFiZWxGb250U2l6ZSx0aGlzLnBvaW50TGFiZWxGb250U3R5bGUsdGhpcy5wb2ludExhYmVsRm9udEZhbWlseSk7XG5cdFx0XHRmb3IgKGk9MDtpPHRoaXMudmFsdWVzQ291bnQ7aSsrKXtcblx0XHRcdFx0Ly8gNXB4IHRvIHNwYWNlIHRoZSB0ZXh0IHNsaWdodGx5IG91dCAtIHNpbWlsYXIgdG8gd2hhdCB3ZSBkbyBpbiB0aGUgZHJhdyBmdW5jdGlvbi5cblx0XHRcdFx0cG9pbnRQb3NpdGlvbiA9IHRoaXMuZ2V0UG9pbnRQb3NpdGlvbihpLCBsYXJnZXN0UG9zc2libGVSYWRpdXMpO1xuXHRcdFx0XHR0ZXh0V2lkdGggPSB0aGlzLmN0eC5tZWFzdXJlVGV4dCh0ZW1wbGF0ZSh0aGlzLnRlbXBsYXRlU3RyaW5nLCB7IHZhbHVlOiB0aGlzLmxhYmVsc1tpXSB9KSkud2lkdGggKyA1O1xuXHRcdFx0XHRpZiAoaSA9PT0gMCB8fCBpID09PSB0aGlzLnZhbHVlc0NvdW50LzIpe1xuXHRcdFx0XHRcdC8vIElmIHdlJ3JlIGF0IGluZGV4IHplcm8sIG9yIGV4YWN0bHkgdGhlIG1pZGRsZSwgd2UncmUgYXQgZXhhY3RseSB0aGUgdG9wL2JvdHRvbVxuXHRcdFx0XHRcdC8vIG9mIHRoZSByYWRhciBjaGFydCwgc28gdGV4dCB3aWxsIGJlIGFsaWduZWQgY2VudHJhbGx5LCBzbyB3ZSdsbCBoYWxmIGl0IGFuZCBjb21wYXJlXG5cdFx0XHRcdFx0Ly8gdy9sZWZ0IGFuZCByaWdodCB0ZXh0IHNpemVzXG5cdFx0XHRcdFx0aGFsZlRleHRXaWR0aCA9IHRleHRXaWR0aC8yO1xuXHRcdFx0XHRcdGlmIChwb2ludFBvc2l0aW9uLnggKyBoYWxmVGV4dFdpZHRoID4gZnVydGhlc3RSaWdodCkge1xuXHRcdFx0XHRcdFx0ZnVydGhlc3RSaWdodCA9IHBvaW50UG9zaXRpb24ueCArIGhhbGZUZXh0V2lkdGg7XG5cdFx0XHRcdFx0XHRmdXJ0aGVzdFJpZ2h0SW5kZXggPSBpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAocG9pbnRQb3NpdGlvbi54IC0gaGFsZlRleHRXaWR0aCA8IGZ1cnRoZXN0TGVmdCkge1xuXHRcdFx0XHRcdFx0ZnVydGhlc3RMZWZ0ID0gcG9pbnRQb3NpdGlvbi54IC0gaGFsZlRleHRXaWR0aDtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0TGVmdEluZGV4ID0gaTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoaSA8IHRoaXMudmFsdWVzQ291bnQvMikge1xuXHRcdFx0XHRcdC8vIExlc3MgdGhhbiBoYWxmIHRoZSB2YWx1ZXMgbWVhbnMgd2UnbGwgbGVmdCBhbGlnbiB0aGUgdGV4dFxuXHRcdFx0XHRcdGlmIChwb2ludFBvc2l0aW9uLnggKyB0ZXh0V2lkdGggPiBmdXJ0aGVzdFJpZ2h0KSB7XG5cdFx0XHRcdFx0XHRmdXJ0aGVzdFJpZ2h0ID0gcG9pbnRQb3NpdGlvbi54ICsgdGV4dFdpZHRoO1xuXHRcdFx0XHRcdFx0ZnVydGhlc3RSaWdodEluZGV4ID0gaTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZSBpZiAoaSA+IHRoaXMudmFsdWVzQ291bnQvMil7XG5cdFx0XHRcdFx0Ly8gTW9yZSB0aGFuIGhhbGYgdGhlIHZhbHVlcyBtZWFucyB3ZSdsbCByaWdodCBhbGlnbiB0aGUgdGV4dFxuXHRcdFx0XHRcdGlmIChwb2ludFBvc2l0aW9uLnggLSB0ZXh0V2lkdGggPCBmdXJ0aGVzdExlZnQpIHtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0TGVmdCA9IHBvaW50UG9zaXRpb24ueCAtIHRleHRXaWR0aDtcblx0XHRcdFx0XHRcdGZ1cnRoZXN0TGVmdEluZGV4ID0gaTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0eFByb3RydXNpb25MZWZ0ID0gZnVydGhlc3RMZWZ0O1xuXG5cdFx0XHR4UHJvdHJ1c2lvblJpZ2h0ID0gTWF0aC5jZWlsKGZ1cnRoZXN0UmlnaHQgLSB0aGlzLndpZHRoKTtcblxuXHRcdFx0ZnVydGhlc3RSaWdodEFuZ2xlID0gdGhpcy5nZXRJbmRleEFuZ2xlKGZ1cnRoZXN0UmlnaHRJbmRleCk7XG5cblx0XHRcdGZ1cnRoZXN0TGVmdEFuZ2xlID0gdGhpcy5nZXRJbmRleEFuZ2xlKGZ1cnRoZXN0TGVmdEluZGV4KTtcblxuXHRcdFx0cmFkaXVzUmVkdWN0aW9uUmlnaHQgPSB4UHJvdHJ1c2lvblJpZ2h0IC8gTWF0aC5zaW4oZnVydGhlc3RSaWdodEFuZ2xlICsgTWF0aC5QSS8yKTtcblxuXHRcdFx0cmFkaXVzUmVkdWN0aW9uTGVmdCA9IHhQcm90cnVzaW9uTGVmdCAvIE1hdGguc2luKGZ1cnRoZXN0TGVmdEFuZ2xlICsgTWF0aC5QSS8yKTtcblxuXHRcdFx0Ly8gRW5zdXJlIHdlIGFjdHVhbGx5IG5lZWQgdG8gcmVkdWNlIHRoZSBzaXplIG9mIHRoZSBjaGFydFxuXHRcdFx0cmFkaXVzUmVkdWN0aW9uUmlnaHQgPSAoaXNOdW1iZXIocmFkaXVzUmVkdWN0aW9uUmlnaHQpKSA/IHJhZGl1c1JlZHVjdGlvblJpZ2h0IDogMDtcblx0XHRcdHJhZGl1c1JlZHVjdGlvbkxlZnQgPSAoaXNOdW1iZXIocmFkaXVzUmVkdWN0aW9uTGVmdCkpID8gcmFkaXVzUmVkdWN0aW9uTGVmdCA6IDA7XG5cblx0XHRcdHRoaXMuZHJhd2luZ0FyZWEgPSBsYXJnZXN0UG9zc2libGVSYWRpdXMgLSAocmFkaXVzUmVkdWN0aW9uTGVmdCArIHJhZGl1c1JlZHVjdGlvblJpZ2h0KS8yO1xuXG5cdFx0XHQvL3RoaXMuZHJhd2luZ0FyZWEgPSBtaW4oW21heFdpZHRoUmFkaXVzLCAodGhpcy5oZWlnaHQgLSAoMiAqICh0aGlzLnBvaW50TGFiZWxGb250U2l6ZSArIDUpKSkvMl0pXG5cdFx0XHR0aGlzLnNldENlbnRlclBvaW50KHJhZGl1c1JlZHVjdGlvbkxlZnQsIHJhZGl1c1JlZHVjdGlvblJpZ2h0KTtcblxuXHRcdH0sXG5cdFx0c2V0Q2VudGVyUG9pbnQ6IGZ1bmN0aW9uKGxlZnRNb3ZlbWVudCwgcmlnaHRNb3ZlbWVudCl7XG5cblx0XHRcdHZhciBtYXhSaWdodCA9IHRoaXMud2lkdGggLSByaWdodE1vdmVtZW50IC0gdGhpcy5kcmF3aW5nQXJlYSxcblx0XHRcdFx0bWF4TGVmdCA9IGxlZnRNb3ZlbWVudCArIHRoaXMuZHJhd2luZ0FyZWE7XG5cblx0XHRcdHRoaXMueENlbnRlciA9IChtYXhMZWZ0ICsgbWF4UmlnaHQpLzI7XG5cdFx0XHQvLyBBbHdheXMgdmVydGljYWxseSBpbiB0aGUgY2VudHJlIGFzIHRoZSB0ZXh0IGhlaWdodCBkb2Vzbid0IGNoYW5nZVxuXHRcdFx0dGhpcy55Q2VudGVyID0gKHRoaXMuaGVpZ2h0LzIpO1xuXHRcdH0sXG5cblx0XHRnZXRJbmRleEFuZ2xlIDogZnVuY3Rpb24oaW5kZXgpe1xuXHRcdFx0dmFyIGFuZ2xlTXVsdGlwbGllciA9IChNYXRoLlBJICogMikgLyB0aGlzLnZhbHVlc0NvdW50O1xuXHRcdFx0Ly8gU3RhcnQgZnJvbSB0aGUgdG9wIGluc3RlYWQgb2YgcmlnaHQsIHNvIHJlbW92ZSBhIHF1YXJ0ZXIgb2YgdGhlIGNpcmNsZVxuXG5cdFx0XHRyZXR1cm4gaW5kZXggKiBhbmdsZU11bHRpcGxpZXIgLSAoTWF0aC5QSS8yKTtcblx0XHR9LFxuXHRcdGdldFBvaW50UG9zaXRpb24gOiBmdW5jdGlvbihpbmRleCwgZGlzdGFuY2VGcm9tQ2VudGVyKXtcblx0XHRcdHZhciB0aGlzQW5nbGUgPSB0aGlzLmdldEluZGV4QW5nbGUoaW5kZXgpO1xuXHRcdFx0cmV0dXJuIHtcblx0XHRcdFx0eCA6IChNYXRoLmNvcyh0aGlzQW5nbGUpICogZGlzdGFuY2VGcm9tQ2VudGVyKSArIHRoaXMueENlbnRlcixcblx0XHRcdFx0eSA6IChNYXRoLnNpbih0aGlzQW5nbGUpICogZGlzdGFuY2VGcm9tQ2VudGVyKSArIHRoaXMueUNlbnRlclxuXHRcdFx0fTtcblx0XHR9LFxuXHRcdGRyYXc6IGZ1bmN0aW9uKCl7XG5cdFx0XHRpZiAodGhpcy5kaXNwbGF5KXtcblx0XHRcdFx0dmFyIGN0eCA9IHRoaXMuY3R4O1xuXHRcdFx0XHRlYWNoKHRoaXMueUxhYmVscywgZnVuY3Rpb24obGFiZWwsIGluZGV4KXtcblx0XHRcdFx0XHQvLyBEb24ndCBkcmF3IGEgY2VudHJlIHZhbHVlXG5cdFx0XHRcdFx0aWYgKGluZGV4ID4gMCl7XG5cdFx0XHRcdFx0XHR2YXIgeUNlbnRlck9mZnNldCA9IGluZGV4ICogKHRoaXMuZHJhd2luZ0FyZWEvdGhpcy5zdGVwcyksXG5cdFx0XHRcdFx0XHRcdHlIZWlnaHQgPSB0aGlzLnlDZW50ZXIgLSB5Q2VudGVyT2Zmc2V0LFxuXHRcdFx0XHRcdFx0XHRwb2ludFBvc2l0aW9uO1xuXG5cdFx0XHRcdFx0XHQvLyBEcmF3IGNpcmN1bGFyIGxpbmVzIGFyb3VuZCB0aGUgc2NhbGVcblx0XHRcdFx0XHRcdGlmICh0aGlzLmxpbmVXaWR0aCA+IDApe1xuXHRcdFx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmxpbmVDb2xvcjtcblx0XHRcdFx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMubGluZVdpZHRoO1xuXG5cdFx0XHRcdFx0XHRcdGlmKHRoaXMubGluZUFyYyl7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5hcmModGhpcy54Q2VudGVyLCB0aGlzLnlDZW50ZXIsIHlDZW50ZXJPZmZzZXQsIDAsIE1hdGguUEkqMik7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHRcdFx0XHRcdFx0fSBlbHNle1xuXHRcdFx0XHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRcdFx0XHRmb3IgKHZhciBpPTA7aTx0aGlzLnZhbHVlc0NvdW50O2krKylcblx0XHRcdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdFx0XHRwb2ludFBvc2l0aW9uID0gdGhpcy5nZXRQb2ludFBvc2l0aW9uKGksIHRoaXMuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHRoaXMubWluICsgKGluZGV4ICogdGhpcy5zdGVwVmFsdWUpKSk7XG5cdFx0XHRcdFx0XHRcdFx0XHRpZiAoaSA9PT0gMCl7XG5cdFx0XHRcdFx0XHRcdFx0XHRcdGN0eC5tb3ZlVG8ocG9pbnRQb3NpdGlvbi54LCBwb2ludFBvc2l0aW9uLnkpO1xuXHRcdFx0XHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhwb2ludFBvc2l0aW9uLngsIHBvaW50UG9zaXRpb24ueSk7XG5cdFx0XHRcdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRcdGN0eC5jbG9zZVBhdGgoKTtcblx0XHRcdFx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGlmKHRoaXMuc2hvd0xhYmVscyl7XG5cdFx0XHRcdFx0XHRcdGN0eC5mb250ID0gZm9udFN0cmluZyh0aGlzLmZvbnRTaXplLHRoaXMuZm9udFN0eWxlLHRoaXMuZm9udEZhbWlseSk7XG5cdFx0XHRcdFx0XHRcdGlmICh0aGlzLnNob3dMYWJlbEJhY2tkcm9wKXtcblx0XHRcdFx0XHRcdFx0XHR2YXIgbGFiZWxXaWR0aCA9IGN0eC5tZWFzdXJlVGV4dChsYWJlbCkud2lkdGg7XG5cdFx0XHRcdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuYmFja2Ryb3BDb2xvcjtcblx0XHRcdFx0XHRcdFx0XHRjdHguZmlsbFJlY3QoXG5cdFx0XHRcdFx0XHRcdFx0XHR0aGlzLnhDZW50ZXIgLSBsYWJlbFdpZHRoLzIgLSB0aGlzLmJhY2tkcm9wUGFkZGluZ1gsXG5cdFx0XHRcdFx0XHRcdFx0XHR5SGVpZ2h0IC0gdGhpcy5mb250U2l6ZS8yIC0gdGhpcy5iYWNrZHJvcFBhZGRpbmdZLFxuXHRcdFx0XHRcdFx0XHRcdFx0bGFiZWxXaWR0aCArIHRoaXMuYmFja2Ryb3BQYWRkaW5nWCoyLFxuXHRcdFx0XHRcdFx0XHRcdFx0dGhpcy5mb250U2l6ZSArIHRoaXMuYmFja2Ryb3BQYWRkaW5nWSoyXG5cdFx0XHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEFsaWduID0gJ2NlbnRlcic7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSBcIm1pZGRsZVwiO1xuXHRcdFx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gdGhpcy5mb250Q29sb3I7XG5cdFx0XHRcdFx0XHRcdGN0eC5maWxsVGV4dChsYWJlbCwgdGhpcy54Q2VudGVyLCB5SGVpZ2h0KTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sIHRoaXMpO1xuXG5cdFx0XHRcdGlmICghdGhpcy5saW5lQXJjKXtcblx0XHRcdFx0XHRjdHgubGluZVdpZHRoID0gdGhpcy5hbmdsZUxpbmVXaWR0aDtcblx0XHRcdFx0XHRjdHguc3Ryb2tlU3R5bGUgPSB0aGlzLmFuZ2xlTGluZUNvbG9yO1xuXHRcdFx0XHRcdGZvciAodmFyIGkgPSB0aGlzLnZhbHVlc0NvdW50IC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0XHRcdFx0XHRcdHZhciBjZW50ZXJPZmZzZXQgPSBudWxsLCBvdXRlclBvc2l0aW9uID0gbnVsbDtcblxuXHRcdFx0XHRcdFx0aWYgKHRoaXMuYW5nbGVMaW5lV2lkdGggPiAwICYmIChpICUgdGhpcy5hbmdsZUxpbmVJbnRlcnZhbCA9PT0gMCkpe1xuXHRcdFx0XHRcdFx0XHRjZW50ZXJPZmZzZXQgPSB0aGlzLmNhbGN1bGF0ZUNlbnRlck9mZnNldCh0aGlzLm1heCk7XG5cdFx0XHRcdFx0XHRcdG91dGVyUG9zaXRpb24gPSB0aGlzLmdldFBvaW50UG9zaXRpb24oaSwgY2VudGVyT2Zmc2V0KTtcblx0XHRcdFx0XHRcdFx0Y3R4LmJlZ2luUGF0aCgpO1xuXHRcdFx0XHRcdFx0XHRjdHgubW92ZVRvKHRoaXMueENlbnRlciwgdGhpcy55Q2VudGVyKTtcblx0XHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhvdXRlclBvc2l0aW9uLngsIG91dGVyUG9zaXRpb24ueSk7XG5cdFx0XHRcdFx0XHRcdGN0eC5zdHJva2UoKTtcblx0XHRcdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0XHRpZiAodGhpcy5iYWNrZ3JvdW5kQ29sb3JzICYmIHRoaXMuYmFja2dyb3VuZENvbG9ycy5sZW5ndGggPT0gdGhpcy52YWx1ZXNDb3VudCkge1xuXHRcdFx0XHRcdFx0XHRpZiAoY2VudGVyT2Zmc2V0ID09IG51bGwpXG5cdFx0XHRcdFx0XHRcdFx0Y2VudGVyT2Zmc2V0ID0gdGhpcy5jYWxjdWxhdGVDZW50ZXJPZmZzZXQodGhpcy5tYXgpO1xuXG5cdFx0XHRcdFx0XHRcdGlmIChvdXRlclBvc2l0aW9uID09IG51bGwpXG5cdFx0XHRcdFx0XHRcdFx0b3V0ZXJQb3NpdGlvbiA9IHRoaXMuZ2V0UG9pbnRQb3NpdGlvbihpLCBjZW50ZXJPZmZzZXQpO1xuXG5cdFx0XHRcdFx0XHRcdHZhciBwcmV2aW91c091dGVyUG9zaXRpb24gPSB0aGlzLmdldFBvaW50UG9zaXRpb24oaSA9PT0gMCA/IHRoaXMudmFsdWVzQ291bnQgLSAxIDogaSAtIDEsIGNlbnRlck9mZnNldCk7XG5cdFx0XHRcdFx0XHRcdHZhciBuZXh0T3V0ZXJQb3NpdGlvbiA9IHRoaXMuZ2V0UG9pbnRQb3NpdGlvbihpID09PSB0aGlzLnZhbHVlc0NvdW50IC0gMSA/IDAgOiBpICsgMSwgY2VudGVyT2Zmc2V0KTtcblxuXHRcdFx0XHRcdFx0XHR2YXIgcHJldmlvdXNPdXRlckhhbGZ3YXkgPSB7IHg6IChwcmV2aW91c091dGVyUG9zaXRpb24ueCArIG91dGVyUG9zaXRpb24ueCkgLyAyLCB5OiAocHJldmlvdXNPdXRlclBvc2l0aW9uLnkgKyBvdXRlclBvc2l0aW9uLnkpIC8gMiB9O1xuXHRcdFx0XHRcdFx0XHR2YXIgbmV4dE91dGVySGFsZndheSA9IHsgeDogKG91dGVyUG9zaXRpb24ueCArIG5leHRPdXRlclBvc2l0aW9uLngpIC8gMiwgeTogKG91dGVyUG9zaXRpb24ueSArIG5leHRPdXRlclBvc2l0aW9uLnkpIC8gMiB9O1xuXG5cdFx0XHRcdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0XHRcdFx0Y3R4Lm1vdmVUbyh0aGlzLnhDZW50ZXIsIHRoaXMueUNlbnRlcik7XG5cdFx0XHRcdFx0XHRcdGN0eC5saW5lVG8ocHJldmlvdXNPdXRlckhhbGZ3YXkueCwgcHJldmlvdXNPdXRlckhhbGZ3YXkueSk7XG5cdFx0XHRcdFx0XHRcdGN0eC5saW5lVG8ob3V0ZXJQb3NpdGlvbi54LCBvdXRlclBvc2l0aW9uLnkpO1xuXHRcdFx0XHRcdFx0XHRjdHgubGluZVRvKG5leHRPdXRlckhhbGZ3YXkueCwgbmV4dE91dGVySGFsZndheS55KTtcblx0XHRcdFx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHRoaXMuYmFja2dyb3VuZENvbG9yc1tpXTtcblx0XHRcdFx0XHRcdFx0Y3R4LmZpbGwoKTtcblx0XHRcdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0Ly8gRXh0cmEgM3B4IG91dCBmb3Igc29tZSBsYWJlbCBzcGFjaW5nXG5cdFx0XHRcdFx0XHR2YXIgcG9pbnRMYWJlbFBvc2l0aW9uID0gdGhpcy5nZXRQb2ludFBvc2l0aW9uKGksIHRoaXMuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHRoaXMubWF4KSArIDUpO1xuXHRcdFx0XHRcdFx0Y3R4LmZvbnQgPSBmb250U3RyaW5nKHRoaXMucG9pbnRMYWJlbEZvbnRTaXplLHRoaXMucG9pbnRMYWJlbEZvbnRTdHlsZSx0aGlzLnBvaW50TGFiZWxGb250RmFtaWx5KTtcblx0XHRcdFx0XHRcdGN0eC5maWxsU3R5bGUgPSB0aGlzLnBvaW50TGFiZWxGb250Q29sb3I7XG5cblx0XHRcdFx0XHRcdHZhciBsYWJlbHNDb3VudCA9IHRoaXMubGFiZWxzLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0aGFsZkxhYmVsc0NvdW50ID0gdGhpcy5sYWJlbHMubGVuZ3RoLzIsXG5cdFx0XHRcdFx0XHRcdHF1YXJ0ZXJMYWJlbHNDb3VudCA9IGhhbGZMYWJlbHNDb3VudC8yLFxuXHRcdFx0XHRcdFx0XHR1cHBlckhhbGYgPSAoaSA8IHF1YXJ0ZXJMYWJlbHNDb3VudCB8fCBpID4gbGFiZWxzQ291bnQgLSBxdWFydGVyTGFiZWxzQ291bnQpLFxuXHRcdFx0XHRcdFx0XHRleGFjdFF1YXJ0ZXIgPSAoaSA9PT0gcXVhcnRlckxhYmVsc0NvdW50IHx8IGkgPT09IGxhYmVsc0NvdW50IC0gcXVhcnRlckxhYmVsc0NvdW50KTtcblx0XHRcdFx0XHRcdGlmIChpID09PSAwKXtcblx0XHRcdFx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9ICdjZW50ZXInO1xuXHRcdFx0XHRcdFx0fSBlbHNlIGlmKGkgPT09IGhhbGZMYWJlbHNDb3VudCl7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSAnY2VudGVyJztcblx0XHRcdFx0XHRcdH0gZWxzZSBpZiAoaSA8IGhhbGZMYWJlbHNDb3VudCl7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QWxpZ24gPSAnbGVmdCc7XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEFsaWduID0gJ3JpZ2h0Jztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Ly8gU2V0IHRoZSBjb3JyZWN0IHRleHQgYmFzZWxpbmUgYmFzZWQgb24gb3V0ZXIgcG9zaXRpb25pbmdcblx0XHRcdFx0XHRcdGlmIChleGFjdFF1YXJ0ZXIpe1xuXHRcdFx0XHRcdFx0XHRjdHgudGV4dEJhc2VsaW5lID0gJ21pZGRsZSc7XG5cdFx0XHRcdFx0XHR9IGVsc2UgaWYgKHVwcGVySGFsZil7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSAnYm90dG9tJztcblx0XHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGN0eC50ZXh0QmFzZWxpbmUgPSAndG9wJztcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdFx0Y3R4LmZpbGxUZXh0KHRoaXMubGFiZWxzW2ldLCBwb2ludExhYmVsUG9zaXRpb24ueCwgcG9pbnRMYWJlbFBvc2l0aW9uLnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQuYW5pbWF0aW9uU2VydmljZSA9IHtcblx0XHRmcmFtZUR1cmF0aW9uOiAxNyxcblx0XHRhbmltYXRpb25zOiBbXSxcblx0XHRkcm9wRnJhbWVzOiAwLFxuXHRcdGFkZEFuaW1hdGlvbjogZnVuY3Rpb24oY2hhcnRJbnN0YW5jZSwgYW5pbWF0aW9uT2JqZWN0KSB7XG5cdFx0XHRmb3IgKHZhciBpbmRleCA9IDA7IGluZGV4IDwgdGhpcy5hbmltYXRpb25zLmxlbmd0aDsgKysgaW5kZXgpe1xuXHRcdFx0XHRpZiAodGhpcy5hbmltYXRpb25zW2luZGV4XS5jaGFydEluc3RhbmNlID09PSBjaGFydEluc3RhbmNlKXtcblx0XHRcdFx0XHQvLyByZXBsYWNpbmcgYW4gaW4gcHJvZ3Jlc3MgYW5pbWF0aW9uXG5cdFx0XHRcdFx0dGhpcy5hbmltYXRpb25zW2luZGV4XS5hbmltYXRpb25PYmplY3QgPSBhbmltYXRpb25PYmplY3Q7XG5cdFx0XHRcdFx0cmV0dXJuO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0XHRcblx0XHRcdHRoaXMuYW5pbWF0aW9ucy5wdXNoKHtcblx0XHRcdFx0Y2hhcnRJbnN0YW5jZTogY2hhcnRJbnN0YW5jZSxcblx0XHRcdFx0YW5pbWF0aW9uT2JqZWN0OiBhbmltYXRpb25PYmplY3Rcblx0XHRcdH0pO1xuXG5cdFx0XHQvLyBJZiB0aGVyZSBhcmUgbm8gYW5pbWF0aW9ucyBxdWV1ZWQsIG1hbnVhbGx5IGtpY2tzdGFydCBhIGRpZ2VzdCwgZm9yIGxhY2sgb2YgYSBiZXR0ZXIgd29yZFxuXHRcdFx0aWYgKHRoaXMuYW5pbWF0aW9ucy5sZW5ndGggPT0gMSkge1xuXHRcdFx0XHRoZWxwZXJzLnJlcXVlc3RBbmltRnJhbWUuY2FsbCh3aW5kb3csIHRoaXMuZGlnZXN0V3JhcHBlcik7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBDYW5jZWwgdGhlIGFuaW1hdGlvbiBmb3IgYSBnaXZlbiBjaGFydCBpbnN0YW5jZVxuXHRcdGNhbmNlbEFuaW1hdGlvbjogZnVuY3Rpb24oY2hhcnRJbnN0YW5jZSkge1xuXHRcdFx0dmFyIGluZGV4ID0gaGVscGVycy5maW5kTmV4dFdoZXJlKHRoaXMuYW5pbWF0aW9ucywgZnVuY3Rpb24oYW5pbWF0aW9uV3JhcHBlcikge1xuXHRcdFx0XHRyZXR1cm4gYW5pbWF0aW9uV3JhcHBlci5jaGFydEluc3RhbmNlID09PSBjaGFydEluc3RhbmNlO1xuXHRcdFx0fSk7XG5cdFx0XHRcblx0XHRcdGlmIChpbmRleClcblx0XHRcdHtcblx0XHRcdFx0dGhpcy5hbmltYXRpb25zLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR9XG5cdFx0fSxcblx0XHQvLyBjYWxscyBzdGFydERpZ2VzdCB3aXRoIHRoZSBwcm9wZXIgY29udGV4dFxuXHRcdGRpZ2VzdFdyYXBwZXI6IGZ1bmN0aW9uKCkge1xuXHRcdFx0Q2hhcnQuYW5pbWF0aW9uU2VydmljZS5zdGFydERpZ2VzdC5jYWxsKENoYXJ0LmFuaW1hdGlvblNlcnZpY2UpO1xuXHRcdH0sXG5cdFx0c3RhcnREaWdlc3Q6IGZ1bmN0aW9uKCkge1xuXG5cdFx0XHR2YXIgc3RhcnRUaW1lID0gRGF0ZS5ub3coKTtcblx0XHRcdHZhciBmcmFtZXNUb0Ryb3AgPSAwO1xuXG5cdFx0XHRpZih0aGlzLmRyb3BGcmFtZXMgPiAxKXtcblx0XHRcdFx0ZnJhbWVzVG9Ecm9wID0gTWF0aC5mbG9vcih0aGlzLmRyb3BGcmFtZXMpO1xuXHRcdFx0XHR0aGlzLmRyb3BGcmFtZXMgLT0gZnJhbWVzVG9Ecm9wO1xuXHRcdFx0fVxuXG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuYW5pbWF0aW9ucy5sZW5ndGg7IGkrKykge1xuXG5cdFx0XHRcdGlmICh0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwID09PSBudWxsKXtcblx0XHRcdFx0XHR0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LmN1cnJlbnRTdGVwID0gMDtcblx0XHRcdFx0fVxuXG5cdFx0XHRcdHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QuY3VycmVudFN0ZXAgKz0gMSArIGZyYW1lc1RvRHJvcDtcblx0XHRcdFx0aWYodGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5jdXJyZW50U3RlcCA+IHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QubnVtU3RlcHMpe1xuXHRcdFx0XHRcdHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QuY3VycmVudFN0ZXAgPSB0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0Lm51bVN0ZXBzO1xuXHRcdFx0XHR9XG5cdFx0XHRcdFxuXHRcdFx0XHR0aGlzLmFuaW1hdGlvbnNbaV0uYW5pbWF0aW9uT2JqZWN0LnJlbmRlcih0aGlzLmFuaW1hdGlvbnNbaV0uY2hhcnRJbnN0YW5jZSwgdGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdCk7XG5cdFx0XHRcdFxuXHRcdFx0XHQvLyBDaGVjayBpZiBleGVjdXRlZCB0aGUgbGFzdCBmcmFtZS5cblx0XHRcdFx0aWYgKHRoaXMuYW5pbWF0aW9uc1tpXS5hbmltYXRpb25PYmplY3QuY3VycmVudFN0ZXAgPT0gdGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5udW1TdGVwcyl7XG5cdFx0XHRcdFx0Ly8gQ2FsbCBvbkFuaW1hdGlvbkNvbXBsZXRlXG5cdFx0XHRcdFx0dGhpcy5hbmltYXRpb25zW2ldLmFuaW1hdGlvbk9iamVjdC5vbkFuaW1hdGlvbkNvbXBsZXRlLmNhbGwodGhpcy5hbmltYXRpb25zW2ldLmNoYXJ0SW5zdGFuY2UpO1xuXHRcdFx0XHRcdC8vIFJlbW92ZSB0aGUgYW5pbWF0aW9uLlxuXHRcdFx0XHRcdHRoaXMuYW5pbWF0aW9ucy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdFx0Ly8gS2VlcCB0aGUgaW5kZXggaW4gcGxhY2UgdG8gb2Zmc2V0IHRoZSBzcGxpY2Vcblx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdH1cblx0XHRcdH1cblxuXHRcdFx0dmFyIGVuZFRpbWUgPSBEYXRlLm5vdygpO1xuXHRcdFx0dmFyIGRlbGF5ID0gZW5kVGltZSAtIHN0YXJ0VGltZSAtIHRoaXMuZnJhbWVEdXJhdGlvbjtcblx0XHRcdHZhciBmcmFtZURlbGF5ID0gZGVsYXkgLyB0aGlzLmZyYW1lRHVyYXRpb247XG5cblx0XHRcdGlmKGZyYW1lRGVsYXkgPiAxKXtcblx0XHRcdFx0dGhpcy5kcm9wRnJhbWVzICs9IGZyYW1lRGVsYXk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIERvIHdlIGhhdmUgbW9yZSBzdHVmZiB0byBhbmltYXRlP1xuXHRcdFx0aWYgKHRoaXMuYW5pbWF0aW9ucy5sZW5ndGggPiAwKXtcblx0XHRcdFx0aGVscGVycy5yZXF1ZXN0QW5pbUZyYW1lLmNhbGwod2luZG93LCB0aGlzLmRpZ2VzdFdyYXBwZXIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHQvLyBBdHRhY2ggZ2xvYmFsIGV2ZW50IHRvIHJlc2l6ZSBlYWNoIGNoYXJ0IGluc3RhbmNlIHdoZW4gdGhlIGJyb3dzZXIgcmVzaXplc1xuXHRoZWxwZXJzLmFkZEV2ZW50KHdpbmRvdywgXCJyZXNpemVcIiwgKGZ1bmN0aW9uKCl7XG5cdFx0Ly8gQmFzaWMgZGVib3VuY2Ugb2YgcmVzaXplIGZ1bmN0aW9uIHNvIGl0IGRvZXNuJ3QgaHVydCBwZXJmb3JtYW5jZSB3aGVuIHJlc2l6aW5nIGJyb3dzZXIuXG5cdFx0dmFyIHRpbWVvdXQ7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKCl7XG5cdFx0XHRjbGVhclRpbWVvdXQodGltZW91dCk7XG5cdFx0XHR0aW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRlYWNoKENoYXJ0Lmluc3RhbmNlcyxmdW5jdGlvbihpbnN0YW5jZSl7XG5cdFx0XHRcdFx0Ly8gSWYgdGhlIHJlc3BvbnNpdmUgZmxhZyBpcyBzZXQgaW4gdGhlIGNoYXJ0IGluc3RhbmNlIGNvbmZpZ1xuXHRcdFx0XHRcdC8vIENhc2NhZGUgdGhlIHJlc2l6ZSBldmVudCBkb3duIHRvIHRoZSBjaGFydC5cblx0XHRcdFx0XHRpZiAoaW5zdGFuY2Uub3B0aW9ucy5yZXNwb25zaXZlKXtcblx0XHRcdFx0XHRcdGluc3RhbmNlLnJlc2l6ZShpbnN0YW5jZS5yZW5kZXIsIHRydWUpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHR9LCA1MCk7XG5cdFx0fTtcblx0fSkoKSk7XG5cblxuXHRpZiAoYW1kKSB7XG5cdFx0ZGVmaW5lKCdDaGFydCcsIFtdLCBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuIENoYXJ0O1xuXHRcdH0pO1xuXHR9IGVsc2UgaWYgKHR5cGVvZiBtb2R1bGUgPT09ICdvYmplY3QnICYmIG1vZHVsZS5leHBvcnRzKSB7XG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBDaGFydDtcblx0fVxuXG5cdHJvb3QuQ2hhcnQgPSBDaGFydDtcblxuXHRDaGFydC5ub0NvbmZsaWN0ID0gZnVuY3Rpb24oKXtcblx0XHRyb290LkNoYXJ0ID0gcHJldmlvdXM7XG5cdFx0cmV0dXJuIENoYXJ0O1xuXHR9O1xuXG59KS5jYWxsKHRoaXMpO1xuXG4oZnVuY3Rpb24oKXtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJvb3QgPSB0aGlzLFxuXHRcdENoYXJ0ID0gcm9vdC5DaGFydCxcblx0XHRoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuXG5cdHZhciBkZWZhdWx0Q29uZmlnID0ge1xuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIHNjYWxlIHNob3VsZCBzdGFydCBhdCB6ZXJvLCBvciBhbiBvcmRlciBvZiBtYWduaXR1ZGUgZG93biBmcm9tIHRoZSBsb3dlc3QgdmFsdWVcblx0XHRzY2FsZUJlZ2luQXRaZXJvIDogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgZ3JpZCBsaW5lcyBhcmUgc2hvd24gYWNyb3NzIHRoZSBjaGFydFxuXHRcdHNjYWxlU2hvd0dyaWRMaW5lcyA6IHRydWUsXG5cblx0XHQvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgZ3JpZCBsaW5lc1xuXHRcdHNjYWxlR3JpZExpbmVDb2xvciA6IFwicmdiYSgwLDAsMCwuMDUpXCIsXG5cblx0XHQvL051bWJlciAtIFdpZHRoIG9mIHRoZSBncmlkIGxpbmVzXG5cdFx0c2NhbGVHcmlkTGluZVdpZHRoIDogMSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBob3Jpem9udGFsIGxpbmVzIChleGNlcHQgWCBheGlzKVxuXHRcdHNjYWxlU2hvd0hvcml6b250YWxMaW5lczogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyB2ZXJ0aWNhbCBsaW5lcyAoZXhjZXB0IFkgYXhpcylcblx0XHRzY2FsZVNob3dWZXJ0aWNhbExpbmVzOiB0cnVlLFxuXG5cdFx0Ly9Cb29sZWFuIC0gSWYgdGhlcmUgaXMgYSBzdHJva2Ugb24gZWFjaCBiYXJcblx0XHRiYXJTaG93U3Ryb2tlIDogdHJ1ZSxcblxuXHRcdC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGJhciBzdHJva2Vcblx0XHRiYXJTdHJva2VXaWR0aCA6IDIsXG5cblx0XHQvL051bWJlciAtIFNwYWNpbmcgYmV0d2VlbiBlYWNoIG9mIHRoZSBYIHZhbHVlIHNldHNcblx0XHRiYXJWYWx1ZVNwYWNpbmcgOiA1LFxuXG5cdFx0Ly9OdW1iZXIgLSBTcGFjaW5nIGJldHdlZW4gZGF0YSBzZXRzIHdpdGhpbiBYIHZhbHVlc1xuXHRcdGJhckRhdGFzZXRTcGFjaW5nIDogMSxcblxuXHRcdC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcblx0XHRsZWdlbmRUZW1wbGF0ZSA6IFwiPHVsIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmRcXFwiPjwlIGZvciAodmFyIGk9MDsgaTxkYXRhc2V0cy5sZW5ndGg7IGkrKyl7JT48bGk+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC1pY29uXFxcIiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjo8JT1kYXRhc2V0c1tpXS5maWxsQ29sb3IlPlxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtdGV4dFxcXCI+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L3NwYW4+PC9saT48JX0lPjwvdWw+XCJcblxuXHR9O1xuXG5cblx0Q2hhcnQuVHlwZS5leHRlbmQoe1xuXHRcdG5hbWU6IFwiQmFyXCIsXG5cdFx0ZGVmYXVsdHMgOiBkZWZhdWx0Q29uZmlnLFxuXHRcdGluaXRpYWxpemU6ICBmdW5jdGlvbihkYXRhKXtcblxuXHRcdFx0Ly9FeHBvc2Ugb3B0aW9ucyBhcyBhIHNjb3BlIHZhcmlhYmxlIGhlcmUgc28gd2UgY2FuIGFjY2VzcyBpdCBpbiB0aGUgU2NhbGVDbGFzc1xuXHRcdFx0dmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG5cblx0XHRcdHRoaXMuU2NhbGVDbGFzcyA9IENoYXJ0LlNjYWxlLmV4dGVuZCh7XG5cdFx0XHRcdG9mZnNldEdyaWRMaW5lcyA6IHRydWUsXG5cdFx0XHRcdGNhbGN1bGF0ZUJhclggOiBmdW5jdGlvbihkYXRhc2V0Q291bnQsIGRhdGFzZXRJbmRleCwgYmFySW5kZXgpe1xuXHRcdFx0XHRcdC8vUmV1c2FibGUgbWV0aG9kIGZvciBjYWxjdWxhdGluZyB0aGUgeFBvc2l0aW9uIG9mIGEgZ2l2ZW4gYmFyIGJhc2VkIG9uIGRhdGFzZXRJbmRleCAmIHdpZHRoIG9mIHRoZSBiYXJcblx0XHRcdFx0XHR2YXIgeFdpZHRoID0gdGhpcy5jYWxjdWxhdGVCYXNlV2lkdGgoKSxcblx0XHRcdFx0XHRcdHhBYnNvbHV0ZSA9IHRoaXMuY2FsY3VsYXRlWChiYXJJbmRleCkgLSAoeFdpZHRoLzIpLFxuXHRcdFx0XHRcdFx0YmFyV2lkdGggPSB0aGlzLmNhbGN1bGF0ZUJhcldpZHRoKGRhdGFzZXRDb3VudCk7XG5cblx0XHRcdFx0XHRyZXR1cm4geEFic29sdXRlICsgKGJhcldpZHRoICogZGF0YXNldEluZGV4KSArIChkYXRhc2V0SW5kZXggKiBvcHRpb25zLmJhckRhdGFzZXRTcGFjaW5nKSArIGJhcldpZHRoLzI7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNhbGN1bGF0ZUJhc2VXaWR0aCA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0cmV0dXJuICh0aGlzLmNhbGN1bGF0ZVgoMSkgLSB0aGlzLmNhbGN1bGF0ZVgoMCkpIC0gKDIqb3B0aW9ucy5iYXJWYWx1ZVNwYWNpbmcpO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjYWxjdWxhdGVCYXJXaWR0aCA6IGZ1bmN0aW9uKGRhdGFzZXRDb3VudCl7XG5cdFx0XHRcdFx0Ly9UaGUgcGFkZGluZyBiZXR3ZWVuIGRhdGFzZXRzIGlzIHRvIHRoZSByaWdodCBvZiBlYWNoIGJhciwgcHJvdmlkaW5nIHRoYXQgdGhlcmUgYXJlIG1vcmUgdGhhbiAxIGRhdGFzZXRcblx0XHRcdFx0XHR2YXIgYmFzZVdpZHRoID0gdGhpcy5jYWxjdWxhdGVCYXNlV2lkdGgoKSAtICgoZGF0YXNldENvdW50IC0gMSkgKiBvcHRpb25zLmJhckRhdGFzZXRTcGFjaW5nKTtcblxuXHRcdFx0XHRcdHJldHVybiAoYmFzZVdpZHRoIC8gZGF0YXNldENvdW50KTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMuZGF0YXNldHMgPSBbXTtcblxuXHRcdFx0Ly9TZXQgdXAgdG9vbHRpcCBldmVudHMgb24gdGhlIGNoYXJ0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNob3dUb29sdGlwcyl7XG5cdFx0XHRcdGhlbHBlcnMuYmluZEV2ZW50cyh0aGlzLCB0aGlzLm9wdGlvbnMudG9vbHRpcEV2ZW50cywgZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHR2YXIgYWN0aXZlQmFycyA9IChldnQudHlwZSAhPT0gJ21vdXNlb3V0JykgPyB0aGlzLmdldEJhcnNBdEV2ZW50KGV2dCkgOiBbXTtcblxuXHRcdFx0XHRcdHRoaXMuZWFjaEJhcnMoZnVuY3Rpb24oYmFyKXtcblx0XHRcdFx0XHRcdGJhci5yZXN0b3JlKFsnZmlsbENvbG9yJywgJ3N0cm9rZUNvbG9yJ10pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGhlbHBlcnMuZWFjaChhY3RpdmVCYXJzLCBmdW5jdGlvbihhY3RpdmVCYXIpe1xuXHRcdFx0XHRcdFx0aWYgKGFjdGl2ZUJhcikge1xuXHRcdFx0XHRcdFx0XHRhY3RpdmVCYXIuZmlsbENvbG9yID0gYWN0aXZlQmFyLmhpZ2hsaWdodEZpbGw7XG5cdFx0XHRcdFx0XHRcdGFjdGl2ZUJhci5zdHJva2VDb2xvciA9IGFjdGl2ZUJhci5oaWdobGlnaHRTdHJva2U7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5zaG93VG9vbHRpcChhY3RpdmVCYXJzKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vRGVjbGFyZSB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBkZWZhdWx0IHBvaW50LCB0byBjYXRlciBmb3IgdGhlIG9wdGlvbnMgcGFzc2VkIGluIHRvIHRoZSBjb25zdHJ1Y3RvclxuXHRcdFx0dGhpcy5CYXJDbGFzcyA9IENoYXJ0LlJlY3RhbmdsZS5leHRlbmQoe1xuXHRcdFx0XHRzdHJva2VXaWR0aCA6IHRoaXMub3B0aW9ucy5iYXJTdHJva2VXaWR0aCxcblx0XHRcdFx0c2hvd1N0cm9rZSA6IHRoaXMub3B0aW9ucy5iYXJTaG93U3Ryb2tlLFxuXHRcdFx0XHRjdHggOiB0aGlzLmNoYXJ0LmN0eFxuXHRcdFx0fSk7XG5cblx0XHRcdC8vSXRlcmF0ZSB0aHJvdWdoIGVhY2ggb2YgdGhlIGRhdGFzZXRzLCBhbmQgYnVpbGQgdGhpcyBpbnRvIGEgcHJvcGVydHkgb2YgdGhlIGNoYXJ0XG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YS5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0LGRhdGFzZXRJbmRleCl7XG5cblx0XHRcdFx0dmFyIGRhdGFzZXRPYmplY3QgPSB7XG5cdFx0XHRcdFx0bGFiZWwgOiBkYXRhc2V0LmxhYmVsIHx8IG51bGwsXG5cdFx0XHRcdFx0ZmlsbENvbG9yIDogZGF0YXNldC5maWxsQ29sb3IsXG5cdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiBkYXRhc2V0LnN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdGJhcnMgOiBbXVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHRoaXMuZGF0YXNldHMucHVzaChkYXRhc2V0T2JqZWN0KTtcblxuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5kYXRhLGZ1bmN0aW9uKGRhdGFQb2ludCxpbmRleCl7XG5cdFx0XHRcdFx0Ly9BZGQgYSBuZXcgcG9pbnQgZm9yIGVhY2ggcGllY2Ugb2YgZGF0YSwgcGFzc2luZyBhbnkgcmVxdWlyZWQgZGF0YSB0byBkcmF3LlxuXHRcdFx0XHRcdGRhdGFzZXRPYmplY3QuYmFycy5wdXNoKG5ldyB0aGlzLkJhckNsYXNzKHtcblx0XHRcdFx0XHRcdHZhbHVlIDogZGF0YVBvaW50LFxuXHRcdFx0XHRcdFx0bGFiZWwgOiBkYXRhLmxhYmVsc1tpbmRleF0sXG5cdFx0XHRcdFx0XHRkYXRhc2V0TGFiZWw6IGRhdGFzZXQubGFiZWwsXG5cdFx0XHRcdFx0XHRzdHJva2VDb2xvciA6ICh0eXBlb2YgZGF0YXNldC5zdHJva2VDb2xvciA9PSAnb2JqZWN0JykgPyBkYXRhc2V0LnN0cm9rZUNvbG9yW2luZGV4XSA6IGRhdGFzZXQuc3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0XHRmaWxsQ29sb3IgOiAodHlwZW9mIGRhdGFzZXQuZmlsbENvbG9yID09ICdvYmplY3QnKSA/IGRhdGFzZXQuZmlsbENvbG9yW2luZGV4XSA6IGRhdGFzZXQuZmlsbENvbG9yLFxuXHRcdFx0XHRcdFx0aGlnaGxpZ2h0RmlsbCA6IChkYXRhc2V0LmhpZ2hsaWdodEZpbGwpID8gKHR5cGVvZiBkYXRhc2V0LmhpZ2hsaWdodEZpbGwgPT0gJ29iamVjdCcpID8gZGF0YXNldC5oaWdobGlnaHRGaWxsW2luZGV4XSA6IGRhdGFzZXQuaGlnaGxpZ2h0RmlsbCA6ICh0eXBlb2YgZGF0YXNldC5maWxsQ29sb3IgPT0gJ29iamVjdCcpID8gZGF0YXNldC5maWxsQ29sb3JbaW5kZXhdIDogZGF0YXNldC5maWxsQ29sb3IsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRTdHJva2UgOiAoZGF0YXNldC5oaWdobGlnaHRTdHJva2UpID8gKHR5cGVvZiBkYXRhc2V0LmhpZ2hsaWdodFN0cm9rZSA9PSAnb2JqZWN0JykgPyBkYXRhc2V0LmhpZ2hsaWdodFN0cm9rZVtpbmRleF0gOiBkYXRhc2V0LmhpZ2hsaWdodFN0cm9rZSA6ICh0eXBlb2YgZGF0YXNldC5zdHJva2VDb2xvciA9PSAnb2JqZWN0JykgPyBkYXRhc2V0LnN0cm9rZUNvbG9yW2luZGV4XSA6IGRhdGFzZXQuc3Ryb2tlQ29sb3Jcblx0XHRcdFx0XHR9KSk7XG5cdFx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdHRoaXMuYnVpbGRTY2FsZShkYXRhLmxhYmVscyk7XG5cblx0XHRcdHRoaXMuQmFyQ2xhc3MucHJvdG90eXBlLmJhc2UgPSB0aGlzLnNjYWxlLmVuZFBvaW50O1xuXG5cdFx0XHR0aGlzLmVhY2hCYXJzKGZ1bmN0aW9uKGJhciwgaW5kZXgsIGRhdGFzZXRJbmRleCl7XG5cdFx0XHRcdGhlbHBlcnMuZXh0ZW5kKGJhciwge1xuXHRcdFx0XHRcdHdpZHRoIDogdGhpcy5zY2FsZS5jYWxjdWxhdGVCYXJXaWR0aCh0aGlzLmRhdGFzZXRzLmxlbmd0aCksXG5cdFx0XHRcdFx0eDogdGhpcy5zY2FsZS5jYWxjdWxhdGVCYXJYKHRoaXMuZGF0YXNldHMubGVuZ3RoLCBkYXRhc2V0SW5kZXgsIGluZGV4KSxcblx0XHRcdFx0XHR5OiB0aGlzLnNjYWxlLmVuZFBvaW50XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRiYXIuc2F2ZSgpO1xuXHRcdFx0fSwgdGhpcyk7XG5cblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHR1cGRhdGUgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zY2FsZS51cGRhdGUoKTtcblx0XHRcdC8vIFJlc2V0IGFueSBoaWdobGlnaHQgY29sb3VycyBiZWZvcmUgdXBkYXRpbmcuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5hY3RpdmVFbGVtZW50cywgZnVuY3Rpb24oYWN0aXZlRWxlbWVudCl7XG5cdFx0XHRcdGFjdGl2ZUVsZW1lbnQucmVzdG9yZShbJ2ZpbGxDb2xvcicsICdzdHJva2VDb2xvciddKTtcblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmVhY2hCYXJzKGZ1bmN0aW9uKGJhcil7XG5cdFx0XHRcdGJhci5zYXZlKCk7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHRlYWNoQmFycyA6IGZ1bmN0aW9uKGNhbGxiYWNrKXtcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQsIGRhdGFzZXRJbmRleCl7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LmJhcnMsIGNhbGxiYWNrLCB0aGlzLCBkYXRhc2V0SW5kZXgpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHR9LFxuXHRcdGdldEJhcnNBdEV2ZW50IDogZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgYmFyc0FycmF5ID0gW10sXG5cdFx0XHRcdGV2ZW50UG9zaXRpb24gPSBoZWxwZXJzLmdldFJlbGF0aXZlUG9zaXRpb24oZSksXG5cdFx0XHRcdGRhdGFzZXRJdGVyYXRvciA9IGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRcdGJhcnNBcnJheS5wdXNoKGRhdGFzZXQuYmFyc1tiYXJJbmRleF0pO1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRiYXJJbmRleDtcblxuXHRcdFx0Zm9yICh2YXIgZGF0YXNldEluZGV4ID0gMDsgZGF0YXNldEluZGV4IDwgdGhpcy5kYXRhc2V0cy5sZW5ndGg7IGRhdGFzZXRJbmRleCsrKSB7XG5cdFx0XHRcdGZvciAoYmFySW5kZXggPSAwOyBiYXJJbmRleCA8IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5iYXJzLmxlbmd0aDsgYmFySW5kZXgrKykge1xuXHRcdFx0XHRcdGlmICh0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0uYmFyc1tiYXJJbmRleF0uaW5SYW5nZShldmVudFBvc2l0aW9uLngsZXZlbnRQb3NpdGlvbi55KSl7XG5cdFx0XHRcdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cywgZGF0YXNldEl0ZXJhdG9yKTtcblx0XHRcdFx0XHRcdHJldHVybiBiYXJzQXJyYXk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBiYXJzQXJyYXk7XG5cdFx0fSxcblx0XHRidWlsZFNjYWxlIDogZnVuY3Rpb24obGFiZWxzKXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0dmFyIGRhdGFUb3RhbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB2YWx1ZXMgPSBbXTtcblx0XHRcdFx0c2VsZi5lYWNoQmFycyhmdW5jdGlvbihiYXIpe1xuXHRcdFx0XHRcdHZhbHVlcy5wdXNoKGJhci52YWx1ZSk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0XHRyZXR1cm4gdmFsdWVzO1xuXHRcdFx0fTtcblxuXHRcdFx0dmFyIHNjYWxlT3B0aW9ucyA9IHtcblx0XHRcdFx0dGVtcGxhdGVTdHJpbmcgOiB0aGlzLm9wdGlvbnMuc2NhbGVMYWJlbCxcblx0XHRcdFx0aGVpZ2h0IDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHdpZHRoIDogdGhpcy5jaGFydC53aWR0aCxcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdHRleHRDb2xvciA6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRDb2xvcixcblx0XHRcdFx0Zm9udFNpemUgOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSxcblx0XHRcdFx0Zm9udFN0eWxlIDogdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLFxuXHRcdFx0XHRmb250RmFtaWx5IDogdGhpcy5vcHRpb25zLnNjYWxlRm9udEZhbWlseSxcblx0XHRcdFx0dmFsdWVzQ291bnQgOiBsYWJlbHMubGVuZ3RoLFxuXHRcdFx0XHRiZWdpbkF0WmVybyA6IHRoaXMub3B0aW9ucy5zY2FsZUJlZ2luQXRaZXJvLFxuXHRcdFx0XHRpbnRlZ2Vyc09ubHkgOiB0aGlzLm9wdGlvbnMuc2NhbGVJbnRlZ2Vyc09ubHksXG5cdFx0XHRcdGNhbGN1bGF0ZVlSYW5nZTogZnVuY3Rpb24oY3VycmVudEhlaWdodCl7XG5cdFx0XHRcdFx0dmFyIHVwZGF0ZWRSYW5nZXMgPSBoZWxwZXJzLmNhbGN1bGF0ZVNjYWxlUmFuZ2UoXG5cdFx0XHRcdFx0XHRkYXRhVG90YWwoKSxcblx0XHRcdFx0XHRcdGN1cnJlbnRIZWlnaHQsXG5cdFx0XHRcdFx0XHR0aGlzLmZvbnRTaXplLFxuXHRcdFx0XHRcdFx0dGhpcy5iZWdpbkF0WmVybyxcblx0XHRcdFx0XHRcdHRoaXMuaW50ZWdlcnNPbmx5XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLCB1cGRhdGVkUmFuZ2VzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eExhYmVscyA6IGxhYmVscyxcblx0XHRcdFx0Zm9udCA6IGhlbHBlcnMuZm9udFN0cmluZyh0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSwgdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLCB0aGlzLm9wdGlvbnMuc2NhbGVGb250RmFtaWx5KSxcblx0XHRcdFx0bGluZVdpZHRoIDogdGhpcy5vcHRpb25zLnNjYWxlTGluZVdpZHRoLFxuXHRcdFx0XHRsaW5lQ29sb3IgOiB0aGlzLm9wdGlvbnMuc2NhbGVMaW5lQ29sb3IsXG5cdFx0XHRcdHNob3dIb3Jpem9udGFsTGluZXMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93SG9yaXpvbnRhbExpbmVzLFxuXHRcdFx0XHRzaG93VmVydGljYWxMaW5lcyA6IHRoaXMub3B0aW9ucy5zY2FsZVNob3dWZXJ0aWNhbExpbmVzLFxuXHRcdFx0XHRncmlkTGluZVdpZHRoIDogKHRoaXMub3B0aW9ucy5zY2FsZVNob3dHcmlkTGluZXMpID8gdGhpcy5vcHRpb25zLnNjYWxlR3JpZExpbmVXaWR0aCA6IDAsXG5cdFx0XHRcdGdyaWRMaW5lQ29sb3IgOiAodGhpcy5vcHRpb25zLnNjYWxlU2hvd0dyaWRMaW5lcykgPyB0aGlzLm9wdGlvbnMuc2NhbGVHcmlkTGluZUNvbG9yIDogXCJyZ2JhKDAsMCwwLDApXCIsXG5cdFx0XHRcdHBhZGRpbmcgOiAodGhpcy5vcHRpb25zLnNob3dTY2FsZSkgPyAwIDogKHRoaXMub3B0aW9ucy5iYXJTaG93U3Ryb2tlKSA/IHRoaXMub3B0aW9ucy5iYXJTdHJva2VXaWR0aCA6IDAsXG5cdFx0XHRcdHNob3dMYWJlbHMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGFiZWxzLFxuXHRcdFx0XHRkaXNwbGF5IDogdGhpcy5vcHRpb25zLnNob3dTY2FsZVxuXHRcdFx0fTtcblxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5zY2FsZU92ZXJyaWRlKXtcblx0XHRcdFx0aGVscGVycy5leHRlbmQoc2NhbGVPcHRpb25zLCB7XG5cdFx0XHRcdFx0Y2FsY3VsYXRlWVJhbmdlOiBoZWxwZXJzLm5vb3AsXG5cdFx0XHRcdFx0c3RlcHM6IHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBzLFxuXHRcdFx0XHRcdHN0ZXBWYWx1ZTogdGhpcy5vcHRpb25zLnNjYWxlU3RlcFdpZHRoLFxuXHRcdFx0XHRcdG1pbjogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSxcblx0XHRcdFx0XHRtYXg6IHRoaXMub3B0aW9ucy5zY2FsZVN0YXJ0VmFsdWUgKyAodGhpcy5vcHRpb25zLnNjYWxlU3RlcHMgKiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnNjYWxlID0gbmV3IHRoaXMuU2NhbGVDbGFzcyhzY2FsZU9wdGlvbnMpO1xuXHRcdH0sXG5cdFx0YWRkRGF0YSA6IGZ1bmN0aW9uKHZhbHVlc0FycmF5LGxhYmVsKXtcblx0XHRcdC8vTWFwIHRoZSB2YWx1ZXMgYXJyYXkgZm9yIGVhY2ggb2YgdGhlIGRhdGFzZXRzXG5cdFx0XHRoZWxwZXJzLmVhY2godmFsdWVzQXJyYXksZnVuY3Rpb24odmFsdWUsZGF0YXNldEluZGV4KXtcblx0XHRcdFx0Ly9BZGQgYSBuZXcgcG9pbnQgZm9yIGVhY2ggcGllY2Ugb2YgZGF0YSwgcGFzc2luZyBhbnkgcmVxdWlyZWQgZGF0YSB0byBkcmF3LlxuXHRcdFx0XHR0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0uYmFycy5wdXNoKG5ldyB0aGlzLkJhckNsYXNzKHtcblx0XHRcdFx0XHR2YWx1ZSA6IHZhbHVlLFxuXHRcdFx0XHRcdGxhYmVsIDogbGFiZWwsXG5cdFx0XHRcdFx0ZGF0YXNldExhYmVsOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ubGFiZWwsXG5cdFx0XHRcdFx0eDogdGhpcy5zY2FsZS5jYWxjdWxhdGVCYXJYKHRoaXMuZGF0YXNldHMubGVuZ3RoLCBkYXRhc2V0SW5kZXgsIHRoaXMuc2NhbGUudmFsdWVzQ291bnQrMSksXG5cdFx0XHRcdFx0eTogdGhpcy5zY2FsZS5lbmRQb2ludCxcblx0XHRcdFx0XHR3aWR0aCA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQmFyV2lkdGgodGhpcy5kYXRhc2V0cy5sZW5ndGgpLFxuXHRcdFx0XHRcdGJhc2UgOiB0aGlzLnNjYWxlLmVuZFBvaW50LFxuXHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLnN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdGZpbGxDb2xvciA6IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5maWxsQ29sb3Jcblx0XHRcdFx0fSkpO1xuXHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0dGhpcy5zY2FsZS5hZGRYTGFiZWwobGFiZWwpO1xuXHRcdFx0Ly9UaGVuIHJlLXJlbmRlciB0aGUgY2hhcnQuXG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdH0sXG5cdFx0cmVtb3ZlRGF0YSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLnNjYWxlLnJlbW92ZVhMYWJlbCgpO1xuXHRcdFx0Ly9UaGVuIHJlLXJlbmRlciB0aGUgY2hhcnQuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0ZGF0YXNldC5iYXJzLnNoaWZ0KCk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHJlZmxvdyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLkJhckNsYXNzLnByb3RvdHlwZSx7XG5cdFx0XHRcdHk6IHRoaXMuc2NhbGUuZW5kUG9pbnQsXG5cdFx0XHRcdGJhc2UgOiB0aGlzLnNjYWxlLmVuZFBvaW50XG5cdFx0XHR9KTtcblx0XHRcdHZhciBuZXdTY2FsZVByb3BzID0gaGVscGVycy5leHRlbmQoe1xuXHRcdFx0XHRoZWlnaHQgOiB0aGlzLmNoYXJ0LmhlaWdodCxcblx0XHRcdFx0d2lkdGggOiB0aGlzLmNoYXJ0LndpZHRoXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuc2NhbGUudXBkYXRlKG5ld1NjYWxlUHJvcHMpO1xuXHRcdH0sXG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKGVhc2Upe1xuXHRcdFx0dmFyIGVhc2luZ0RlY2ltYWwgPSBlYXNlIHx8IDE7XG5cdFx0XHR0aGlzLmNsZWFyKCk7XG5cblx0XHRcdHZhciBjdHggPSB0aGlzLmNoYXJ0LmN0eDtcblxuXHRcdFx0dGhpcy5zY2FsZS5kcmF3KGVhc2luZ0RlY2ltYWwpO1xuXG5cdFx0XHQvL0RyYXcgYWxsIHRoZSBiYXJzIGZvciBlYWNoIGRhdGFzZXRcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQsZGF0YXNldEluZGV4KXtcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQuYmFycyxmdW5jdGlvbihiYXIsaW5kZXgpe1xuXHRcdFx0XHRcdGlmIChiYXIuaGFzVmFsdWUoKSl7XG5cdFx0XHRcdFx0XHRiYXIuYmFzZSA9IHRoaXMuc2NhbGUuZW5kUG9pbnQ7XG5cdFx0XHRcdFx0XHQvL1RyYW5zaXRpb24gdGhlbiBkcmF3XG5cdFx0XHRcdFx0XHRiYXIudHJhbnNpdGlvbih7XG5cdFx0XHRcdFx0XHRcdHggOiB0aGlzLnNjYWxlLmNhbGN1bGF0ZUJhclgodGhpcy5kYXRhc2V0cy5sZW5ndGgsIGRhdGFzZXRJbmRleCwgaW5kZXgpLFxuXHRcdFx0XHRcdFx0XHR5IDogdGhpcy5zY2FsZS5jYWxjdWxhdGVZKGJhci52YWx1ZSksXG5cdFx0XHRcdFx0XHRcdHdpZHRoIDogdGhpcy5zY2FsZS5jYWxjdWxhdGVCYXJXaWR0aCh0aGlzLmRhdGFzZXRzLmxlbmd0aClcblx0XHRcdFx0XHRcdH0sIGVhc2luZ0RlY2ltYWwpLmRyYXcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdH0sdGhpcyk7XG5cdFx0fVxuXHR9KTtcblxuXG59KS5jYWxsKHRoaXMpO1xuXG4oZnVuY3Rpb24oKXtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJvb3QgPSB0aGlzLFxuXHRcdENoYXJ0ID0gcm9vdC5DaGFydCxcblx0XHQvL0NhY2hlIGEgbG9jYWwgcmVmZXJlbmNlIHRvIENoYXJ0LmhlbHBlcnNcblx0XHRoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuXHR2YXIgZGVmYXVsdENvbmZpZyA9IHtcblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIHNob3VsZCBzaG93IGEgc3Ryb2tlIG9uIGVhY2ggc2VnbWVudFxuXHRcdHNlZ21lbnRTaG93U3Ryb2tlIDogdHJ1ZSxcblxuXHRcdC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG5cdFx0c2VnbWVudFN0cm9rZUNvbG9yIDogXCIjZmZmXCIsXG5cblx0XHQvL051bWJlciAtIFRoZSB3aWR0aCBvZiBlYWNoIHNlZ21lbnQgc3Ryb2tlXG5cdFx0c2VnbWVudFN0cm9rZVdpZHRoIDogMixcblxuXHRcdC8vVGhlIHBlcmNlbnRhZ2Ugb2YgdGhlIGNoYXJ0IHRoYXQgd2UgY3V0IG91dCBvZiB0aGUgbWlkZGxlLlxuXHRcdHBlcmNlbnRhZ2VJbm5lckN1dG91dCA6IDUwLFxuXG5cdFx0Ly9OdW1iZXIgLSBBbW91bnQgb2YgYW5pbWF0aW9uIHN0ZXBzXG5cdFx0YW5pbWF0aW9uU3RlcHMgOiAxMDAsXG5cblx0XHQvL1N0cmluZyAtIEFuaW1hdGlvbiBlYXNpbmcgZWZmZWN0XG5cdFx0YW5pbWF0aW9uRWFzaW5nIDogXCJlYXNlT3V0Qm91bmNlXCIsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHdlIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBEb3VnaG51dFxuXHRcdGFuaW1hdGVSb3RhdGUgOiB0cnVlLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB3ZSBhbmltYXRlIHNjYWxpbmcgdGhlIERvdWdobnV0IGZyb20gdGhlIGNlbnRyZVxuXHRcdGFuaW1hdGVTY2FsZSA6IGZhbHNlLFxuXG5cdFx0Ly9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuXHRcdGxlZ2VuZFRlbXBsYXRlIDogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLWljb25cXFwiIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC10ZXh0XFxcIj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvc3Bhbj48L2xpPjwlfSU+PC91bD5cIlxuXG5cdH07XG5cblx0Q2hhcnQuVHlwZS5leHRlbmQoe1xuXHRcdC8vUGFzc2luZyBpbiBhIG5hbWUgcmVnaXN0ZXJzIHRoaXMgY2hhcnQgaW4gdGhlIENoYXJ0IG5hbWVzcGFjZVxuXHRcdG5hbWU6IFwiRG91Z2hudXRcIixcblx0XHQvL1Byb3ZpZGluZyBhIGRlZmF1bHRzIHdpbGwgYWxzbyByZWdpc3RlciB0aGUgZGVmYXVsdHMgaW4gdGhlIGNoYXJ0IG5hbWVzcGFjZVxuXHRcdGRlZmF1bHRzIDogZGVmYXVsdENvbmZpZyxcblx0XHQvL0luaXRpYWxpemUgaXMgZmlyZWQgd2hlbiB0aGUgY2hhcnQgaXMgaW5pdGlhbGl6ZWQgLSBEYXRhIGlzIHBhc3NlZCBpbiBhcyBhIHBhcmFtZXRlclxuXHRcdC8vQ29uZmlnIGlzIGF1dG9tYXRpY2FsbHkgbWVyZ2VkIGJ5IHRoZSBjb3JlIG9mIENoYXJ0LmpzLCBhbmQgaXMgYXZhaWxhYmxlIGF0IHRoaXMub3B0aW9uc1xuXHRcdGluaXRpYWxpemU6ICBmdW5jdGlvbihkYXRhKXtcblxuXHRcdFx0Ly9EZWNsYXJlIHNlZ21lbnRzIGFzIGEgc3RhdGljIHByb3BlcnR5IHRvIHByZXZlbnQgaW5oZXJpdGluZyBhY3Jvc3MgdGhlIENoYXJ0IHR5cGUgcHJvdG90eXBlXG5cdFx0XHR0aGlzLnNlZ21lbnRzID0gW107XG5cdFx0XHR0aGlzLm91dGVyUmFkaXVzID0gKGhlbHBlcnMubWluKFt0aGlzLmNoYXJ0LndpZHRoLHRoaXMuY2hhcnQuaGVpZ2h0XSkgLVx0dGhpcy5vcHRpb25zLnNlZ21lbnRTdHJva2VXaWR0aC8yKS8yO1xuXG5cdFx0XHR0aGlzLlNlZ21lbnRBcmMgPSBDaGFydC5BcmMuZXh0ZW5kKHtcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdHggOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHkgOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblxuXHRcdFx0Ly9TZXQgdXAgdG9vbHRpcCBldmVudHMgb24gdGhlIGNoYXJ0XG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNob3dUb29sdGlwcyl7XG5cdFx0XHRcdGhlbHBlcnMuYmluZEV2ZW50cyh0aGlzLCB0aGlzLm9wdGlvbnMudG9vbHRpcEV2ZW50cywgZnVuY3Rpb24oZXZ0KXtcblx0XHRcdFx0XHR2YXIgYWN0aXZlU2VnbWVudHMgPSAoZXZ0LnR5cGUgIT09ICdtb3VzZW91dCcpID8gdGhpcy5nZXRTZWdtZW50c0F0RXZlbnQoZXZ0KSA6IFtdO1xuXG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdFx0XHRzZWdtZW50LnJlc3RvcmUoW1wiZmlsbENvbG9yXCJdKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRoZWxwZXJzLmVhY2goYWN0aXZlU2VnbWVudHMsZnVuY3Rpb24oYWN0aXZlU2VnbWVudCl7XG5cdFx0XHRcdFx0XHRhY3RpdmVTZWdtZW50LmZpbGxDb2xvciA9IGFjdGl2ZVNlZ21lbnQuaGlnaGxpZ2h0Q29sb3I7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5zaG93VG9vbHRpcChhY3RpdmVTZWdtZW50cyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXHRcdFx0dGhpcy5jYWxjdWxhdGVUb3RhbChkYXRhKTtcblxuXHRcdFx0aGVscGVycy5lYWNoKGRhdGEsZnVuY3Rpb24oZGF0YXBvaW50LCBpbmRleCl7XG5cdFx0XHRcdGlmICghZGF0YXBvaW50LmNvbG9yKSB7XG5cdFx0XHRcdFx0ZGF0YXBvaW50LmNvbG9yID0gJ2hzbCgnICsgKDM2MCAqIGluZGV4IC8gZGF0YS5sZW5ndGgpICsgJywgMTAwJSwgNTAlKSc7XG5cdFx0XHRcdH1cblx0XHRcdFx0dGhpcy5hZGREYXRhKGRhdGFwb2ludCwgaW5kZXgsIHRydWUpO1xuXHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXHRcdGdldFNlZ21lbnRzQXRFdmVudCA6IGZ1bmN0aW9uKGUpe1xuXHRcdFx0dmFyIHNlZ21lbnRzQXJyYXkgPSBbXTtcblxuXHRcdFx0dmFyIGxvY2F0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uKGUpO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cyxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0aWYgKHNlZ21lbnQuaW5SYW5nZShsb2NhdGlvbi54LGxvY2F0aW9uLnkpKSBzZWdtZW50c0FycmF5LnB1c2goc2VnbWVudCk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0cmV0dXJuIHNlZ21lbnRzQXJyYXk7XG5cdFx0fSxcblx0XHRhZGREYXRhIDogZnVuY3Rpb24oc2VnbWVudCwgYXRJbmRleCwgc2lsZW50KXtcblx0XHRcdHZhciBpbmRleCA9IGF0SW5kZXggIT09IHVuZGVmaW5lZCA/IGF0SW5kZXggOiB0aGlzLnNlZ21lbnRzLmxlbmd0aDtcblx0XHRcdGlmICggdHlwZW9mKHNlZ21lbnQuY29sb3IpID09PSBcInVuZGVmaW5lZFwiICkge1xuXHRcdFx0XHRzZWdtZW50LmNvbG9yID0gQ2hhcnQuZGVmYXVsdHMuZ2xvYmFsLnNlZ21lbnRDb2xvckRlZmF1bHRbaW5kZXggJSBDaGFydC5kZWZhdWx0cy5nbG9iYWwuc2VnbWVudENvbG9yRGVmYXVsdC5sZW5ndGhdO1xuXHRcdFx0XHRzZWdtZW50LmhpZ2hsaWdodCA9IENoYXJ0LmRlZmF1bHRzLmdsb2JhbC5zZWdtZW50SGlnaGxpZ2h0Q29sb3JEZWZhdWx0c1tpbmRleCAlIENoYXJ0LmRlZmF1bHRzLmdsb2JhbC5zZWdtZW50SGlnaGxpZ2h0Q29sb3JEZWZhdWx0cy5sZW5ndGhdO1x0XHRcdFx0XG5cdFx0XHR9XG5cdFx0XHR0aGlzLnNlZ21lbnRzLnNwbGljZShpbmRleCwgMCwgbmV3IHRoaXMuU2VnbWVudEFyYyh7XG5cdFx0XHRcdHZhbHVlIDogc2VnbWVudC52YWx1ZSxcblx0XHRcdFx0b3V0ZXJSYWRpdXMgOiAodGhpcy5vcHRpb25zLmFuaW1hdGVTY2FsZSkgPyAwIDogdGhpcy5vdXRlclJhZGl1cyxcblx0XHRcdFx0aW5uZXJSYWRpdXMgOiAodGhpcy5vcHRpb25zLmFuaW1hdGVTY2FsZSkgPyAwIDogKHRoaXMub3V0ZXJSYWRpdXMvMTAwKSAqIHRoaXMub3B0aW9ucy5wZXJjZW50YWdlSW5uZXJDdXRvdXQsXG5cdFx0XHRcdGZpbGxDb2xvciA6IHNlZ21lbnQuY29sb3IsXG5cdFx0XHRcdGhpZ2hsaWdodENvbG9yIDogc2VnbWVudC5oaWdobGlnaHQgfHwgc2VnbWVudC5jb2xvcixcblx0XHRcdFx0c2hvd1N0cm9rZSA6IHRoaXMub3B0aW9ucy5zZWdtZW50U2hvd1N0cm9rZSxcblx0XHRcdFx0c3Ryb2tlV2lkdGggOiB0aGlzLm9wdGlvbnMuc2VnbWVudFN0cm9rZVdpZHRoLFxuXHRcdFx0XHRzdHJva2VDb2xvciA6IHRoaXMub3B0aW9ucy5zZWdtZW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdHN0YXJ0QW5nbGUgOiBNYXRoLlBJICogMS41LFxuXHRcdFx0XHRjaXJjdW1mZXJlbmNlIDogKHRoaXMub3B0aW9ucy5hbmltYXRlUm90YXRlKSA/IDAgOiB0aGlzLmNhbGN1bGF0ZUNpcmN1bWZlcmVuY2Uoc2VnbWVudC52YWx1ZSksXG5cdFx0XHRcdGxhYmVsIDogc2VnbWVudC5sYWJlbFxuXHRcdFx0fSkpO1xuXHRcdFx0aWYgKCFzaWxlbnQpe1xuXHRcdFx0XHR0aGlzLnJlZmxvdygpO1xuXHRcdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0Y2FsY3VsYXRlQ2lyY3VtZmVyZW5jZSA6IGZ1bmN0aW9uKHZhbHVlKSB7XG5cdFx0XHRpZiAoIHRoaXMudG90YWwgPiAwICkge1xuXHRcdFx0XHRyZXR1cm4gKE1hdGguUEkqMikqKHZhbHVlIC8gdGhpcy50b3RhbCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gMDtcblx0XHRcdH1cblx0XHR9LFxuXHRcdGNhbGN1bGF0ZVRvdGFsIDogZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR0aGlzLnRvdGFsID0gMDtcblx0XHRcdGhlbHBlcnMuZWFjaChkYXRhLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHR0aGlzLnRvdGFsICs9IE1hdGguYWJzKHNlZ21lbnQudmFsdWUpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLmNhbGN1bGF0ZVRvdGFsKHRoaXMuc2VnbWVudHMpO1xuXG5cdFx0XHQvLyBSZXNldCBhbnkgaGlnaGxpZ2h0IGNvbG91cnMgYmVmb3JlIHVwZGF0aW5nLlxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuYWN0aXZlRWxlbWVudHMsIGZ1bmN0aW9uKGFjdGl2ZUVsZW1lbnQpe1xuXHRcdFx0XHRhY3RpdmVFbGVtZW50LnJlc3RvcmUoWydmaWxsQ29sb3InXSk7XG5cdFx0XHR9KTtcblxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdHNlZ21lbnQuc2F2ZSgpO1xuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cblx0XHRyZW1vdmVEYXRhOiBmdW5jdGlvbihhdEluZGV4KXtcblx0XHRcdHZhciBpbmRleFRvRGVsZXRlID0gKGhlbHBlcnMuaXNOdW1iZXIoYXRJbmRleCkpID8gYXRJbmRleCA6IHRoaXMuc2VnbWVudHMubGVuZ3RoLTE7XG5cdFx0XHR0aGlzLnNlZ21lbnRzLnNwbGljZShpbmRleFRvRGVsZXRlLCAxKTtcblx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdH0sXG5cblx0XHRyZWZsb3cgOiBmdW5jdGlvbigpe1xuXHRcdFx0aGVscGVycy5leHRlbmQodGhpcy5TZWdtZW50QXJjLnByb3RvdHlwZSx7XG5cdFx0XHRcdHggOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHkgOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMub3V0ZXJSYWRpdXMgPSAoaGVscGVycy5taW4oW3RoaXMuY2hhcnQud2lkdGgsdGhpcy5jaGFydC5oZWlnaHRdKSAtXHR0aGlzLm9wdGlvbnMuc2VnbWVudFN0cm9rZVdpZHRoLzIpLzI7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cywgZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdHNlZ21lbnQudXBkYXRlKHtcblx0XHRcdFx0XHRvdXRlclJhZGl1cyA6IHRoaXMub3V0ZXJSYWRpdXMsXG5cdFx0XHRcdFx0aW5uZXJSYWRpdXMgOiAodGhpcy5vdXRlclJhZGl1cy8xMDApICogdGhpcy5vcHRpb25zLnBlcmNlbnRhZ2VJbm5lckN1dG91dFxuXHRcdFx0XHR9KTtcblx0XHRcdH0sIHRoaXMpO1xuXHRcdH0sXG5cdFx0ZHJhdyA6IGZ1bmN0aW9uKGVhc2VEZWNpbWFsKXtcblx0XHRcdHZhciBhbmltRGVjaW1hbCA9IChlYXNlRGVjaW1hbCkgPyBlYXNlRGVjaW1hbCA6IDE7XG5cdFx0XHR0aGlzLmNsZWFyKCk7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cyxmdW5jdGlvbihzZWdtZW50LGluZGV4KXtcblx0XHRcdFx0c2VnbWVudC50cmFuc2l0aW9uKHtcblx0XHRcdFx0XHRjaXJjdW1mZXJlbmNlIDogdGhpcy5jYWxjdWxhdGVDaXJjdW1mZXJlbmNlKHNlZ21lbnQudmFsdWUpLFxuXHRcdFx0XHRcdG91dGVyUmFkaXVzIDogdGhpcy5vdXRlclJhZGl1cyxcblx0XHRcdFx0XHRpbm5lclJhZGl1cyA6ICh0aGlzLm91dGVyUmFkaXVzLzEwMCkgKiB0aGlzLm9wdGlvbnMucGVyY2VudGFnZUlubmVyQ3V0b3V0XG5cdFx0XHRcdH0sYW5pbURlY2ltYWwpO1xuXG5cdFx0XHRcdHNlZ21lbnQuZW5kQW5nbGUgPSBzZWdtZW50LnN0YXJ0QW5nbGUgKyBzZWdtZW50LmNpcmN1bWZlcmVuY2U7XG5cblx0XHRcdFx0c2VnbWVudC5kcmF3KCk7XG5cdFx0XHRcdGlmIChpbmRleCA9PT0gMCl7XG5cdFx0XHRcdFx0c2VnbWVudC5zdGFydEFuZ2xlID0gTWF0aC5QSSAqIDEuNTtcblx0XHRcdFx0fVxuXHRcdFx0XHQvL0NoZWNrIHRvIHNlZSBpZiBpdCdzIHRoZSBsYXN0IHNlZ21lbnQsIGlmIG5vdCBnZXQgdGhlIG5leHQgYW5kIHVwZGF0ZSB0aGUgc3RhcnQgYW5nbGVcblx0XHRcdFx0aWYgKGluZGV4IDwgdGhpcy5zZWdtZW50cy5sZW5ndGgtMSl7XG5cdFx0XHRcdFx0dGhpcy5zZWdtZW50c1tpbmRleCsxXS5zdGFydEFuZ2xlID0gc2VnbWVudC5lbmRBbmdsZTtcblx0XHRcdFx0fVxuXHRcdFx0fSx0aGlzKTtcblxuXHRcdH1cblx0fSk7XG5cblx0Q2hhcnQudHlwZXMuRG91Z2hudXQuZXh0ZW5kKHtcblx0XHRuYW1lIDogXCJQaWVcIixcblx0XHRkZWZhdWx0cyA6IGhlbHBlcnMubWVyZ2UoZGVmYXVsdENvbmZpZyx7cGVyY2VudGFnZUlubmVyQ3V0b3V0IDogMH0pXG5cdH0pO1xuXG59KS5jYWxsKHRoaXMpO1xuXG4oZnVuY3Rpb24oKXtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHJvb3QgPSB0aGlzLFxuXHRcdENoYXJ0ID0gcm9vdC5DaGFydCxcblx0XHRoZWxwZXJzID0gQ2hhcnQuaGVscGVycztcblxuXHR2YXIgZGVmYXVsdENvbmZpZyA9IHtcblxuXHRcdC8vL0Jvb2xlYW4gLSBXaGV0aGVyIGdyaWQgbGluZXMgYXJlIHNob3duIGFjcm9zcyB0aGUgY2hhcnRcblx0XHRzY2FsZVNob3dHcmlkTGluZXMgOiB0cnVlLFxuXG5cdFx0Ly9TdHJpbmcgLSBDb2xvdXIgb2YgdGhlIGdyaWQgbGluZXNcblx0XHRzY2FsZUdyaWRMaW5lQ29sb3IgOiBcInJnYmEoMCwwLDAsLjA1KVwiLFxuXG5cdFx0Ly9OdW1iZXIgLSBXaWR0aCBvZiB0aGUgZ3JpZCBsaW5lc1xuXHRcdHNjYWxlR3JpZExpbmVXaWR0aCA6IDEsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgaG9yaXpvbnRhbCBsaW5lcyAoZXhjZXB0IFggYXhpcylcblx0XHRzY2FsZVNob3dIb3Jpem9udGFsTGluZXM6IHRydWUsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgdmVydGljYWwgbGluZXMgKGV4Y2VwdCBZIGF4aXMpXG5cdFx0c2NhbGVTaG93VmVydGljYWxMaW5lczogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdGhlIGxpbmUgaXMgY3VydmVkIGJldHdlZW4gcG9pbnRzXG5cdFx0YmV6aWVyQ3VydmUgOiB0cnVlLFxuXG5cdFx0Ly9OdW1iZXIgLSBUZW5zaW9uIG9mIHRoZSBiZXppZXIgY3VydmUgYmV0d2VlbiBwb2ludHNcblx0XHRiZXppZXJDdXJ2ZVRlbnNpb24gOiAwLjQsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIHNob3cgYSBkb3QgZm9yIGVhY2ggcG9pbnRcblx0XHRwb2ludERvdCA6IHRydWUsXG5cblx0XHQvL051bWJlciAtIFJhZGl1cyBvZiBlYWNoIHBvaW50IGRvdCBpbiBwaXhlbHNcblx0XHRwb2ludERvdFJhZGl1cyA6IDQsXG5cblx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHBvaW50IGRvdCBzdHJva2Vcblx0XHRwb2ludERvdFN0cm9rZVdpZHRoIDogMSxcblxuXHRcdC8vTnVtYmVyIC0gYW1vdW50IGV4dHJhIHRvIGFkZCB0byB0aGUgcmFkaXVzIHRvIGNhdGVyIGZvciBoaXQgZGV0ZWN0aW9uIG91dHNpZGUgdGhlIGRyYXduIHBvaW50XG5cdFx0cG9pbnRIaXREZXRlY3Rpb25SYWRpdXMgOiAyMCxcblxuXHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gc2hvdyBhIHN0cm9rZSBmb3IgZGF0YXNldHNcblx0XHRkYXRhc2V0U3Ryb2tlIDogdHJ1ZSxcblxuXHRcdC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgZGF0YXNldCBzdHJva2Vcblx0XHRkYXRhc2V0U3Ryb2tlV2lkdGggOiAyLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBmaWxsIHRoZSBkYXRhc2V0IHdpdGggYSBjb2xvdXJcblx0XHRkYXRhc2V0RmlsbCA6IHRydWUsXG5cblx0XHQvL1N0cmluZyAtIEEgbGVnZW5kIHRlbXBsYXRlXG5cdFx0bGVnZW5kVGVtcGxhdGUgOiBcIjx1bCBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kXFxcIj48JSBmb3IgKHZhciBpPTA7IGk8ZGF0YXNldHMubGVuZ3RoOyBpKyspeyU+PGxpPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtaWNvblxcXCIgc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6PCU9ZGF0YXNldHNbaV0uc3Ryb2tlQ29sb3IlPlxcXCI+PC9zcGFuPjxzcGFuIGNsYXNzPVxcXCI8JT1uYW1lLnRvTG93ZXJDYXNlKCklPi1sZWdlbmQtdGV4dFxcXCI+PCVpZihkYXRhc2V0c1tpXS5sYWJlbCl7JT48JT1kYXRhc2V0c1tpXS5sYWJlbCU+PCV9JT48L3NwYW4+PC9saT48JX0lPjwvdWw+XCIsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIGhvcml6b250YWxseSBjZW50ZXIgdGhlIGxhYmVsIGFuZCBwb2ludCBkb3QgaW5zaWRlIHRoZSBncmlkXG5cdFx0b2Zmc2V0R3JpZExpbmVzIDogZmFsc2VcblxuXHR9O1xuXG5cblx0Q2hhcnQuVHlwZS5leHRlbmQoe1xuXHRcdG5hbWU6IFwiTGluZVwiLFxuXHRcdGRlZmF1bHRzIDogZGVmYXVsdENvbmZpZyxcblx0XHRpbml0aWFsaXplOiAgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHQvL0RlY2xhcmUgdGhlIGV4dGVuc2lvbiBvZiB0aGUgZGVmYXVsdCBwb2ludCwgdG8gY2F0ZXIgZm9yIHRoZSBvcHRpb25zIHBhc3NlZCBpbiB0byB0aGUgY29uc3RydWN0b3Jcblx0XHRcdHRoaXMuUG9pbnRDbGFzcyA9IENoYXJ0LlBvaW50LmV4dGVuZCh7XG5cdFx0XHRcdG9mZnNldEdyaWRMaW5lcyA6IHRoaXMub3B0aW9ucy5vZmZzZXRHcmlkTGluZXMsXG5cdFx0XHRcdHN0cm9rZVdpZHRoIDogdGhpcy5vcHRpb25zLnBvaW50RG90U3Ryb2tlV2lkdGgsXG5cdFx0XHRcdHJhZGl1cyA6IHRoaXMub3B0aW9ucy5wb2ludERvdFJhZGl1cyxcblx0XHRcdFx0ZGlzcGxheTogdGhpcy5vcHRpb25zLnBvaW50RG90LFxuXHRcdFx0XHRoaXREZXRlY3Rpb25SYWRpdXMgOiB0aGlzLm9wdGlvbnMucG9pbnRIaXREZXRlY3Rpb25SYWRpdXMsXG5cdFx0XHRcdGN0eCA6IHRoaXMuY2hhcnQuY3R4LFxuXHRcdFx0XHRpblJhbmdlIDogZnVuY3Rpb24obW91c2VYKXtcblx0XHRcdFx0XHRyZXR1cm4gKE1hdGgucG93KG1vdXNlWC10aGlzLngsIDIpIDwgTWF0aC5wb3codGhpcy5yYWRpdXMgKyB0aGlzLmhpdERldGVjdGlvblJhZGl1cywyKSk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXG5cdFx0XHR0aGlzLmRhdGFzZXRzID0gW107XG5cblx0XHRcdC8vU2V0IHVwIHRvb2x0aXAgZXZlbnRzIG9uIHRoZSBjaGFydFxuXHRcdFx0aWYgKHRoaXMub3B0aW9ucy5zaG93VG9vbHRpcHMpe1xuXHRcdFx0XHRoZWxwZXJzLmJpbmRFdmVudHModGhpcywgdGhpcy5vcHRpb25zLnRvb2x0aXBFdmVudHMsIGZ1bmN0aW9uKGV2dCl7XG5cdFx0XHRcdFx0dmFyIGFjdGl2ZVBvaW50cyA9IChldnQudHlwZSAhPT0gJ21vdXNlb3V0JykgPyB0aGlzLmdldFBvaW50c0F0RXZlbnQoZXZ0KSA6IFtdO1xuXHRcdFx0XHRcdHRoaXMuZWFjaFBvaW50cyhmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdFx0XHRwb2ludC5yZXN0b3JlKFsnZmlsbENvbG9yJywgJ3N0cm9rZUNvbG9yJ10pO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdGhlbHBlcnMuZWFjaChhY3RpdmVQb2ludHMsIGZ1bmN0aW9uKGFjdGl2ZVBvaW50KXtcblx0XHRcdFx0XHRcdGFjdGl2ZVBvaW50LmZpbGxDb2xvciA9IGFjdGl2ZVBvaW50LmhpZ2hsaWdodEZpbGw7XG5cdFx0XHRcdFx0XHRhY3RpdmVQb2ludC5zdHJva2VDb2xvciA9IGFjdGl2ZVBvaW50LmhpZ2hsaWdodFN0cm9rZTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHR0aGlzLnNob3dUb29sdGlwKGFjdGl2ZVBvaW50cyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHQvL0l0ZXJhdGUgdGhyb3VnaCBlYWNoIG9mIHRoZSBkYXRhc2V0cywgYW5kIGJ1aWxkIHRoaXMgaW50byBhIHByb3BlcnR5IG9mIHRoZSBjaGFydFxuXHRcdFx0aGVscGVycy5lYWNoKGRhdGEuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cblx0XHRcdFx0dmFyIGRhdGFzZXRPYmplY3QgPSB7XG5cdFx0XHRcdFx0bGFiZWwgOiBkYXRhc2V0LmxhYmVsIHx8IG51bGwsXG5cdFx0XHRcdFx0ZmlsbENvbG9yIDogZGF0YXNldC5maWxsQ29sb3IsXG5cdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiBkYXRhc2V0LnN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdHBvaW50Q29sb3IgOiBkYXRhc2V0LnBvaW50Q29sb3IsXG5cdFx0XHRcdFx0cG9pbnRTdHJva2VDb2xvciA6IGRhdGFzZXQucG9pbnRTdHJva2VDb2xvcixcblx0XHRcdFx0XHRwb2ludHMgOiBbXVxuXHRcdFx0XHR9O1xuXG5cdFx0XHRcdHRoaXMuZGF0YXNldHMucHVzaChkYXRhc2V0T2JqZWN0KTtcblxuXG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LmRhdGEsZnVuY3Rpb24oZGF0YVBvaW50LGluZGV4KXtcblx0XHRcdFx0XHQvL0FkZCBhIG5ldyBwb2ludCBmb3IgZWFjaCBwaWVjZSBvZiBkYXRhLCBwYXNzaW5nIGFueSByZXF1aXJlZCBkYXRhIHRvIGRyYXcuXG5cdFx0XHRcdFx0ZGF0YXNldE9iamVjdC5wb2ludHMucHVzaChuZXcgdGhpcy5Qb2ludENsYXNzKHtcblx0XHRcdFx0XHRcdHZhbHVlIDogZGF0YVBvaW50LFxuXHRcdFx0XHRcdFx0bGFiZWwgOiBkYXRhLmxhYmVsc1tpbmRleF0sXG5cdFx0XHRcdFx0XHRkYXRhc2V0TGFiZWw6IGRhdGFzZXQubGFiZWwsXG5cdFx0XHRcdFx0XHRzdHJva2VDb2xvciA6IGRhdGFzZXQucG9pbnRTdHJva2VDb2xvcixcblx0XHRcdFx0XHRcdGZpbGxDb2xvciA6IGRhdGFzZXQucG9pbnRDb2xvcixcblx0XHRcdFx0XHRcdGhpZ2hsaWdodEZpbGwgOiBkYXRhc2V0LnBvaW50SGlnaGxpZ2h0RmlsbCB8fCBkYXRhc2V0LnBvaW50Q29sb3IsXG5cdFx0XHRcdFx0XHRoaWdobGlnaHRTdHJva2UgOiBkYXRhc2V0LnBvaW50SGlnaGxpZ2h0U3Ryb2tlIHx8IGRhdGFzZXQucG9pbnRTdHJva2VDb2xvclxuXHRcdFx0XHRcdH0pKTtcblx0XHRcdFx0fSx0aGlzKTtcblxuXHRcdFx0XHR0aGlzLmJ1aWxkU2NhbGUoZGF0YS5sYWJlbHMpO1xuXG5cblx0XHRcdFx0dGhpcy5lYWNoUG9pbnRzKGZ1bmN0aW9uKHBvaW50LCBpbmRleCl7XG5cdFx0XHRcdFx0aGVscGVycy5leHRlbmQocG9pbnQsIHtcblx0XHRcdFx0XHRcdHg6IHRoaXMuc2NhbGUuY2FsY3VsYXRlWChpbmRleCksXG5cdFx0XHRcdFx0XHR5OiB0aGlzLnNjYWxlLmVuZFBvaW50XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0cG9pbnQuc2F2ZSgpO1xuXHRcdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0fSx0aGlzKTtcblxuXG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0dXBkYXRlIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuc2NhbGUudXBkYXRlKCk7XG5cdFx0XHQvLyBSZXNldCBhbnkgaGlnaGxpZ2h0IGNvbG91cnMgYmVmb3JlIHVwZGF0aW5nLlxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuYWN0aXZlRWxlbWVudHMsIGZ1bmN0aW9uKGFjdGl2ZUVsZW1lbnQpe1xuXHRcdFx0XHRhY3RpdmVFbGVtZW50LnJlc3RvcmUoWydmaWxsQ29sb3InLCAnc3Ryb2tlQ29sb3InXSk7XG5cdFx0XHR9KTtcblx0XHRcdHRoaXMuZWFjaFBvaW50cyhmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdHBvaW50LnNhdmUoKTtcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5yZW5kZXIoKTtcblx0XHR9LFxuXHRcdGVhY2hQb2ludHMgOiBmdW5jdGlvbihjYWxsYmFjayl7XG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLGNhbGxiYWNrLHRoaXMpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHR9LFxuXHRcdGdldFBvaW50c0F0RXZlbnQgOiBmdW5jdGlvbihlKXtcblx0XHRcdHZhciBwb2ludHNBcnJheSA9IFtdLFxuXHRcdFx0XHRldmVudFBvc2l0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uKGUpO1xuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cyxmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdFx0aWYgKHBvaW50LmluUmFuZ2UoZXZlbnRQb3NpdGlvbi54LGV2ZW50UG9zaXRpb24ueSkpIHBvaW50c0FycmF5LnB1c2gocG9pbnQpO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0XHRyZXR1cm4gcG9pbnRzQXJyYXk7XG5cdFx0fSxcblx0XHRidWlsZFNjYWxlIDogZnVuY3Rpb24obGFiZWxzKXtcblx0XHRcdHZhciBzZWxmID0gdGhpcztcblxuXHRcdFx0dmFyIGRhdGFUb3RhbCA9IGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB2YWx1ZXMgPSBbXTtcblx0XHRcdFx0c2VsZi5lYWNoUG9pbnRzKGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdFx0XHR2YWx1ZXMucHVzaChwb2ludC52YWx1ZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdHJldHVybiB2YWx1ZXM7XG5cdFx0XHR9O1xuXG5cdFx0XHR2YXIgc2NhbGVPcHRpb25zID0ge1xuXHRcdFx0XHR0ZW1wbGF0ZVN0cmluZyA6IHRoaXMub3B0aW9ucy5zY2FsZUxhYmVsLFxuXHRcdFx0XHRoZWlnaHQgOiB0aGlzLmNoYXJ0LmhlaWdodCxcblx0XHRcdFx0d2lkdGggOiB0aGlzLmNoYXJ0LndpZHRoLFxuXHRcdFx0XHRjdHggOiB0aGlzLmNoYXJ0LmN0eCxcblx0XHRcdFx0dGV4dENvbG9yIDogdGhpcy5vcHRpb25zLnNjYWxlRm9udENvbG9yLFxuXHRcdFx0XHRvZmZzZXRHcmlkTGluZXMgOiB0aGlzLm9wdGlvbnMub2Zmc2V0R3JpZExpbmVzLFxuXHRcdFx0XHRmb250U2l6ZSA6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTaXplLFxuXHRcdFx0XHRmb250U3R5bGUgOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250U3R5bGUsXG5cdFx0XHRcdGZvbnRGYW1pbHkgOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250RmFtaWx5LFxuXHRcdFx0XHR2YWx1ZXNDb3VudCA6IGxhYmVscy5sZW5ndGgsXG5cdFx0XHRcdGJlZ2luQXRaZXJvIDogdGhpcy5vcHRpb25zLnNjYWxlQmVnaW5BdFplcm8sXG5cdFx0XHRcdGludGVnZXJzT25seSA6IHRoaXMub3B0aW9ucy5zY2FsZUludGVnZXJzT25seSxcblx0XHRcdFx0Y2FsY3VsYXRlWVJhbmdlIDogZnVuY3Rpb24oY3VycmVudEhlaWdodCl7XG5cdFx0XHRcdFx0dmFyIHVwZGF0ZWRSYW5nZXMgPSBoZWxwZXJzLmNhbGN1bGF0ZVNjYWxlUmFuZ2UoXG5cdFx0XHRcdFx0XHRkYXRhVG90YWwoKSxcblx0XHRcdFx0XHRcdGN1cnJlbnRIZWlnaHQsXG5cdFx0XHRcdFx0XHR0aGlzLmZvbnRTaXplLFxuXHRcdFx0XHRcdFx0dGhpcy5iZWdpbkF0WmVybyxcblx0XHRcdFx0XHRcdHRoaXMuaW50ZWdlcnNPbmx5XG5cdFx0XHRcdFx0KTtcblx0XHRcdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLCB1cGRhdGVkUmFuZ2VzKTtcblx0XHRcdFx0fSxcblx0XHRcdFx0eExhYmVscyA6IGxhYmVscyxcblx0XHRcdFx0Zm9udCA6IGhlbHBlcnMuZm9udFN0cmluZyh0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSwgdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLCB0aGlzLm9wdGlvbnMuc2NhbGVGb250RmFtaWx5KSxcblx0XHRcdFx0bGluZVdpZHRoIDogdGhpcy5vcHRpb25zLnNjYWxlTGluZVdpZHRoLFxuXHRcdFx0XHRsaW5lQ29sb3IgOiB0aGlzLm9wdGlvbnMuc2NhbGVMaW5lQ29sb3IsXG5cdFx0XHRcdHNob3dIb3Jpem9udGFsTGluZXMgOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93SG9yaXpvbnRhbExpbmVzLFxuXHRcdFx0XHRzaG93VmVydGljYWxMaW5lcyA6IHRoaXMub3B0aW9ucy5zY2FsZVNob3dWZXJ0aWNhbExpbmVzLFxuXHRcdFx0XHRncmlkTGluZVdpZHRoIDogKHRoaXMub3B0aW9ucy5zY2FsZVNob3dHcmlkTGluZXMpID8gdGhpcy5vcHRpb25zLnNjYWxlR3JpZExpbmVXaWR0aCA6IDAsXG5cdFx0XHRcdGdyaWRMaW5lQ29sb3IgOiAodGhpcy5vcHRpb25zLnNjYWxlU2hvd0dyaWRMaW5lcykgPyB0aGlzLm9wdGlvbnMuc2NhbGVHcmlkTGluZUNvbG9yIDogXCJyZ2JhKDAsMCwwLDApXCIsXG5cdFx0XHRcdHBhZGRpbmc6ICh0aGlzLm9wdGlvbnMuc2hvd1NjYWxlKSA/IDAgOiB0aGlzLm9wdGlvbnMucG9pbnREb3RSYWRpdXMgKyB0aGlzLm9wdGlvbnMucG9pbnREb3RTdHJva2VXaWR0aCxcblx0XHRcdFx0c2hvd0xhYmVscyA6IHRoaXMub3B0aW9ucy5zY2FsZVNob3dMYWJlbHMsXG5cdFx0XHRcdGRpc3BsYXkgOiB0aGlzLm9wdGlvbnMuc2hvd1NjYWxlXG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAodGhpcy5vcHRpb25zLnNjYWxlT3ZlcnJpZGUpe1xuXHRcdFx0XHRoZWxwZXJzLmV4dGVuZChzY2FsZU9wdGlvbnMsIHtcblx0XHRcdFx0XHRjYWxjdWxhdGVZUmFuZ2U6IGhlbHBlcnMubm9vcCxcblx0XHRcdFx0XHRzdGVwczogdGhpcy5vcHRpb25zLnNjYWxlU3RlcHMsXG5cdFx0XHRcdFx0c3RlcFZhbHVlOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgsXG5cdFx0XHRcdFx0bWluOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGFydFZhbHVlLFxuXHRcdFx0XHRcdG1heDogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSArICh0aGlzLm9wdGlvbnMuc2NhbGVTdGVwcyAqIHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBXaWR0aClcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblxuXHRcdFx0dGhpcy5zY2FsZSA9IG5ldyBDaGFydC5TY2FsZShzY2FsZU9wdGlvbnMpO1xuXHRcdH0sXG5cdFx0YWRkRGF0YSA6IGZ1bmN0aW9uKHZhbHVlc0FycmF5LGxhYmVsKXtcblx0XHRcdC8vTWFwIHRoZSB2YWx1ZXMgYXJyYXkgZm9yIGVhY2ggb2YgdGhlIGRhdGFzZXRzXG5cblx0XHRcdGhlbHBlcnMuZWFjaCh2YWx1ZXNBcnJheSxmdW5jdGlvbih2YWx1ZSxkYXRhc2V0SW5kZXgpe1xuXHRcdFx0XHQvL0FkZCBhIG5ldyBwb2ludCBmb3IgZWFjaCBwaWVjZSBvZiBkYXRhLCBwYXNzaW5nIGFueSByZXF1aXJlZCBkYXRhIHRvIGRyYXcuXG5cdFx0XHRcdHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5wb2ludHMucHVzaChuZXcgdGhpcy5Qb2ludENsYXNzKHtcblx0XHRcdFx0XHR2YWx1ZSA6IHZhbHVlLFxuXHRcdFx0XHRcdGxhYmVsIDogbGFiZWwsXG5cdFx0XHRcdFx0ZGF0YXNldExhYmVsOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ubGFiZWwsXG5cdFx0XHRcdFx0eDogdGhpcy5zY2FsZS5jYWxjdWxhdGVYKHRoaXMuc2NhbGUudmFsdWVzQ291bnQrMSksXG5cdFx0XHRcdFx0eTogdGhpcy5zY2FsZS5lbmRQb2ludCxcblx0XHRcdFx0XHRzdHJva2VDb2xvciA6IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5wb2ludFN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdGZpbGxDb2xvciA6IHRoaXMuZGF0YXNldHNbZGF0YXNldEluZGV4XS5wb2ludENvbG9yXG5cdFx0XHRcdH0pKTtcblx0XHRcdH0sdGhpcyk7XG5cblx0XHRcdHRoaXMuc2NhbGUuYWRkWExhYmVsKGxhYmVsKTtcblx0XHRcdC8vVGhlbiByZS1yZW5kZXIgdGhlIGNoYXJ0LlxuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHJlbW92ZURhdGEgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zY2FsZS5yZW1vdmVYTGFiZWwoKTtcblx0XHRcdC8vVGhlbiByZS1yZW5kZXIgdGhlIGNoYXJ0LlxuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdGRhdGFzZXQucG9pbnRzLnNoaWZ0KCk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHJlZmxvdyA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR2YXIgbmV3U2NhbGVQcm9wcyA9IGhlbHBlcnMuZXh0ZW5kKHtcblx0XHRcdFx0aGVpZ2h0IDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHdpZHRoIDogdGhpcy5jaGFydC53aWR0aFxuXHRcdFx0fSk7XG5cdFx0XHR0aGlzLnNjYWxlLnVwZGF0ZShuZXdTY2FsZVByb3BzKTtcblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbihlYXNlKXtcblx0XHRcdHZhciBlYXNpbmdEZWNpbWFsID0gZWFzZSB8fCAxO1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXG5cdFx0XHR2YXIgY3R4ID0gdGhpcy5jaGFydC5jdHg7XG5cblx0XHRcdC8vIFNvbWUgaGVscGVyIG1ldGhvZHMgZm9yIGdldHRpbmcgdGhlIG5leHQvcHJldiBwb2ludHNcblx0XHRcdHZhciBoYXNWYWx1ZSA9IGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdFx0XHRyZXR1cm4gaXRlbS52YWx1ZSAhPT0gbnVsbDtcblx0XHRcdH0sXG5cdFx0XHRuZXh0UG9pbnQgPSBmdW5jdGlvbihwb2ludCwgY29sbGVjdGlvbiwgaW5kZXgpe1xuXHRcdFx0XHRyZXR1cm4gaGVscGVycy5maW5kTmV4dFdoZXJlKGNvbGxlY3Rpb24sIGhhc1ZhbHVlLCBpbmRleCkgfHwgcG9pbnQ7XG5cdFx0XHR9LFxuXHRcdFx0cHJldmlvdXNQb2ludCA9IGZ1bmN0aW9uKHBvaW50LCBjb2xsZWN0aW9uLCBpbmRleCl7XG5cdFx0XHRcdHJldHVybiBoZWxwZXJzLmZpbmRQcmV2aW91c1doZXJlKGNvbGxlY3Rpb24sIGhhc1ZhbHVlLCBpbmRleCkgfHwgcG9pbnQ7XG5cdFx0XHR9O1xuXG5cdFx0XHRpZiAoIXRoaXMuc2NhbGUpIHJldHVybjtcblx0XHRcdHRoaXMuc2NhbGUuZHJhdyhlYXNpbmdEZWNpbWFsKTtcblxuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblx0XHRcdFx0dmFyIHBvaW50c1dpdGhWYWx1ZXMgPSBoZWxwZXJzLndoZXJlKGRhdGFzZXQucG9pbnRzLCBoYXNWYWx1ZSk7XG5cblx0XHRcdFx0Ly9UcmFuc2l0aW9uIGVhY2ggcG9pbnQgZmlyc3Qgc28gdGhhdCB0aGUgbGluZSBhbmQgcG9pbnQgZHJhd2luZyBpc24ndCBvdXQgb2Ygc3luY1xuXHRcdFx0XHQvL1dlIGNhbiB1c2UgdGhpcyBleHRyYSBsb29wIHRvIGNhbGN1bGF0ZSB0aGUgY29udHJvbCBwb2ludHMgb2YgdGhpcyBkYXRhc2V0IGFsc28gaW4gdGhpcyBsb29wXG5cblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLCBmdW5jdGlvbihwb2ludCwgaW5kZXgpe1xuXHRcdFx0XHRcdGlmIChwb2ludC5oYXNWYWx1ZSgpKXtcblx0XHRcdFx0XHRcdHBvaW50LnRyYW5zaXRpb24oe1xuXHRcdFx0XHRcdFx0XHR5IDogdGhpcy5zY2FsZS5jYWxjdWxhdGVZKHBvaW50LnZhbHVlKSxcblx0XHRcdFx0XHRcdFx0eCA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlWChpbmRleClcblx0XHRcdFx0XHRcdH0sIGVhc2luZ0RlY2ltYWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSx0aGlzKTtcblxuXG5cdFx0XHRcdC8vIENvbnRyb2wgcG9pbnRzIG5lZWQgdG8gYmUgY2FsY3VsYXRlZCBpbiBhIHNlcGFyYXRlIGxvb3AsIGJlY2F1c2Ugd2UgbmVlZCB0byBrbm93IHRoZSBjdXJyZW50IHgveSBvZiB0aGUgcG9pbnRcblx0XHRcdFx0Ly8gVGhpcyB3b3VsZCBjYXVzZSBpc3N1ZXMgd2hlbiB0aGVyZSBpcyBubyBhbmltYXRpb24sIGJlY2F1c2UgdGhlIHkgb2YgdGhlIG5leHQgcG9pbnQgd291bGQgYmUgMCwgc28gYmV6aWVycyB3b3VsZCBiZSBza2V3ZWRcblx0XHRcdFx0aWYgKHRoaXMub3B0aW9ucy5iZXppZXJDdXJ2ZSl7XG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKHBvaW50c1dpdGhWYWx1ZXMsIGZ1bmN0aW9uKHBvaW50LCBpbmRleCl7XG5cdFx0XHRcdFx0XHR2YXIgdGVuc2lvbiA9IChpbmRleCA+IDAgJiYgaW5kZXggPCBwb2ludHNXaXRoVmFsdWVzLmxlbmd0aCAtIDEpID8gdGhpcy5vcHRpb25zLmJlemllckN1cnZlVGVuc2lvbiA6IDA7XG5cdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzID0gaGVscGVycy5zcGxpbmVDdXJ2ZShcblx0XHRcdFx0XHRcdFx0cHJldmlvdXNQb2ludChwb2ludCwgcG9pbnRzV2l0aFZhbHVlcywgaW5kZXgpLFxuXHRcdFx0XHRcdFx0XHRwb2ludCxcblx0XHRcdFx0XHRcdFx0bmV4dFBvaW50KHBvaW50LCBwb2ludHNXaXRoVmFsdWVzLCBpbmRleCksXG5cdFx0XHRcdFx0XHRcdHRlbnNpb25cblx0XHRcdFx0XHRcdCk7XG5cblx0XHRcdFx0XHRcdC8vIFByZXZlbnQgdGhlIGJlemllciBnb2luZyBvdXRzaWRlIG9mIHRoZSBib3VuZHMgb2YgdGhlIGdyYXBoXG5cblx0XHRcdFx0XHRcdC8vIENhcCBwdXRlciBiZXppZXIgaGFuZGxlcyB0byB0aGUgdXBwZXIvbG93ZXIgc2NhbGUgYm91bmRzXG5cdFx0XHRcdFx0XHRpZiAocG9pbnQuY29udHJvbFBvaW50cy5vdXRlci55ID4gdGhpcy5zY2FsZS5lbmRQb2ludCl7XG5cdFx0XHRcdFx0XHRcdHBvaW50LmNvbnRyb2xQb2ludHMub3V0ZXIueSA9IHRoaXMuc2NhbGUuZW5kUG9pbnQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmIChwb2ludC5jb250cm9sUG9pbnRzLm91dGVyLnkgPCB0aGlzLnNjYWxlLnN0YXJ0UG9pbnQpe1xuXHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLm91dGVyLnkgPSB0aGlzLnNjYWxlLnN0YXJ0UG9pbnQ7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHRcdC8vIENhcCBpbm5lciBiZXppZXIgaGFuZGxlcyB0byB0aGUgdXBwZXIvbG93ZXIgc2NhbGUgYm91bmRzXG5cdFx0XHRcdFx0XHRpZiAocG9pbnQuY29udHJvbFBvaW50cy5pbm5lci55ID4gdGhpcy5zY2FsZS5lbmRQb2ludCl7XG5cdFx0XHRcdFx0XHRcdHBvaW50LmNvbnRyb2xQb2ludHMuaW5uZXIueSA9IHRoaXMuc2NhbGUuZW5kUG9pbnQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlIGlmIChwb2ludC5jb250cm9sUG9pbnRzLmlubmVyLnkgPCB0aGlzLnNjYWxlLnN0YXJ0UG9pbnQpe1xuXHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLmlubmVyLnkgPSB0aGlzLnNjYWxlLnN0YXJ0UG9pbnQ7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSx0aGlzKTtcblx0XHRcdFx0fVxuXG5cblx0XHRcdFx0Ly9EcmF3IHRoZSBsaW5lIGJldHdlZW4gYWxsIHRoZSBwb2ludHNcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5kYXRhc2V0U3Ryb2tlV2lkdGg7XG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IGRhdGFzZXQuc3Ryb2tlQ29sb3I7XG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblxuXHRcdFx0XHRoZWxwZXJzLmVhY2gocG9pbnRzV2l0aFZhbHVlcywgZnVuY3Rpb24ocG9pbnQsIGluZGV4KXtcblx0XHRcdFx0XHRpZiAoaW5kZXggPT09IDApe1xuXHRcdFx0XHRcdFx0Y3R4Lm1vdmVUbyhwb2ludC54LCBwb2ludC55KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdGlmKHRoaXMub3B0aW9ucy5iZXppZXJDdXJ2ZSl7XG5cdFx0XHRcdFx0XHRcdHZhciBwcmV2aW91cyA9IHByZXZpb3VzUG9pbnQocG9pbnQsIHBvaW50c1dpdGhWYWx1ZXMsIGluZGV4KTtcblxuXHRcdFx0XHRcdFx0XHRjdHguYmV6aWVyQ3VydmVUbyhcblx0XHRcdFx0XHRcdFx0XHRwcmV2aW91cy5jb250cm9sUG9pbnRzLm91dGVyLngsXG5cdFx0XHRcdFx0XHRcdFx0cHJldmlvdXMuY29udHJvbFBvaW50cy5vdXRlci55LFxuXHRcdFx0XHRcdFx0XHRcdHBvaW50LmNvbnRyb2xQb2ludHMuaW5uZXIueCxcblx0XHRcdFx0XHRcdFx0XHRwb2ludC5jb250cm9sUG9pbnRzLmlubmVyLnksXG5cdFx0XHRcdFx0XHRcdFx0cG9pbnQueCxcblx0XHRcdFx0XHRcdFx0XHRwb2ludC55XG5cdFx0XHRcdFx0XHRcdCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0XHRjdHgubGluZVRvKHBvaW50LngscG9pbnQueSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9LCB0aGlzKTtcblxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLmRhdGFzZXRTdHJva2UpIHtcblx0XHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHRpZiAodGhpcy5vcHRpb25zLmRhdGFzZXRGaWxsICYmIHBvaW50c1dpdGhWYWx1ZXMubGVuZ3RoID4gMCl7XG5cdFx0XHRcdFx0Ly9Sb3VuZCBvZmYgdGhlIGxpbmUgYnkgZ29pbmcgdG8gdGhlIGJhc2Ugb2YgdGhlIGNoYXJ0LCBiYWNrIHRvIHRoZSBzdGFydCwgdGhlbiBmaWxsLlxuXHRcdFx0XHRcdGN0eC5saW5lVG8ocG9pbnRzV2l0aFZhbHVlc1twb2ludHNXaXRoVmFsdWVzLmxlbmd0aCAtIDFdLngsIHRoaXMuc2NhbGUuZW5kUG9pbnQpO1xuXHRcdFx0XHRcdGN0eC5saW5lVG8ocG9pbnRzV2l0aFZhbHVlc1swXS54LCB0aGlzLnNjYWxlLmVuZFBvaW50KTtcblx0XHRcdFx0XHRjdHguZmlsbFN0eWxlID0gZGF0YXNldC5maWxsQ29sb3I7XG5cdFx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvL05vdyBkcmF3IHRoZSBwb2ludHMgb3ZlciB0aGUgbGluZVxuXHRcdFx0XHQvL0EgbGl0dGxlIGluZWZmaWNpZW50IGRvdWJsZSBsb29waW5nLCBidXQgYmV0dGVyIHRoYW4gdGhlIGxpbmVcblx0XHRcdFx0Ly9sYWdnaW5nIGJlaGluZCB0aGUgcG9pbnQgcG9zaXRpb25zXG5cdFx0XHRcdGhlbHBlcnMuZWFjaChwb2ludHNXaXRoVmFsdWVzLGZ1bmN0aW9uKHBvaW50KXtcblx0XHRcdFx0XHRwb2ludC5kcmF3KCk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSx0aGlzKTtcblx0XHR9XG5cdH0pO1xuXG5cbn0pLmNhbGwodGhpcyk7XG5cbihmdW5jdGlvbigpe1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgcm9vdCA9IHRoaXMsXG5cdFx0Q2hhcnQgPSByb290LkNoYXJ0LFxuXHRcdC8vQ2FjaGUgYSBsb2NhbCByZWZlcmVuY2UgdG8gQ2hhcnQuaGVscGVyc1xuXHRcdGhlbHBlcnMgPSBDaGFydC5oZWxwZXJzO1xuXG5cdHZhciBkZWZhdWx0Q29uZmlnID0ge1xuXHRcdC8vQm9vbGVhbiAtIFNob3cgYSBiYWNrZHJvcCB0byB0aGUgc2NhbGUgbGFiZWxcblx0XHRzY2FsZVNob3dMYWJlbEJhY2tkcm9wIDogdHJ1ZSxcblxuXHRcdC8vU3RyaW5nIC0gVGhlIGNvbG91ciBvZiB0aGUgbGFiZWwgYmFja2Ryb3Bcblx0XHRzY2FsZUJhY2tkcm9wQ29sb3IgOiBcInJnYmEoMjU1LDI1NSwyNTUsMC43NSlcIixcblxuXHRcdC8vIEJvb2xlYW4gLSBXaGV0aGVyIHRoZSBzY2FsZSBzaG91bGQgYmVnaW4gYXQgemVyb1xuXHRcdHNjYWxlQmVnaW5BdFplcm8gOiB0cnVlLFxuXG5cdFx0Ly9OdW1iZXIgLSBUaGUgYmFja2Ryb3AgcGFkZGluZyBhYm92ZSAmIGJlbG93IHRoZSBsYWJlbCBpbiBwaXhlbHNcblx0XHRzY2FsZUJhY2tkcm9wUGFkZGluZ1kgOiAyLFxuXG5cdFx0Ly9OdW1iZXIgLSBUaGUgYmFja2Ryb3AgcGFkZGluZyB0byB0aGUgc2lkZSBvZiB0aGUgbGFiZWwgaW4gcGl4ZWxzXG5cdFx0c2NhbGVCYWNrZHJvcFBhZGRpbmdYIDogMixcblxuXHRcdC8vQm9vbGVhbiAtIFNob3cgbGluZSBmb3IgZWFjaCB2YWx1ZSBpbiB0aGUgc2NhbGVcblx0XHRzY2FsZVNob3dMaW5lIDogdHJ1ZSxcblxuXHRcdC8vQm9vbGVhbiAtIFN0cm9rZSBhIGxpbmUgYXJvdW5kIGVhY2ggc2VnbWVudCBpbiB0aGUgY2hhcnRcblx0XHRzZWdtZW50U2hvd1N0cm9rZSA6IHRydWUsXG5cblx0XHQvL1N0cmluZyAtIFRoZSBjb2xvdXIgb2YgdGhlIHN0cm9rZSBvbiBlYWNoIHNlZ21lbnQuXG5cdFx0c2VnbWVudFN0cm9rZUNvbG9yIDogXCIjZmZmXCIsXG5cblx0XHQvL051bWJlciAtIFRoZSB3aWR0aCBvZiB0aGUgc3Ryb2tlIHZhbHVlIGluIHBpeGVsc1xuXHRcdHNlZ21lbnRTdHJva2VXaWR0aCA6IDIsXG5cblx0XHQvL051bWJlciAtIEFtb3VudCBvZiBhbmltYXRpb24gc3RlcHNcblx0XHRhbmltYXRpb25TdGVwcyA6IDEwMCxcblxuXHRcdC8vU3RyaW5nIC0gQW5pbWF0aW9uIGVhc2luZyBlZmZlY3QuXG5cdFx0YW5pbWF0aW9uRWFzaW5nIDogXCJlYXNlT3V0Qm91bmNlXCIsXG5cblx0XHQvL0Jvb2xlYW4gLSBXaGV0aGVyIHRvIGFuaW1hdGUgdGhlIHJvdGF0aW9uIG9mIHRoZSBjaGFydFxuXHRcdGFuaW1hdGVSb3RhdGUgOiB0cnVlLFxuXG5cdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBhbmltYXRlIHNjYWxpbmcgdGhlIGNoYXJ0IGZyb20gdGhlIGNlbnRyZVxuXHRcdGFuaW1hdGVTY2FsZSA6IGZhbHNlLFxuXG5cdFx0Ly9TdHJpbmcgLSBBIGxlZ2VuZCB0ZW1wbGF0ZVxuXHRcdGxlZ2VuZFRlbXBsYXRlIDogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPHNlZ21lbnRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLWljb25cXFwiIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPXNlZ21lbnRzW2ldLmZpbGxDb2xvciU+XFxcIj48L3NwYW4+PHNwYW4gY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZC10ZXh0XFxcIj48JWlmKHNlZ21lbnRzW2ldLmxhYmVsKXslPjwlPXNlZ21lbnRzW2ldLmxhYmVsJT48JX0lPjwvc3Bhbj48L2xpPjwlfSU+PC91bD5cIlxuXHR9O1xuXG5cblx0Q2hhcnQuVHlwZS5leHRlbmQoe1xuXHRcdC8vUGFzc2luZyBpbiBhIG5hbWUgcmVnaXN0ZXJzIHRoaXMgY2hhcnQgaW4gdGhlIENoYXJ0IG5hbWVzcGFjZVxuXHRcdG5hbWU6IFwiUG9sYXJBcmVhXCIsXG5cdFx0Ly9Qcm92aWRpbmcgYSBkZWZhdWx0cyB3aWxsIGFsc28gcmVnaXN0ZXIgdGhlIGRlZmF1bHRzIGluIHRoZSBjaGFydCBuYW1lc3BhY2Vcblx0XHRkZWZhdWx0cyA6IGRlZmF1bHRDb25maWcsXG5cdFx0Ly9Jbml0aWFsaXplIGlzIGZpcmVkIHdoZW4gdGhlIGNoYXJ0IGlzIGluaXRpYWxpemVkIC0gRGF0YSBpcyBwYXNzZWQgaW4gYXMgYSBwYXJhbWV0ZXJcblx0XHQvL0NvbmZpZyBpcyBhdXRvbWF0aWNhbGx5IG1lcmdlZCBieSB0aGUgY29yZSBvZiBDaGFydC5qcywgYW5kIGlzIGF2YWlsYWJsZSBhdCB0aGlzLm9wdGlvbnNcblx0XHRpbml0aWFsaXplOiAgZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR0aGlzLnNlZ21lbnRzID0gW107XG5cdFx0XHQvL0RlY2xhcmUgc2VnbWVudCBjbGFzcyBhcyBhIGNoYXJ0IGluc3RhbmNlIHNwZWNpZmljIGNsYXNzLCBzbyBpdCBjYW4gc2hhcmUgcHJvcHMgZm9yIHRoaXMgaW5zdGFuY2Vcblx0XHRcdHRoaXMuU2VnbWVudEFyYyA9IENoYXJ0LkFyYy5leHRlbmQoe1xuXHRcdFx0XHRzaG93U3Ryb2tlIDogdGhpcy5vcHRpb25zLnNlZ21lbnRTaG93U3Ryb2tlLFxuXHRcdFx0XHRzdHJva2VXaWR0aCA6IHRoaXMub3B0aW9ucy5zZWdtZW50U3Ryb2tlV2lkdGgsXG5cdFx0XHRcdHN0cm9rZUNvbG9yIDogdGhpcy5vcHRpb25zLnNlZ21lbnRTdHJva2VDb2xvcixcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdGlubmVyUmFkaXVzIDogMCxcblx0XHRcdFx0eCA6IHRoaXMuY2hhcnQud2lkdGgvMixcblx0XHRcdFx0eSA6IHRoaXMuY2hhcnQuaGVpZ2h0LzJcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5zY2FsZSA9IG5ldyBDaGFydC5SYWRpYWxTY2FsZSh7XG5cdFx0XHRcdGRpc3BsYXk6IHRoaXMub3B0aW9ucy5zaG93U2NhbGUsXG5cdFx0XHRcdGZvbnRTdHlsZTogdGhpcy5vcHRpb25zLnNjYWxlRm9udFN0eWxlLFxuXHRcdFx0XHRmb250U2l6ZTogdGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsXG5cdFx0XHRcdGZvbnRGYW1pbHk6IHRoaXMub3B0aW9ucy5zY2FsZUZvbnRGYW1pbHksXG5cdFx0XHRcdGZvbnRDb2xvcjogdGhpcy5vcHRpb25zLnNjYWxlRm9udENvbG9yLFxuXHRcdFx0XHRzaG93TGFiZWxzOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGFiZWxzLFxuXHRcdFx0XHRzaG93TGFiZWxCYWNrZHJvcDogdGhpcy5vcHRpb25zLnNjYWxlU2hvd0xhYmVsQmFja2Ryb3AsXG5cdFx0XHRcdGJhY2tkcm9wQ29sb3I6IHRoaXMub3B0aW9ucy5zY2FsZUJhY2tkcm9wQ29sb3IsXG5cdFx0XHRcdGJhY2tkcm9wUGFkZGluZ1kgOiB0aGlzLm9wdGlvbnMuc2NhbGVCYWNrZHJvcFBhZGRpbmdZLFxuXHRcdFx0XHRiYWNrZHJvcFBhZGRpbmdYOiB0aGlzLm9wdGlvbnMuc2NhbGVCYWNrZHJvcFBhZGRpbmdYLFxuXHRcdFx0XHRsaW5lV2lkdGg6ICh0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGluZSkgPyB0aGlzLm9wdGlvbnMuc2NhbGVMaW5lV2lkdGggOiAwLFxuXHRcdFx0XHRsaW5lQ29sb3I6IHRoaXMub3B0aW9ucy5zY2FsZUxpbmVDb2xvcixcblx0XHRcdFx0bGluZUFyYzogdHJ1ZSxcblx0XHRcdFx0d2lkdGg6IHRoaXMuY2hhcnQud2lkdGgsXG5cdFx0XHRcdGhlaWdodDogdGhpcy5jaGFydC5oZWlnaHQsXG5cdFx0XHRcdHhDZW50ZXI6IHRoaXMuY2hhcnQud2lkdGgvMixcblx0XHRcdFx0eUNlbnRlcjogdGhpcy5jaGFydC5oZWlnaHQvMixcblx0XHRcdFx0Y3R4IDogdGhpcy5jaGFydC5jdHgsXG5cdFx0XHRcdHRlbXBsYXRlU3RyaW5nOiB0aGlzLm9wdGlvbnMuc2NhbGVMYWJlbCxcblx0XHRcdFx0dmFsdWVzQ291bnQ6IGRhdGEubGVuZ3RoXG5cdFx0XHR9KTtcblxuXHRcdFx0dGhpcy51cGRhdGVTY2FsZVJhbmdlKGRhdGEpO1xuXG5cdFx0XHR0aGlzLnNjYWxlLnVwZGF0ZSgpO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YSxmdW5jdGlvbihzZWdtZW50LGluZGV4KXtcblx0XHRcdFx0dGhpcy5hZGREYXRhKHNlZ21lbnQsaW5kZXgsdHJ1ZSk7XG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHQvL1NldCB1cCB0b29sdGlwIGV2ZW50cyBvbiB0aGUgY2hhcnRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rvb2x0aXBzKXtcblx0XHRcdFx0aGVscGVycy5iaW5kRXZlbnRzKHRoaXMsIHRoaXMub3B0aW9ucy50b29sdGlwRXZlbnRzLCBmdW5jdGlvbihldnQpe1xuXHRcdFx0XHRcdHZhciBhY3RpdmVTZWdtZW50cyA9IChldnQudHlwZSAhPT0gJ21vdXNlb3V0JykgPyB0aGlzLmdldFNlZ21lbnRzQXRFdmVudChldnQpIDogW107XG5cdFx0XHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdFx0XHRzZWdtZW50LnJlc3RvcmUoW1wiZmlsbENvbG9yXCJdKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRoZWxwZXJzLmVhY2goYWN0aXZlU2VnbWVudHMsZnVuY3Rpb24oYWN0aXZlU2VnbWVudCl7XG5cdFx0XHRcdFx0XHRhY3RpdmVTZWdtZW50LmZpbGxDb2xvciA9IGFjdGl2ZVNlZ21lbnQuaGlnaGxpZ2h0Q29sb3I7XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0dGhpcy5zaG93VG9vbHRpcChhY3RpdmVTZWdtZW50cyk7XG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0Z2V0U2VnbWVudHNBdEV2ZW50IDogZnVuY3Rpb24oZSl7XG5cdFx0XHR2YXIgc2VnbWVudHNBcnJheSA9IFtdO1xuXG5cdFx0XHR2YXIgbG9jYXRpb24gPSBoZWxwZXJzLmdldFJlbGF0aXZlUG9zaXRpb24oZSk7XG5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLnNlZ21lbnRzLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHRpZiAoc2VnbWVudC5pblJhbmdlKGxvY2F0aW9uLngsbG9jYXRpb24ueSkpIHNlZ21lbnRzQXJyYXkucHVzaChzZWdtZW50KTtcblx0XHRcdH0sdGhpcyk7XG5cdFx0XHRyZXR1cm4gc2VnbWVudHNBcnJheTtcblx0XHR9LFxuXHRcdGFkZERhdGEgOiBmdW5jdGlvbihzZWdtZW50LCBhdEluZGV4LCBzaWxlbnQpe1xuXHRcdFx0dmFyIGluZGV4ID0gYXRJbmRleCB8fCB0aGlzLnNlZ21lbnRzLmxlbmd0aDtcblxuXHRcdFx0dGhpcy5zZWdtZW50cy5zcGxpY2UoaW5kZXgsIDAsIG5ldyB0aGlzLlNlZ21lbnRBcmMoe1xuXHRcdFx0XHRmaWxsQ29sb3I6IHNlZ21lbnQuY29sb3IsXG5cdFx0XHRcdGhpZ2hsaWdodENvbG9yOiBzZWdtZW50LmhpZ2hsaWdodCB8fCBzZWdtZW50LmNvbG9yLFxuXHRcdFx0XHRsYWJlbDogc2VnbWVudC5sYWJlbCxcblx0XHRcdFx0dmFsdWU6IHNlZ21lbnQudmFsdWUsXG5cdFx0XHRcdG91dGVyUmFkaXVzOiAodGhpcy5vcHRpb25zLmFuaW1hdGVTY2FsZSkgPyAwIDogdGhpcy5zY2FsZS5jYWxjdWxhdGVDZW50ZXJPZmZzZXQoc2VnbWVudC52YWx1ZSksXG5cdFx0XHRcdGNpcmN1bWZlcmVuY2U6ICh0aGlzLm9wdGlvbnMuYW5pbWF0ZVJvdGF0ZSkgPyAwIDogdGhpcy5zY2FsZS5nZXRDaXJjdW1mZXJlbmNlKCksXG5cdFx0XHRcdHN0YXJ0QW5nbGU6IE1hdGguUEkgKiAxLjVcblx0XHRcdH0pKTtcblx0XHRcdGlmICghc2lsZW50KXtcblx0XHRcdFx0dGhpcy5yZWZsb3coKTtcblx0XHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlbW92ZURhdGE6IGZ1bmN0aW9uKGF0SW5kZXgpe1xuXHRcdFx0dmFyIGluZGV4VG9EZWxldGUgPSAoaGVscGVycy5pc051bWJlcihhdEluZGV4KSkgPyBhdEluZGV4IDogdGhpcy5zZWdtZW50cy5sZW5ndGgtMTtcblx0XHRcdHRoaXMuc2VnbWVudHMuc3BsaWNlKGluZGV4VG9EZWxldGUsIDEpO1xuXHRcdFx0dGhpcy5yZWZsb3coKTtcblx0XHRcdHRoaXMudXBkYXRlKCk7XG5cdFx0fSxcblx0XHRjYWxjdWxhdGVUb3RhbDogZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR0aGlzLnRvdGFsID0gMDtcblx0XHRcdGhlbHBlcnMuZWFjaChkYXRhLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHR0aGlzLnRvdGFsICs9IHNlZ21lbnQudmFsdWU7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdFx0dGhpcy5zY2FsZS52YWx1ZXNDb3VudCA9IHRoaXMuc2VnbWVudHMubGVuZ3RoO1xuXHRcdH0sXG5cdFx0dXBkYXRlU2NhbGVSYW5nZTogZnVuY3Rpb24oZGF0YXBvaW50cyl7XG5cdFx0XHR2YXIgdmFsdWVzQXJyYXkgPSBbXTtcblx0XHRcdGhlbHBlcnMuZWFjaChkYXRhcG9pbnRzLGZ1bmN0aW9uKHNlZ21lbnQpe1xuXHRcdFx0XHR2YWx1ZXNBcnJheS5wdXNoKHNlZ21lbnQudmFsdWUpO1xuXHRcdFx0fSk7XG5cblx0XHRcdHZhciBzY2FsZVNpemVzID0gKHRoaXMub3B0aW9ucy5zY2FsZU92ZXJyaWRlKSA/XG5cdFx0XHRcdHtcblx0XHRcdFx0XHRzdGVwczogdGhpcy5vcHRpb25zLnNjYWxlU3RlcHMsXG5cdFx0XHRcdFx0c3RlcFZhbHVlOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwV2lkdGgsXG5cdFx0XHRcdFx0bWluOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGFydFZhbHVlLFxuXHRcdFx0XHRcdG1heDogdGhpcy5vcHRpb25zLnNjYWxlU3RhcnRWYWx1ZSArICh0aGlzLm9wdGlvbnMuc2NhbGVTdGVwcyAqIHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBXaWR0aClcblx0XHRcdFx0fSA6XG5cdFx0XHRcdGhlbHBlcnMuY2FsY3VsYXRlU2NhbGVSYW5nZShcblx0XHRcdFx0XHR2YWx1ZXNBcnJheSxcblx0XHRcdFx0XHRoZWxwZXJzLm1pbihbdGhpcy5jaGFydC53aWR0aCwgdGhpcy5jaGFydC5oZWlnaHRdKS8yLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUZvbnRTaXplLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUJlZ2luQXRaZXJvLFxuXHRcdFx0XHRcdHRoaXMub3B0aW9ucy5zY2FsZUludGVnZXJzT25seVxuXHRcdFx0XHQpO1xuXG5cdFx0XHRoZWxwZXJzLmV4dGVuZChcblx0XHRcdFx0dGhpcy5zY2FsZSxcblx0XHRcdFx0c2NhbGVTaXplcyxcblx0XHRcdFx0e1xuXHRcdFx0XHRcdHNpemU6IGhlbHBlcnMubWluKFt0aGlzLmNoYXJ0LndpZHRoLCB0aGlzLmNoYXJ0LmhlaWdodF0pLFxuXHRcdFx0XHRcdHhDZW50ZXI6IHRoaXMuY2hhcnQud2lkdGgvMixcblx0XHRcdFx0XHR5Q2VudGVyOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHRcdH1cblx0XHRcdCk7XG5cblx0XHR9LFxuXHRcdHVwZGF0ZSA6IGZ1bmN0aW9uKCl7XG5cdFx0XHR0aGlzLmNhbGN1bGF0ZVRvdGFsKHRoaXMuc2VnbWVudHMpO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cyxmdW5jdGlvbihzZWdtZW50KXtcblx0XHRcdFx0c2VnbWVudC5zYXZlKCk7XG5cdFx0XHR9KTtcblx0XHRcdFxuXHRcdFx0dGhpcy5yZWZsb3coKTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHRyZWZsb3cgOiBmdW5jdGlvbigpe1xuXHRcdFx0aGVscGVycy5leHRlbmQodGhpcy5TZWdtZW50QXJjLnByb3RvdHlwZSx7XG5cdFx0XHRcdHggOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHkgOiB0aGlzLmNoYXJ0LmhlaWdodC8yXG5cdFx0XHR9KTtcblx0XHRcdHRoaXMudXBkYXRlU2NhbGVSYW5nZSh0aGlzLnNlZ21lbnRzKTtcblx0XHRcdHRoaXMuc2NhbGUudXBkYXRlKCk7XG5cblx0XHRcdGhlbHBlcnMuZXh0ZW5kKHRoaXMuc2NhbGUse1xuXHRcdFx0XHR4Q2VudGVyOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHlDZW50ZXI6IHRoaXMuY2hhcnQuaGVpZ2h0LzJcblx0XHRcdH0pO1xuXG5cdFx0XHRoZWxwZXJzLmVhY2godGhpcy5zZWdtZW50cywgZnVuY3Rpb24oc2VnbWVudCl7XG5cdFx0XHRcdHNlZ21lbnQudXBkYXRlKHtcblx0XHRcdFx0XHRvdXRlclJhZGl1cyA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHNlZ21lbnQudmFsdWUpXG5cdFx0XHRcdH0pO1xuXHRcdFx0fSwgdGhpcyk7XG5cblx0XHR9LFxuXHRcdGRyYXcgOiBmdW5jdGlvbihlYXNlKXtcblx0XHRcdHZhciBlYXNpbmdEZWNpbWFsID0gZWFzZSB8fCAxO1xuXHRcdFx0Ly9DbGVhciAmIGRyYXcgdGhlIGNhbnZhc1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0aGVscGVycy5lYWNoKHRoaXMuc2VnbWVudHMsZnVuY3Rpb24oc2VnbWVudCwgaW5kZXgpe1xuXHRcdFx0XHRzZWdtZW50LnRyYW5zaXRpb24oe1xuXHRcdFx0XHRcdGNpcmN1bWZlcmVuY2UgOiB0aGlzLnNjYWxlLmdldENpcmN1bWZlcmVuY2UoKSxcblx0XHRcdFx0XHRvdXRlclJhZGl1cyA6IHRoaXMuc2NhbGUuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KHNlZ21lbnQudmFsdWUpXG5cdFx0XHRcdH0sZWFzaW5nRGVjaW1hbCk7XG5cblx0XHRcdFx0c2VnbWVudC5lbmRBbmdsZSA9IHNlZ21lbnQuc3RhcnRBbmdsZSArIHNlZ21lbnQuY2lyY3VtZmVyZW5jZTtcblxuXHRcdFx0XHQvLyBJZiB3ZSd2ZSByZW1vdmVkIHRoZSBmaXJzdCBzZWdtZW50IHdlIG5lZWQgdG8gc2V0IHRoZSBmaXJzdCBvbmUgdG9cblx0XHRcdFx0Ly8gc3RhcnQgYXQgdGhlIHRvcC5cblx0XHRcdFx0aWYgKGluZGV4ID09PSAwKXtcblx0XHRcdFx0XHRzZWdtZW50LnN0YXJ0QW5nbGUgPSBNYXRoLlBJICogMS41O1xuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9DaGVjayB0byBzZWUgaWYgaXQncyB0aGUgbGFzdCBzZWdtZW50LCBpZiBub3QgZ2V0IHRoZSBuZXh0IGFuZCB1cGRhdGUgdGhlIHN0YXJ0IGFuZ2xlXG5cdFx0XHRcdGlmIChpbmRleCA8IHRoaXMuc2VnbWVudHMubGVuZ3RoIC0gMSl7XG5cdFx0XHRcdFx0dGhpcy5zZWdtZW50c1tpbmRleCsxXS5zdGFydEFuZ2xlID0gc2VnbWVudC5lbmRBbmdsZTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWdtZW50LmRyYXcoKTtcblx0XHRcdH0sIHRoaXMpO1xuXHRcdFx0dGhpcy5zY2FsZS5kcmF3KCk7XG5cdFx0fVxuXHR9KTtcblxufSkuY2FsbCh0aGlzKTtcblxuKGZ1bmN0aW9uKCl7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciByb290ID0gdGhpcyxcblx0XHRDaGFydCA9IHJvb3QuQ2hhcnQsXG5cdFx0aGVscGVycyA9IENoYXJ0LmhlbHBlcnM7XG5cblxuXG5cdENoYXJ0LlR5cGUuZXh0ZW5kKHtcblx0XHRuYW1lOiBcIlJhZGFyXCIsXG5cdFx0ZGVmYXVsdHM6e1xuXHRcdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGxpbmVzIGZvciBlYWNoIHNjYWxlIHBvaW50XG5cdFx0XHRzY2FsZVNob3dMaW5lIDogdHJ1ZSxcblxuXHRcdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB3ZSBzaG93IHRoZSBhbmdsZSBsaW5lcyBvdXQgb2YgdGhlIHJhZGFyXG5cdFx0XHRhbmdsZVNob3dMaW5lT3V0IDogdHJ1ZSxcblxuXHRcdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGxhYmVscyBvbiB0aGUgc2NhbGVcblx0XHRcdHNjYWxlU2hvd0xhYmVscyA6IGZhbHNlLFxuXG5cdFx0XHQvLyBCb29sZWFuIC0gV2hldGhlciB0aGUgc2NhbGUgc2hvdWxkIGJlZ2luIGF0IHplcm9cblx0XHRcdHNjYWxlQmVnaW5BdFplcm8gOiB0cnVlLFxuXG5cdFx0XHQvL1N0cmluZyAtIENvbG91ciBvZiB0aGUgYW5nbGUgbGluZVxuXHRcdFx0YW5nbGVMaW5lQ29sb3IgOiBcInJnYmEoMCwwLDAsLjEpXCIsXG5cblx0XHRcdC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgdGhlIGFuZ2xlIGxpbmVcblx0XHRcdGFuZ2xlTGluZVdpZHRoIDogMSxcblxuXHRcdFx0Ly9OdW1iZXIgLSBJbnRlcnZhbCBhdCB3aGljaCB0byBkcmF3IGFuZ2xlIGxpbmVzIChcImV2ZXJ5IE50aCBwb2ludFwiKVxuXHRcdFx0YW5nbGVMaW5lSW50ZXJ2YWw6IDEsXG5cblx0XHRcdC8vU3RyaW5nIC0gUG9pbnQgbGFiZWwgZm9udCBkZWNsYXJhdGlvblxuXHRcdFx0cG9pbnRMYWJlbEZvbnRGYW1pbHkgOiBcIidBcmlhbCdcIixcblxuXHRcdFx0Ly9TdHJpbmcgLSBQb2ludCBsYWJlbCBmb250IHdlaWdodFxuXHRcdFx0cG9pbnRMYWJlbEZvbnRTdHlsZSA6IFwibm9ybWFsXCIsXG5cblx0XHRcdC8vTnVtYmVyIC0gUG9pbnQgbGFiZWwgZm9udCBzaXplIGluIHBpeGVsc1xuXHRcdFx0cG9pbnRMYWJlbEZvbnRTaXplIDogMTAsXG5cblx0XHRcdC8vU3RyaW5nIC0gUG9pbnQgbGFiZWwgZm9udCBjb2xvdXJcblx0XHRcdHBvaW50TGFiZWxGb250Q29sb3IgOiBcIiM2NjZcIixcblxuXHRcdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgZG90IGZvciBlYWNoIHBvaW50XG5cdFx0XHRwb2ludERvdCA6IHRydWUsXG5cblx0XHRcdC8vTnVtYmVyIC0gUmFkaXVzIG9mIGVhY2ggcG9pbnQgZG90IGluIHBpeGVsc1xuXHRcdFx0cG9pbnREb3RSYWRpdXMgOiAzLFxuXG5cdFx0XHQvL051bWJlciAtIFBpeGVsIHdpZHRoIG9mIHBvaW50IGRvdCBzdHJva2Vcblx0XHRcdHBvaW50RG90U3Ryb2tlV2lkdGggOiAxLFxuXG5cdFx0XHQvL051bWJlciAtIGFtb3VudCBleHRyYSB0byBhZGQgdG8gdGhlIHJhZGl1cyB0byBjYXRlciBmb3IgaGl0IGRldGVjdGlvbiBvdXRzaWRlIHRoZSBkcmF3biBwb2ludFxuXHRcdFx0cG9pbnRIaXREZXRlY3Rpb25SYWRpdXMgOiAyMCxcblxuXHRcdFx0Ly9Cb29sZWFuIC0gV2hldGhlciB0byBzaG93IGEgc3Ryb2tlIGZvciBkYXRhc2V0c1xuXHRcdFx0ZGF0YXNldFN0cm9rZSA6IHRydWUsXG5cblx0XHRcdC8vTnVtYmVyIC0gUGl4ZWwgd2lkdGggb2YgZGF0YXNldCBzdHJva2Vcblx0XHRcdGRhdGFzZXRTdHJva2VXaWR0aCA6IDIsXG5cblx0XHRcdC8vQm9vbGVhbiAtIFdoZXRoZXIgdG8gZmlsbCB0aGUgZGF0YXNldCB3aXRoIGEgY29sb3VyXG5cdFx0XHRkYXRhc2V0RmlsbCA6IHRydWUsXG5cblx0XHRcdC8vU3RyaW5nIC0gQSBsZWdlbmQgdGVtcGxhdGVcblx0XHRcdGxlZ2VuZFRlbXBsYXRlIDogXCI8dWwgY2xhc3M9XFxcIjwlPW5hbWUudG9Mb3dlckNhc2UoKSU+LWxlZ2VuZFxcXCI+PCUgZm9yICh2YXIgaT0wOyBpPGRhdGFzZXRzLmxlbmd0aDsgaSsrKXslPjxsaT48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLWljb25cXFwiIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOjwlPWRhdGFzZXRzW2ldLnN0cm9rZUNvbG9yJT5cXFwiPjwvc3Bhbj48c3BhbiBjbGFzcz1cXFwiPCU9bmFtZS50b0xvd2VyQ2FzZSgpJT4tbGVnZW5kLXRleHRcXFwiPjwlaWYoZGF0YXNldHNbaV0ubGFiZWwpeyU+PCU9ZGF0YXNldHNbaV0ubGFiZWwlPjwlfSU+PC9zcGFuPjwvbGk+PCV9JT48L3VsPlwiXG5cblx0XHR9LFxuXG5cdFx0aW5pdGlhbGl6ZTogZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR0aGlzLlBvaW50Q2xhc3MgPSBDaGFydC5Qb2ludC5leHRlbmQoe1xuXHRcdFx0XHRzdHJva2VXaWR0aCA6IHRoaXMub3B0aW9ucy5wb2ludERvdFN0cm9rZVdpZHRoLFxuXHRcdFx0XHRyYWRpdXMgOiB0aGlzLm9wdGlvbnMucG9pbnREb3RSYWRpdXMsXG5cdFx0XHRcdGRpc3BsYXk6IHRoaXMub3B0aW9ucy5wb2ludERvdCxcblx0XHRcdFx0aGl0RGV0ZWN0aW9uUmFkaXVzIDogdGhpcy5vcHRpb25zLnBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzLFxuXHRcdFx0XHRjdHggOiB0aGlzLmNoYXJ0LmN0eFxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMuZGF0YXNldHMgPSBbXTtcblxuXHRcdFx0dGhpcy5idWlsZFNjYWxlKGRhdGEpO1xuXG5cdFx0XHQvL1NldCB1cCB0b29sdGlwIGV2ZW50cyBvbiB0aGUgY2hhcnRcblx0XHRcdGlmICh0aGlzLm9wdGlvbnMuc2hvd1Rvb2x0aXBzKXtcblx0XHRcdFx0aGVscGVycy5iaW5kRXZlbnRzKHRoaXMsIHRoaXMub3B0aW9ucy50b29sdGlwRXZlbnRzLCBmdW5jdGlvbihldnQpe1xuXHRcdFx0XHRcdHZhciBhY3RpdmVQb2ludHNDb2xsZWN0aW9uID0gKGV2dC50eXBlICE9PSAnbW91c2VvdXQnKSA/IHRoaXMuZ2V0UG9pbnRzQXRFdmVudChldnQpIDogW107XG5cblx0XHRcdFx0XHR0aGlzLmVhY2hQb2ludHMoZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRcdFx0cG9pbnQucmVzdG9yZShbJ2ZpbGxDb2xvcicsICdzdHJva2VDb2xvciddKTtcblx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRoZWxwZXJzLmVhY2goYWN0aXZlUG9pbnRzQ29sbGVjdGlvbiwgZnVuY3Rpb24oYWN0aXZlUG9pbnQpe1xuXHRcdFx0XHRcdFx0YWN0aXZlUG9pbnQuZmlsbENvbG9yID0gYWN0aXZlUG9pbnQuaGlnaGxpZ2h0RmlsbDtcblx0XHRcdFx0XHRcdGFjdGl2ZVBvaW50LnN0cm9rZUNvbG9yID0gYWN0aXZlUG9pbnQuaGlnaGxpZ2h0U3Ryb2tlO1xuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0dGhpcy5zaG93VG9vbHRpcChhY3RpdmVQb2ludHNDb2xsZWN0aW9uKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vSXRlcmF0ZSB0aHJvdWdoIGVhY2ggb2YgdGhlIGRhdGFzZXRzLCBhbmQgYnVpbGQgdGhpcyBpbnRvIGEgcHJvcGVydHkgb2YgdGhlIGNoYXJ0XG5cdFx0XHRoZWxwZXJzLmVhY2goZGF0YS5kYXRhc2V0cyxmdW5jdGlvbihkYXRhc2V0KXtcblxuXHRcdFx0XHR2YXIgZGF0YXNldE9iamVjdCA9IHtcblx0XHRcdFx0XHRsYWJlbDogZGF0YXNldC5sYWJlbCB8fCBudWxsLFxuXHRcdFx0XHRcdGZpbGxDb2xvciA6IGRhdGFzZXQuZmlsbENvbG9yLFxuXHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogZGF0YXNldC5zdHJva2VDb2xvcixcblx0XHRcdFx0XHRwb2ludENvbG9yIDogZGF0YXNldC5wb2ludENvbG9yLFxuXHRcdFx0XHRcdHBvaW50U3Ryb2tlQ29sb3IgOiBkYXRhc2V0LnBvaW50U3Ryb2tlQ29sb3IsXG5cdFx0XHRcdFx0cG9pbnRzIDogW11cblx0XHRcdFx0fTtcblxuXHRcdFx0XHR0aGlzLmRhdGFzZXRzLnB1c2goZGF0YXNldE9iamVjdCk7XG5cblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQuZGF0YSxmdW5jdGlvbihkYXRhUG9pbnQsaW5kZXgpe1xuXHRcdFx0XHRcdC8vQWRkIGEgbmV3IHBvaW50IGZvciBlYWNoIHBpZWNlIG9mIGRhdGEsIHBhc3NpbmcgYW55IHJlcXVpcmVkIGRhdGEgdG8gZHJhdy5cblx0XHRcdFx0XHR2YXIgcG9pbnRQb3NpdGlvbjtcblx0XHRcdFx0XHRpZiAoIXRoaXMuc2NhbGUuYW5pbWF0aW9uKXtcblx0XHRcdFx0XHRcdHBvaW50UG9zaXRpb24gPSB0aGlzLnNjYWxlLmdldFBvaW50UG9zaXRpb24oaW5kZXgsIHRoaXMuc2NhbGUuY2FsY3VsYXRlQ2VudGVyT2Zmc2V0KGRhdGFQb2ludCkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRkYXRhc2V0T2JqZWN0LnBvaW50cy5wdXNoKG5ldyB0aGlzLlBvaW50Q2xhc3Moe1xuXHRcdFx0XHRcdFx0dmFsdWUgOiBkYXRhUG9pbnQsXG5cdFx0XHRcdFx0XHRsYWJlbCA6IGRhdGEubGFiZWxzW2luZGV4XSxcblx0XHRcdFx0XHRcdGRhdGFzZXRMYWJlbDogZGF0YXNldC5sYWJlbCxcblx0XHRcdFx0XHRcdHg6ICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSA/IHRoaXMuc2NhbGUueENlbnRlciA6IHBvaW50UG9zaXRpb24ueCxcblx0XHRcdFx0XHRcdHk6ICh0aGlzLm9wdGlvbnMuYW5pbWF0aW9uKSA/IHRoaXMuc2NhbGUueUNlbnRlciA6IHBvaW50UG9zaXRpb24ueSxcblx0XHRcdFx0XHRcdHN0cm9rZUNvbG9yIDogZGF0YXNldC5wb2ludFN0cm9rZUNvbG9yLFxuXHRcdFx0XHRcdFx0ZmlsbENvbG9yIDogZGF0YXNldC5wb2ludENvbG9yLFxuXHRcdFx0XHRcdFx0aGlnaGxpZ2h0RmlsbCA6IGRhdGFzZXQucG9pbnRIaWdobGlnaHRGaWxsIHx8IGRhdGFzZXQucG9pbnRDb2xvcixcblx0XHRcdFx0XHRcdGhpZ2hsaWdodFN0cm9rZSA6IGRhdGFzZXQucG9pbnRIaWdobGlnaHRTdHJva2UgfHwgZGF0YXNldC5wb2ludFN0cm9rZUNvbG9yXG5cdFx0XHRcdFx0fSkpO1xuXHRcdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR0aGlzLnJlbmRlcigpO1xuXHRcdH0sXG5cdFx0ZWFjaFBvaW50cyA6IGZ1bmN0aW9uKGNhbGxiYWNrKXtcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5wb2ludHMsY2FsbGJhY2ssdGhpcyk7XG5cdFx0XHR9LHRoaXMpO1xuXHRcdH0sXG5cblx0XHRnZXRQb2ludHNBdEV2ZW50IDogZnVuY3Rpb24oZXZ0KXtcblx0XHRcdHZhciBtb3VzZVBvc2l0aW9uID0gaGVscGVycy5nZXRSZWxhdGl2ZVBvc2l0aW9uKGV2dCksXG5cdFx0XHRcdGZyb21DZW50ZXIgPSBoZWxwZXJzLmdldEFuZ2xlRnJvbVBvaW50KHtcblx0XHRcdFx0XHR4OiB0aGlzLnNjYWxlLnhDZW50ZXIsXG5cdFx0XHRcdFx0eTogdGhpcy5zY2FsZS55Q2VudGVyXG5cdFx0XHRcdH0sIG1vdXNlUG9zaXRpb24pO1xuXG5cdFx0XHR2YXIgYW5nbGVQZXJJbmRleCA9IChNYXRoLlBJICogMikgL3RoaXMuc2NhbGUudmFsdWVzQ291bnQsXG5cdFx0XHRcdHBvaW50SW5kZXggPSBNYXRoLnJvdW5kKChmcm9tQ2VudGVyLmFuZ2xlIC0gTWF0aC5QSSAqIDEuNSkgLyBhbmdsZVBlckluZGV4KSxcblx0XHRcdFx0YWN0aXZlUG9pbnRzQ29sbGVjdGlvbiA9IFtdO1xuXG5cdFx0XHQvLyBJZiB3ZSdyZSBhdCB0aGUgdG9wLCBtYWtlIHRoZSBwb2ludEluZGV4IDAgdG8gZ2V0IHRoZSBmaXJzdCBvZiB0aGUgYXJyYXkuXG5cdFx0XHRpZiAocG9pbnRJbmRleCA+PSB0aGlzLnNjYWxlLnZhbHVlc0NvdW50IHx8IHBvaW50SW5kZXggPCAwKXtcblx0XHRcdFx0cG9pbnRJbmRleCA9IDA7XG5cdFx0XHR9XG5cblx0XHRcdGlmIChmcm9tQ2VudGVyLmRpc3RhbmNlIDw9IHRoaXMuc2NhbGUuZHJhd2luZ0FyZWEpe1xuXHRcdFx0XHRoZWxwZXJzLmVhY2godGhpcy5kYXRhc2V0cywgZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdFx0YWN0aXZlUG9pbnRzQ29sbGVjdGlvbi5wdXNoKGRhdGFzZXQucG9pbnRzW3BvaW50SW5kZXhdKTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBhY3RpdmVQb2ludHNDb2xsZWN0aW9uO1xuXHRcdH0sXG5cblx0XHRidWlsZFNjYWxlIDogZnVuY3Rpb24oZGF0YSl7XG5cdFx0XHR0aGlzLnNjYWxlID0gbmV3IENoYXJ0LlJhZGlhbFNjYWxlKHtcblx0XHRcdFx0ZGlzcGxheTogdGhpcy5vcHRpb25zLnNob3dTY2FsZSxcblx0XHRcdFx0Zm9udFN0eWxlOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250U3R5bGUsXG5cdFx0XHRcdGZvbnRTaXplOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250U2l6ZSxcblx0XHRcdFx0Zm9udEZhbWlseTogdGhpcy5vcHRpb25zLnNjYWxlRm9udEZhbWlseSxcblx0XHRcdFx0Zm9udENvbG9yOiB0aGlzLm9wdGlvbnMuc2NhbGVGb250Q29sb3IsXG5cdFx0XHRcdHNob3dMYWJlbHM6IHRoaXMub3B0aW9ucy5zY2FsZVNob3dMYWJlbHMsXG5cdFx0XHRcdHNob3dMYWJlbEJhY2tkcm9wOiB0aGlzLm9wdGlvbnMuc2NhbGVTaG93TGFiZWxCYWNrZHJvcCxcblx0XHRcdFx0YmFja2Ryb3BDb2xvcjogdGhpcy5vcHRpb25zLnNjYWxlQmFja2Ryb3BDb2xvcixcblx0XHRcdFx0YmFja2dyb3VuZENvbG9yczogdGhpcy5vcHRpb25zLnNjYWxlQmFja2dyb3VuZENvbG9ycyxcblx0XHRcdFx0YmFja2Ryb3BQYWRkaW5nWSA6IHRoaXMub3B0aW9ucy5zY2FsZUJhY2tkcm9wUGFkZGluZ1ksXG5cdFx0XHRcdGJhY2tkcm9wUGFkZGluZ1g6IHRoaXMub3B0aW9ucy5zY2FsZUJhY2tkcm9wUGFkZGluZ1gsXG5cdFx0XHRcdGxpbmVXaWR0aDogKHRoaXMub3B0aW9ucy5zY2FsZVNob3dMaW5lKSA/IHRoaXMub3B0aW9ucy5zY2FsZUxpbmVXaWR0aCA6IDAsXG5cdFx0XHRcdGxpbmVDb2xvcjogdGhpcy5vcHRpb25zLnNjYWxlTGluZUNvbG9yLFxuXHRcdFx0XHRhbmdsZUxpbmVDb2xvciA6IHRoaXMub3B0aW9ucy5hbmdsZUxpbmVDb2xvcixcblx0XHRcdFx0YW5nbGVMaW5lV2lkdGggOiAodGhpcy5vcHRpb25zLmFuZ2xlU2hvd0xpbmVPdXQpID8gdGhpcy5vcHRpb25zLmFuZ2xlTGluZVdpZHRoIDogMCxcbiAgICAgICAgYW5nbGVMaW5lSW50ZXJ2YWw6ICh0aGlzLm9wdGlvbnMuYW5nbGVMaW5lSW50ZXJ2YWwpID8gdGhpcy5vcHRpb25zLmFuZ2xlTGluZUludGVydmFsIDogMSxcblx0XHRcdFx0Ly8gUG9pbnQgbGFiZWxzIGF0IHRoZSBlZGdlIG9mIGVhY2ggbGluZVxuXHRcdFx0XHRwb2ludExhYmVsRm9udENvbG9yIDogdGhpcy5vcHRpb25zLnBvaW50TGFiZWxGb250Q29sb3IsXG5cdFx0XHRcdHBvaW50TGFiZWxGb250U2l6ZSA6IHRoaXMub3B0aW9ucy5wb2ludExhYmVsRm9udFNpemUsXG5cdFx0XHRcdHBvaW50TGFiZWxGb250RmFtaWx5IDogdGhpcy5vcHRpb25zLnBvaW50TGFiZWxGb250RmFtaWx5LFxuXHRcdFx0XHRwb2ludExhYmVsRm9udFN0eWxlIDogdGhpcy5vcHRpb25zLnBvaW50TGFiZWxGb250U3R5bGUsXG5cdFx0XHRcdGhlaWdodCA6IHRoaXMuY2hhcnQuaGVpZ2h0LFxuXHRcdFx0XHR3aWR0aDogdGhpcy5jaGFydC53aWR0aCxcblx0XHRcdFx0eENlbnRlcjogdGhpcy5jaGFydC53aWR0aC8yLFxuXHRcdFx0XHR5Q2VudGVyOiB0aGlzLmNoYXJ0LmhlaWdodC8yLFxuXHRcdFx0XHRjdHggOiB0aGlzLmNoYXJ0LmN0eCxcblx0XHRcdFx0dGVtcGxhdGVTdHJpbmc6IHRoaXMub3B0aW9ucy5zY2FsZUxhYmVsLFxuXHRcdFx0XHRsYWJlbHM6IGRhdGEubGFiZWxzLFxuXHRcdFx0XHR2YWx1ZXNDb3VudDogZGF0YS5kYXRhc2V0c1swXS5kYXRhLmxlbmd0aFxuXHRcdFx0fSk7XG5cblx0XHRcdHRoaXMuc2NhbGUuc2V0U2NhbGVTaXplKCk7XG5cdFx0XHR0aGlzLnVwZGF0ZVNjYWxlUmFuZ2UoZGF0YS5kYXRhc2V0cyk7XG5cdFx0XHR0aGlzLnNjYWxlLmJ1aWxkWUxhYmVscygpO1xuXHRcdH0sXG5cdFx0dXBkYXRlU2NhbGVSYW5nZTogZnVuY3Rpb24oZGF0YXNldHMpe1xuXHRcdFx0dmFyIHZhbHVlc0FycmF5ID0gKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdHZhciB0b3RhbERhdGFBcnJheSA9IFtdO1xuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldHMsZnVuY3Rpb24oZGF0YXNldCl7XG5cdFx0XHRcdFx0aWYgKGRhdGFzZXQuZGF0YSl7XG5cdFx0XHRcdFx0XHR0b3RhbERhdGFBcnJheSA9IHRvdGFsRGF0YUFycmF5LmNvbmNhdChkYXRhc2V0LmRhdGEpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNlIHtcblx0XHRcdFx0XHRcdGhlbHBlcnMuZWFjaChkYXRhc2V0LnBvaW50cywgZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRcdFx0XHR0b3RhbERhdGFBcnJheS5wdXNoKHBvaW50LnZhbHVlKTtcblx0XHRcdFx0XHRcdH0pO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSk7XG5cdFx0XHRcdHJldHVybiB0b3RhbERhdGFBcnJheTtcblx0XHRcdH0pKCk7XG5cblxuXHRcdFx0dmFyIHNjYWxlU2l6ZXMgPSAodGhpcy5vcHRpb25zLnNjYWxlT3ZlcnJpZGUpID9cblx0XHRcdFx0e1xuXHRcdFx0XHRcdHN0ZXBzOiB0aGlzLm9wdGlvbnMuc2NhbGVTdGVwcyxcblx0XHRcdFx0XHRzdGVwVmFsdWU6IHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBXaWR0aCxcblx0XHRcdFx0XHRtaW46IHRoaXMub3B0aW9ucy5zY2FsZVN0YXJ0VmFsdWUsXG5cdFx0XHRcdFx0bWF4OiB0aGlzLm9wdGlvbnMuc2NhbGVTdGFydFZhbHVlICsgKHRoaXMub3B0aW9ucy5zY2FsZVN0ZXBzICogdGhpcy5vcHRpb25zLnNjYWxlU3RlcFdpZHRoKVxuXHRcdFx0XHR9IDpcblx0XHRcdFx0aGVscGVycy5jYWxjdWxhdGVTY2FsZVJhbmdlKFxuXHRcdFx0XHRcdHZhbHVlc0FycmF5LFxuXHRcdFx0XHRcdGhlbHBlcnMubWluKFt0aGlzLmNoYXJ0LndpZHRoLCB0aGlzLmNoYXJ0LmhlaWdodF0pLzIsXG5cdFx0XHRcdFx0dGhpcy5vcHRpb25zLnNjYWxlRm9udFNpemUsXG5cdFx0XHRcdFx0dGhpcy5vcHRpb25zLnNjYWxlQmVnaW5BdFplcm8sXG5cdFx0XHRcdFx0dGhpcy5vcHRpb25zLnNjYWxlSW50ZWdlcnNPbmx5XG5cdFx0XHRcdCk7XG5cblx0XHRcdGhlbHBlcnMuZXh0ZW5kKFxuXHRcdFx0XHR0aGlzLnNjYWxlLFxuXHRcdFx0XHRzY2FsZVNpemVzXG5cdFx0XHQpO1xuXG5cdFx0fSxcblx0XHRhZGREYXRhIDogZnVuY3Rpb24odmFsdWVzQXJyYXksbGFiZWwpe1xuXHRcdFx0Ly9NYXAgdGhlIHZhbHVlcyBhcnJheSBmb3IgZWFjaCBvZiB0aGUgZGF0YXNldHNcblx0XHRcdHRoaXMuc2NhbGUudmFsdWVzQ291bnQrKztcblx0XHRcdGhlbHBlcnMuZWFjaCh2YWx1ZXNBcnJheSxmdW5jdGlvbih2YWx1ZSxkYXRhc2V0SW5kZXgpe1xuXHRcdFx0XHR2YXIgcG9pbnRQb3NpdGlvbiA9IHRoaXMuc2NhbGUuZ2V0UG9pbnRQb3NpdGlvbih0aGlzLnNjYWxlLnZhbHVlc0NvdW50LCB0aGlzLnNjYWxlLmNhbGN1bGF0ZUNlbnRlck9mZnNldCh2YWx1ZSkpO1xuXHRcdFx0XHR0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRzLnB1c2gobmV3IHRoaXMuUG9pbnRDbGFzcyh7XG5cdFx0XHRcdFx0dmFsdWUgOiB2YWx1ZSxcblx0XHRcdFx0XHRsYWJlbCA6IGxhYmVsLFxuXHRcdFx0XHRcdGRhdGFzZXRMYWJlbDogdGhpcy5kYXRhc2V0c1tkYXRhc2V0SW5kZXhdLmxhYmVsLFxuXHRcdFx0XHRcdHg6IHBvaW50UG9zaXRpb24ueCxcblx0XHRcdFx0XHR5OiBwb2ludFBvc2l0aW9uLnksXG5cdFx0XHRcdFx0c3Ryb2tlQ29sb3IgOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRTdHJva2VDb2xvcixcblx0XHRcdFx0XHRmaWxsQ29sb3IgOiB0aGlzLmRhdGFzZXRzW2RhdGFzZXRJbmRleF0ucG9pbnRDb2xvclxuXHRcdFx0XHR9KSk7XG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0XHR0aGlzLnNjYWxlLmxhYmVscy5wdXNoKGxhYmVsKTtcblxuXHRcdFx0dGhpcy5yZWZsb3coKTtcblxuXHRcdFx0dGhpcy51cGRhdGUoKTtcblx0XHR9LFxuXHRcdHJlbW92ZURhdGEgOiBmdW5jdGlvbigpe1xuXHRcdFx0dGhpcy5zY2FsZS52YWx1ZXNDb3VudC0tO1xuXHRcdFx0dGhpcy5zY2FsZS5sYWJlbHMuc2hpZnQoKTtcblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXHRcdFx0XHRkYXRhc2V0LnBvaW50cy5zaGlmdCgpO1xuXHRcdFx0fSx0aGlzKTtcblx0XHRcdHRoaXMucmVmbG93KCk7XG5cdFx0XHR0aGlzLnVwZGF0ZSgpO1xuXHRcdH0sXG5cdFx0dXBkYXRlIDogZnVuY3Rpb24oKXtcblx0XHRcdHRoaXMuZWFjaFBvaW50cyhmdW5jdGlvbihwb2ludCl7XG5cdFx0XHRcdHBvaW50LnNhdmUoKTtcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy5yZWZsb3coKTtcblx0XHRcdHRoaXMucmVuZGVyKCk7XG5cdFx0fSxcblx0XHRyZWZsb3c6IGZ1bmN0aW9uKCl7XG5cdFx0XHRoZWxwZXJzLmV4dGVuZCh0aGlzLnNjYWxlLCB7XG5cdFx0XHRcdHdpZHRoIDogdGhpcy5jaGFydC53aWR0aCxcblx0XHRcdFx0aGVpZ2h0OiB0aGlzLmNoYXJ0LmhlaWdodCxcblx0XHRcdFx0c2l6ZSA6IGhlbHBlcnMubWluKFt0aGlzLmNoYXJ0LndpZHRoLCB0aGlzLmNoYXJ0LmhlaWdodF0pLFxuXHRcdFx0XHR4Q2VudGVyOiB0aGlzLmNoYXJ0LndpZHRoLzIsXG5cdFx0XHRcdHlDZW50ZXI6IHRoaXMuY2hhcnQuaGVpZ2h0LzJcblx0XHRcdH0pO1xuXHRcdFx0dGhpcy51cGRhdGVTY2FsZVJhbmdlKHRoaXMuZGF0YXNldHMpO1xuXHRcdFx0dGhpcy5zY2FsZS5zZXRTY2FsZVNpemUoKTtcblx0XHRcdHRoaXMuc2NhbGUuYnVpbGRZTGFiZWxzKCk7XG5cdFx0fSxcblx0XHRkcmF3IDogZnVuY3Rpb24oZWFzZSl7XG5cdFx0XHR2YXIgZWFzZURlY2ltYWwgPSBlYXNlIHx8IDEsXG5cdFx0XHRcdGN0eCA9IHRoaXMuY2hhcnQuY3R4O1xuXHRcdFx0dGhpcy5jbGVhcigpO1xuXHRcdFx0dGhpcy5zY2FsZS5kcmF3KCk7XG5cblx0XHRcdGhlbHBlcnMuZWFjaCh0aGlzLmRhdGFzZXRzLGZ1bmN0aW9uKGRhdGFzZXQpe1xuXG5cdFx0XHRcdC8vVHJhbnNpdGlvbiBlYWNoIHBvaW50IGZpcnN0IHNvIHRoYXQgdGhlIGxpbmUgYW5kIHBvaW50IGRyYXdpbmcgaXNuJ3Qgb3V0IG9mIHN5bmNcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLGZ1bmN0aW9uKHBvaW50LGluZGV4KXtcblx0XHRcdFx0XHRpZiAocG9pbnQuaGFzVmFsdWUoKSl7XG5cdFx0XHRcdFx0XHRwb2ludC50cmFuc2l0aW9uKHRoaXMuc2NhbGUuZ2V0UG9pbnRQb3NpdGlvbihpbmRleCwgdGhpcy5zY2FsZS5jYWxjdWxhdGVDZW50ZXJPZmZzZXQocG9pbnQudmFsdWUpKSwgZWFzZURlY2ltYWwpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSx0aGlzKTtcblxuXG5cblx0XHRcdFx0Ly9EcmF3IHRoZSBsaW5lIGJldHdlZW4gYWxsIHRoZSBwb2ludHNcblx0XHRcdFx0Y3R4LmxpbmVXaWR0aCA9IHRoaXMub3B0aW9ucy5kYXRhc2V0U3Ryb2tlV2lkdGg7XG5cdFx0XHRcdGN0eC5zdHJva2VTdHlsZSA9IGRhdGFzZXQuc3Ryb2tlQ29sb3I7XG5cdFx0XHRcdGN0eC5iZWdpblBhdGgoKTtcblx0XHRcdFx0aGVscGVycy5lYWNoKGRhdGFzZXQucG9pbnRzLGZ1bmN0aW9uKHBvaW50LGluZGV4KXtcblx0XHRcdFx0XHRpZiAoaW5kZXggPT09IDApe1xuXHRcdFx0XHRcdFx0Y3R4Lm1vdmVUbyhwb2ludC54LHBvaW50LnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0Y3R4LmxpbmVUbyhwb2ludC54LHBvaW50LnkpO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0fSx0aGlzKTtcblx0XHRcdFx0Y3R4LmNsb3NlUGF0aCgpO1xuXHRcdFx0XHRjdHguc3Ryb2tlKCk7XG5cblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IGRhdGFzZXQuZmlsbENvbG9yO1xuXHRcdFx0XHRpZih0aGlzLm9wdGlvbnMuZGF0YXNldEZpbGwpe1xuXHRcdFx0XHRcdGN0eC5maWxsKCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0Ly9Ob3cgZHJhdyB0aGUgcG9pbnRzIG92ZXIgdGhlIGxpbmVcblx0XHRcdFx0Ly9BIGxpdHRsZSBpbmVmZmljaWVudCBkb3VibGUgbG9vcGluZywgYnV0IGJldHRlciB0aGFuIHRoZSBsaW5lXG5cdFx0XHRcdC8vbGFnZ2luZyBiZWhpbmQgdGhlIHBvaW50IHBvc2l0aW9uc1xuXHRcdFx0XHRoZWxwZXJzLmVhY2goZGF0YXNldC5wb2ludHMsZnVuY3Rpb24ocG9pbnQpe1xuXHRcdFx0XHRcdGlmIChwb2ludC5oYXNWYWx1ZSgpKXtcblx0XHRcdFx0XHRcdHBvaW50LmRyYXcoKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHR9LHRoaXMpO1xuXG5cdFx0fVxuXG5cdH0pO1xuXG5cblxuXG5cbn0pLmNhbGwodGhpcyk7XG4iLCJ2YXIgJCA9IHdpbmRvdy4kO1xudmFyIF8gPSB3aW5kb3cuXztcbnZhciBtb21lbnQgPSB3aW5kb3cubW9tZW50O1xudmFyIENoYXJ0ID0gcmVxdWlyZSgnQ2hhcnQuanMnKTtcblxudmFyIGNoYXJ0RGF0YU1vbnRoID0ge1xuICAgIGxhYmVsczogW10sXG4gICAgZGF0YXNldHM6IFtcbiAgICAgICAge1xuICAgICAgICAgICAgbGFiZWw6IFwiUGxheWVyIEFjdGl2aXR5IE1vbnRoIGNoYXJ0XCIsXG4gICAgICAgICAgICBmaWxsQ29sb3I6IFwicmdiYSgyMjAsMjIwLDIyMCwwLjIpXCIsXG4gICAgICAgICAgICBzdHJva2VDb2xvcjogXCJyZ2JhKDIyMCwyMjAsMjIwLDEpXCIsXG4gICAgICAgICAgICBwb2ludENvbG9yOiBcInJnYmEoMjIwLDIyMCwyMjAsMSlcIixcbiAgICAgICAgICAgIHBvaW50U3Ryb2tlQ29sb3I6IFwiI2ZmZlwiLFxuICAgICAgICAgICAgcG9pbnRIaWdobGlnaHRGaWxsOiBcIiNmZmZcIixcbiAgICAgICAgICAgIHBvaW50SGlnaGxpZ2h0U3Ryb2tlOiBcInJnYmEoMjIwLDIyMCwyMjAsMSlcIixcbiAgICAgICAgICAgIGRhdGE6IFtdXG4gICAgICAgIH1cbiAgICBdXG59O1xudmFyIG1vbnRoT3B0aW9ucyA9IHtcbiAgICBzY2FsZVNob3dHcmlkTGluZXMgOiBmYWxzZSxcbiAgICBiZXppZXJDdXJ2ZSA6IGZhbHNlLFxuICAgIGJlemllckN1cnZlVGVuc2lvbiA6IDAuNCxcbiAgICBwb2ludERvdCA6IHRydWUsXG4gICAgcG9pbnREb3RSYWRpdXMgOiA0LFxuICAgIHBvaW50RG90U3Ryb2tlV2lkdGggOiAxLFxuICAgIHBvaW50SGl0RGV0ZWN0aW9uUmFkaXVzIDogNSxcbiAgICBkYXRhc2V0U3Ryb2tlIDogdHJ1ZSxcbiAgICBkYXRhc2V0U3Ryb2tlV2lkdGggOiAyLFxuICAgIGRhdGFzZXRGaWxsIDogdHJ1ZSxcblxuICAgIGFuaW1hdGlvblN0ZXBzOiA2MCxcbiAgICBzY2FsZUZvbnRDb2xvcjogXCIjYWFhXCIsXG4gICAgcmVzcG9uc2l2ZTogdHJ1ZSxcbiAgICBtYWludGFpbkFzcGVjdFJhdGlvOiB0cnVlLFxuICAgIHNjYWxlQmVnaW5BdFplcm86IHRydWUsXG5cbiAgICB0b29sdGlwVGVtcGxhdGU6IFwiPCVpZiAobGFiZWwpeyU+PCU9bGFiZWwlPiA6IDwlfSU+PCU9IHZhbHVlICU+IGdhbWVzXCJcbn07XG5cbmZ1bmN0aW9uIHVwZGF0ZU1vbnRoQ2hhcnREYXRhKGFjdGl2aXR5KSB7XG4gICAgY2hhcnREYXRhTW9udGguZGF0YXNldHNbMF0uZGF0YSA9IFtdO1xuICAgIGNoYXJ0RGF0YU1vbnRoLmxhYmVscyA9IFtdO1xuXG4gICAgdmFyIGxtID0gbW9tZW50KCkudXRjKCkuc3RhcnRPZihcImRheVwiKS5zdWJ0cmFjdCgxNSwgXCJkYXlzXCIpLmFkZCgxLCBcIm1pbnV0ZVwiKSwgdHNtID0gbG07XG4gICAgXy5lYWNoKGFjdGl2aXR5LCBmdW5jdGlvbiAoZGF5KSB7XG4gICAgICAgIHRzbSA9IG1vbWVudChkYXkuZGF0ZSkuc3RhcnRPZihcImRheVwiKTsgLy8sIFwiWVlZWS1NTS1ERCBISDptbTpzc1wiXG4gICAgICAgIGxtLmFkZCgxLCBcImRheXNcIik7XG4gICAgICAgIHdoaWxlIChsbS5pc0JlZm9yZSh0c20pKSB7XG4gICAgICAgICAgICBjaGFydERhdGFNb250aC5sYWJlbHMucHVzaChsbS5mb3JtYXQoXCJkZGQsIEREL01NXCIpKTtcbiAgICAgICAgICAgIGNoYXJ0RGF0YU1vbnRoLmRhdGFzZXRzWzBdLmRhdGEucHVzaCgwKTtcbiAgICAgICAgICAgIGxtLmFkZCgxLCBcImRheXNcIik7XG4gICAgICAgIH1cbiAgICAgICAgY2hhcnREYXRhTW9udGgubGFiZWxzLnB1c2godHNtLmZvcm1hdChcImRkZCwgREQvTU1cIikpO1xuICAgICAgICBjaGFydERhdGFNb250aC5kYXRhc2V0c1swXS5kYXRhLnB1c2goZGF5LmNvdW50KTtcbiAgICB9KTtcblxuICAgIGxtID0gbW9tZW50KCkudXRjKCkuc3RhcnRPZihcImRheVwiKS5hZGQoMiwgXCJtaW51dGVcIik7XG4gICAgdHNtLmFkZCgxLCBcImRheXNcIik7XG4gICAgd2hpbGUgKHRzbS5pc0JlZm9yZShsbSkpIHtcbiAgICAgICAgY2hhcnREYXRhTW9udGgubGFiZWxzLnB1c2godHNtLmZvcm1hdChcImRkZCwgREQvTU1cIikpO1xuICAgICAgICBjaGFydERhdGFNb250aC5kYXRhc2V0c1swXS5kYXRhLnB1c2goMCk7XG4gICAgICAgIHRzbS5hZGQoMSwgXCJkYXlzXCIpO1xuICAgIH1cblxuICAgIHZhciBjdHggPSAkKFwiI3BsYXllci1hY3Rpdml0eS1tb250aFwiKS5nZXQoMCkuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgIHZhciBzZXJ2ZXJIaXN0b3J5Q2hhcnQgPSBuZXcgQ2hhcnQoY3R4KS5MaW5lKGNoYXJ0RGF0YU1vbnRoLCBtb250aE9wdGlvbnMpO1xufVxuXG52YXIgcmVxID0gJC5nZXQoXCIvYXBpL3BsYXllci9hY3Rpdml0eS9cIitlbmNvZGVVUklDb21wb25lbnQoJChcIiNwbGF5ZXItbmFtZVwiKS50ZXh0KCkpLCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICB1cGRhdGVNb250aENoYXJ0RGF0YShyZXN1bHQuYWN0aXZpdHkpO1xufSk7XG4iXX0=
