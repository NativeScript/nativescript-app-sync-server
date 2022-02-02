import express from 'express'
import { AppError } from '../core/app-error'
import * as middleware from '../core/middleware'
import * as clientManager from '../core/services/client-manager'
import _ from 'lodash'
import log4js from 'log4js'

const log = log4js.getLogger("cps:index");
const router = express.Router();

router.get('/updateCheck', async (req, res, next) => {
  const deploymentKey = _.get(req, "query.deploymentKey");
  const appVersion = _.get(req, "query.appVersion");
  const label = _.get(req, "query.label");
  const packageHash = _.get(req, "query.packageHash");
  const clientUniqueId = _.get(req, "query.clientUniqueId");

  try {
    const rs = await clientManager.updateCheckFromCache(deploymentKey, appVersion, label, packageHash, clientUniqueId)
    const data = await clientManager.chosenMan(rs.packageId, rs.rollout, clientUniqueId)

    if (!data) {
      rs.isAvailable = false;
    }

    delete rs.packageId;
    delete rs.rollout;
    res.send({ "updateInfo": rs });
  } catch (e) {
    if (e instanceof AppError) {
      res.status(404).send(e.message);
    } else {
      next(e);
    }
  }
});

router.post('/reportStatus/download', async (req, res) => {
  const clientUniqueId = _.get(req, "body.clientUniqueId");
  const label = _.get(req, "body.label");
  const deploymentKey = _.get(req, "body.deploymentKey");

  try {
    await clientManager.reportStatusDownload(deploymentKey, label, clientUniqueId)

    res.send('OK');
  } catch (err: any) {
    if (!(err instanceof AppError)) {
      console.error(err.stack)
    }
  }

});

router.post('/reportStatus/deploy', async (req, res) => {
  log.debug('req.body', req.body);
  const clientUniqueId = _.get(req, "body.clientUniqueId");
  const label = _.get(req, "body.label");
  const deploymentKey = _.get(req, "body.deploymentKey");

  try {
    clientManager.reportStatusDeploy(deploymentKey, label, clientUniqueId, req.body)

    res.send('OK');
  } catch (err: any) {
    if (!(err instanceof AppError)) {
      console.error(err.stack)
    }
  }

});

router.get('/authenticated', middleware.checkToken, (req, res) => {
  return res.send({ authenticated: true, user: _.pick(req.users, ['email', 'username', 'id']) });
});

export default router;
