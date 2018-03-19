var chai = require('chai');

var expect = chai.expect;

var player = require('../build/tracker/player');
var redis = require('../build/util/redis').default;
var database = require('../build/util/database').default;

redis.selectAsync(3);
redis.unref();
database.destroy();

describe('player', function() {
	describe('#totalStats()', function() {
		it('should sum all stats in object', function() {
			let modeStats = {
				insta: { frags: 7, flags: 2, deaths: 5, tks: 8, accFrags: 50 },
				effic: { frags: 5, flags: 8, deaths: 11, tks: 2, accFrags: 20 }
			};
			expect(player.totalStats(modeStats)).to.eql({ frags: 12, flags: 10, deaths: 16, tks: 10, accFrags: 70 });
		});
	});
	
	describe('#sumModeStats()', function() {
		it('should sum all stats in object', function() {
			let newModeStats = { frags: 7, flags: 2, deaths: 5, tks: 8, accFrags: 50 };
			let oldModeStatsString = '[5,4,10,2,0]';
			expect(player.sumModeStats(newModeStats, oldModeStatsString)).to.eql('[12,6,15,10,50]');
		});
	});
	
	describe('#updateRow()', function() {
		it('should update a database row', function() {
			let row = {
				name: 'origin',
				frags: 1000,
				flags: 100,
				deaths: 1000,
				tks: 100,
				accFrags: 500,
				country: 'SY',
				instastats: '',
				efficstats: ''
			};
			let modeStats = {
				other: { frags: 7, flags: 8, deaths: 9, tks: 3, accFrags: 101 },
				effic: { frags: 2, flags: 6, deaths: 4, tks: 1, accFrags: 26 },
				insta: { frags: 3, flags: 5, deaths: 2, tks: 1, accFrags: 39 }
			};
			expect(player.updateRow('origin', row, modeStats, 'US')).to.eql({
				name: 'origin',
				frags: 1012,
				flags: 119,
				deaths: 1015,
				tks: 105,
				accFrags: 666,
				country: 'US',
				elo: 1200,
				instastats: '[3,5,2,1,39]',
				efficstats: '[2,6,4,1,26]'
			});
			expect(player.updateRow('origin', row, modeStats, '')).to.eql({
				name: 'origin',
				frags: 1012,
				flags: 119,
				deaths: 1015,
				tks: 105,
				accFrags: 666,
				country: 'SY',
				elo: 1200,
				instastats: '[3,5,2,1,39]',
				efficstats: '[2,6,4,1,26]'
			});
			expect(player.updateRow('origin', {}, modeStats, 'SY')).to.eql({
				name: 'origin',
				frags: 12,
				flags: 19,
				deaths: 15,
				tks: 5,
				accFrags: 166,
				country: 'SY',
				elo: 1200,
				instastats: '[3,5,2,1,39]',
				efficstats: '[2,6,4,1,26]'
			});
		});
	});
	
	describe('#Player', function() {
		var pl;
		
		describe('#constructor', function() {
			it('should create a player', function() {
				pl = new player.default('origin');
				expect(pl.name).to.equal('origin');
			});
		});
		
		describe('#updateState', function() {
			it('should update a player\'s stats', function() {
				let oldState = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };
				let newState = { frags: 2, flags: 6, deaths: 4, tks: 1, acc: 13, country: 'US' };
				pl.updateState('ffa', newState, oldState);
				expect(pl.modeStats.other).to.eql({ frags: 2, flags: 6, deaths: 4, tks: 1, accFrags: 26 });
				expect(pl.country).to.equal('US');
			});
			
			it('should update a player\'s stats a 2nd time', function() {
				let oldState = { frags: 2, flags: 6, deaths: 4, tks: 1, acc: 13, country: 'US' };
				let newState = { frags: 7, flags: 8, deaths: 9, tks: 3, acc: 15, country: 'DE' };
				pl.updateState('ffa', newState, oldState);
				expect(pl.modeStats.other).to.eql({ frags: 7, flags: 8, deaths: 9, tks: 3, accFrags: 101 });
				expect(pl.country).to.equal('DE');
			});
			
			it('should update a player\'s stats a 3rd time', function() {
				let oldState = { frags: 7, flags: 8, deaths: 9, tks: 3, acc: 15, country: 'DE' };
				let newState = { frags: 0, flags: 0, deaths: 2, tks: 0, acc: 0, country: '' };
				pl.updateState('ffa', newState, oldState);
				expect(pl.modeStats.other).to.eql({ frags: 7, flags: 8, deaths: 9, tks: 3, accFrags: 101 });
				expect(pl.country).to.equal('DE');
			});
			
			it('should update a player\'s effic and insta stats', function() {
				let oldState = { frags: 0, flags: 0, deaths: 0, tks: 0, acc: 0 };
				let newEfficState = { frags: 2, flags: 6, deaths: 4, tks: 1, acc: 13 };
				let newInstaState = { frags: 3, flags: 5, deaths: 2, tks: 1, acc: 13 };
				pl.updateState('efficiency', newEfficState, oldState);
				pl.updateState('instagib', newInstaState, oldState);
				expect(pl.modeStats.other).to.eql({ frags: 7, flags: 8, deaths: 9, tks: 3, accFrags: 101 });
				expect(pl.modeStats.effic).to.eql({ frags: 2, flags: 6, deaths: 4, tks: 1, accFrags: 26 });
				expect(pl.modeStats.insta).to.eql({ frags: 3, flags: 5, deaths: 2, tks: 1, accFrags: 39 });
				expect(pl.country).to.equal('DE');
			});
		});
	});
});
