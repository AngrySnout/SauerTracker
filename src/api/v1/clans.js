import _ from 'lodash';

import vars from "../../../vars.json";

import app from '../../util/web';
import cache from '../../util/cache';
import {debug, error, round2} from '../../util/util';
import database from '../../util/database';

cache.set("clans", 60*60*1000, function() {
	return database("games").where({ gametype: "clanwar" }).select("meta").then(rows => {
		var clans = {};
		_.each(rows, function (row) {
			try {
				if (row.meta) row.meta = JSON.parse(row.meta);
				if (!row.meta) {
					row.meta = null;
					return;
				}
				clans[row.meta[0]] = clans[row.meta[0]]&&clans[row.meta[0]]+1||1;
				clans[row.meta[2]] = clans[row.meta[2]]&&clans[row.meta[2]]+1||1;
			} catch (e) {
				row.meta = null;
				debug(e);
			}
		});
		var wins = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[2]: "";
		});
		var losses = _.countBy(rows, function (row) {
			return (row.meta && row.meta[1]!=row.meta[3])? row.meta[0]: "";
		});
		var clns = _.orderBy(_.map(vars.clans, function (clan) {
			if (!wins[clan.tag]) wins[clan.tag] = 0;
			if (!losses[clan.tag]) losses[clan.tag] = 0;
			var draws_2 = ((clans[clan.tag]||0)-((wins[clan.tag]||0)+(losses[clan.tag]||0)))/2;
			var rate = (clans[clan.tag]? (wins[clan.tag]+draws_2)/clans[clan.tag]: 0);
			return { "name": clan.tag, "wins": wins[clan.tag], "losses": losses[clan.tag], "rate": round2(rate), "points": round2((wins[clan.tag]+draws_2)*rate) };
		}), "points", "desc");
		var rank = 1;
		_.each(clns, function (clan) {
			clan.rank = rank++;
		});
		return clns;
	});
});

export function getClans() {
	return cache.get("clans");
}

app.get("/api/clans", function(req, res) {
	getClans().then(clans => {
		res.send({ clans: clans });
	}).catch(err => {
		error(err);
		res.status(500).send({ error: err.message });
	});
});
