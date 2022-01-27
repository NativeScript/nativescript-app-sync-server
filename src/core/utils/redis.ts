
import config from '../config'
import redis from 'redis'
import _ from'lodash'

export const getRedisClient = function (name) {
  return redis.createClient(_.get(config, `redis.${name}`));
};

export const client = getRedisClient('default')