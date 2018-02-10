import redis from 'redis';
import Promise from 'bluebird';

import { error } from './util';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);


const client = redis.createClient();
export default client;

client.on('error', (err) => {
	error(err);
});
