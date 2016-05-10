import _ from 'lodash';

import app from '../util/web';
import cache from '../util/cache';
import metrics from '../util/metrics';

app.get("/metrics", (req, res) => {
    res.render('metrics', {metrics: metrics.getAll()});
});
