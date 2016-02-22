var _ = require('lodash');
var IRC = require('internet-relay-chat');

var config = require('../../tracker.json');
var servers = require('../tracker/server-list');
var player = require('../tracker/player');
var util = require('../util/util');

function splitArgs(text) {
	return text.replace(/[\n\r]/g, "").split(" ");
}

var handlers = {};

if (config.irc.server) {
	var bot = new IRC({ "server": config.irc.server, "port": config.irc.port, "username": config.irc.nick, "realname": config.irc.nick, "nick": config.irc.nick, "autoRejoin": config.irc.autoReconnect});

	bot.connect();

	bot.on('connect', function() {
		console.log('IRC Bot connected');
	});

	bot.on('registered', function() {
		bot.join(config.irc.chan);
	});

	bot.on('message', function(sender, channel, message) {
		var args = splitArgs(message);
		if (args[0].length < 2 || args[0][0] != config.irc.prefix) return;
		args[0] = args[0].slice(1);
		var hdl = handlers[args[0]];
		if (hdl) {
			var isop = bot.userHasMode(channel, sender.nick, "o");
			var isvoiced = bot.userHasMode(channel, sender.nick, "v");
			if ((hdl.modereq == "o" && !isop) || (hdl.modereq == "v" && !isop && !isvoiced)) bot.message(config.irc.chan, sender.nick + ": no permission, please ask a channel operator.");
			else hdl.handler.apply(this, [config.irc.chan].concat(args.slice(1)));
		}
	});

	bot.on('pm', function(sender, message) {
		var args = splitArgs(message);
		if (args[0].length < 2 || args[0][0] != config.irc.prefix) return;
		args[0] = args[0].slice(1);
		var hdl = handlers[args[0]];
		if (hdl) {
			var isop = bot.userHasMode(config.irc.chan, sender.nick, "o");
			var isvoiced = bot.userHasMode(config.irc.chan, sender.nick, "v");
			if ((hdl.modereq == "o" && !isop) || (hdl.modereq == "v" && !isop && !isvoiced)) bot.message(sender.nick, sender.nick + ": no permission, please ask a channel operator.");
			else hdl.handler.apply(this, [sender.nick].concat(args.slice(1)));
		}
	});

	bot.on('error', console.log);
} else {
	bot = { message: function () { console.log.apply(this, _.map(arguments, function (arg) { return arg; }).slice(1)); } };

	var stdin = process.openStdin();

	stdin.addListener("data", function(d) {
		var args = splitArgs(d.toString());
		args[0] = args[0].slice(1);
		var hdl = handlers[args[0]];
		if (hdl) {
			hdl.handler.apply(this, args);
		}
	});
}

function addhandler(command, help, modereq, handler) {
	handlers[command] = { handler: handler, help: help, modereq: modereq };
}

addhandler("commands", config.irc.prefix+"commands: lists all commands.", "", function(sendTo) {
	bot.message(sendTo, config.irc.prefix+_.reduce(_.keys(handlers), function (memo, cname) { return memo+", "+config.irc.prefix+cname; }));
});

addhandler("help", config.irc.prefix+"help [command]: prints help message for [command].", "", function(sendTo, command) {
	if (!command) bot.message(sendTo, config.irc.prefix+"help [command]: prints help message for [command]. Type `"+config.irc.prefix+"commands` to list all commands.");
	else bot.message(sendTo, handlers[command]? handlers[command].help: "Command `" + command + "` not found.");
});

addhandler("numservs", config.irc.prefix+"numservs: prints the total number of servers.", "", function(sendTo) {
	bot.message(sendTo, "Number of servers: " + servers.servers.list.length);
});

addhandler("setservinfo", config.irc.prefix+"setservinfo [ip] [port] [info] [value]: sets [info] of server to [value]. Pass and empty [value] to clear. [info] is one of 'website', 'demourl', and 'banned' (where [value] is the ban reason).", "o", function(sendTo, host, port, info, value) {
	bot.message(sendTo, servers.setInfo(host, Number(port), info, _.values(arguments).slice(4).join(" ")));
});

addhandler("addserv", config.irc.prefix+"addserv [ip] [port]: adds a new server to the tracker.", "o", function(sendTo, host, port) {
	bot.message(sendTo, servers.addServer(host, Number(port)));
});

addhandler("delserv", config.irc.prefix+"delserv [ip] [port]: removes a server from the tracker.", "o", function(sendTo, host, port) {
	bot.message(sendTo, servers.delServer(host, Number(port)));
});

addhandler("lastseen", config.irc.prefix+"lastseen [name]: prints when and where [name] was last seen.", "v", function(sendTo, name) {
	player.lastSeen(name, function (text) { bot.message(sendTo, text); });
});

addhandler("lastseenip", config.irc.prefix+"lastseenip [ip]: prints when and where [ip] was last seen.", "v", function(sendTo, ip) {
	player.lastSeenIP(ip, function (text) { bot.message(sendTo, text); });
});

addhandler("nameips", config.irc.prefix+"nameips [name]: lists most recent ips for [name].", "v", function(sendTo, name) {
	player.nameIPs(name, function (text) { bot.message(sendTo, text); });
});

addhandler("ipnames", config.irc.prefix+"ipnames [ip]: lists most recent names for [ip].", "v", function(sendTo, ip) {
	player.ipNames(ip, function (text) { bot.message(sendTo, text); });
});

addhandler("namesfor", config.irc.prefix+"namesfor [string]: prints other names for [name].", "v", function(sendTo, str) {
	player.namesFor(str, function (text) { bot.message(sendTo, text); });
});

addhandler("findname", config.irc.prefix+"findname [string]: prints names for players with [string] in their name.", "v", function(sendTo, str) {
	player.findName(str, function (text) { bot.message(sendTo, text); });
});

addhandler("banip", config.irc.prefix+"banip [ip]: ban player with ip [ip] from stats tracking.", "v", function(sendTo, ip) {
	player.banIP(ip, function (text) { bot.message(sendTo, text); });
});

addhandler("unbanip", config.irc.prefix+"unbanip [ip]: unban player with ip [ip] from stats tracking.", "v", function(sendTo, ip) {
	player.unbanIP(ip, function (text) { bot.message(sendTo, text); });
});

addhandler("banname", config.irc.prefix+"banname [name]: ban player with name [name] from stats tracking and delete their stats.", "v", function(sendTo, name) {
	player.banName(name, function (text) { bot.message(sendTo, text); });
});

addhandler("unbanname", config.irc.prefix+"unbanname [name]: unban player with name [name] from stats tracking and delete their stats.", "v", function(sendTo, name) {
	player.unbanName(name, function (text) { bot.message(sendTo, text); });
});

addhandler("banlist", config.irc.prefix+"banlist: prints a list of all banned IPs.", "v", function(sendTo) {
	bot.message(sendTo, _.keys(player.bans).join(" "));
});
