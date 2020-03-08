import _ from 'lodash';

import { getGameMode, getMasterMode } from '../../util/protocol';
import { filterString, cube2colorHTML } from '../../util/packet';
import { logWarn, round2 } from '../../util/util';
import Game from '../game';
import getCountry, { formatIP } from '../../util/country';

export function parseGameInfo259(p, nclients, nattr) {
  const game = new Game();

  game.clients = nclients;
  game.gameMode = getGameMode(p.getInt());
  game.timeLeft = p.getInt();
  if (game.gameMode === 'coop_edit' && game.timeLeft <= 0)
    game.timeLeftString = '';
  else if (game.timeLeft <= 0) game.timeLeftString = 'intermission';
  else
    game.timeLeftString = `${_.padStart(
      Math.floor(game.timeLeft / 60),
      2,
      '0'
    )}:${_.padStart(game.timeLeft % 60, 2, '0')}`;
  game.maxClients = p.getInt();
  game.masterMode = getMasterMode(p.getInt());

  if (nattr === 7) {
    game.paused = p.getInt();
    game.gameSpeed = p.getInt();
  } else {
    game.paused = 0;
    game.gameSpeed = 100;
  }

  game.mapName = p.getString() || '[new map]';
  if (game.mapName.length > 20)
    game.mapName = `${game.mapName.slice(0, 20)}...`;

  const serverdesc = p.getString();
  const description = filterString(serverdesc);
  const descriptionStyled = cube2colorHTML(serverdesc);

  if (game.timeLeft > 0) {
    game.intermission = false;
    game.saved = false;
  }

  return { game, description, descriptionStyled };
}

export function parsePlayerExtInfo105(p) {
  const player = {};
  player.cn = p.getInt();
  player.ping = p.getInt();
  player.name = p.getString();
  if (player.name.length > 15) {
    logWarn(
      `Warning: player name longer than 15 characters. Truncating. Name: ${player.name}`
    );
    player.name = player.name.substring(0, 15);
  }
  if (!player.name) player.name = 'unnamed';
  player.team = p.getString();
  if (player.team.length > 4) {
    logWarn(
      `Warning: team name longer than 4 characters. Truncating. Name: ${player.team}`
    );
    player.team = player.team.substring(0, 15);
  }
  player.frags = p.getInt();
  player.flags = p.getInt();
  player.deaths = p.getInt();
  player.kpd = round2(player.frags / Math.max(player.deaths, 1));
  player.tks = p.getInt();
  player.acc = p.getInt();
  p.getInt();
  p.getInt();
  p.getInt();
  player.privilege = p.getInt();
  player.state = p.getInt();

  const ipbuf = Buffer.alloc(4);
  p.buffer.copy(ipbuf, 0, p.offset, p.offset + 3);
  ipbuf[3] = 0;
  const ip = ipbuf.readUInt32BE(0);
  player.ip = formatIP(ip);
  player.country = getCountry(player.ip);

  return player;
}

export function parseTeamsExtInfo105(p) {
  const teams = {};
  p.getInt();
  p.getInt();

  while (p.remaining() > 0) {
    let name = p.getString();
    if (name.length > 4) {
      logWarn(
        `Warning: team name longer than 4 characters. Truncating. Name: ${name}`
      );
      name = name.substring(0, 15);
    }
    const score = p.getInt();
    const bases = p.getInt();
    for (let i = 0; i < bases; i++) p.getInt();
    teams[name] = score;
  }

  return teams;
}
