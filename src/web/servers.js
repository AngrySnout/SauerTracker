import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import redis from '../util/redis';
import serversTemplate from '../../website/views/servers.pug';

app.get('/', (req, res) => {
  redis
    .getAsync('server-list')
    .then(list => {
      res.send(
        serversTemplate({
          servers: _.orderBy(list ? JSON.parse(list) : [], 'clients', 'desc'),
          sortedBy: 'clients',
          sortOrder: 'desc',
          vars,
          noBanner: req.query.banner === 'no',
        })
      );
    })
    .catch(err => {
      res.status(500).send({ error: err.message });
    });
});

app.get('/servers', (req, res) => {
  res.redirect('/');
});
