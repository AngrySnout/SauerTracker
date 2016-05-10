import _ from 'lodash';
import Promise from "bluebird";

import config from '../../tracker.json';

import {debug, error} from '../util/util';
import database from '../util/database';
import Player from "./player";

class PlayerManager {
	constructor(name) {
		this.players = {};
		this.bans = {};
		this.banNames = {};
	}

	updatePlayer(server, newState, oldState, curTime) {
		let name = newState.name;
		if (this.banNames[name] || this.bans[newState.ip]) return;
		if (!this.players[name]) this.players[name] = new Player(name);
		this.players[name].updateState(server, newState, oldState, curTime);
	}

	flushplayers() {
		let self = this;
		return database("players").whereIn("name", _.map(self.players, "name")).then(rows => {
			rows = _.keyBy(rows, "name");
			return database.transaction(function(trx) {
				let promises = [];
				_.each(self.players, player => {
					promises.push(player.saveStats(rows[player.name], trx));
					promises.push(player.saveSpy());
				});
				self.players = {};
				return Promise.all(promises).finally(trx.commit);
			}).then();
		}).then(() => {
			debug("Players flushed");
		}).catch(error);
	}

	isOnline(name) {
		return !!this.players[name];
	}

	start() {
		let self = this;
		database.select().table('bans').then(players => {
			_.each(players, function (ban) {
				if (ban.ip) self.bans[ban.ip] = true;
				else if (ban.name) self.banNames[ban.name] = true;
			});
		});

		setInterval(() => {
			this.flushplayers();
		}, config.savePlayersInt*1000);
	}
}

var playerManager = new PlayerManager();
export default playerManager;
