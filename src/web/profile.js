var _ = require('lodash');

var web = require('../util/web');
var player = require('../tracker/player');
var util = require('../util/util');

web.app.get("/profile", function(req, res) {
    let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
    if (ip) ip = ip[1]+"0";
	else ip = "0.0.0.1";
    player.ipNamesL(ip, function (names) {
		res.render("profile", { ip: ip, names: names });
	});
});

web.app.get("/api/profile", function(req, res) {
    let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
    if (ip) ip = ip[1]+"0";
	else ip = "0.0.0.1";
    player.ipNamesL(ip, function (names) {
		res.send({ ip: ip, names: names });
	});
});
