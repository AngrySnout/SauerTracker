import _ from 'lodash';
import Promise from 'bluebird';

import vars from '../../vars.json';

import app from '../util/web';
import cache from '../util/cache';
import serverManager from '../tracker/server-manager';
import {getServerList} from '../api/v1/servers';

app.get('/', function (req, res) {
    getServerList().then(list => {
        res.render('servers', {servers: _.orderBy(list, 'clients', 'desc'), sortedBy: 'clients', sortOrder: 'desc', vars: vars});
    }).catch(error => {
        res.status(500).send({ error: error });
    });
});

app.get('/servers', function (req, res) {
    res.redirect('/');
});
