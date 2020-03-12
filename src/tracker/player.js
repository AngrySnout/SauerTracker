import _ from 'lodash';

import vars from '../../vars.json';

import database from '../util/database';
import redis from '../util/redis';
import { getBaseElo } from '../util/config';

const emptyStats = {
  frags: 0,
  flags: 0,
  deaths: 0,
  tks: 0,
  accFrags: 0,
};

export function totalStats(modeStats) {
  const res = Object.assign({}, emptyStats);
  _.each(_.keys(modeStats), key => {
    res.frags += modeStats[key].frags;
    res.flags += modeStats[key].flags;
    res.deaths += modeStats[key].deaths;
    res.tks += modeStats[key].tks;
    res.accFrags += modeStats[key].accFrags;
  });
  return res;
}

export function sumModeStats(newModeStats, oldModeStatsString) {
  if (!newModeStats) return oldModeStatsString;
  const oldModeStatsArray = JSON.parse(oldModeStatsString);
  const newModeStatsArray = [
    newModeStats.frags,
    newModeStats.flags,
    newModeStats.deaths,
    newModeStats.tks,
    newModeStats.accFrags,
  ];
  return JSON.stringify(_.zipWith(oldModeStatsArray, newModeStatsArray, _.add));
}

export function updateRow(name, row, modeStats, country) {
  const newStats = totalStats(modeStats);

  const stats = {
    name: row.name || name,
    frags: row.frags || 0,
    flags: row.flags || 0,
    deaths: row.deaths || 0,
    tks: row.tks || 0,
    accFrags: row.accFrags || 0,
    elo: row.elo || getBaseElo(),
    country: row.country || '',
    instastats: row.instastats || '[0,0,0,0,0]',
    efficstats: row.efficstats || '[0,0,0,0,0]',
  };

  stats.frags += newStats.frags;
  stats.flags += newStats.flags;
  stats.deaths += newStats.deaths;
  stats.tks += newStats.tks;
  stats.accFrags += newStats.accFrags;
  if (country) stats.country = country;

  if (modeStats.insta)
    stats.instastats = sumModeStats(modeStats.insta, stats.instastats);
  if (modeStats.effic)
    stats.efficstats = sumModeStats(modeStats.effic, stats.efficstats);

  return stats;
}

export default class Player {
  constructor(name) {
    this.name = name;
    this.country = '';
    this.modeStats = {};
  }

  updateState(gameMode, newState, oldState) {
    if (!this.country || newState.country) this.country = newState.country;

    let modetype = 'other';
    if (vars.gameModes[gameMode]) {
      if (vars.gameModes[gameMode].efficMode) modetype = 'effic';
      else if (vars.gameModes[gameMode].instaMode) modetype = 'insta';
    }

    if (!this.modeStats[modetype])
      this.modeStats[modetype] = Object.assign({}, emptyStats);

    const newfrags = Math.max(newState.frags - oldState.frags, 0);
    this.modeStats[modetype].frags += newfrags;
    this.modeStats[modetype].flags += Math.max(
      newState.flags - oldState.flags,
      0
    );
    this.modeStats[modetype].deaths += Math.max(
      newState.deaths - oldState.deaths,
      0
    );
    this.modeStats[modetype].tks += Math.max(newState.tks - oldState.tks, 0);
    this.modeStats[modetype].accFrags += newState.acc * newfrags;
  }

  saveStats(row, trx) {
    const stats = updateRow(this.name, row || {}, this.modeStats, this.country);

    // redis.zincrbyAsync(
    //   'top-countries',
    //   _.sum(_.map(this.modeStats, 'frags')),
    //   this.country
    // );

    if (row && row.name) {
      return database('players')
        .where('name', this.name)
        .update(stats)
        .transacting(trx)
        .then();
    }
    return database('players')
      .insert(stats)
      .transacting(trx)
      .then();
  }
}
