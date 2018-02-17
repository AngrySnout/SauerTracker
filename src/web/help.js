import app from '../util/web';

app.get('/faq', (req, res) => {
	res.render('faq');
});
