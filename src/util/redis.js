import redis from 'redis';
import Promise from 'bluebird';

import { logError } from './util';
import { getRedisURL } from './config';

Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);

const client = redis.createClient({
  url: getRedisURL(),
});
export default client;

client.on('error', err => {
  logError(err);
});
