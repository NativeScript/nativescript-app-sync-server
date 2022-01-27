import express from 'express'
import _ from 'lodash'
import config from '../core/config'
import validator from 'validator'
import log4js from 'log4js'

const router = express.Router();
const log = log4js.getLogger("cps:auth");

router.get('/password', (req, res) => {
  res.render('auth/password', { title: 'AppSync Server' });
});

router.get('/login', (req, res) => {
  var codePushWebUrl = _.get(config, 'common.codePushWebUrl');
  if (codePushWebUrl && validator.isURL(codePushWebUrl)) {
    log.debug(`login redirect:${codePushWebUrl}`);
    res.redirect(`${codePushWebUrl}/login`);
  } else {
    res.render('auth/login', { title: 'AppSync Server' });
  }
});

router.get('/link', (req, res) => {
  res.redirect(`/auth/login`);
});

router.get('/register', (req, res) => {
  var codePushWebUrl = _.get(config, 'common.codePushWebUrl');
  var isRedirect = false;
  if (codePushWebUrl && validator.isURL(codePushWebUrl)) {
    log.debug(`register redirect:${codePushWebUrl}`);
    res.redirect(`${codePushWebUrl}/register`);
  } else {
    res.render('auth/login', { title: 'AppSync Server' });
  }
});

router.post('/logout', (req, res) => {
  res.send("ok");
});

router.post('/login', (req, res, next) => {
  var AppError = require('../core/app-error');
  var accountManager = require('../core/services/account-manager')();
  var security = require('../core/utils/security');
  var account = _.trim(req.body.account);
  var password = _.trim(req.body.password);
  var tokenSecret = _.get(config, 'jwt.tokenSecret');
  log.debug(`login:${account}`);
  accountManager.login(account, password)
    .then((users) => {
      var jwt = require('jsonwebtoken');
      return jwt.sign({ uid: users.id, hash: security.md5(users.ack_code), expiredIn: 7200 }, tokenSecret);
    })
    .then((token) => {
      log.debug(token);
      res.send({ status: 'OK', results: { tokens: token } });
    })
    .catch((e) => {
      if (e instanceof AppError.AppError) {
        log.debug(e);
        res.send({ status: 'ERROR', errorMessage: e.message });
      } else {
        next(e);
      }
    });
});

export default router;
