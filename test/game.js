var chai = require('chai');
var expect = chai.expect;

var game = require('../build/tracker/game');
var redis = require('../build/util/redis').default;
var database = require('../build/util/database').default;
var vars = require('../vars.json');

redis.selectAsync(3);
redis.unref();
database.destroy();

vars.clans = [
	{ 'tag': 'ab]' },
	{ 'tag': '|cd|' }
];

describe('game', function() {
	describe('#calcEloChange()', function() {
		it('should calculate Elo change after a game', function() {
			expect(game.calcEloChange(1200, 1200, 10, 5), 'winner gains points').to.be.above(0);
			expect(game.calcEloChange(1200, 1200, 5, 10), 'loser loses points').to.be.below(0);
			expect(game.calcEloChange(1200, 1200, 10, 10), 'tie affects Elo').to.equal(0);
			expect(game.calcEloChange(1200, 1200, 10, 5), 'frag difference affects elo').to.be.above(game.calcEloChange(1200, 1200, 10, 9));
			expect(game.calcEloChange(1400, 1000, 10, 5), 'Elo difference reduces points gained by win').to.be.below(game.calcEloChange(1200, 1200, 10, 5));
			expect(game.calcEloChange(1000, 1400, 10, 5), 'Elo difference increases points gained by win').to.be.above(game.calcEloChange(1200, 1200, 10, 5));
		});
	});
	
	describe('#getGameType()', function() {
		it('should guess the type of a game', function() {
			var publicGame = {
				gameMode: 'insta_ctf',
				masterMode: 'veto',
				players: [
					{
						name: 'a',
						team: 'good',
						frags: 10,
						state: 1
					},
					{
						name: 'b',
						team: 'evil',
						frags: 5,
						state: 1
					}
				],
				teams: {
					good: 1,
					evil: 0
				}
			};
			var duelGame = {
				gameMode: 'instagib',
				masterMode: 'locked',
				players: [
					{
						name: 'a',
						frags: 10,
						state: 1
					},
					{
						name: 'b',
						frags: 5,
						state: 1
					},
					{
						name: 'c',
						state: 5
					}
				]
			};
			var mixGame = {
				gameMode: 'insta_ctf',
				masterMode: 'locked',
				players: [
					{
						name: 'a',
						team: 'good',
						frags: 10,
						state: 1
					},
					{
						name: 'b',
						team: 'good',
						frags: 5,
						state: 1
					},
					{
						name: 'c',
						team: 'good',
						frags: 5,
						state: 1
					},
					{
						name: 'd',
						team: 'evil',
						frags: 5,
						state: 1
					},
					{
						name: 'e',
						team: 'evil',
						frags: 5,
						state: 1
					},
					{
						name: 'f',
						team: 'evil',
						frags: 5,
						state: 1
					}

				],
				teams: {
					good: 1,
					evil: 0
				}
			};
			var clanwarGame = {
				gameMode: 'insta_ctf',
				masterMode: 'locked',
				players: [
					{
						name: 'ab]a',
						team: 'good',
						frags: 10,
						state: 1
					},
					{
						name: 'ab]b',
						team: 'good',
						frags: 5,
						state: 1
					},
					{
						name: 'ab]c',
						team: 'good',
						frags: 5,
						state: 1
					},
					{
						name: 'd|cd|',
						team: 'evil',
						frags: 5,
						state: 1
					},
					{
						name: 'e|cd|',
						team: 'evil',
						frags: 5,
						state: 1
					},
					{
						name: 'f|cd|',
						team: 'evil',
						frags: 5,
						state: 1
					}

				],
				teams: {
					good: 1,
					evil: 0
				}
			};
			
			expect(game.getGameType(publicGame), 'public game').to.eql(['public']);
			expect(game.getGameType(duelGame, 0), 'duel game').to.eql(['duel',['b',5,'a',10]]);
			expect(game.getGameType(mixGame, 0), 'mix game').to.eql(['mix']);
			expect(game.getGameType(clanwarGame, 0), 'clanwar game').to.eql(['clanwar',['|cd|',0,'ab]',1]]);
		});
	});
	
	describe('#Game', function() {
		let g = new game.default();
		
		beforeEach(function() {
			g.players = {
				0: { name: 'a', frags: 10, team: 'good', flags: 1, deaths: 5, kpd: 2, acc: 0.25, tks: 1, state: 1, country: 'DE', ping: 100 },
				1: { name: 'b', frags: 10, team: 'evil', flags: 1, deaths: 5, kpd: 2, acc: 0.25, tks: 1, state: 1, country: 'DE', ping: 100 },
				2: { name: 'c', frags: 10, team: 'good', flags: 1, deaths: 5, kpd: 2, acc: 0.25, tks: 1, state: 5, country: 'DE', ping: 100 },
				3: { name: 'd', frags: 10, team: 'evil', flags: 1, deaths: 5, kpd: 2, acc: 0.25, tks: 1, state: 5, country: 'DE', ping: 100 },
				4: { name: 'e', frags: 10, team: 'good', flags: 1, deaths: 5, kpd: 2, acc: 0.25, tks: 1, state: 5, country: 'DE', ping: 100 }
			};
			g.teams = { good: 1, evil: 0 };
			g.clients = 5;
			g.mapName = 'ot';
			g.gameMode = 'instagib';
			g.masterMode = 'veto';
			g.maxClients = 128;
			g.mmColor = 'yellow';
			g.isFull = false;
			g.paused = false;
			g.gameSpeed = 100;
			g.timeLeft = 1000;
			g.timeLeftString = '16:40';
			g.intermission = false;
			g.saved = false;
		});
		
		describe('#serialize()', function() {
			it('should serialize a Game object', function() {
				expect(g.serialize(true)).to.eql({'zombie':false,'timeLeft':1000,'timeLeftString':'16:40','isFull':false,'gameMode':'instagib','clients':5,'mapName':'ot','masterMode':'veto','maxClients':128,'players':[{'name':'a','frags':10,'team':'good','flags':1,'deaths':5,'kpd':2,'acc':0.25,'tks':1,'state':1,'country':'DE','countryName':'Germany','ping':100},{'name':'b','frags':10,'team':'evil','flags':1,'deaths':5,'kpd':2,'acc':0.25,'tks':1,'state':1,'country':'DE','countryName':'Germany','ping':100},{'name':'c','frags':10,'team':'good','flags':1,'deaths':5,'kpd':2,'acc':0.25,'tks':1,'state':5,'country':'DE','countryName':'Germany','ping':100},{'name':'d','frags':10,'team':'evil','flags':1,'deaths':5,'kpd':2,'acc':0.25,'tks':1,'state':5,'country':'DE','countryName':'Germany','ping':100},{'name':'e','frags':10,'team':'good','flags':1,'deaths':5,'kpd':2,'acc':0.25,'tks':1,'state':5,'country':'DE','countryName':'Germany','ping':100}],'teams':{'good':1,'evil':0},'gameType':'public'});
			});
		});
	});
});
