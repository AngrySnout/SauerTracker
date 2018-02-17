import _ from 'lodash';
import moment from 'moment';

import database from '../util/database';

let players = {};

export function addPlayerSpy(name, ip, server) {
	if (!players[name]) players[name] = {};
	players[name][ip] = { host: server.host, port: server.port, time: moment().format('YYYY-MM-DD HH:mm:ss') };
}

export function saveSpy() {
	const oldPlayer = players;
	players = {};
	return _.map(oldPlayer, (player, name) => _.map(player.ips, (info, ip) => database.raw('insert into spy (name, ip, lastseen, lshost, lsport) values (?, ?, ?, ?, ?) on conflict (name, ip) do update set lastseen = excluded.lastseen, lshost = excluded.lshost, lsport = excluded.lsport', name, ip, info.time, info.host, info.port)));
}
