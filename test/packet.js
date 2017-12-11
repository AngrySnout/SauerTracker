var chai = require('chai');
var expect = chai.expect;

var packet = require('../build/util/packet');

describe('packet', function() {
	describe('#cube2uni()', function() {
		it('should replace \\x97 with ö', function() {
			expect(packet.cube2uni('abc\x97')).to.equal('abcö');
		});
	});
	
	describe('#uni2cube()', function() {
		it('should replace ö with \\x97', function() {
			expect(packet.uni2cube('abcö')).to.equal('abc\x97');
		});
	});
	
	describe('#filterString()', function() {
		it('should remove \\f and the following character', function() {
			expect(packet.filterString('abc\fdefg')).to.equal('abcefg');
		});
	});
	
	describe('#escapeHtml()', function() {
		it('should escape html characters', function() {
			expect(packet.escapeHtml('<span>str&ing</span>')).to.equal('&lt;span&gt;str&amp;ing&lt;&#x2F;span&gt;');
		});
	});
	
	describe('#cube2colorHTML()', function() {
		it('should add html coloring to cube 2 style formatted string', function() {
			expect(packet.cube2colorHTML('\f5xy\fs\f6z&\frby')).to.equal('<span style="color: magenta">xy</span><span style="color: orange">z&amp;</span><span style="color: magenta">by</span>');
		});
	});
	
	describe('#Packet', function() {
		it('should correctly parse packet from Buffer', function() {
			var p = new packet.default(new Buffer('0580050581050505E568656C6C6F00', 'hex'));
			expect(p.getInt()).to.equal(5);
			expect(p.getInt()).to.equal(1285);
			expect(p.getInt()).to.equal(-452655867);
			expect(p.getString()).to.equal('hello');
		});
		
		it('should correctly construct packet', function() {
			var p = new packet.default(new Buffer(21));
			p.putInt(15);
			p.putInt(200);
			p.putInt(999999);
			p.putString('hello');
			p.putString('world');
			expect(p.buffer.toString('hex')).to.equal('0f80c800813f420f0068656c6c6f00776f726c6400');
		});
		
		it('should correctly construct packet and read it', function() {
			var p = new packet.default(new Buffer(21));
			p.putInt(15);
			p.putInt(200);
			p.putInt(-999999);
			p.putString('hello');
			p.putString('world');
			p.offset = 0;
			expect(p.getInt()).to.equal(15);
			expect(p.getInt()).to.equal(200);
			expect(p.getInt()).to.equal(-999999);
			expect(p.remaining()).to.equal(12);
			expect(p.finalize().toString('hex')).to.equal('0f80c80081c1bdf0ff')
			expect(p.getString()).to.equal('hello');
			expect(p.overread()).to.equal(false);
			expect(p.getString()).to.equal('world');
			expect(p.overread()).to.equal(true);
		});
	});
});
