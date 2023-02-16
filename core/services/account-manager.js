'use strict';
var Promise = require('bluebird');
var models = require('../../models');
var _ = require('lodash');
var validator = require('validator');
var security = require('../utils/security');
var factory = require('../utils/factory');
var moment = require('moment');
var EmailManager = require('./email-manager');
var config = require('../config');
var AppError = require('../app-error');
var log4js = require('log4js');
var log = log4js.getLogger("cps:AccountManager");

var proto = module.exports = function (){
  function AccountManager() {

  }
  AccountManager.__proto__ = proto;
  return AccountManager;
};

proto.collaboratorCan = function(uid, appName) {
  return this.getCollaborator(uid, appName)
  .then((data) => {
    if (!data) {
      log.debug(`collaboratorCan App ${appName} not exists.`);
      throw new AppError.AppError(`App ${appName} not exists.`);
    }
    log.debug('collaboratorCan yes');
    return data;
  });
};

proto.ownerCan = function(uid, appName) {
  return this.getCollaborator(uid, appName)
  .then((data) => {
    if (!data) {
      log.debug(`ownerCan App ${appName} not exists.`);
      throw new AppError.AppError(`App ${appName} not exists.`);
    }
    if (!_.eq(_.get(data,'roles'), 'Owner') ) {
      log.debug(`ownerCan Permission Deny, You are not owner!`);
      throw new AppError.AppError("Permission Deny, You are not owner!");
    }
    return data;
  });
};

proto.getCollaborator = function (uid, appName) {
  return models.Collaborators.findByAppNameAndUid(uid, appName);
};

proto.findUserByEmail = function (email) {
  return models.Users.findOne({where: {email: email}})
  .then((data) => {
    if (_.isEmpty(data)) {
      throw new AppError.AppError(email + " does not exist.");
    } else {
      return data;
    }
  });
};

