import app from '../util/web';
import config from '../../tracker.json';

app.get('/banners', function (req, res) {
	res.render('banners', { query: req.query, bannerURL: config.bannerURL });
});
