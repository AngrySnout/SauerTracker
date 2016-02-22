import {loadCharts} from "./_server-charts.js";

var addr = $("#server-address").text().split(":");

window.tryLoadBackground($("#map-name").text());
loadCharts(addr[0], addr[1]);
