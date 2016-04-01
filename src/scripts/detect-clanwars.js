var _ = require('lodash');
var db = require('../util/database');
var game = require('../tracker/game');

db.start();

let count = 0;

db.db.raw(`
    SELECT  games.id,
            games.gamemode,
            games.gametype,
            (SELECT array_to_json(array_agg(row(scores.team, scores.score))) FROM scores WHERE scores.game = games.id) teams,
            (SELECT array_to_json(array_agg(row(stats.name, stats.team, stats.frags))) FROM stats WHERE stats.game = games.id AND stats.state != 5) players

    FROM    games

    WHERE   games.gametype = 'mix' OR
            games.gametype = 'clanwar'
    `)
.then(result => {
    return result.rows;
}).map(row => {
    let players = _.map(row.players, player => { return { name: player.f1, team: player.f2, frags: player.f3 }; });
    let teams = {};
    _.each(row.teams, team => {
        teams[team.f1] = team.f2;
    });
    let g = { masterMode: "locked", teams: teams, players: players, gameMode: row.gamemode };
    let gameType = game.getGameType(g);
    db.db.raw();
    if (gameType[0] != row.gametype) {
        count++;
        return db.db("games").where("id", row.id).update({ gametype: gameType[0], meta: gameType[1] }).then();
    }
}).then(() => {
    console.log(count);
    process.exit();
});
