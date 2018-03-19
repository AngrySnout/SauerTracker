/* eslint-disable no-unused-vars,import/no-unresolved,
import/extensions,import/no-extraneous-dependencies */
import NProgress from 'nprogress';
import $ from 'jquery';
import foundation from 'foundation-sites';

const moment = require('moment');
const _ = require('lodash');
const fdatepicker = require('foundation-datepicker');


const url = require('url');
const typeahead = require('typeahead.js');

window.NProgress = NProgress;
window.moment = moment;
window.url = url;

window.dateReflow = function () {
	const now = moment();
	$('.date').each(function () {
		const cd = moment(`${$(this).text().replace(/[TZ]/g, ' ').trim()}+0000`);
		$(this).attr('title', cd.format('dddd, MMMM Do YYYY, HH:mm:ss'));
		if (cd.diff(now, 'hours') >= -22) $(this).text(cd.fromNow());
		else if (cd.diff(now, 'days') >= -7) $(this).text(cd.fromNow() + cd.format(', HH:mm'));
		else if (!cd.isSame(now, 'year')) $(this).text(cd.format('MMMM Do YYYY, HH:mm'));
		else if (cd.diff(now, 'days') < -7) $(this).text(cd.format('MMMM Do, HH:mm'));
		$(this).addClass('date-active');
		$(this).removeClass('date');
	});
};

window.disableDefault = function () {
	$('.disable-default').addClass('disable-default-active');
	$('.disable-default-active').click((e) => {
		e.preventDefault();
	});
};

window.showConnect = function (host, port) {
	$('#connect-command').val(`/connect ${host} ${port}`);
	$('#connect-info').foundation('open');
	$('#connect-command').focus();
};

window.tryLoadBackground = function (name) {
	const bg = new Image();
	bg.onload = function () {
		$('body').css('background', `url(/images/mapshots/${name}.jpg) no-repeat center center fixed`);
		$('body').css('background-size', 'cover');
	};
	bg.src = `/images/mapshots/${name}.jpg`;
};

$(window.document).ready(() => {
	$('.client-side').css('display', 'inline-block');
	$(document).foundation();
	window.dateReflow();
	window.disableDefault();
});

let pollVisible = false;

window.togglePoll = function () {
	pollVisible = !pollVisible;

	if (pollVisible) {
		$('.slidebar').animate({ left: '0px' }, 400, 'linear');
	} else {
		$('.slidebar').animate({ left: '-490px' }, 400, 'linear');
	}
};
