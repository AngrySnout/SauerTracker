import _ from 'lodash';

import vars from '../../vars.json';
import app from '../util/web';
import { ObjectNotFoundError } from '../util/util';
import { findServer } from '../api/v1/server';
import serverTemplate from '../../website/views/server.pug';

app.get('/server/:host/:port', (req, res) => {
  findServer(req.params.host, req.params.port)
    .then(server => {
      res.send(
        serverTemplate({
          server,
          vars,
          _,
          bannerURL: vars.bannerURL,
        })
      );
    })
    .catch(ObjectNotFoundError, () => {
      res
        .status(404)
        .render('error', { status: 404, error: 'Server not found.' });
    })
    .catch(err => {
      res.status(500).render('error', { status: 500, error: err.message });
    });
});
