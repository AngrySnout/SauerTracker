import $ from "jquery";
import foundation from "foundation-sites";
var moment = require('moment');
var _ = require('lodash');
var fdatepicker = require("foundation-datepicker");
import NProgress from 'nprogress';
var url = require('url');
var typeahead = require('typeahead.js');

window.NProgress = NProgress;
window.moment = moment;
window.url = url;

window.dateReflow = function() {
    var now = moment();
    $(".date").each(function (ind, elem) {
        var cd = moment($(this).text()+" +0000"); //, "YYYY-MM-DD HH:mm:ss Z"
        $(this).attr("title", cd.format("dddd, MMMM Do YYYY, HH:mm:ss"));
        if (cd.diff(now, 'hours') >= -22) $(this).text(cd.fromNow());
        else if (cd.diff(now, 'days') >= -7) $(this).text(cd.fromNow()+cd.format(", HH:mm"));
        else if (!cd.isSame(now, 'year')) $(this).text(cd.format("MMMM Do YYYY, HH:mm"));
        else if (cd.diff(now, 'days') < -7) $(this).text(cd.format("MMMM Do, HH:mm"));
        $(this).addClass("date-active");
        $(this).removeClass("date");
    });
};

window.disableDefault = function() {
    $(".disable-default").addClass("disable-default-active");
    $(".disable-default-active").click(function(e) {
        e.preventDefault();
    });
};

window.showConnect = function (host, port) {
	$("#connect-command").val("/connect "+host+" "+port);
	$("#connect-info").foundation('open');
	$("#connect-command").focus();
};

window.tryLoadBackground = function (name) {
	var bg = new Image();
	bg.onload = function () {
		$("body").css("background", "url(/images/mapshots/"+name+".jpg) no-repeat center center fixed");
		$("body").css("background-size", "cover");
	};
	bg.src = "/images/mapshots/"+name+".jpg";
};

$(window.document).ready(function(){
    $(".client-side").css("display", "inline-block");
    $(document).foundation();
    window.dateReflow();
    window.disableDefault();
});

var pollVisible = false;

window.togglePoll = function() {
    pollVisible = !pollVisible;

    if (pollVisible) {
        $(".slidebar").animate({ left: "0px" }, 400, "linear");
    } else {
        $(".slidebar").animate({ left: "-490px" }, 400, "linear");
    }
}