proto.getAllAccessKeyByUid = function (uid) {
  return models.UserTokens.findAll({where: {uid: uid}, order:[['id', 'DESC']]})
  .then((tokens) => {
    return _.map(tokens, function(v){
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

proto.isExsitAccessKeyName = function (uid, friendlyName) {
  return models.UserTokens.findOne({
    where: {uid: uid, name: friendlyName}
  });
};

proto.createAccessKey = function (uid, newAccessKey, ttl, friendlyName, createdBy, description) {
  return models.UserTokens.create({
    uid: uid,
    name: friendlyName,
    tokens: newAccessKey,
    description: description,
    created_by: createdBy,
    expires_at: moment().add(ttl/1000, 'seconds').format('YYYY-MM-DD HH:mm:ss'),
    created_at: moment().format('YYYY-MM-DD HH:mm:ss'),
  });
};

const LOGIN_LIMIT_PRE = 'LOGIN_LIMIT_PRE_';

proto.login = function (account, password) {
  if (_.isEmpty(account)) {
    return Promise.reject(new AppError.AppError("Please enter your email address"))
  }
  if (_.isEmpty(password)) {
    return Promise.reject(new AppError.AppError("Please enter your password"))
  }
  var where = {};
  if (validator.isEmail(account)) {
    where = {email: account};
  }else {
    where = {username: account};
  }
  var tryLoginTimes = _.get(config, 'common.tryLoginTimes', 0);
  return models.Users.findOne({where: where})
  .then((users) => {
    if (_.isEmpty(users)) {
      throw new AppError.AppError("The email or password you entered is incorrect");
    }
    return users;
  })
  .then((users) => {
    if (tryLoginTimes > 0) {
      // var loginKey = `${LOGIN_LIMIT_PRE}${users.id}`;
      // var client = factory.getRedisClient("default");
      // return client.getAsync(loginKey)
      // .then((loginErrorTimes) => {
      //   if (loginErrorTimes > tryLoginTimes) {
      //     throw new AppError.AppError(`Too many login attempts. Your account has been locked.`);
      //   }
      //   return users;
      // })
      // .finally(() => client.quit());
      return users;
    } else {
      return users;
    }
  })
  .then((users) => {
    if (!security.passwordVerifySync(password, users.password)) {
      if (tryLoginTimes > 0) {
        var loginKey = `${LOGIN_LIMIT_PRE}${users.id}`;
        var client = factory.getRedisClient("default");
        client.existsAsync(loginKey)
        .then((isExists) => {
          if (!isExists) {
            var expires = moment().endOf('day').format('X') - moment().format('X');
            return client.setexAsync(loginKey, expires, 0);
          }
          return isExists;
        })
        .then(() => {
          return client.incrAsync(loginKey);
        })
        .finally(() => client.quit());
      }
      throw new AppError.AppError("The email or password you entered is incorrect");
    } else {
      return users;
    }
  });
};

const REGISTER_CODE = "REGISTER_CODE_";
const EXPIRED = 1200;
const EXPIRED_SPEED = 10;

proto.sendRegisterCode = function (email) {
  if (_.isEmpty(email)) {
    return Promise.reject(new AppError.AppError("Please enter your email address"));
  }
  return models.Users.findOne({where: {email: email}})
  .then((u) => {
    if (u) {
      throw new AppError.AppError(`"${email}" already registered`);
    }
  })
  .then(() => {
    //将token临时存储到redis
    var token = security.randToken(40);
    return token
    // var client = factory.getRedisClient("default");
    // return client.setexAsync(`${REGISTER_CODE}${security.md5(email)}`, EXPIRED, token)
    // .then(() => {
    //   return token;
    // })
    // .finally(() => client.quit());
  })
  .then((token) => {
    //将token发送到用户邮箱
    var emailManager = new EmailManager();
    console.log("Calling email manager with token: " + token);
    return emailManager.sendRegisterCode(email, token);
  })
  .catch(err => {
    console.log(err)
  })
};

proto.checkRegisterCode = function (email, token) {
  return models.Users.findOne({where: {email: email}})
  .then((u) => {
    if (u) {
      throw new AppError.AppError(`"${email}" is already registered`);
    }
  })
  .then(() => {
    var registerKey = `${REGISTER_CODE}${security.md5(email)}`;
    var client = factory.getRedisClient("default");
    return true;
    //return client.getAsync(registerKey)
    // .then((storageToken) => {
    //   if (_.isEmpty(storageToken)) {
    //     throw new AppError.AppError(`The verification code has expired, grab a new one!`);
    //   }
    //   if (!_.eq(token, storageToken)) {
    //     client.ttlAsync(registerKey)
    //     .then((ttl) => {
    //       if (ttl > 0) {
    //         return client.expireAsync(registerKey, ttl - EXPIRED_SPEED);
    //       }
    //       return ttl;
    //     })
    //     .finally(() => client.quit());
    //     throw new AppError.AppError(`Incorrect verification code, please enter it again.`);
    //   }
    //   return storageToken;
    // })
  })
}

proto.register = function (email, password) {
  return models.Users.findOne({where: {email: email}})
  .then((u) => {
    if (u) {
      throw new AppError.AppError(`"${email}" is already registered`);
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

proto.registerExternal = function (id, email, identical) {
  return models.Users.findOne({where: {email: email}})
  .then((u) => {
    if (u) {
      throw new AppError.AppError(`"${email}" is already registered`);
    }
  })
  .then(() => {
    return models.Users.create({
      email: email,
      identical: identical,
      id: id
    });
  })
}

proto.changePassword = function (uid, oldPassword, newPassword) {
  if (!_.isString(newPassword) || newPassword.length < 6) {
    return Promise.reject(new AppError.AppError("Please enter a password between 6 and 20 characters"));
  }
  return models.Users.findOne({where: {id: uid}})
  .then((u) => {
    if (!u) {
      throw new AppError.AppError(`User not found`);
    }
    return u;
  })
  .then((u) => {
    var isEq = security.passwordVerifySync(oldPassword, u.get('password'));
    if (!isEq) {
      throw new AppError.AppError(`The old password is incorrect, please try again`);
    }
    u.set('password', security.passwordHashSync(newPassword));
    u.set('ack_code', security.randToken(5));
    return u.save();
  });
};

