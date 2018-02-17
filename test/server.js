var chai = require('chai');
var sinon = require('sinon');

var expect = chai.expect;

var Server = require('../build/tracker/server').default;
var redis = require('../build/util/redis').default;
var database = require('../build/util/database').default;
var util = require('../build/util/util');

redis.unref();
database.destroy();
util.log = function() {};

describe('Server', function() {
	let server;
	
	describe('#constructor()', function() {
		it('should create a new server', function() {
			server = new Server('1.2.3.4', 1234, { website: '1234.com' });
			expect(server).to.include({ host: '1.2.3.4', port: 1234 }).and.to.nested.include({ 'info.website': '1234.com' });
		});
	});
	
	describe('#setInfo()', function() {
		it('should update server info', function() {
			server.setInfo('demourl', '1234.com/demos');
			expect(server).to.nested.include({ 'info.demourl': '1234.com/demos' });
		});
	});
	
	describe('#shouldPoll()', function() {
		it('should', function() {
			// TODO
		});
	});
	
	describe('#tryPoll()', function() {
		it('should', function() {
			// TODO
		});
	});
	
	describe('#shouldClean()', function() {
		it('should report that the server shouldn\'t be cleaned', function() {
			server.lastReply = 1000;
			expect(server.shouldClean(10000)).to.equal(false);
		});
		
		it('should report that the server shouldn be cleaned', function() {
			server.lastReply = 1000;
			expect(server.shouldClean(31001)).to.equal(true);
		});
	});
	
	describe('#parseReply()', function() {
		it('should', function() {
			// TODO
		});
	});
	
	describe('#serialize()', function() {
		it('should serialize a Server object', function() {
			server.descriptionStyled = '<b>My Server</b>';
			server.description = 'My Server';
			server.country = 'de';
			server.game = null;
			expect(server.serialize(false)).to.eql({
				'country': 'de',
				'countryName': 'Germany',
				'description': 'My Server',
				'descriptionStyled': '<b>My Server</b>',
				'host': '1.2.3.4',
				'port': 1234
			});
		});
	});
});
