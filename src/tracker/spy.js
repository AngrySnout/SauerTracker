import _ from 'lodash';
import moment from 'moment';

import database from '../util/database';

let players = {};

export function addPlayerSpy(name, ip, server) {
	if (!players[name]) players[name] = {};
	players[name][ip] = { host: server.host, port: server.port, time: moment().format('YYYY-MM-DD HH:mm:ss') };
}

export function saveSpy() {
	return _.map(players, (player, name) => {
		return _.map(player.ips, (info, ip) => {
			return database.raw('insert into spy (name, ip, lastseen, lshost, lsport) values (?, ?, ?, ?, ?) on conflict (name, ip) do update set lastseen = excluded.lastseen, lshost = excluded.lshost, lsport = excluded.lsport', name, ip, info.time, info.host, info.port);
		});
	});
}
