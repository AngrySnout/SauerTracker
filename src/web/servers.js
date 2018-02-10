import _ from 'lodash';

import vars from '../../vars.json';

import app from '../util/web';
import { getServerList } from '../api/v1/servers';

app.get('/', (req, res) => {
  getServerList().then((list) => {
    res.render('servers', {
      servers: _.orderBy(list, 'clients', 'desc'), sortedBy: 'clients', sortOrder: 'desc', vars, noBanner: (req.query.banner === 'no'),
    });
  }).catch((error) => {
    res.status(500).send({ error });
  });
});

app.get('/servers', (req, res) => {
  res.redirect('/');
});
