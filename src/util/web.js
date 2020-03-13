import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';

import { logInfo } from '../util/util';
import { getPort } from '../util/config';

const app = express();
export default app;

app.set('trust proxy', 'loopback');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'production') app.locals.pretty = true;

app.use((req, res, next) => {
  // Enable cross-origin on all routes
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept'
  );

  // Disable caching on /api/ routes (fixes bug on Dolphin browser)
  if (req.path.indexOf('/api/') === 0) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
});

app.use('/', express.static('./assets', { maxAge: 24 * 60 * 60 * 1000 }));

http.createServer(app.handle.bind(app)).listen(getPort(), () => {
  logInfo(`Server listening on port ${getPort()}`);
});
