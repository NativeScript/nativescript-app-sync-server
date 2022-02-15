import { Response, Request } from "express-serve-static-core";
import { AppError } from '../core/app-error'
import * as middleware from '../core/middleware'
import * as clientManager from '../core/services/client-manager'
import _ from 'lodash'
import log4js from 'log4js'
import validationRouter from '~/core/router'
import * as t from '~/core/utils/iots'

const log = log4js.getLogger("cps:index");
const router = validationRouter()

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

router.post('/reportStatus/download', {
  body: t.type({
    clientUniqueId: t.string,
    label: t.string,
    deploymentKey: t.string,
  })
}, async (req, res) => {
  const clientUniqueId = req.body.clientUniqueId
  const label = req.body.label
  const deploymentKey = req.body.deploymentKey

  try {
    await clientManager.reportStatusDownload(deploymentKey, label, clientUniqueId)

    res.send('OK');
  } catch (err: any) {
    if (!(err instanceof AppError)) {
      console.error(err.stack)
    }
  }

});

router.post('/reportStatus/deploy', {
  body: t.type({
    clientUniqueId: t.string,
    deploymentKey: t.string,
    label: t.string,
    previousDeploymentKey: t.optional(t.string),
    previousLabelOrAppVersion: t.optional(t.string),
    status: t.union([t.literal('DeploymentSucceeded'), t.literal('DeploymentFailed')])
  })
}, async (req, res) => {
  log.debug('req.body', req.body);
  const { clientUniqueId, label, deploymentKey, ...other } = req.body

  try {
    clientManager.reportStatusDeploy(deploymentKey, label, clientUniqueId, other)

    res.send('OK');
  } catch (err: any) {
    if (!(err instanceof AppError)) {
      console.error(err.stack)
    }
  }

});

router.get('/authenticated', middleware.checkToken, (req: Request, res: Response) => {
  return res.send({ authenticated: true, user: _.pick(req.users, ['email', 'username', 'id']) });
});

export default router;
