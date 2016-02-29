var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var compression = require('compression');
var url = require('url');
var bodyParser = require('body-parser');
var _ = require('lodash');
var moment = require('moment');
var responseTime = require('response-time');

var db = require('./database');
var config = require('../../tracker.json');

export var app = express();

app.set('trust proxy', 'loopback');

app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.set('views', './website/src/views');
app.set('view engine', 'jade');

if (process.env.NODE_ENV !== "production") app.locals.pretty = true;

app.use(function(req, res, next) {
	// If using an old domain, redirect to "sauertracker.net"
	if (req.get('host') == "uk.cube2.org" || req.get('host') == "tracker.impressivesquad.eu") {
		res.redirect(req.protocol+"://sauertracker.net"+req.originalUrl);
		return;
	}

	// Enable cross-origin on all routes
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

	// Disable caching on /api/ routes (fixes bug on Dolphin browser)
	if (req.path.indexOf("/api/") === 0) {
		res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
		res.setHeader("Pragma", "no-cache");
		res.setHeader("Expires", "0");
	}

	next();
});

app.use(responseTime(function (req, res, time) {
	db.db("requests").insert(_.assign(_.pick(req, [ "method", "ip", "url" ]), { time: time })).then();
}));

app.use('/', express.static('./website/assets', { maxAge: 7*24*60*60*1000 }));
app.use('/', express.static('./website/build', { maxAge: 24*60*60*1000 }));

var server = http.createServer(app.handle.bind(app)).listen(config.serverPort, function(){
	console.log("Server listening on port "+config.serverPort);
});

// Run SSL server only if a certificate is available
if (fs.existsSync('ssl/key.pem')) {
	var options = {
		key: fs.readFileSync('ssl/key.pem'),
		cert: fs.readFileSync('ssl/cert.pem'),
		ca: fs.readFileSync('ssl/ca.pem')
	};

	var secureserver = https.createServer(options, app.handle.bind(app)).listen(config.secureServerPort, function(){
		console.log("Secure server listening on port "+config.secureServerPort);
	});
}
