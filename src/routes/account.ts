import express from 'express'
import * as  models from '../models'
import _ from 'lodash'
import * as security from '../core/utils/security'
import * as  middleware from '../core/middleware'
import log4js from 'log4js'

const log = log4js.getLogger("cps:account")
const router = express.Router()

router.get('/', middleware.checkToken, (req, res) => {
  var userInfo = {
    email: req.users.email,
    linkedProviders: [],
    name: req.users.username,
  };
  log.debug(userInfo);
  res.send({ account: userInfo });
});

export default router;
