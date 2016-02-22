var _ = require('lodash');
var Promise = require('bluebird');

var web = require('../util/web');
var cache = require('../util/cache');
var vars = require("../../vars.json");
import {servers} from '../tracker/server-list';

cache.set("server-list", 1000, (callback) => {
    return new Promise((resolve, reject) => {
        resolve(servers.serialize());
    });
});

web.app.get("/api/servers", (req, res) => {
    cache.get("server-list").then(list => {
        res.send(list);
    }).catch(error => {
        res.status(500).send({error: error});
    });
});

web.app.get('/', function (req, res) {
    res.render('servers', {servers: _.orderBy(servers.serialize(), "clients", "desc"), sortedBy: "clients", sortOrder: "desc", vars: vars});
});

web.app.get('/servers', function (req, res) {
    res.redirect("/");
});
