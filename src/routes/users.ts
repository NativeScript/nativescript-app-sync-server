import _ from 'lodash'
import * as models from '../models'
import * as middleware from '../core/middleware'
import * as accountManager from '../core/services/account-manager'
import { AppError } from '../core/app-error'
import log4js from 'log4js'
import validationRouter from '~/core/router'
import * as t from '~/core/utils/iots'

const router = validationRouter();
const log = log4js.getLogger("cps:account");

router.post('/',
  {
    body: t.type({
      email: t.string,
      token: t.string,
      password: t.string
    })
  },
  async (req, res, next) => {
    const email = _.trim(req.body.email);
    const token = _.trim(req.body.token);
    const password = _.trim(req.body.password);

    try {
      const u = await accountManager.checkRegisterCode(email, token)
      if (_.isString(password) && password.length < 6) {
        throw new AppError('Please enter a password of 6 to 20 digits');
      }
      await accountManager.register(email, password);

      res.send({ status: "OK" });
    } catch (e) {
      if (e instanceof AppError) {
        res.send({ status: "ERROR", message: e.message });
      } else {
        next(e);
      }
    }
  });

router.get('/exists', { query: t.type({ email: t.string }) }, async (req, res, next) => {
  const email = _.trim(req.query.email);

  try {
    const u = await models.Users.findOne({ where: { email: email } })
    if (!email) {
      throw new AppError(`Please enter your email address`);
    }
    res.send({ status: "OK", exists: u ? true : false });

  } catch (e) {
    if (e instanceof AppError) {
      res.send({ status: "ERROR", message: e.message });
    } else {
      next(e);
    }
  }

});

router.post('/registerCode', { body: t.type({ email: t.string }) }, async (req, res, next) => {
  const email = req.body.email
  log.debug('registerCode called for email:', email);

  await accountManager.sendRegisterCode(email)
  res.send({ status: "OK" });
});

router.get('/registerCode/exists', { query: t.type({ email: t.string, token: t.optional(t.string) }) }, async (req, res, next) => {
  const { email, token } = req.query

  try {
    await accountManager.checkRegisterCode(email, token || '')
    res.send({ status: "OK" });
  } catch (e) {
    if (e instanceof AppError) {
      res.send({ status: "ERROR", message: e.message });
    } else {
      next(e);
    }
  }
});

//change Password
router.patch('/password', { body: t.type({ oldPassword: t.string, newPassword: t.string }) }, middleware.checkToken as any, async (req, res, next) => {
  const oldPassword = _.trim(req.body.oldPassword);
  const newPassword = _.trim(req.body.newPassword);
  const uid = req.users.id;

  try {
    await accountManager.changePassword(uid, oldPassword, newPassword)
    res.send({ status: "OK" });
  } catch (e) {
    if (e instanceof AppError) {
      res.send({ status: "ERROR", message: e.message });
    } else {
      next(e);
    }
  }
});

export default router;
