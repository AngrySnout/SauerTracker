import _ from 'lodash';
import IRC from 'internet-relay-chat';

import config from '../../tracker.json';
import { logInfo } from '../util/util';

const playersAdmin = require('../admin/players');
const serversAdmin = require('../admin/servers');

function splitArgs(text) {
	return text.replace(/[\n\r]/g, '').split(' ');
}

const handlers = {};


let bot;

if (config.irc.server) {
	bot = new IRC({
		server: config.irc.server,
		port: config.irc.port,
		username: config.irc.nick,
		realname: config.irc.nick,
		nick: config.irc.nick,
		autoRejoin: 15000,
	});

	bot.connect();

	bot.on('connect', () => {
		logInfo('IRC Bot connected');
	});

	bot.on('registered', () => {
		bot.join(config.irc.chan);
	});

	bot.on('message', function (sender, channel, message) {
		const args = splitArgs(message);
		if (args[0].length < 2 || args[0][0] !== config.irc.prefix) return;
		args[0] = args[0].slice(1);
		const hdl = handlers[args[0]];
		if (hdl) {
			const isop = bot.userHasMode(channel, sender.nick, 'o');
			const isvoiced = bot.userHasMode(channel, sender.nick, 'v');
			if ((hdl.modereq === 'o' && !isop) || (hdl.modereq === 'v' && !isop && !isvoiced)) bot.message(config.irc.chan, `${sender.nick}: no permission, please ask a channel operator.`);
			else hdl.handler.apply(this, [config.irc.chan].concat(args.slice(1)));
		}
	});

	bot.on('pm', function (sender, message) {
		const args = splitArgs(message);
		if (args[0].length < 2 || args[0][0] !== config.irc.prefix) return;
		args[0] = args[0].slice(1);
		const hdl = handlers[args[0]];
		if (hdl) {
			const isop = bot.userHasMode(config.irc.chan, sender.nick, 'o');
			const isvoiced = bot.userHasMode(config.irc.chan, sender.nick, 'v');
			if ((hdl.modereq === 'o' && !isop) || (hdl.modereq === 'v' && !isop && !isvoiced)) bot.message(sender.nick, `${sender.nick}: no permission, please ask a channel operator.`);
			else hdl.handler.apply(this, [sender.nick].concat(args.slice(1)));
		}
	});

	bot.on('error', logInfo);
} else {
	bot = { message() { logInfo.apply(this, _.map(arguments, arg => arg).slice(1)); } };

	const stdin = process.openStdin();

	stdin.addListener('data', function (d) {
		const args = splitArgs(d.toString());
		args[0] = args[0].slice(1);
		const hdl = handlers[args[0]];
		if (hdl) {
			hdl.handler.apply(this, args);
		}
	});
}

function addhandler(command, help, modereq, handler) {
	handlers[command] = { handler, help, modereq };
}

function commandList() {
	return `All commands: ${config.irc.prefix}${_.reduce(_.keys(handlers), (memo, cname) => `${memo}, ${config.irc.prefix}${cname}`)}`;
}

addhandler('commands', `${config.irc.prefix}commands: lists all commands.`, '', (sendTo) => {
	bot.message(sendTo, commandList());
});

addhandler('help', `${config.irc.prefix}help [command]: prints help message for [command].`, '', (sendTo, command) => {
	if (!command) bot.message(sendTo, commandList());
	else bot.message(sendTo, handlers[command] ? handlers[command].help : `Command \`${command}\` not found.`);
});

addhandler('numservs', `${config.irc.prefix}numservs: prints the total number of servers.`, '', (sendTo) => {
	bot.message(sendTo, `Number of servers: ${serversAdmin.countServers()}`);
});

addhandler('setservinfo', `${config.irc.prefix}setservinfo [ip] [port] [info] [value]: sets [info] of server to [value]. Pass and empty [value] to clear. [info] is one of 'website', 'demourl', and 'banned' (where [value] is the ban reason).`, 'o', function (sendTo, host, port, info) {
	bot.message(sendTo, serversAdmin.setInfo(host, Number(port), info, _.values(arguments).slice(4).join(' ')));
});

addhandler('addserv', `${config.irc.prefix}addserv [ip] [port]: adds a new server to the tracker.`, 'o', (sendTo, host, port) => {
	bot.message(sendTo, serversAdmin.addServer(host, Number(port)));
});

addhandler('addhiddenserv', `${config.irc.prefix}addhiddenserv [ip] [port] [fakePort]: adds a new hidden server to the tracker.`, 'o', (sendTo, host, port, fakePort) => {
	bot.message(sendTo, serversAdmin.addHiddenServer(host, Number(port), fakePort));
});

addhandler('delserv', `${config.irc.prefix}delserv [ip] [port]: removes a server from the tracker.`, 'o', (sendTo, host, port) => {
	bot.message(sendTo, serversAdmin.delServer(host, Number(port)));
});

addhandler('lastseen', `${config.irc.prefix}lastseen [name]: prints when and where [name] was last seen.`, 'v', (sendTo, name) => {
	playersAdmin.lastSeen(name, (text) => { bot.message(sendTo, text); });
});

addhandler('lastseenip', `${config.irc.prefix}lastseenip [ip]: prints when and where [ip] was last seen.`, 'v', (sendTo, ip) => {
	playersAdmin.lastSeenIP(ip, (text) => { bot.message(sendTo, text); });
});

addhandler('nameips', `${config.irc.prefix}nameips [name]: lists most recent ips for [name].`, 'v', (sendTo, name) => {
	playersAdmin.nameIPs(name, (text) => { bot.message(sendTo, text); });
});

addhandler('ipnames', `${config.irc.prefix}ipnames [ip]: lists most recent names for [ip].`, 'v', (sendTo, ip) => {
	playersAdmin.ipNames(ip, (text) => { bot.message(sendTo, text); });
});

addhandler('namesfor', `${config.irc.prefix}namesfor [string]: prints other names for [name].`, 'v', (sendTo, str) => {
	playersAdmin.namesFor(str, (text) => { bot.message(sendTo, text); });
});

addhandler('findname', `${config.irc.prefix}findname [string]: prints names for players with [string] in their name.`, 'v', (sendTo, str) => {
	playersAdmin.findName(str, (text) => { bot.message(sendTo, text); });
});

addhandler('banip', `${config.irc.prefix}banip [ip]: ban player with ip [ip] from stats tracking.`, 'o', (sendTo, ip) => {
	playersAdmin.banIP(ip, (text) => { bot.message(sendTo, text); });
});

addhandler('unbanip', `${config.irc.prefix}unbanip [ip]: unban player with ip [ip] from stats tracking.`, 'o', (sendTo, ip) => {
	playersAdmin.unbanIP(ip, (text) => { bot.message(sendTo, text); });
});

addhandler('banname', `${config.irc.prefix}banname [name]: ban player with name [name] from stats tracking and delete their stats.`, 'o', (sendTo, name) => {
	playersAdmin.banName(name, (text) => { bot.message(sendTo, text); });
});

addhandler('unbanname', `${config.irc.prefix}unbanname [name]: unban player with name [name] from stats tracking and delete their stats.`, 'o', (sendTo, name) => {
	playersAdmin.unbanName(name, (text) => { bot.message(sendTo, text); });
});

addhandler('banlist', `${config.irc.prefix}banlist: prints a list of all banned IPs and names.`, 'v', (sendTo) => {
	bot.message(sendTo, `Banned IPs: ${_.keys(playersAdmin.getBans()).join(' ')}`);
	bot.message(sendTo, `Banned names: ${_.keys(playersAdmin.getBanNames()).join(' ')}`);
});
