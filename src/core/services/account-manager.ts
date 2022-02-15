import * as models from '../../models'
import _ from 'lodash'
import validator from 'validator'
import * as security from '../utils/security'
import { getRedisClient } from '../utils/redis'
import moment from 'moment'
import * as emailManager from './email-manager'
import * as config from '../config'
import { AppError } from '../app-error'
import log4js from 'log4js'
import { findByAppNameAndUid } from '~/queries'

const log = log4js.getLogger("cps:AccountManager")

export const collaboratorCan = async function (uid: number, appName: string) {
  const data = await getCollaborator(uid, appName)
  if (!data) {
    log.debug(`collaboratorCan App ${appName} not exists.`);
    throw new AppError(`App ${appName} not exists.`);
  }
  log.debug('collaboratorCan yes');
  return data;
};

export const ownerCan = function (uid: number, appName: string) {
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

export const getCollaborator = (uid: number, appName: string) => findByAppNameAndUid(uid, appName);

export const findUserByEmail = function (email: string) {
  return models.Users.findOne({ where: { email: email } })
    .then((data) => {
      if (_.isEmpty(data)) {
        throw new AppError(email + " does not exist");
      } else {
        return data;
      }
    });
};

export const getAllAccessKeyByUid = function (uid: number) {
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

export const isExsitAccessKeyName = function (uid: number, friendlyName: string) {
  return models.UserTokens.findOne({
    where: { uid: uid, name: friendlyName }
  });
};

export const createAccessKey = function (uid: number, newAccessKey: string, ttl: number, friendlyName: string, createdBy: string, description: string) {
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

export const login = async function (account: string, password: string) {
  if (_.isEmpty(account)) {
    throw new AppError("Please enter your email address")
  }
  if (_.isEmpty(password)) {
    throw new AppError("Please enter your password")
  }
  const isEmail = validator.isEmail(account)
  const where = isEmail ? { email: account } : { username: account }

  const tryLoginTimes = _.get(config, 'common.tryLoginTimes', 0);
  const users = await models.Users.findOne({ where: where })
  if (!users) {
    throw new AppError("The email or password you entered is incorrect")
  }

  if (tryLoginTimes > 0) {
    const loginKey = `${LOGIN_LIMIT_PRE}${users.id}`;
    const client = await getRedisClient()
    const loginErrorTimes = await client.get(loginKey).finally(() => client.quit());

    if (Number(loginErrorTimes) > tryLoginTimes) {
      throw new AppError(`Too many login attempts. Your account has been locked.`);
    }
  }

  if (!security.passwordVerifySync(password, users.password)) {
    if (tryLoginTimes > 0) {
      const loginKey = `${LOGIN_LIMIT_PRE}${users.id}`;
      const client = await getRedisClient()

      try {
        const isExists = await client.exists(loginKey)
        if (!isExists) {
          const expires = Number(moment().endOf('day').format('X')) - Number(moment().format('X'));
          await client.setEx(loginKey, expires, '0');
        }

        await client.incr(loginKey);
      } finally {
        client.quit()
      }

    }
    throw new AppError("The email or password you entered is incorrect");
  } else {
    return users;
  }
};

const REGISTER_CODE = "REGISTER_CODE_";
const EXPIRED = 1200;
const EXPIRED_SPEED = 10;

export const sendRegisterCode = function (email: string) {
  return models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (u) {
        throw new AppError(`"${email}" already registered`);
      }
    })
    .then(async () => {
      var token = security.randToken(40);
      const client = await getRedisClient()
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

export const checkRegisterCode = function (email: string, token: string) {
  return models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (u) {
        throw new AppError(`"${email}" is already registered`);
      }
    })
    .then(async () => {
      var registerKey = `${REGISTER_CODE}${security.md5(email)}`;
      const client = await getRedisClient()
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

export const register = function (email: string, password: string) {
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

export const changePassword = function (uid: number, oldPassword: string, newPassword: string) {
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

