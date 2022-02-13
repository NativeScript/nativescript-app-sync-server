import express, { NextFunction, Request, Response } from 'express'
import bluebird from 'bluebird'
import _ from 'lodash'
import validator from 'validator'
import * as accountManager from '../core/services/account-manager'
import * as deployments from '../core/services/deployments'
import * as collaborators from '../core/services/collaborators'
import * as appManager from '../core/services/app-manager'
import * as packageManager from '../core/services/package-manager'
import * as clientManager from '../core/services/client-manager'
import { AppError } from '../core/app-error'
import * as common from '../core/utils/common'
import config from '../core/config'
import log4js from 'log4js'
import constName from '../core/constants'
import { requestValidator } from '~/core/middleware'
import * as types from '~/iots'

const log = log4js.getLogger("cps:apps");

const router = express.Router();

router.get('/', (req, res, next) => {
  var uid = req.users.id;
  appManager.listApps(uid)
    .then((data) => {
      res.send({ apps: data });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
});

router.get('/:appName/deployments', async (req, res, next) => {
  const uid = req.users.id;
  const appName = _.trim(req.params.appName);
  log.debug(`/:appName/deployments for app: ${appName}, user: ${uid}`)
  try {
    const col = await accountManager.collaboratorCan(uid, appName)
    const data = await deployments.listDeloyments(col.appid);

    res.send({ deployments: data });
  } catch (e) {
    if (e instanceof AppError) {
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  }
});

router.get('/:appName/deployments/:deploymentName',
  (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
      })
      .then((deploymentInfo) => {
        if (!deploymentInfo) {
          throw new AppError("does not find the deployment");
        }
        res.send({ deployment: deployments.listDeloyment(deploymentInfo) });
        return true;
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.post('/:appName/deployments',
  (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var name = req.body.name;
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return deployments.addDeloyment(name, col.appid, uid);
      })
      .then((data) => {
        res.send({ deployment: { name: data.name, key: data.deployment_key } });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.get('/:appName/deployments/:deploymentName/metrics',
  (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (!deploymentInfo) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          })
      })
      .then((deploymentInfo) => {
        return deployments.getAllPackageIdsByDeploymentsId(deploymentInfo.id);
      })
      .then((packagesInfos) => {
        return bluebird.Promise.reduce(packagesInfos, (result, v) => {
          return packageManager.getMetricsbyPackageId(v.get('id'))
            .then((metrics) => {
              if (metrics) {
                result[v.get('label')] = {
                  active: metrics.get('active'),
                  downloaded: metrics.get('downloaded'),
                  failed: metrics.get('failed'),
                  installed: metrics.get('installed'),
                };
              }
              return result;
            });
        }, {} as { [key: string]: { active: number, downloaded: number, failed: number, installed: number } });
      })
      .then((rs) => {
        res.send({ "metrics": rs });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.send({ "metrics": null });
        } else {
          next(e);
        }
      });
  });

router.get('/:appName/deployments/:deploymentName/history',
  (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (!deploymentInfo) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          });
      })
      .then((deploymentInfo) => {
        return deployments.getDeploymentHistory(deploymentInfo.id);
      })
      .then((rs) => {
        res.send({ history: rs });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.delete('/:appName/deployments/:deploymentName/history',
  (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (!deploymentInfo) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          });
      })
      .then((deploymentInfo) => {
        return deployments.deleteDeploymentHistory(deploymentInfo.id);
      })
      .then((rs) => {
        res.send("ok");
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.patch('/:appName/deployments/:deploymentName',
  (req, res, next) => {
    var name = req.body.name;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    var uid = req.users.id;
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return deployments.renameDeloymentByName(deploymentName, col.appid, name);
      })
      .then((data) => {
        res.send({ deployment: data });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.delete('/:appName/deployments/:deploymentName',
  (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    var uid = req.users.id;
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return deployments.deleteDeloymentByName(deploymentName, col.appid);
      })
      .then((data) => {
        res.send({ deployment: data });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.post('/:appName/deployments/:deploymentName/release',
  async (req, res, next) => {
    const appName = _.trim(req.params.appName);
    const deploymentName = _.trim(req.params.deploymentName);
    const uid = req.users.id;

    const col = await accountManager.collaboratorCan(uid, appName)
    log.debug(col);
    const deploymentInfo = await deployments.findDeloymentByName(deploymentName, col.appid)
    if (!deploymentInfo) {
      log.debug(`does not find the deployment`);
      throw new AppError("does not find the deployment");
    }

    try {


      const data = await packageManager.parseReqFile(req)
      if (data.package.mimetype != "application/zip") {
        log.debug(`upload file type is invlidate`, data.package);
        throw new AppError("upload file type is invalidate");
      }
      log.debug('packageInfo:', data.packageInfo);

      const packages = await packageManager.releasePackage(deploymentInfo.appid, deploymentInfo.id, data.packageInfo, data.package.filepath, uid)
        .finally(() => {
          common.deleteFolderSync(data.package.filepath);
        });


      if (packages) {
        await packageManager.createDiffPackagesByLastNums(deploymentInfo.appid, packages, _.get(config, 'common.diffNums', 1))
          .catch((e) => {
            log.error(e);
          });
      }
      //clear cache if exists.
      if (_.get(config, 'common.updateCheckCache', false) !== false) {
        await clientManager.clearUpdateCheckCache(deploymentInfo.deployment_key, '*', '*', '*');
      }
    } catch (e) {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    }
    res.send('{"msg": "succeed"}');
  });

router.patch('/:appName/deployments/:deploymentName/release',
  async (req, res, next) => {
    log.debug('req.body', req.body);
    const appName = _.trim(req.params.appName);
    const deploymentName = _.trim(req.params.deploymentName);
    const uid = req.users.id;
    const label = _.get(req, 'body.packageInfo.label');

    try {
      const col = await accountManager.collaboratorCan(uid, appName)

      const deploymentInfo = await deployments.findDeloymentByName(deploymentName, col.appid)
      if (!deploymentInfo) {
        throw new AppError("does not find the deployment");
      }

      const packageInfo = label ? await packageManager.findPackageInfoByDeploymentIdAndLabel(deploymentInfo.id, label)
        : await packageManager.findLatestPackageInfoByDeployVersion(deploymentInfo.last_deployment_version_id)

      if (!packageInfo) {
        throw new AppError("does not find the packageInfo");
      }
      await packageManager.modifyReleasePackage(packageInfo?.id, _.get(req, 'body.packageInfo'))
      //clear cache if exists.
      if (_.get(config, 'common.updateCheckCache', false) !== false) {
        await bluebird.Promise.delay(2500)
          .then(() => {
            clientManager.clearUpdateCheckCache(deploymentInfo.deployment_key, '*', '*', '*');
          });
      }
      res.send("");
    } catch (error) {
      if (error instanceof AppError) {
        res.status(406).send(error.message);
      } else {
        next(error);
      }
    }
  });


router.post('/:appName/deployments/:sourceDeploymentName/promote/:destDeploymentName',
  async (req, res, next) => {
    log.debug('req.body:', req.body);
    const appName = _.trim(req.params.appName);
    const sourceDeploymentName = _.trim(req.params.sourceDeploymentName);
    const destDeploymentName = _.trim(req.params.destDeploymentName);
    const uid = req.users.id;

    try {
      const col = await accountManager.collaboratorCan(uid, appName)
      const appId = col.appid;
      const [sourceDeploymentInfo, destDeploymentInfo] = await Promise.all([
        deployments.findDeloymentByName(sourceDeploymentName, appId),
        deployments.findDeloymentByName(destDeploymentName, appId)
      ])
      if (!sourceDeploymentInfo) {
        throw new AppError(`${sourceDeploymentName}  does not exist.`);
      }
      if (!destDeploymentInfo) {
        throw new AppError(`${destDeploymentName}  does not exist.`);
      }
      const params = { ...req.body.packageInfo, promoteUid: uid }
      const packages = await packageManager.promotePackage(sourceDeploymentInfo, destDeploymentInfo, params)
      if (packages) {
        await bluebird.Promise.delay(1000)
          .then(() => {
            packageManager.createDiffPackagesByLastNums(destDeploymentInfo.appid, packages, _.get(config, 'common.diffNums', 1))
              .catch((e) => {
                log.error(e);
              });
          });
      }
      //clear cache if exists.
      if (_.get(config, 'common.updateCheckCache', false) !== false) {
        bluebird.Promise.delay(2500)
          .then(() => {
            clientManager.clearUpdateCheckCache(destDeploymentInfo.deployment_key, '*', '*', '*');
          });
      }

      res.send({ package: packages });
    } catch (error) {
      if (error instanceof AppError) {
        res.status(406).send(error.message);
      } else {
        next(error);
      }
    }
  });

const rollbackCb = async function (req: Request, res: Response, next: NextFunction) {
  const appName = _.trim(req.params.appName);
  const deploymentName = _.trim(req.params.deploymentName);
  const uid = req.users.id;
  const targetLabel = _.trim(_.get(req, 'params.label'));

  try {
    const col = await accountManager.collaboratorCan(uid, appName)
    const dep = await deployments.findDeloymentByName(deploymentName, col.appid)

    if (!dep)
      throw new AppError('Cannot find a deployment to rollback')

    const packageInfo = await packageManager.rollbackPackage(dep.last_deployment_version_id, targetLabel, uid)

    if (packageInfo) {
      packageManager.createDiffPackagesByLastNums(dep.appid, packageInfo, 1)
        .catch((e) => {
          log.error(e);
        });
    }

    //clear cache if exists.
    if (config.common.updateCheckCache !== false) {
      clientManager.clearUpdateCheckCache(dep.deployment_key, '*', '*', '*');
    }

    res.send('ok');
  } catch (e) {
    if (e instanceof AppError) {
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  }

};

router.post('/:appName/deployments/:deploymentName/rollback',
  rollbackCb);

router.post('/:appName/deployments/:deploymentName/rollback/:label',
  rollbackCb);

router.get('/:appName/collaborators',
  (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var uid = req.users.id;
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return collaborators.listCollaborators(col.appid);
      })
      .then((data) => {
        const rs = _.reduce(data, (result, value, key) => {
          const isCurrentAccount = _.eq(key, req.users.email)
          result[key] = { ...value, isCurrentAccount }
          return result
        }, {} as { [key: string]: { permission: string, isCurrentAccount: boolean } });
        res.send({ collaborators: rs });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.post('/:appName/collaborators/:email',
  async function (req, res, next) {
    const appName = _.trim(req.params.appName)
    const email = _.trim(req.params.email)
    const uid = req.users.id

    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!")
    }

    try {
      const col = await accountManager.ownerCan(uid, appName)
      const user = await accountManager.findUserByEmail(email)

      if (!user)
        throw new AppError('Cannot find user to collaborate with')

      const data = await collaborators.addCollaborator(col.appid, user?.id)
      res.send(data)
    } catch (e) {
      if (e instanceof AppError) {
        res.status(406).send(e.message)
      } else {
        next(e)
      }
    }

    return
  })

router.delete('/:appName/collaborators/:email',
  async (req, res, next) => {
    const appName = _.trim(req.params.appName);
    const email = _.trim(decodeURI(req.params.email));
    const uid = req.users.id;

    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!");
    }

    try {
      const col = await accountManager.ownerCan(uid, appName)
      const user = await accountManager.findUserByEmail(email)

      if (!user)
        throw new AppError('Cannot find user to delete')

      if (_.eq(user?.id, uid))
        throw new AppError("can't delete yourself!");

      await collaborators.deleteCollaborator(col.appid, user.id);
      res.send("ok");
    } catch (e) {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    }

    return
  });

router.delete('/:appName',
  (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var uid = req.users.id;
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return appManager.deleteApp(col.appid);
      })
      .then((data) => {
        res.send(data);
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.patch('/:appName',
  (req, res, next) => {
    var newAppName = _.trim(req.body.name);
    var appName = _.trim(req.params.appName);
    var uid = req.users.id;
    if (_.isEmpty(newAppName)) {
      return res.status(406).send("Please input name!");
    } else {
      return accountManager.ownerCan(uid, appName)
        .then((col) => {
          return appManager.findAppByName(uid, newAppName)
            .then((appInfo) => {
              if (!_.isEmpty(appInfo)) {
                throw new AppError(newAppName + " Exist!");
              }
              return appManager.modifyApp(col.appid, { name: newAppName });
            });
        })
        .then(() => {
          res.send("");
        })
        .catch((e) => {
          if (e instanceof AppError) {
            res.status(406).send(e.message);
          } else {
            next(e);
          }
        });
    }
  });

router.post('/:appName/transfer/:email',
  async (req, res, next) => {
    const appName = _.trim(req.params.appName);
    const email = _.trim(req.params.email);
    const uid = req.users.id;

    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!");
    }

    try {
      const col = await accountManager.ownerCan(uid, appName)
      const user = await accountManager.findUserByEmail(email)

      if (!user)
        throw new AppError('Cannot find user to delete')

      if (_.eq(user?.id, uid)) {
        throw new AppError("You can't transfer to yourself!");
      }
      const data = await appManager.transferApp(col.appid, uid, user.id);
      res.send(data);
    } catch (e) {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    }
    return
  });

router.post('/', requestValidator(types.CreateAppDec), async (req, res, next) => {
  log.debug("addApp params:", req.body);
  
  const appName = req.body.name;
  if (!appName) {
    return res.status(406).send("Please input name!");
  }

  const osName = _.toLower(req.body.os);
  const osMap = {
    [_.toLower(constName.IOS_NAME)]: constName.IOS,
    [_.toLower(constName.ANDROID_NAME)]: constName.ANDROID,
    [_.toLower(constName.WINDOWS_NAME)]: constName.WINDOWS
  }

  const platformMap = {
    [_.toLower(constName.REACT_NATIVE_NAME)]: constName.REACT_NATIVE,
    [_.toLower(constName.CORDOVA_NAME)]: constName.CORDOVA,
    [_.toLower(constName.NATIVESCRIPT_NAME)]: constName.NATIVESCRIPT
  }

  const os = osMap[osName]

  if (!os)
    return res.status(406).send("Please input os [iOS|Android|Windows]!");

  const platformName = _.toLower(req.body.platform);
  const platform = platformMap[platformName];

  if (!platform)
    return res.status(406).send("Please input platform [React-Native|Cordova|NativeScript]!");

  const manuallyProvisionDeployments = req.body.manuallyProvisionDeployments;
  const uid = req.users.id;

  try {
    const appInfo = await appManager.findAppByName(uid, appName)
    if (appInfo) {
      throw new AppError(appName + " Exist!");
    }

    await appManager.addApp(uid, appName, os, platform, req.users.identical)

    const data = { name: appName, collaborators: { [req.users.email]: { permission: "Owner" } } };

    res.send({ app: data });
  } catch (e) {
    if (e instanceof AppError) {
      res.status(406).send(e.message);
    } else {
      next(e);
    }
  }

  return
});

export default router;
