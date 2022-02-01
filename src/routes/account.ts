import express from 'express'
import _ from 'lodash'
import log4js from 'log4js'

const log = log4js.getLogger("cps:account")
const router = express.Router()

router.get('/', (req, res) => {
  var userInfo = {
    email: req.users.email,
    linkedProviders: [],
    name: req.users.username,
  };
  log.debug(userInfo);
  res.send({ account: userInfo });
});

export default router;
