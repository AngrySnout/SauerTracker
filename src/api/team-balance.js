import dgram from 'dgram';

import { logInfo, logError } from '../util/util';
import { getBalancePort } from '../util/config';
import Packet from '../util/packet';

export default function startTeamBalanceServer() {
  if (!getBalancePort()) return;

  const server = dgram.createSocket('udp4');

  server.on('error', err => {
    logError(`server error:\n${err.stack}`);
    server.close();
  });

  server.on('message', (data, rinfo) => {
    const st = new Packet(data, 0);
    let s = st.getString();
    const names = [];
    let mode;
    let map;
    while (s) {
      names.push(s);
      s = st.getString();
    }
    s = st.getString();
    if (s) mode = s;
    s = st.getString();
    if (s) map = s;

    makeTeams(names, mode, map).then(teams => {
      // eslint-disable-next-line new-cap
      const buf = new Buffer.alloc(1024);
      const p = new Packet(buf);

      _.each(teams, team => {
        _.each(team, player => {
          p.putInt(names.indexOf(player));
        });
      });

      server.send(buf, 0, p.offset, rinfo.port, rinfo.address);
    });
  });

  server.on('listening', () => {
    const address = server.address();
    logInfo(`Team balance server listening on port ${address.port}`);
  });

  server.bind(getBalancePort());
}
