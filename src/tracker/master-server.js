import net from 'net';
import _ from 'lodash';
import Promise from 'bluebird';

import config from '../../tracker.json';

/**
 *	Poll the master server.
 *	@param {function} resolve - Called with the new list. The list is an array of objects containing members 'host' and 'port'.
 *	@param {function} reject - Called with either an error message, or an array of errors, in case of an error.
 */
export default function getServerList(resolve, reject) {
  const self = this;
  try {
    let agg = '';
    const socket = net.connect(config.master.port, config.master.name, () => {
      socket.write('list\n');
    });
    socket.on('data', (data) => {
      agg += data.toString();
    });
    socket.on('end', () => {
      if (agg !== '') {
        const res = [];
        _.each(agg.split('\n'), (line) => {
          const ts = line.split(' ');
          if (ts.length == 3 && ts[0] == 'addserver') res.push({ host: ts[1], port: parseInt(ts[2]) });
        });
        resolve(res);
      } else reject('Masterserver connection failed.');
    });
    socket.on('error', (err) => {
      reject(["Can't poll masterserver:", err]);
    });
  } catch (err) {
    reject(["Can't poll masterserver:", err]);
  }
}
