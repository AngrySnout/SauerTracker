import app from '../util/web';
import {ipNamesL} from '../admin/players';

app.get('/profile', function(req, res) {
	let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
	if (ip) ip = ip[1]+'0';
	else ip = '0.0.0.1';
	ipNamesL(ip, function (names) {
		res.render('profile', { ip: ip, names: names });
	});
});

app.get('/api/profile', function(req, res) {
	let ip = req.ip.match(/(\d+\.\d+\.\d+\.)\d+$/);
	if (ip) ip = ip[1]+'0';
	else ip = '0.0.0.1';
	ipNamesL(ip, function (names) {
		res.send({ ip: ip, names: names });
	});
});
