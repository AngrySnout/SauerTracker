import database from '../util/database';
import serverManager from '../tracker/server-manager';

export function countServers() {
  return serverManager.list.length;
}

export function addServer(host, port) {
  try {
    const added = serverManager.add(host, port || 28785);
    if (added) {
      const server = { host, port: parseInt(port) };
      database('servers').insert(server).then();
    }
    return added ? 'Done!' : 'Error: server already exists.';
  } catch (e) {
    return e;
  }
}

export function delServer(host, port) {
  try {
    const removed = serverManager.remove(host, port, true);
    if (removed) {
      const query = database('servers').where({ host, port: parseInt(port) });
      query.del().then();
    }
    return removed ? 'Done!' : 'Error: server not found.';
  } catch (e) {
    return e;
  }
}

export function findServer(host, port) {
  return serverManager.find(host, port);
}

const infos = ['website', 'demourl', 'banned', 'keep'];
export function setInfo(host, port, key, value) {
  if (infos.indexOf(key) < 0) throw new Error(`Invalid info param '${key}'.`);
  const server = serverManager.find(host, port);
  if (!server) return 'Error: server not found.';

  try {
    server.setInfo(key, value);
    database('servers').where({ host, port }).then((rows) => {
      if (rows.length) {
        database('servers').where({ id: rows[0].id }).update(key, value).then();
      } else {
        const newserv = { host, port };
        newserv[key] = value;
        database('servers').insert(newserv).then();
      }
    });
    return 'Done!';
  } catch (e) {
    return e;
  }
}
