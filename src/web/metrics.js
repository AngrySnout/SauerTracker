var _ = require('lodash');

var web = require('../util/web');
var cache = require('../util/cache');
var metrics = require('../util/metrics');

web.app.get("/metrics", (req, res) => {
    res.render('metrics', {metrics: metrics.getAll()});
});
