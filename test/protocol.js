var chai = require('chai');
var expect = chai.expect;

var protocol = require('../build/util/protocol');

describe('protocol', function() {
	describe('#getGameMode()', function() {
		it('should return efficiency for 5', function() {
			expect(protocol.getGameMode(5)).to.equal('efficiency');
		});
		
		it('should return insta_hold for 16', function() {
			expect(protocol.getGameMode(16)).to.equal('insta_hold');
		});
		
		it('should return unknown for 50', function() {
			expect(protocol.getGameMode(50)).to.equal('unknown');
		});
	});
	
	describe('#getMasterMode()', function() {
		it('should return auth for -1', function() {
			expect(protocol.getMasterMode(-1)).to.equal('auth');
		});
		
		it('should return locked for 2', function() {
			expect(protocol.getMasterMode(2)).to.equal('locked');
		});
		
		it('should return unknown for 50', function() {
			expect(protocol.getMasterMode(50)).to.equal('unknown');
		});
	});
});
