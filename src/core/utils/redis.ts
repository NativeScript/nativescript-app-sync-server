
import config from '../config'
import { createClient } from 'redis'
import _ from 'lodash/fp'

export const getRedisClient = async () => {
  const client = createClient(_.get(`redis`, config))
  client.on('error', (err) => console.log('Redis Client Error', err));
  client.on('connect', () => console.log('Redis connected!'));

  await client.connect()

  return client
}
