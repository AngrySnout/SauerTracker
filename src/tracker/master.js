import net from 'net';
import Promise from 'bluebird';
import _ from 'lodash';

import redis from '../util/redis';
import { logInfo, logError } from '../util/util';
import { getMasterPort, getMasterHost } from '../util/config';

function pollMasterServer() {
  return new Promise((resolve, reject) => {
    let agg = '';
    const socket = net.connect(getMasterPort(), getMasterHost(), () => {
      socket.write('list\n');
    });
    socket.on('data', data => {
      agg += data.toString();
    });
    socket.on('end', () => {
      if (!agg) reject('Masterserver connection failed.');
      resolve(agg);
    });
    socket.on('error', err => {
      reject(["Can't poll masterserver:", err]);
    });
  });
}

/**
 *	Poll the master server.
 *	@returns {Promise} Resolves with an array containing objects of the form
 *  `{ host: "x.x.x.x", port: 12345 }`.
 */
export function getServerList() {
  return pollMasterServer().then(result => {
    const servers = [];
    _.each(result.split('\n'), line => {
      const ts = line.split(' ');
      if (ts.length === 3 && ts[0] === 'addserver')
        servers.push({ host: ts[1], port: parseInt(ts[2], 10) });
    });
    return servers;
  });
}

/**
 *	Get the server list from the master server and save it in cache.
 */
export function updateServerList() {
  return redis.getAsync('last-master-update').then(lastUpdate => {
    if (lastUpdate && Date.now() - lastUpdate < 600000) return;
    getServerList()
      .then(results => {
        logInfo(
          `Updated server list from master server (${results.length} servers)`
        );
        return Promise.all([
          redis.setAsync('servers', JSON.stringify(results)),
          redis.setAsync('last-master-update', Date.now()),
        ]);
      })
      .catch(err => {
        logError(err);
        return err;
      });
  });
}

/**
 *	Run updateServerList every interval milliseconds.
 */
export function start() {
  setInterval(updateServerList, 30000);
  updateServerList();
}
