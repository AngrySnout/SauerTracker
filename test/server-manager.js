var chai = require('chai');
var sinon = require('sinon');
var expect = chai.expect;

var Server = require('../build/tracker/server').default;
var serverManager = require('../build/tracker/server-manager').default;
var redis = require('../build/util/redis').default;
var database = require('../build/util/database').default;
var util = require('../build/util/util');

redis.unref();
database.destroy();
util.log = function() {};

describe('ServerManager', function() {
	describe('#add()', function() {
		it('should successfully add a server', function() {
			expect(serverManager.add('1.2.3.4', 1234)).to.equal(true);
		});
		
		it('should successfully add a second server', function() {
			expect(serverManager.add('2.3.4.5', 2345, { website: '2345.com' })).to.equal(true);
		});
		
		it('should fail to add an existing server', function() {
			expect(serverManager.add('2.3.4.5', 2345)).to.equal(false);
		});
		
		it('should fail to add a server with an invalid IP address', function() {
			expect(() => serverManager.add('2.3.4.a', 2345)).to.throw();
		});
	});
	
	describe('#find()', function() {
		it('should find a server', function() {
			expect(serverManager.find('1.2.3.4', 1234)).to.include({ host: '1.2.3.4', port: 1234 });
		});
		
		it('should find another server', function() {
			expect(serverManager.find('2.3.4.5', 2345)).to.include({ host: '2.3.4.5', port: 2345 }).and.to.nested.include({ 'info.website': '2345.com' });
		});
		
		it('should find not find a non-existent server', function() {
			expect(serverManager.find('3.4.5.6', 2345)).to.be.undefined;
		});
	});
	
	describe('#cleanUp()', function() {
		var clock;
		
		before(function() {
			clock = sinon.useFakeTimers();
		});
		
		after(function() {
			clock.restore();
		});
		
		it('should not remove any servers', function() {
			serverManager.cleanUp();
			expect(serverManager.find('1.2.3.4', 1234)).to.include({ host: '1.2.3.4', port: 1234 });
		});
		
		it('should remove one of the servers', function() {
			serverManager.find('2.3.4.5', 2345).lastReply = new Date().getTime();
			clock.tick(30001);
			serverManager.find('1.2.3.4', 1234).lastReply = new Date().getTime();
			serverManager.cleanUp();
			expect(serverManager.find('1.2.3.4', 1234)).to.include({ host: '1.2.3.4', port: 1234 });
			expect(serverManager.find('2.3.4.5', 2345)).to.be.undefined;
		});
		
		it('should remove the other server', function() {
			clock.tick(30001);
			serverManager.cleanUp();
			expect(serverManager.find('1.2.3.4', 1234)).to.be.undefined;
		});
	});
	
	describe('#update()', function() {
		before(function() {
			redis.selectAsync(4);
		});
	
		after(function() {
			redis.selectAsync(3);
		});

		it('should update the server list from redis', function(done) {
			redis.setAsync('servers', JSON.stringify([
				{ host: '1.2.3.4', port: 1234 },
				{ host: '2.3.4.5', port: 2345 },
				{ host: '2.3.4.5', port: 2345 }
			])).then(function() {
				return serverManager.update();
			}).then(function(res) {
				expect(res).to.equal(2);
				expect(serverManager.find('1.2.3.4', 1234)).to.include({ host: '1.2.3.4', port: 1234 });
				expect(serverManager.find('2.3.4.5', 2345)).to.include({ host: '2.3.4.5', port: 2345 });
				done();
			}).catch(done);
		});
	});
	
	describe('#pollAll()', function() {
		var spy,
			tryPoll;
		
		before(function() {
			spy = sinon.spy();
			tryPoll = Server.prototype.tryPoll;
			Server.prototype.tryPoll = spy;
		});
		
		after(function() {
			Server.prototype.tryPoll = tryPoll;
		});
		
		it('should try to poll all servers', function() {
			serverManager.pollAll();
			expect(spy.callCount).to.equal(2);
			expect(spy.getCall(0).args[1]).to.equal(1);
		});
		
		it('should try to poll all servers a second time', function() {
			serverManager.pollAll();
			expect(spy.callCount).to.equal(4);
			expect(spy.getCall(2).args[1]).to.equal(2);
		});
	});
	
	describe('#serialize()', function() {
		var stub,
			serialize;
		
		before(function() {
			serialize = Server.prototype.serialize;
			stub = sinon.stub(Server.prototype, 'serialize').returns(42);
		});
		
		after(function() {
			Server.prototype.serialize = serialize;
		});
		
		it('should serialize all servers', function() {
			let s = serverManager.serialize();
			expect(stub.callCount).to.equal(0);
			expect(s).to.eql([]);
			for (let i in serverManager.list) {
				serverManager.list[i].game = { masterMode: 'locked' };
			}
			s = serverManager.serialize();
			expect(stub.callCount).to.equal(2);
			expect(s).to.eql([ 42, 42 ]);
		});
	});
	
	describe('#updateServerListJSON()', function() {
		var stub,
			serialize;
		
		before(function() {
			serialize = Server.prototype.serialize;
			stub = sinon.stub(Server.prototype, 'serialize').returns(42);
		});
		
		after(function() {
			Server.prototype.serialize = serialize;
		});
		
		it('should serialize all servers and put the result in redis', function(done) {
			serverManager.updateServerListJSON()
				.then(() => redis.getAsync('server-list'))
				.then(function(res) {
					expect(stub.callCount).to.equal(2);
					expect(res).to.equal('[42,42]');
					done();
				})
				.catch(done);
		});
	});
});
