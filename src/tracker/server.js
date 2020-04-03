/* eslint-disable no-buffer-constructor */
import dgram from 'dgram';
import _ from 'lodash';

import { isValidIP, isValidPort, logWarn } from '../util/util';
import Packet from '../util/packet';
import playerManager from '../tracker/player-manager';
import { addPlayerSpy } from './spy';
import {
  parseGameInfo259,
  parsePlayerExtInfo105,
  parseTeamsExtInfo105,
} from './protocols/259';
import { serverPolled, serverReplied } from '../util/metrics';
import getCountry, { getCountryName } from '../util/country';

const typeBuffers = [
  new Buffer.from('01', 'hex'),
  new Buffer.from('0001ff', 'hex'), // EXT_PLAYERSTATS -1
  new Buffer.from('0002', 'hex'), // EXT_TEAMSCORE
];

const POLL_PING = 0;
const POLL_EXTINFO = 1;
const POLL_ENDGAME = 2;

export default class Server {
  constructor(host, port, info) {
    if (!isValidIP(host))
      throw new Error(`Invalid host ${host} provided to Server().`);
    port = parseInt(port, 10);
    if (!isValidPort(port))
      throw new Error(`Invalid port ${port} provided to Server().`);

    this.host = host;
    this.realHost = host;
    this.port = port;
    this.realPort = port;
    this.lastReply = new Date().getTime() - 1;
    this.lastPoll = 0;
    this.lastExtInfoPoll = 0;
    this.game = null;
    this.info = { website: '', demourl: '', banned: '' };
    this.description = '';
    this.descriptionStyled = '';

    this.country = getCountry(this.realHost);

    if (info) {
      this.info.website = info.website || '';
      this.info.demourl = info.demourl || '';
      this.info.banned = info.banned || '';
    }
  }

  setInfo(key, value) {
    this.info[key] = value || '';
  }

  poll(type, time) {
    const self = this;
    let socket = dgram.createSocket('udp4');
    try {
      const buf = typeBuffers[type || 0];

      socket.on('message', data => {
        self.parseReply(data, type, time);
      });

      socket.on('error', () => {
        socket.close();
        socket = null;
      });

      socket.send(buf, 0, buf.length, this.realPort + 1, this.realHost);
      if (type === 0) serverPolled(this.host, this.port);

      (sock =>
        setTimeout(() => {
          if (sock !== null) {
            sock.close();
            sock = null;
          }
        }, 1000))(socket);
    } catch (err) {
      logWarn(`Error: Server query failed with uncaught error: ${err}`);
      logWarn(err.stack);
      if (socket !== null) {
        socket.close();
        socket = null;
      }
    }
  }

  // eslint-disable-next-line consistent-return
  shouldPoll(type, time) {
    // eslint-disable-next-line default-case
    switch (type) {
      case POLL_PING: {
        // we ping the server if time since last poll has exceeded 10
        // seconds or if we need to update extinfo
        return (
          time - this.lastPoll > 10000 || this.shouldPoll(POLL_EXTINFO, time)
        );
      }
      case POLL_EXTINFO: {
        // we poll for extinfo when time since last extinfo poll has exceeded
        // 5 seconds or if we need to poll for endgame
        return (
          (time - this.lastExtInfoPoll > 5000 &&
            this.game &&
            this.game.clients > 0) ||
          this.shouldPoll(POLL_ENDGAME, time)
        );
      }
      case POLL_ENDGAME: {
        // we poll for endgame when the server is not banned, the game has less than 5 seconds left,
        // is not paused, and has players, and time since last endgame poll has exceeded
        // 2 seconds
        return (
          !this.info.banned &&
          this.game &&
          this.game.timeLeft < 5 &&
          !this.game.paused &&
          time - this.lastPoll > 2000 &&
          this.game.clients > 0
        );
      }
    }
  }

