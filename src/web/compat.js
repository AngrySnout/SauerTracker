// This file is not essential to the Tracker, but is kept here for compatibility

var fuzzaldrin = require('fuzzaldrin');
var web = require("../util/web");
import {servers} from "../tracker/server-list";

web.app.get("/flagrunnoobs", (req, res) => {
    res.render("empty", { section: "home", title: "Flagrun Noobs", content: "<h4>1. Terminator</h4>" });
});

web.app.get(/\/findserver\/(.*)/, (req, res) => {
    var query = decodeURI(req.originalUrl).match(/\/findserver\/(.*)/)[1];
	var candidates = fuzzaldrin.filter(servers.list, query, { key: 'description', maxResults: 5 });
	if (candidates.length == 5 || candidates.length === 0) res.send(query);
	else res.send(candidates[0].description+": /connect "+candidates[0].host+" "+candidates[0].port);
});
