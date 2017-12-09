import _ from 'lodash';

import config from '../../tracker.json';
import vars from '../../vars.json';
import countryLimits from '../../countryLimits.json';

import {log, round2} from '../util/util';
import database from '../util/database';

export default class Player {
	constructor(name) {
		this.name = name;
		this.ips = {};
		this.modes = {};
	}

	updateState(server, newState, oldState, curTime) {
		if (countryLimits[this.name] && countryLimits[this.name] != newState.country) {
			log(`Faker found: ${this.name} ${newState.country}`);
			return;
		}

		this.ips[newState.ip] = { lastSeen: curTime, onServer: server };
		this.lastSeen = curTime;
		this.ip = newState.ip;

		if (server.game.zombie || newState.cn >= 128 || server.game.gameMode == 'coop_edit' || server.banned || newState.banned) return;

		let modetype = 'any';
		if (vars.gameModes[server.game.gameMode]) {
			if (vars.gameModes[server.game.gameMode].efficMode) modetype = 'effic';
			else if (vars.gameModes[server.game.gameMode].instaMode) modetype = 'insta';
		}

		if (!this.modes[modetype]) this.modes[modetype] = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };

		if (newState.frags > 0)
		{
			let newfrags = Math.max(newState.frags-oldState.frags, 0);
			this.modes[modetype].acc = ((this.modes[modetype].acc * this.modes[modetype].frags) + (newState.acc * newfrags)) / Math.max(this.modes[modetype].frags + newfrags, 1);
			this.modes[modetype].frags += newfrags;
		}
		this.modes[modetype].flags += Math.max(newState.flags-oldState.flags, 0);
		this.modes[modetype].deaths += Math.max(newState.deaths-oldState.deaths, 0);
		this.modes[modetype].tks += Math.max(newState.tks-oldState.tks, 0);

		if (!this.country || this.countryName == 'Unknown') {
			this.country = newState.country;
			this.countryName = newState.countryName;
		}
	}

	saveSpy() {
		let self = this;
		return _.map(this.ips, function (info, ip) {
			return database('spy').where({ name: self.name, ip: ip }).then(rows => {
				if (!rows.length) return database('spy').insert({ name: self.name, ip: self.ip, country: self.country, lastseen: info.lastSeen, lshost: info.onServer.host, lsport: info.onServer.port }).then();
				else return database('spy').where({ name: self.name, ip: ip }).update({ country: self.country, lastseen: info.lastSeen, lshost: info.onServer.host, lsport: info.onServer.port }).then();
			});
		});
	}

	sumStats() {
		let self = this;
		let res = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };
		_.each(_.keys(this.modes), function (key) {
			if (res.frags + self.modes[key].frags !== 0) res.acc = ((res.acc * res.frags) + (self.modes[key].acc * self.modes[key].frags)) / (res.frags + self.modes[key].frags);
			res.frags += self.modes[key].frags;
			res.flags += self.modes[key].flags;
			res.deaths += self.modes[key].deaths;
			res.tks += self.modes[key].tks;
		});
		return res;
	}

	getModeStats(mode) {
		if (!this.modes[mode]) return;
		return [this.modes[mode].frags, this.modes[mode].flags, this.modes[mode].deaths, this.modes[mode].tks, round2(this.modes[mode].frags/Math.max(this.modes[mode].deaths, 1)), this.modes[mode].acc];
	}

	saveStats(row, trx) {
		row = row||{};

		let newStats = this.sumStats();
		let stats = {	name: row.name||this.name,
			frags: row.frags||0,
			flags: row.flags||0,
			deaths: row.deaths||0,
			tks: row.tks||0,
			kpd: 0,
			acc: row.acc||0,
			elo: row.elo||config.tracker.baseElo,
			country: row.country||'',
			countryName: row.countryName||'Unknown',
			instastats: row.instastats||'[0,0,0,0,0,0]',
			efficstats: row.efficstats||'[0,0,0,0,0,0]' };

		// accuracy must be done first
		if (newStats.frags+stats.frags === 0) stats.acc = 0;
		else stats.acc = round2(((newStats.frags*newStats.acc)+(stats.frags*stats.acc))/(newStats.frags+stats.frags));
		stats.frags += newStats.frags;
		stats.flags += newStats.flags;
		stats.deaths += newStats.deaths;
		stats.tks += newStats.tks;
		// and kpd last
		stats.kpd = round2(stats.frags/Math.max(stats.deaths, 1));

		if (this.country && this.countryName != 'Unknwon') {
			stats.country = this.country;
			stats.countryName = this.countryName;
		}

		function calcModeStats(self, mode) {
			let newModeStats = self.getModeStats(mode);
			let modeStats = JSON.parse(mode==='insta'? stats.instastats: stats.efficstats);
			if (modeStats[0]+newModeStats[0] === 0) modeStats[5] = 0;
			else modeStats[5] = round2((modeStats[0]*modeStats[5]+newModeStats[0]*newModeStats[5])/(modeStats[0]+newModeStats[0]));
			modeStats[0] += newModeStats[0]; //frags
			modeStats[1] += newModeStats[1]; //flags
			modeStats[2] += newModeStats[2]; //deaths
			modeStats[3] += newModeStats[3]; //tks
			modeStats[4] = round2(modeStats[0]/Math.max(modeStats[2], 1)); //kpd
			return modeStats;
		}

		if (this.modes.insta) stats.instastats = JSON.stringify(calcModeStats(this, 'insta'));
		if (this.modes.effic) stats.efficstats = JSON.stringify(calcModeStats(this, 'effic'));

		if (row.name) return database('players').where('name', this.name).update(stats).transacting(trx).then();
		else return database('players').insert(stats).transacting(trx).then();
	}
}
