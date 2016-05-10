import _ from 'lodash';
import Promise from "bluebird";

import vars from "../../vars.json";

import app from '../util/web';
import cache from '../util/cache';
import serverManager from '../tracker/server-manager';

cache.set("server-list", 1000, (callback) => {
    return new Promise((resolve, reject) => {
        resolve(serverManager.serialize());
    });
});

app.get("/api/servers", (req, res) => {
    cache.get("server-list").then(list => {
        res.send(list);
    }).catch(error => {
        res.status(500).send({error: error});
    });
});

app.get('/', function (req, res) {
    cache.get("server-list").then(list => {
        res.render('servers', {servers: _.orderBy(list, "clients", "desc"), sortedBy: "clients", sortOrder: "desc", vars: vars});
    }).catch(error => {
        res.status(500).send({error: error});
    });
});

app.get('/servers', function (req, res) {
    res.redirect("/");
});
