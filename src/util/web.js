import express from 'express';
import http from 'http';
import compression from 'compression';
import bodyParser from 'body-parser';

import config from '../../tracker.json';

import { logInfo } from '../util/util';

const app = express();
export default app;

app.set('trust proxy', 'loopback');

app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', './website/views');
app.set('view engine', 'pug');

if (process.env.NODE_ENV !== 'production') app.locals.pretty = true;

app.use((req, res, next) => {
	// If using an old domain, redirect to "sauertracker.net"
	if (req.get('host') === 'uk.cube2.org' || req.get('host') === 'tracker.impressivesquad.eu') {
		res.redirect(`${req.protocol}://sauertracker.net${req.originalUrl}`);
		return;
	}

	// Enable cross-origin on all routes
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

	// Disable caching on /api/ routes (fixes bug on Dolphin browser)
	if (req.path.indexOf('/api/') === 0) {
		res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
		res.setHeader('Pragma', 'no-cache');
		res.setHeader('Expires', '0');
	}

	// Scramble all IP addresses for some people
	let ipAddress = req.headers['x-forwarded-for'] || req.ip;
	if (ipAddress.substr(0, 7) == "::ffff:") {
		ipAddress = ipAddress.substr(7)
	}
	if (ipAddress.startsWith('173.80.85.')) {
		let send = res.send;
		res.send = function (string) {
			let body = string instanceof Buffer ? string.toString() : string;
			body = body.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/g, function (w, a, b, c, d) {
				d = parseInt(d)+1;
				return `${c}.${b}.${a}.${d}`;
			});
			send.call(this, body);
		};
	}

	next();
});

if (config.website.serveStaticFiles) {
	app.use('/', express.static('./assets', { maxAge: 24 * 60 * 60 * 1000 }));
}

http.createServer(app.handle.bind(app)).listen(config.website.serverPort, () => {
	logInfo(`Server listening on port ${config.website.serverPort}`);
});
