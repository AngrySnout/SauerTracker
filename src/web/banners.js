import app from '../util/web';
import vars from '../../vars.json';

app.get('/banners', function (req, res) {
	res.render('banners', { query: req.query, bannerURL: vars.bannerURL });
});
