var _ = window._;
var $ = window.$;
var Chart = require("Chart.js");
var moment = window.moment;

// TODO: this file could use some cleaning up

var clampTimes = [];
var tmm = moment("00:00", "HH:mm");
for (var i = 0; i < 48; i++) {
	clampTimes.push(tmm.format("HH:mm"));
	tmm.add(30, "minutes");
}
var chartDataDay = {
	labels: clampTimes,
	datasets: [
		{
			label: "Server History Day chart",
			fillColor: "rgba(220,220,220,0.2)",
			strokeColor: "rgba(220,220,220,1)",
			pointColor: "rgba(220,220,220,1)",
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: "rgba(220,220,220,1)",
			data: []
		}
	]
};
var chartDataMonth = {
	labels: [],
	datasets: [
		{
			label: "Server History Month chart",
			fillColor: "rgba(220,220,220,0.2)",
			strokeColor: "rgba(220,220,220,1)",
			pointColor: "rgba(220,220,220,1)",
			pointStrokeColor: "#fff",
			pointHighlightFill: "#fff",
			pointHighlightStroke: "rgba(220,220,220,1)",
			data: []
		}
	]
};
var dayOptions = {
	scaleShowGridLines : false,
	bezierCurve : false,
	bezierCurveTension : 0.4,
	pointDot : true,
	pointDotRadius : 3,
	pointDotStrokeWidth : 1,
	pointHitDetectionRadius : 5,
	datasetStroke : true,
	datasetStrokeWidth : 2,
	datasetFill : true,

	animationSteps: 60,
	scaleFontColor: "#aaa",
	responsive: true,
	maintainAspectRatio: true,
	scaleBeginAtZero: true,

	tooltipTemplate: "<%if (label){%><%=label%> : <%}%><%= value %> players"
};
var monthOptions = {
	scaleShowGridLines : false,
	bezierCurve : false,
	bezierCurveTension : 0.4,
	pointDot : true,
	pointDotRadius : 4,
	pointDotStrokeWidth : 1,
	pointHitDetectionRadius : 5,
	datasetStroke : true,
	datasetStrokeWidth : 2,
	datasetFill : true,

	animationSteps: 60,
	scaleFontColor: "#aaa",
	responsive: true,
	maintainAspectRatio: true,
	scaleBeginAtZero: true,

	tooltipTemplate: "<%if (label){%><%=label%> : <%}%><%= value %> games"
};

function updateDayChartData(activity) {
	chartDataDay.datasets[0].data = [];

	var curp = 0;
	_.each(clampTimes, function (time) {
		var doBefore = moment(time, "HH:mm").add(30, "minutes"); //, "hh:mma"
		var sum = 0, cnt = 0;
		while (curp < activity.length && moment(activity[curp].timestamp).isBefore(doBefore)) {
			sum += activity[curp].numplayers;
			cnt++;
			curp++;
		}
		if (cnt) chartDataDay.datasets[0].data.push(parseInt(sum/cnt));
		else chartDataDay.datasets[0].data.push(0);

		if (curp >= activity.length) {
			var nowm = moment().subtract(moment().utcOffset(), "minutes");
			while (doBefore.isBefore(nowm)) {
				doBefore.add(30, "minutes");
				chartDataDay.datasets[0].data.push(0);
			}
			return false;
		}
	});

	var ctx = $("#server-activity-day").get(0).getContext("2d");
	var serverHistoryChart = new Chart(ctx).Line(chartDataDay, dayOptions);
}

function updateMonthChartData(activity) {
	chartDataMonth.datasets[0].data = [];
	chartDataMonth.labels = [];

	var lm = moment().utc().startOf("day").subtract(15, "days").add(1, "minute"), tsm = lm;
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

	lm = moment().utc().startOf("day");
	tsm.add(1, "days");
	while (tsm.isBefore(lm)) {
		chartDataMonth.labels.push(lm.format("ddd, DD/MM"));
		chartDataMonth.datasets[0].data.push(0);
		tsm.add(1, "days");
	}

	var ctx = $("#server-activity-month").get(0).getContext("2d");
	var serverHistoryChart = new Chart(ctx).Line(chartDataMonth, monthOptions);
}

export function loadCharts(host, port) {
	$.get('/api/server/activity/'+host+'/'+port, function(result) {
		updateDayChartData(result.day);
		updateMonthChartData(result.month);
	});
}
