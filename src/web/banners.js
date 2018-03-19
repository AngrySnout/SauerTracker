import app from '../util/web';
import vars from '../../vars.json';

app.get('/banners', (req, res) => {
	res.render('banners', { query: req.query, bannerURL: vars.bannerURL });
});