  tryPoll(time) {
    const pollExtInfo = this.shouldPoll(POLL_EXTINFO, time);

    if (this.shouldPoll(POLL_PING, time)) {
      this.lastPoll = time;
      this.poll(0, time);
    }

    if (!this.game || this.game.saved || this.game.clients === 0) return;

    if (pollExtInfo) {
      this.lastExtInfoPoll = time;
      this.poll(1, time);
      this.poll(2, time);
    }

    if (
      !this.info.banned &&
      this.game.timeLeft <= 0 &&
      !this.game.intermission &&
      this.game.gameMode !== 'coop_edit' &&
      _.countBy(this.game.players, pl => pl.state !== 5).true > 1
    ) {
      this.game.intermission = true;
      const self = this;
      setTimeout(() => {
        if (self.game.timeLeft > 0) self.game.intermission = false;
        else self.game.save(self);
      }, 1500);
    }
  }

  shouldClean(time) {
    // only keep the server if it has replied within the last 30 seconds
    return time - this.lastReply > 30000;
  }

  parseReply(data, type, time) {
    try {
      const st = new Packet(data, typeBuffers[type].length);

      // eslint-disable-next-line default-case
      switch (type) {
        case 0: {
          // game info
          if (st.remaining() < 5) return;
          serverReplied(this.host, this.port);

          const nclients = st.getInt();
          const nattr = st.getInt();
          const gameVersion = st.getInt();

          if (
            gameVersion === 259 ||
            gameVersion === 260 ||
            gameVersion === 261
          ) {
            // versions 259 and 260 are fully compatible
            this.version = gameVersion;
            this.lastReply = time;
            const oldGame = this.game;
            const serverInfo = parseGameInfo259(st, nclients, nattr, this);
            this.game = serverInfo.game;
            this.description = serverInfo.description;
            this.descriptionStyled = serverInfo.descriptionStyled;
            if (oldGame && oldGame.players && nclients > 0)
              this.game.players = oldGame.players;
            if (oldGame && oldGame.teams) this.game.teams = oldGame.teams;
            if (
              oldGame &&
              oldGame.mapName === this.game.mapName &&
              oldGame.gameMode === this.game.gameMode &&
              oldGame.timeLeft >= this.game.timeLeft
            ) {
              this.game.saved = oldGame.saved;
            }
          } else {
            this.game = null;
          }

          break;
        }
        case 1: {
          // player extinfo
          if (st.remaining() <= 3) return;

          const ack = st.getInt();
          const ver = st.getInt();
          const iserr = st.getInt();
          if (ack !== -1 || ver !== 105 || iserr !== 0) return;

          const respType = st.getInt();

          if (respType === -11) {
            // EXT_PLAYERSTATS_RESP_STATS
            const player = parsePlayerExtInfo105(st);
            const oldPlayer = this.game.players[player.cn];
            this.game.players[player.cn] = player;

            // save player info and stats
            if (
              oldPlayer &&
              player.name &&
              oldPlayer.name === player.name &&
              oldPlayer.ip === player.ip &&
              !this.game.zombie &&
              !this.banned &&
              player.cn < 128 &&
              this.game.gameMode !== 'coop_edit'
            ) {
              playerManager.updatePlayer(this.game.gameMode, player, oldPlayer);
            }

            addPlayerSpy(player.name, player.ip, player.country, {
              host: this.realHost,
              port: this.realPort,
            });
          } else if (respType === -10) {
            // EXT_PLAYERSTATS_RESP_IDS
            const newCNs = [];
            while (st.remaining() > 0) newCNs.push(st.getInt());

            const oldCNs = _.pullAll(
              _.map(_.keys(this.game.players), Number),
              newCNs
            );
            _.each(oldCNs, cn => {
              delete this.game.players[cn];
            });
          }

          break;
        }
        case 2: {
          // game scores
          if (st.remaining() <= 3) return;

          const ack = st.getInt();
          const ver = st.getInt();
          const iserr = st.getInt();
          if (ack !== -1 || ver !== 105 || iserr !== 0) return;

          this.game.teams = parseTeamsExtInfo105(st);
          break;
        }
      }
    } catch (err) {
      logWarn(
        `Error: Server response parsing failed: ${err} ${this.description} ${this.realHost} ${this.realPort} ${type} ${data}`
      );
      logWarn(err.stack);
    }
  }

  serialize(expanded) {
    let res = {
      descriptionStyled: this.descriptionStyled,
      description: this.description,
      country: this.country,
      countryName: getCountryName(this.country),
      host: this.host,
      port: this.port,
      version: this.version,
    };
    if (expanded) res.info = this.info;

    if (this.game) res = Object.assign(res, this.game.serialize(expanded));
    return res;
  }
}
