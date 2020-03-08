import app from '../util/web';
import { getAllMetrics } from '../util/metrics';
import metricsTemplate from '../../website/views/metrics.pug';

app.get('/metrics', (req, res) => {
  getAllMetrics().then(metrics => {
    res.send(metricsTemplate({ metrics }));
  });
});
