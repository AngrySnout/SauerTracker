import express from 'express';
import fs from 'fs';
import http from 'http';
import https from 'https';
import compression from 'compression';
import bodyParser from 'body-parser';
import _ from 'lodash';
import responseTime from 'response-time';

import config from '../../tracker.json';

import { log } from '../util/util';
import database from '../util/database';

const app = express();
export default app;

app.set('trust proxy', 'loopback');

app.use(compression());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.set('views', './website/src/views');
app.set('view engine', 'pug');

if (process.env.NODE_ENV !== 'production') app.locals.pretty = true;

app.use((req, res, next) => {
  // If using an old domain, redirect to "sauertracker.net"
  if (req.get('host') == 'uk.cube2.org' || req.get('host') == 'tracker.impressivesquad.eu') {
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

  next();
});

app.use(responseTime((req, res, time) => {
  database('requests').insert(_.assign(_.pick(req, ['method', 'ip', 'url']), { time })).then();
}));

app.use('/', express.static('./website/assets', { maxAge: 7 * 24 * 60 * 60 * 1000 }));
app.use('/', express.static('./website/build', { maxAge: 24 * 60 * 60 * 1000 }));

const server = http.createServer(app.handle.bind(app)).listen(config.serverPort, () => {
  log(`Server listening on port ${config.serverPort}`);
});

// Run HTTPS server only if a certificate is available
if (fs.existsSync('ssl/key.pem')) {
  const options = {
    key: fs.readFileSync('ssl/key.pem'),
    cert: fs.readFileSync('ssl/cert.pem'),
    ca: fs.readFileSync('ssl/ca.pem'),
  };

  https.createServer(options, app.handle.bind(app)).listen(config.secureServerPort, () => {
    log(`Secure server listening on port ${config.secureServerPort}`);
  });
}
