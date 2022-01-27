import express from 'express'
import Promise from 'bluebird'
import _ from 'lodash'
import * as models from '../models'
import * as middleware from '../core/middleware'
import * as accountManager from '../core/services/account-manager'
import { AppError } from '../core/app-error'
import log4js from 'log4js'

const router = express.Router();
const log = log4js.getLogger("cps:account");

router.get('/', middleware.checkToken, (req, res) => {
  res.send({ title: 'AppSync Server' });
});

router.post('/', (req, res, next) => {
  var email = _.trim(_.get(req, 'body.email'));
  var token = _.trim(_.get(req, 'body.token'));
  var password = _.trim(_.get(req, 'body.password'));
  return accountManager.checkRegisterCode(email, token)
    .then((u) => {
      if (_.isString(password) && password.length < 6) {
        throw new AppError('Please enter a password of 6 to 20 digits');
      }
      return accountManager.register(email, password);
    })
    .then(() => {
      res.send({ status: "OK" });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
      } else {
        next(e);
      }
    });
});

router.get('/exists', (req, res, next) => {
  var email = _.trim(_.get(req, 'query.email'));
  models.Users.findOne({ where: { email: email } })
    .then((u) => {
      if (!email) {
        throw new AppError(`Please enter your email address`);
      }
      res.send({ status: "OK", exists: u ? true : false });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
      } else {
        next(e);
      }
    });
});

router.post('/registerCode', (req, res, next) => {
  var email = _.get(req, 'body.email');
  log.debug('registerCode called for email:', email);

  return accountManager.sendRegisterCode(email)
    .then(() => {
      res.send({ status: "OK" });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
      } else {
        next(e);
      }
    });
});

router.get('/registerCode/exists', (req, res, next) => {
  var email = _.trim(_.get(req, 'query.email'));
  var token = _.trim(_.get(req, 'query.token'));
  return accountManager.checkRegisterCode(email, token)
    .then(() => {
      res.send({ status: "OK" });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
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
  return accountManager.changePassword(uid, oldPassword, newPassword)
    .then(() => {
      res.send({ status: "OK" });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
      } else {
        next(e);
      }
    });
});

export default router;
