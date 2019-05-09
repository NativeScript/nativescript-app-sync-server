var express = require('express');
var router = express.Router();
var models = require('../models');
var _ = require('lodash');
var security = require('../core/utils/security');
var middleware = require('../core/middleware');
var log4js = require('log4js');
var log = log4js.getLogger("cps:account");

router.get('/', middleware.checkToken, (req, res) => {
  var userInfo = {
    email:req.users.email,
    linkedProviders: [],
    name:req.users.username,
  };
  log.debug(userInfo);
  res.send({account:userInfo});
});

module.exports = router;
