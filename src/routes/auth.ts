import express from 'express'
import _ from 'lodash'
import config from '../core/config'
import log4js from 'log4js'
import jwt from 'jsonwebtoken'
import { AppError } from '../core/app-error'
import * as accountManager from '../core/services/account-manager'
import * as security from '../core/utils/security'

const router = express.Router();
const log = log4js.getLogger("cps:auth");

router.post('/logout', (req, res) => {
  res.send("ok");
});

router.post('/login', (req, res, next) => {
  const account = _.trim(req.body.account);
  const password = _.trim(req.body.password);
  const tokenSecret = _.get(config, 'jwt.tokenSecret');
  log.debug(`login:${account}`);
  accountManager.login(account, password)
    .then((users) => {
      return jwt.sign({ uid: users?.id, hash: security.md5(users?.ack_code), email: users?.email }, tokenSecret, { expiresIn: '2h' });
    })
    .then((token) => {
      log.debug(token);
      res.send({ status: 'OK', results: { tokens: token } });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        log.debug(e.message);
        res.send({ status: 'ERROR', errorMessage: e.message });
      } else {
        next(e);
      }
    });
});

export default router;
