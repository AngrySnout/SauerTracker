var _ = require('lodash');
var vars = require("../../vars.json");

export var apiPaths = [
    {
        "name"   : "servers",
        "title"  : "/servers",
        "route"  : "/api/servers",
        "desc"   : "Returns a list of all servers online.",
        "example": "/api/servers"
    },
    {
        "name"   : "server",
        "title"  : "/server",
        "route"  : "/api/server/:ip/:port",
        "desc"   : "Returns a single server along with the game info.",
        "example": "/api/server/144.76.176.131/28785"
    },
    {
        "name"   : "server-activity",
        "title"  : "/server/activity",
        "route"  : "/api/server/activity/:host/:port",
        "desc"   : "Returns two lists, one with the average number of player at different time today, and one with the number of games per day in the last 15 days. Times with 0 players and days with 0 games are skipped.",
        "example": "/api/server/activity/144.76.176.131/28785"
    },
    {
        "name"   : "games-find",
        "title"  : "/games/find",
        "route"  : "/api/games/find?...",
        "desc"   : "Returns a list of games that match a given query, sorted descendingly by id (timestamp). Also returns the total number of matches, the maximum, and the minimum game ID.\nThe Following parameters are supported: host, port, serverdesc, map, gamemode, gametype, fromdate, todate, players, exact (match exact player names), specs (search for spectators as well), beforeid, afterid (used for pagination), limit. Any fields left empty will be ignored.\n\ngamemode can be one of '"+_.keys(vars.gameModes).join("', '")+"'.\ngametype can be one of 'duel', 'public', 'mix', 'clanwar', 'other', 'intern'.\nfromdate and todate should be formatted as yyyy-mm-dd.\nlimit is 20 by default, and is maxed at 1000.",
        "example": "/api/games/find?host=144.76.176.131&port=28785&todate=2015-09-25"
    },
    {
        "name": "games-players",
        "title": "/games/players",
        "route": "/api/games/players?...",
        "desc": "Shorthand for calling '/games/find' multiple times, once for each space-separated name in the query parameter 'players'. Accepts the same arguments as '/games/find'. Returns an array of object, each of which has the same properties as the one returned from '/games/find', in the same order as the input.",
        "example": "/api/games/players?fromdate=2015-09-25&exact=on&limit=2&players=MTH named"
    },
    {
        "name"   : "game",
        "title"  : "/game",
        "route"  : "/api/game/:id",
        "desc"   : "Returns a single saved game.",
        "example": "/api/game/142298"
    },
    {
        "name"   : "players-find",
        "title"  : "/players/find",
        "route"  : "/api/players/find?name=...",
        "desc"   : "Returns a list of up to 200 players matching a given name and country, sorted descendingly by frags. Parameters left empty will be ignored. Set country to __ (2 underscores) for Unknown.",
        "example": "/api/players/find?name=named&country=US"
    },
    {
        "name"   : "player",
        "title"  : "/player",
        "route"  : "/api/player/:name",
        "desc"   : "Returns info of the player with the given name.",
        "example": "/api/player/Nix"
    },
    {
        "name"   : "player-activity",
        "title"  : "/player/activity",
        "route"  : "/api/player/activity/:name",
        "desc"   : "Returns a list of average number of games player by player with the given name in the last 15 days. Days with 0 games are skipped.",
        "example": "/api/player/activity/Nix"
    },
    {
        "name"   : "clans",
        "title"  : "/clans",
        "route"  : "/api/clans",
        "desc"   : "Returns a list of all clans, sorted by rank.",
        "example": "/api/clans"
    },
    {
        "name"   : "clan",
        "title"  : "/clan",
        "route"  : "/api/clans/:clantag",
        "desc"   : "Returns the clan with the given clantag, along with 10 latest clanwars and 10 last seen members.",
        "example": "/api/clan/!s]"
    }
];
