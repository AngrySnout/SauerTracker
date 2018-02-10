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
		});
	});
	
	describe('#tryPoll()', function() {
		it('should', function() {
		});
	});
	
	describe('#shouldClean()', function() {
		it('should', function() {
		});
	});
	
	describe('#parseReply()', function() {
		it('should', function() {
		});
	});
	
	describe('#serialize()', function() {
		it('should', function() {
		});
	});
});
