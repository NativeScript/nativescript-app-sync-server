'use strict';
var _ = require('lodash');
var Promise = require('bluebird');
var security = require('../core/utils/security');
var models = require('../models');
var moment = require('moment');
var AppError = require('./app-error')

var middleware = module.exports

var checkAuthToken = function (authToken) {
  var objToken = security.parseToken(authToken);
  return models.Users.findOne({
    where: {identical: objToken.identical}
  })
  .then((users) => {
    if (_.isEmpty(users)) {
      throw new AppError.Unauthorized();
    }
    var Sequelize = require('sequelize');
    return models.UserTokens.findOne({
      where: {tokens: authToken, uid: users.id, expires_at: { [Sequelize.Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss') }}
    })
    .then((tokenInfo) => {
      if (_.isEmpty(tokenInfo)){
        throw new AppError.Unauthorized()
      }
      return users;
    })
  }).then((users) => {
    return users;
  })
}

var checkAccessToken = function (accessToken) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(accessToken)) {
      return reject(new AppError.Unauthorized());
    }
    var config = require('../core/config');
    var tokenSecret = _.get(config, 'jwt.tokenSecret');
    var jwt = require('jsonwebtoken');
    try {
      var authData = jwt.verify(accessToken, tokenSecret);
    } catch (e) {
      return reject(new AppError.Unauthorized());
    }
    var uid = _.get(authData, 'uid', null);
    var hash = _.get(authData, 'hash', null);
    if (parseInt(uid) > 0) {
      return models.Users.findOne({
        where: {id: uid}
      })
      .then((users) => {
        if (_.isEmpty(users)) {
          throw new AppError.Unauthorized();
        }
        if (!_.eq(hash, security.md5(users.get('ack_code')))){
          throw new AppError.Unauthorized();
        }
        resolve(users);
      })
      .catch((e) => {
        reject(e);
      });
    } else {
      reject(new AppError.Unauthorized());
    }
  });
}

middleware.checkToken = function(req, res, next) {
  var authArr = _.split(req.get('Authorization'), ' ');
  var authType = 1;
  var authToken = null;
  if (_.eq(authArr[0], 'Bearer')) {
    authToken = authArr[1]; //Bearer
    if (authToken && authToken.length > 64) {
      authType = 2;
    } else {
      authType = 1;
    }
  } else if(_.eq(authArr[0], 'Basic')) {
    authType = 2;
    var b = new Buffer(authArr[1], 'base64');
    var user = _.split(b.toString(), ':');
    authToken = _.get(user, '1');
  }
  if (authToken && authType == 1) {
    checkAuthToken(authToken)
    .then((users) => {
      req.users = users;
      next();
      return users;
    })
    .catch((e) => {
      if (e instanceof AppError.AppError) {
        res.status(e.status || 404).send(e.message);
      } else {
        next(e);
      }
    });
  } else if (authToken && authType == 2) {
    checkAccessToken(authToken)
    .then((users) => {
      req.users = users;
      next();
      return users;
    })
    .catch((e) => {
      if (e instanceof AppError.AppError) {
        res.status(e.status || 404).send(e.message);
      } else {
        next(e);
      }
    });
  } else {
    res.send(new AppError.Unauthorized(`Auth type not supported.`));
  }
};
