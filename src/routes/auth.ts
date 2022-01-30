import express from 'express'
import _ from 'lodash'
import config from '../core/config'
import validator from 'validator'
import log4js from 'log4js'

const router = express.Router();
const log = log4js.getLogger("cps:auth");

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
