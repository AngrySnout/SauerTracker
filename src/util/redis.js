import redis from 'redis';
import Promise from 'bluebird';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

import {error} from './util';

var client = redis.createClient();
export default client;

client.on('error', function (err) {
	error(err);
});
