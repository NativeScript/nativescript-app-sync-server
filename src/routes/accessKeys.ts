import express from 'express'
import _ from 'lodash'
import security from '../core/utils/security'
import models from '../models/db'
import middleware from '../core/middleware'
import am from '../core/services/account-manager'
import AppError from '../core/app-error'
import log4js from 'log4js'

const log = log4js.getLogger("cps:accessKey")
const router = express.Router();
const accountManager = am()

router.get('/', middleware.checkToken, (req, res, next) => {
  var uid = req.users.id;
  accountManager.getAllAccessKeyByUid(uid)
    .then((accessKeys) => {
      res.send({ accessKeys: accessKeys });
    })
    .catch((e) => {
      next(e);
    });
});

router.post('/', middleware.checkToken, (req, res, next) => {
  var uid = req.users.id;
  var identical = req.users.identical;
  var createdBy = _.trim(req.body.createdBy);
  var friendlyName = _.trim(req.body.friendlyName);
  var ttl = parseInt(req.body.ttl);
  var description = _.trim(req.body.description);
  log.debug(req.body);
  var newAccessKey = security.randToken(28).concat(identical);
  return accountManager.isExsitAccessKeyName(uid, friendlyName)
    .then((data) => {
      if (!_.isEmpty(data)) {
        throw new AppError.AppError(`The access key "${friendlyName}"  already exists.`);
      }
    })
    .then(() => {
      return accountManager.createAccessKey(uid, newAccessKey, ttl, friendlyName, createdBy, description);
    })
    .then((newToken) => {
      var moment = from "moment");
  var info = {
    name: newToken.tokens,
    createdTime: parseInt(moment(newToken.created_at).format('x')),
    createdBy: newToken.created_by,
    expires: parseInt(moment(newToken.expires_at).format('x')),
    description: newToken.description,
    friendlyName: newToken.name,
  };
  log.debug(info);
  res.send({ accessKey: info });
})
  .catch((e) => {
    if (e instanceof AppError.AppError) {
      log.debug(e);
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  });
});

router.delete('/:name', middleware.checkToken, (req, res, next) => {
  var name = _.trim(decodeURI(req.params.name));
  var uid = req.users.id;
  return models.UserTokens.destroy({ where: { name: name, uid: uid } })
    .then((rowNum) => {
      log.debug('delete acceesKey:', name);
      res.send({ friendlyName: name });
    })
    .catch((e) => {
      if (e instanceof AppError.AppError) {
        log.debug(e);
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
});
module.exports = router;
