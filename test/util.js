var chai = require('chai');
var expect = chai.expect;

var util = require('../build/util/util');
var vars = require('../vars.json');

vars.clans = [
	{ "tag": "ab]" },
	{ "tag": "|cd|" }
];

describe('util', function() {
	describe('#ipRepLB()', function() {
		it('should replace the least significant octet in IP address', function() {
			expect(util.ipRepLB('1.2.3.4', 5)).to.equal('1.2.3.5');
		});
	});
	
	describe('#round2()', function() {
		it('should round number to 2 decimals', function() {
			expect(util.round2(0.1234)).to.equal(0.12);
		});
	});
	
	describe('#isValidIP()', function() {
		it('should return true for 1.2.3.4', function() {
			expect(util.isValidIP('1.2.3.4')).to.equal(true);
		});
		
		it('should return false for 1.2.3.4.5', function() {
			expect(util.isValidIP('1.2.3.4.5')).to.equal(false);
		});
		
		it('should return false for abcd', function() {
			expect(util.isValidIP('abcd')).to.equal(false);
		});
		
		it('should return false for a.b.c.d', function() {
			expect(util.isValidIP('a.b.c.d')).to.equal(false);
		});
	});
	
	describe('#isValidPort()', function() {
		it('should return true for 123', function() {
			expect(util.isValidPort(123)).to.equal(true);
		});
		
		it('should return false for -5', function() {
			expect(util.isValidPort(-5)).to.equal(false);
		});
		
		it('should return false for abcd', function() {
			expect(util.isValidPort('abcd')).to.equal(false);
		});
		
		it('should return false for 65535', function() {
			expect(util.isValidPort(65535)).to.equal(false);
		});
	});
	
	describe('#escapePostgresLike()', function() {
		it('should escape instances of _ and %', function() {
			expect(util.escapePostgresLike('a_b%c')).to.equal('a\\_b\\%c');
		});
	});
	
	describe('#getClan()', function() {
		it('should return ab] for ab]something', function() {
			expect(util.getClan('ab]something')).to.equal('ab]');
		});
		
		it('should return |cd| for something|cd|', function() {
			expect(util.getClan('something|cd|')).to.equal('|cd|');
		});
		
		it('should return undefined for something', function() {
			expect(util.getClan('something')).to.be.undefined;
		});
	});
});