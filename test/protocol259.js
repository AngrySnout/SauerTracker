var chai = require('chai');

var expect = chai.expect;

var protocol259 = require('../build/tracker/protocols/259');
var Packet = require('../build/util/packet');
var util = require('../build/util/util');

util.logInfo = function() {};
util.logWarn = function() {};
util.logError = function() {};

describe('protocol259', function() {
	describe('#parseGameInfo259()', function() {
		it('should parse a server info reply', function() {
			const st = new Packet.default(new Buffer('00058003010080260217ff73696265726961000c3063480c372773657276657200', 'hex'), 0);
			
			const nclients = st.getInt();
			const nattr = st.getInt();
			const gameVersion = st.getInt();
			
			expect(gameVersion).to.equal(259);
			
			expect(protocol259.parseGameInfo259(st, nclients, nattr)).to.eql({
				game: {
					players: {},
					teams: {},
					clients: 0,
					mapName: 'siberia',
					gameMode: 'ffa',
					maxClients: 23,
					mmColor: '',
					isFull: false,
					paused: 0,
					gameSpeed: 100,
					timeLeft: 550,
					intermission: false,
					saved: false,
					zombie: false,
					timeLeftString: '09:10',
					masterMode: 'auth'
				},
				description: 'cH\'server',
				descriptionStyled: '<span style="color: green">cH</span><span style="color: white">&#39;server</span>'
			});
		});
	});
	
	describe('#parsePlayerExtInfo105()', function() {
		it('should parse a server player stats reply', function() {
			const st = new Packet.default(new Buffer('ff6900f5051d4a6f736800676f6f6400fc000400006419060200010203', 'hex'), 0);
			
			const ack = st.getInt();
			const ver = st.getInt();
			const iserr = st.getInt();
			const respType = st.getInt();
			
			expect(ack).to.equal(-1);
			expect(ver).to.equal(105);
			expect(iserr).to.equal(0);
			expect(respType).to.equal(-11);
			
			expect(protocol259.parsePlayerExtInfo105(st)).to.eql({
				cn: 5,
				ping: 29,
				name: 'Josh',
				team: 'good',
				frags: -4,
				flags: 0,
				deaths: 4,
				kpd: -1,
				tks: 0,
				acc: 0,
				privilege: 2,
				state: 0,
				ip: '1.2.3.0',
				country: 'US'
			});
		});
	});
	
	describe('#parseTeamsExtInfo105()', function() {
		it('should parse a server team scores reply', function() {
			const st = new Packet.default(new Buffer('ff69000c809000676f6f640002ff6576696c0007ff', 'hex'), 0);
			
			const ack = st.getInt();
			const ver = st.getInt();
			const iserr = st.getInt();
			
			expect(ack).to.equal(-1);
			expect(ver).to.equal(105);
			expect(iserr).to.equal(0);
			
			expect(protocol259.parseTeamsExtInfo105(st)).to.eql({ good: 2, evil: 7 });
		});
	});
});
