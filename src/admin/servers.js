import database from '../util/database';
import serverManager from '../tracker/server-manager';

export function countServers() {
	return serverManager.list.length;
}

export function addServer(host, port) {
	try {
		let added = serverManager.add(host, port||28785);
		if (added) {
			let server = { host: host, port: parseInt(port) };
			database('servers').insert(server).then();
		}
		return added? 'Done!': 'Error: server already exists.';
	} catch(e) {
		return e;
	}
}

export function delServer(host, port) {
	try {
		let removed = serverManager.remove(host, port, true);
		if (removed) {
			let query = database('servers').where({ host: host, port: parseInt(port) });
			query.del().then();
		}
		return removed? 'Done!': 'Error: server not found.';
	} catch(e) {
		return e;
	}
}

export function findServer(host, port) {
	return serverManager.find(host, port);
}

var infos = ['website', 'demourl', 'banned', 'keep'];
export function setInfo(host, port, key, value) {
	if (infos.indexOf(key) < 0) throw new Error(`Invalid info param '${key}'.`);
	var server = serverManager.find(host, port);
	if (!server) return 'Error: server not found.';

	try {
		server.setInfo(key, value);
		database('servers').where({ host: host, port: port }).then(rows => {
			if (rows.length) {
				database('servers').where({ id: rows[0].id }).update(key, value).then();
			} else {
				let newserv = { host: host, port: port };
				newserv[key] = value;
				database('servers').insert(newserv).then();
			}
		});
		return 'Done!';
	} catch(e) {
		return e;
	}
}
