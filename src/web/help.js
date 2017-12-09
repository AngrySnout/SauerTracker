import app from '../util/web';
import {apiPaths} from './paths';

app.get('/faq', function(req, res) {
	res.render('faq');
});

app.get('/api', function(req, res) {
	res.render('api', { paths: apiPaths });
});
