import * as t from 'io-ts'
import _ from 'lodash'
import * as security from '../core/utils/security'
import * as models from '../models'
import * as accountManager from '../core/services/account-manager'
import { AppError } from '../core/app-error'
import log4js from 'log4js'
import moment from 'moment'
import validationRouter from '~/core/router'

const log = log4js.getLogger("cps:accessKey")
const router = validationRouter()

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

router.post('/', {
  body: t.type({
    friendlyName: t?.string,
    description: t?.string,
    ttl: t.number
  })
}, async (req, res, next) => {

  const uid = req.users.id;
  const identical = req.users.identical;
  const createdBy = uid;

  const friendlyName = _.trim(req.body.friendlyName);
  const ttl = req.body.ttl
  const description = _.trim(req.body.description);

  log.debug(req.body);
  const newAccessKey = security.randToken(28).concat(identical);
  try {
    const data = await accountManager.isExsitAccessKeyName(uid, friendlyName)
    if (data) {
      throw new AppError(`The access key "${friendlyName}"  already exists.`);
    }
    const newToken = await accountManager.createAccessKey(uid, newAccessKey, ttl, friendlyName, String(createdBy), description);
    const info = {
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
  } catch (e) {
    if (e instanceof AppError) {
      log.debug(e);
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  }


});

router.delete('/:name', { params: t.type({ name: t.string }) }, async (req, res, next) => {
  const name = _.trim(decodeURI(req.params.name));
  const uid = req.users.id;

  try {
    await models.UserTokens.destroy({ where: { name, uid } })
    log.debug('delete accessKey:', name);
    res.send({ friendlyName: name });
  } catch (e) {
    if (e instanceof AppError) {
      log.debug(e);
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  }
});

export default router;
