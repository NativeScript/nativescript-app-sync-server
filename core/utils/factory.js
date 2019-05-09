'use strict';
var Promise = require('bluebird');
var redis = require('redis');
Promise.promisifyAll(redis.RedisClient.prototype);
Promise.promisifyAll(redis.Multi.prototype);
var config    = require('../config');
var _ = require('lodash');
var factory = {};
module.exports = factory;

factory.getRedisClient = function (name) {
  return redis.createClient(_.get(config, `redis.${name}`));
};
