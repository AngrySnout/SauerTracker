import app from '../util/web';
import apiPaths from './paths';

app.get('/faq', (req, res) => {
	res.render('faq');
});

app.get('/api', (req, res) => {
	res.render('api', { paths: apiPaths });
});
