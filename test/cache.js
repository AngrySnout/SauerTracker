var Promise = require('bluebird');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
var expect = chai.expect;

var redis = require('../build/util/redis').default;
var cache = require('../build/util/cache').default;

redis.selectAsync(3);
redis.unref()

describe('cache', function() {
	it('should create a cache entry and get it', function() {
		cache.set('test-entry', 5000, () => Promise.resolve(42));
		return Promise.all([ expect(cache.get('test-entry')).to.eventually.equal(42),
							 expect(redis.getAsync('cache-test-entry').then(parseInt)).to.eventually.be.above(0) ]);
	});
});
