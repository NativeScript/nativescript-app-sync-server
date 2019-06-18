var express = require('express');
var router = express.Router();
var Promise = require('bluebird');
var _ = require('lodash');
var models = require('../models');
var middleware = require('../core/middleware');
var AccountManager = require('../core/services/account-manager');
var AppError = require('../core/app-error');
var log4js = require('log4js');
var log = log4js.getLogger("cps:account");

router.get('/', middleware.checkToken, (req, res) => {
  res.send({ title: 'AppSync Server' });
});

router.post('/', (req, res, next) => {
  var email = _.trim(_.get(req, 'body.email'));
  var token = _.trim(_.get(req, 'body.token'));
  var password = _.trim(_.get(req, 'body.password'));
  var accountManager = new AccountManager();
  return accountManager.checkRegisterCode(email, token)
  .then((u) => {
    if (_.isString(password) && password.length < 6) {
      throw new AppError.AppError('Please enter a password of 6 to 20 digits');
    }
    return accountManager.register(email, password);
  })
  .then(() => {
    res.send({status: "OK"});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.send({status: "ERROR", message: e.message});
    } else {
      next(e);
    }
  });
});

router.get('/exists', (req, res, next) => {
  var email = _.trim(_.get(req, 'query.email'));
  models.Users.findOne({where: {email: email}})
  .then((u) => {
    if (!email) {
      throw new AppError.AppError(`Please enter your email address`);
    }
    res.send({status: "OK", exists: u ? true : false});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.send({status: "ERROR", message: e.message});
    } else {
      next(e);
    }
  });
});

router.post('/registerCode', (req, res, next) => {
  var email = _.get(req, 'body.email');
  log.debug('registerCode called for email:', email);

  var accountManager = new AccountManager();
  return accountManager.sendRegisterCode(email)
  .then(() => {
    res.send({status: "OK"});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.send({status: "ERROR", message: e.message});
    } else {
      next(e);
    }
  });
});

router.get('/registerCode/exists', (req, res, next) => {
  var email = _.trim(_.get(req, 'query.email'));
  var token = _.trim(_.get(req, 'query.token'));
  var accountManager = new AccountManager();
  return accountManager.checkRegisterCode(email, token)
  .then(() => {
    res.send({status: "OK"});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.send({status: "ERROR", message: e.message});
    } else {
      next(e);
    }
  });
});

//修改密码
router.patch('/password', middleware.checkToken, (req, res, next) => {
  var oldPassword = _.trim(_.get(req, 'body.oldPassword'));
  var newPassword = _.trim(_.get(req, 'body.newPassword'));
  var uid = req.users.id;
  var accountManager = new AccountManager();
  return accountManager.changePassword(uid, oldPassword, newPassword)
  .then(() => {
    res.send({status: "OK"});
  })
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      res.send({status: "ERROR", message: e.message});
    } else {
      next(e);
    }
  });
});

module.exports = router;
