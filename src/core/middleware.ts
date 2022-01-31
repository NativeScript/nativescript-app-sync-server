import _ from 'lodash'
import Promise from 'bluebird'
import * as security from './utils/security'
import * as models from '../models'
import moment from 'moment'
import { AppError, UnauthorizedError } from './app-error'
import { Op } from 'sequelize'
import config from './config'
import jwt from 'jsonwebtoken'

const checkAuthToken = function (authToken) {
  const objToken = security.parseToken(authToken);
  return models.Users.findOne({
    where: { identical: objToken.identical }
  })
    .then((users) => {
      if (_.isEmpty(users)) {
        throw new UnauthorizedError();
      }
      return models.UserTokens.findOne({
        where: { tokens: authToken, uid: users?.id, expires_at: { [Op.gt]: moment().format('YYYY-MM-DD HH:mm:ss') } }
      })
        .then((tokenInfo) => {
          if (_.isEmpty(tokenInfo)) {
            throw new UnauthorizedError()
          }
          return users;
        })
    }).then((users) => {
      return users;
    })
}

const checkAccessToken = function (accessToken) {
  return new Promise((resolve, reject) => {
    if (_.isEmpty(accessToken)) {
      return reject(new UnauthorizedError());
    }

    var tokenSecret = _.get(config, 'jwt.tokenSecret');

    try {
      var authData = jwt.verify(accessToken, tokenSecret);
    } catch (e) {
      return reject(new UnauthorizedError());
    }
    var uid = _.get(authData, 'uid', null);
    var hash = _.get(authData, 'hash', null);
    if (parseInt(uid) > 0) {
      return models.Users.findOne({
        where: { id: uid }
      })
        .then((users) => {
          if (_.isEmpty(users)) {
            throw new UnauthorizedError();
          }
          if (!_.eq(hash, security.md5(users?.get('ack_code')))) {
            throw new UnauthorizedError();
          }
          resolve(users);
        })
        .catch((e) => {
          reject(e);
        });
    } else {
      reject(new UnauthorizedError());
    }
  });
}

export const checkToken = function (req, res, next) {
  var authArr = _.split(req.get('Authorization'), ' ');
  var authType = 1;
  var authToken = '';
  if (_.eq(authArr[0], 'Bearer')) {
    authToken = authArr[1]; //Bearer
    if (authToken && authToken.length > 64) {
      authType = 2;
    } else {
      authType = 1;
    }
  } else if (_.eq(authArr[0], 'Basic')) {
    authType = 2;
    var b = Buffer.from(authArr[1], 'base64');
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
        if (e instanceof AppError) {
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
        if (e instanceof AppError) {
          res.status(e.status || 404).send(e.message);
        } else {
          next(e);
        }
      });
  } else {
    res.send(new UnauthorizedError(`Auth type not supported.`));
  }
};
