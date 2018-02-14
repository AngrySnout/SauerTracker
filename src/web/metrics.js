import app from '../util/web';
import { getAllMetrics } from '../util/metrics';

app.get('/metrics', (req, res) => {
	getAllMetrics().then((metrics) => { res.render('metrics', { metrics }); });
});
