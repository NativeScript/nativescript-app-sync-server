import express from 'express'
import _ from 'lodash'
import * as security from '../core/utils/security'
import * as models from '../models'
import * as accountManager from '../core/services/account-manager'
import { AppError } from '../core/app-error'
import log4js from 'log4js'
import moment from 'moment'
import * as t from 'io-ts'
import { validateAndDecode } from '~/core/utils/validation'

const log = log4js.getLogger("cps:accessKey")
const router = express.Router();

router.get('/', (req, res, next) => {
  const uid = req.users.id
  accountManager.getAllAccessKeyByUid(uid)
    .then((accessKeys) => {
      res.send({ accessKeys })
    })
    .catch((e) => {
      next(e)
    })
});

const CreateAccessKey = t.type({
  ttl: t.number,
  description: t.union([t.string, t.undefined]),
  friendlyName: t.string
})

router.post('/', (req, res, next) => {
  const params = validateAndDecode(CreateAccessKey, req.body)

  const uid = req.users.id;
  const identical = req.users.identical;
  const createdBy = uid;

  const friendlyName = _.trim(params.friendlyName);
  const ttl = params.ttl
  const description = _.trim(params.description);

  log.debug(req.body);
  var newAccessKey = security.randToken(28).concat(identical);
  return accountManager.isExsitAccessKeyName(uid, friendlyName)
    .then((data) => {
      if (!_.isEmpty(data)) {
        throw new AppError(`The access key "${friendlyName}"  already exists.`);
      }
    })
    .then(() => {
      return accountManager.createAccessKey(uid, newAccessKey, ttl, friendlyName, String(createdBy), description);
    })
    .then((newToken) => {
      var info = {
        name: newToken.tokens,
        token: newToken.tokens,
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
      if (e instanceof AppError) {
        log.debug(e);
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
});

router.delete('/:name', (req, res, next) => {
  var name = _.trim(decodeURI(req.params.name));
  var uid = req.users.id;
  return models.UserTokens.destroy({ where: { name, uid } })
    .then((rowNum) => {
      log.debug('delete accessKey:', name);
      res.send({ friendlyName: name });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        log.debug(e);
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
});
export default router;
