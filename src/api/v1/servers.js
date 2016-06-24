import Promise from 'bluebird';
import _ from 'lodash';

import app from '../../util/web';
import cache from '../../util/cache';
import serverManager from '../../tracker/server-manager';

cache.set('server-list', 1000, (callback) => {
    return Promise.resolve(serverManager.serialize());
});

export function getServerList() {
	return cache.get('server-list');
}

app.get('/api/servers', (req, res) => {
    getServerList()
        .then(list => { res.send(list); })
        .catch(err => { res.status(500).send({ error: err }); });
});

cache.set('server-countries', 5000, (callback) => {
    let res = {};
    res.servers = _.countBy(serverManager.list, 'countryName');
    res.players = {};
    res.links = {};

    _.each(serverManager.list, server => {
        _.each(_.countBy(server.game.players, 'countryName'), (val, ind) => {
            if (ind == 'Unknown') return;

            res.players[ind] = res.players[ind]? res.players[ind]+val: val;

            if (!res.links[server.countryName]) res.links[server.countryName] = {};
            res.links[server.countryName][ind] = true;
        });
    });

    return Promise.resolve(res);
});

app.get('/api/server-countries', (req, res) => {
    cache.get('server-countries')
        .then(list => { res.send(list); })
        .catch(err => { res.status(500).send({ error: err }); });
});
