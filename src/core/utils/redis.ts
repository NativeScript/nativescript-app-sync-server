
import config from '../config'
import * as redis from 'redis'
import _ from 'lodash'

export const client = redis.createClient(_.get(config, `redis.default`))
client.on('error', (err) => console.log('Redis Client Error', err));