import app from '../util/web';
import metrics from '../util/metrics';

app.get('/metrics', (req, res) => {
	res.render('metrics', { metrics: metrics.getAll() });
});
