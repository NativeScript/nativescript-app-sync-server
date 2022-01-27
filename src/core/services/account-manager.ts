import * as models from '../../models'
import _ from 'lodash'
import validator from 'validator'
import * as security from '../utils/security'
import { client } from '../utils/redis'
import moment from 'moment'
import * as emailManager from './email-manager'
import * as config from '../config'
import { AppError } from '../app-error'
import log4js from 'log4js'
import { findByAppNameAndUid } from '~/queries'

const log = log4js.getLogger("cps:AccountManager")

export const collaboratorCan = function (uid, appName) {
  return getCollaborator(uid, appName)
    .then((data) => {
      if (!data) {
        log.debug(`collaboratorCan App ${appName} not exists.`);
        throw new AppError(`App ${appName} not exists.`);
      }
      log.debug('collaboratorCan yes');
      return data;
    });
};

export const ownerCan = function (uid, appName) {
  return getCollaborator(uid, appName)
    .then((data) => {
      if (!data) {
        log.debug(`ownerCan App ${appName} not exists.`);
        throw new AppError(`App ${appName} not exists.`);
      }
      if (!_.eq(_.get(data, 'roles'), 'Owner')) {
        log.debug(`ownerCan Permission Deny, You are not owner!`);
        throw new AppError("Permission Deny, You are not owner!");
      }
      return data;
    });
};

export const getCollaborator = function (uid, appName) {
  return findByAppNameAndUid(uid, appName);
};

export const findUserByEmail = function (email) {
  return models.Users.findOne({ where: { email: email } })
    .then((data) => {
      if (_.isEmpty(data)) {
        throw new AppError(email + " does not exist.");
      } else {
        return data;
      }
    });
};

export const getAllAccessKeyByUid = function (uid) {
  return models.UserTokens.findAll({ where: { uid: uid }, order: [['id', 'DESC']] })
    .then((tokens) => {
      return _.map(tokens, function (v) {
        return {
          name: '(hidden)',
          createdTime: parseInt(moment(v.created_at).format('x')),
          createdBy: v.created_by,
          expires: parseInt(moment(v.expires_at).format('x')),
          friendlyName: v.name,
          description: v.description,
        };
      });
    });
};

export const isExsitAccessKeyName = function (uid, friendlyName) {
  return models.UserTokens.findOne({
    where: { uid: uid, name: friendlyName }
  });
};

export const createAccessKey = function (uid, newAccessKey, ttl, friendlyName, createdBy, description) {
  return models.UserTokens.create({
    uid: uid,
    name: friendlyName,
    tokens: newAccessKey,
    description: description,
    created_by: createdBy,
    expires_at: moment().add(ttl / 1000, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  });
};

const LOGIN_LIMIT_PRE = 'LOGIN_LIMIT_PRE_';

export const login = function (account, password) {
  if (_.isEmpty(account)) {
    return Promise.reject(new AppError("Please enter your email address"))
  }
  if (_.isEmpty(password)) {
    return Promise.reject(new AppError("Please enter your password"))
  }
  var where = {};
  if (validator.isEmail(account)) {
    where = { email: account };
  } else {
    where = { username: account };
  }
  var tryLoginTimes = _.get(config, 'common.tryLoginTimes', 0);
  return models.Users.findOne({ where: where })
    .then((users) => {
      if (_.isEmpty(users)) {
        throw new AppError("The email or password you entered is incorrect");
      }
      return users;
    })
    .then((users) => {
      if (tryLoginTimes > 0) {
        var loginKey = `${LOGIN_LIMIT_PRE}${users?.id}`;
        return client.get(loginKey)
          .then((loginErrorTimes) => {
            if (Number(loginErrorTimes) > tryLoginTimes) {
              throw new AppError(`Too many login attempts. Your account has been locked.`);
            }
            return users;
          })
          .finally(() => client.quit());
      } else {
        return users;
      }
    })
    .then((users) => {
      if (!security.passwordVerifySync(password, users?.password)) {
        if (tryLoginTimes > 0) {
          var loginKey = `${LOGIN_LIMIT_PRE}${users?.id}`;
          client.exists(loginKey).then((isExists: any) => {
            if (!isExists) {
              var expires = Number(moment().endOf('day').format('X')) - Number(moment().format('X'));
              return client.setEx(loginKey, expires, '0');
            }
            return isExists;
          })
            .then(() => {
              return client.incr(loginKey);
            })
            .finally(() => client.quit());
        }
        throw new AppError("The email or password you entered is incorrect");
      } else {
        return users;
      }
    });
};

const REGISTER_CODE = "REGISTER_CODE_";
const EXPIRED = 1200;
const EXPIRED_SPEED = 10;

export const sendRegisterCode = function (email) {
  if (_.isEmpty(email)) {
    return Promise.reject(new AppError("Please enter your email address"));
  }
  return models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (u) {
        throw new AppError(`"${email}" already registered`);
      }
    })
    .then(() => {
      var token = security.randToken(40);
      return client.setEx(`${REGISTER_CODE}${security.md5(email)}`, EXPIRED, token)
        .then(() => {
          return token;
        })
        .finally(() => client.quit());
    })
    .then((token) => {
      console.log("Calling email manager with token: " + token);
      return emailManager.sendRegisterCode(email, token);
    })
};

export const checkRegisterCode = function (email, token) {
  return models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (u) {
        throw new AppError(`"${email}" is already registered`);
      }
    })
    .then(() => {
      var registerKey = `${REGISTER_CODE}${security.md5(email)}`;
      return client.get(registerKey)
        .then((storageToken) => {
          if (_.isEmpty(storageToken)) {
            throw new AppError(`The verification code has expired, grab a new one!`);
          }
          if (!_.eq(token, storageToken)) {
            client.ttl(registerKey)
              .then((ttl: any) => {
                if (ttl > 0) {
                  return client.expire(registerKey, ttl - EXPIRED_SPEED);
                }
                return ttl;
              })
              .finally(() => client.quit());
            throw new AppError(`Incorrect verification code, please enter it again.`);
          }
          return storageToken;
        })
    })
}

export const register = function (email, password) {
  return models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (u) {
        throw new AppError(`"${email}" is already registered`);
      }
    })
    .then(() => {
      var identical = security.randToken(9);
      return models.Users.create({
        email: email,
        password: security.passwordHashSync(password),
        identical: identical
      });
    })
}

export const changePassword = function (uid, oldPassword, newPassword) {
  if (!_.isString(newPassword) || newPassword.length < 6) {
    return Promise.reject(new AppError("Please enter a password between 6 and 20 characters"));
  }
  return models.Users.findOne({ where: { id: uid } })
    .then((u) => {
      if (!u) {
        throw new AppError(`User not found`);
      }
      return u;
    })
    .then((u) => {
      var isEq = security.passwordVerifySync(oldPassword, u.get('password'));
      if (!isEq) {
        throw new AppError(`The old password is incorrect, please try again`);
      }
      u.set('password', security.passwordHashSync(newPassword));
      u.set('ack_code', security.randToken(5));
      return u.save();
    });
};

