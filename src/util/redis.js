import redis from 'redis';
import Promise from 'bluebird';

import { logError } from './util';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);


const client = redis.createClient();
export default client;

client.on('error', (err) => {
	logError(err);
});
