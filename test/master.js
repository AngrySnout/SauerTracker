var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var Mitm = require('mitm');

chai.use(chaiAsPromised);
var expect = chai.expect;
var mitm = Mitm();

var config = require('../tracker.json');

mitm.on('connect', function(socket, opts) {
	if (opts.host != config.master.name || opts.port != config.master.port) socket.bypass();
});

var redis = require('../build/util/redis').default;
var master = require('../build/tracker/master');

redis.selectAsync(3);
redis.unref();

var sampleMasterReply = `addserver 1.2.3.4 1234
addserver 4.3.2.1 4321`;
var sampleServerList = [
	{ host: '1.2.3.4', port: 1234},
	{ host: '4.3.2.1', port: 4321}
];

describe('master', function() {
	describe('#getServerList()', function() {
		it('should get the server list from the master server', function() {
			mitm.once('connection', function(socket) { socket.write(sampleMasterReply); socket.emit('end'); });
			return expect(master.getServerList()).to.eventually.eql(sampleServerList);
		});
		
		it('should fail due to empty reply', function() {
			mitm.once('connection', function(socket) { socket.write(''); socket.emit('end'); });
			return expect(master.getServerList()).to.eventually.be.rejected;
		});
		
		it('should fail due to connection error', function() {
			mitm.once('connection', function(socket) { socket.emit('error'); });
			return expect(master.getServerList()).to.eventually.be.rejected;
		});
	});
	
	describe('#updateServerList()', function() {
		it('should update the server list and save it in redis', function() {
			mitm.once('connection', function(socket) { socket.write(sampleMasterReply); socket.emit('end'); });
			return Promise.all([ expect(master.updateServerList()).to.eventually.not.be.rejected,
				expect(redis.getAsync('servers')).to.eventually.eql(JSON.stringify(sampleServerList)) ]);
		});
	});
});
