import express from 'express'
import Promise from 'bluebird'
import _ from 'lodash'
import * as middleware from '../core/middleware'
import validator from 'validator'
import * as accountManager from '../core/services/account-manager'
import * as deployments from '../core/services/deployments'
import * as collaborators from '../core/services/collaborators'
import * as appManager from '../core/services/app-manager'
import * as packageManager from '../core/services/package-manager'
import { AppError } from '../core/app-error'
import * as common from '../core/utils/common'
import config from '../core/config'
import log4js from 'log4js'
import constName from '../core/constants'

const REGEX = /^(\w+)(-android|-ios)$/;
const REGEX_ANDROID = /^(\w+)(-android)$/;
const REGEX_IOS = /^(\w+)(-ios)$/;
const log = log4js.getLogger("cps:apps");
const router = express.Router();

router.get('/', middleware.checkToken, (req, res, next) => {
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

router.get('/:appName/deployments',
  middleware.checkToken, (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);

    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.listDeloyments(col.appid);
      })
      .then((data) => {
        res.send({ deployments: data });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.get('/:appName/deployments/:deploymentName',
  middleware.checkToken, (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
      })
      .then((deploymentInfo) => {
        if (_.isEmpty(deploymentInfo)) {
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
  middleware.checkToken, (req, res, next) => {
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
  middleware.checkToken, (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (_.isEmpty(deploymentInfo)) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          })
      })
      .then((deploymentInfo) => {
        return deployments.getAllPackageIdsByDeploymentsId(deploymentInfo?.id);
      })
      .then((packagesInfos) => {
        return Promise.reduce(packagesInfos, (result, v) => {
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
        }, {});
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
  middleware.checkToken, (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (_.isEmpty(deploymentInfo)) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          });
      })
      .then((deploymentInfo) => {
        return deployments.getDeploymentHistory(deploymentInfo?.id);
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
  middleware.checkToken, (req, res, next) => {
    var uid = req.users.id;
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (_.isEmpty(deploymentInfo)) {
              throw new AppError("does not find the deployment");
            }
            return deploymentInfo;
          });
      })
      .then((deploymentInfo) => {
        return deployments.deleteDeploymentHistory(deploymentInfo?.id);
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
  middleware.checkToken, (req, res, next) => {
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
  middleware.checkToken, (req, res, next) => {
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
  middleware.checkToken, (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    var uid = req.users.id;
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        log.debug(col);
        return deployments.findDeloymentByName(deploymentName, col.appid)
          .then((deploymentInfo) => {
            if (_.isEmpty(deploymentInfo)) {
              log.debug(`does not find the deployment`);
              throw new AppError("does not find the deployment");
            }
            return packageManager.parseReqFile(req)
              .then((data) => {
                if (data.package.type != "application/zip") {
                  log.debug(`upload file type is invlidate`, data.package);
                  throw new AppError("upload file type is invalidate");
                }
                log.debug('packageInfo:', data.packageInfo);
                return packageManager.releasePackage(deploymentInfo?.appid, deploymentInfo?.id, data.packageInfo, data.package.path, uid)
                  .finally(() => {
                    common.deleteFolderSync(data.package.path);
                  });
              })
              .then((packages) => {
                if (packages) {
                  Promise.delay(1000)
                    .then(() => {
                      packageManager.createDiffPackagesByLastNums(deploymentInfo?.appid, packages, _.get(config, 'common.diffNums', 1))
                        .catch((e) => {
                          log.error(e);
                        });
                    });
                }
                //clear cache if exists.
                if (_.get(config, 'common.updateCheckCache', false) !== false) {
                  Promise.delay(2500)
                    .then(() => {
                      var ClientManager = require('../core/services/client-manager');
                      var clientManager = new ClientManager();
                      clientManager.clearUpdateCheckCache(deploymentInfo?.deployment_key, '*', '*', '*');
                    });
                }
                return null;
              });
          });
      })
      .then(() => {
        res.send('{"msg": "succeed"}');
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

router.patch('/:appName/deployments/:deploymentName/release',
  middleware.checkToken, (req, res, next) => {
    log.debug('req.body', req.body);
    var appName = _.trim(req.params.appName);
    var deploymentName = _.trim(req.params.deploymentName);
    var uid = req.users.id;
    var label = _.get(req, 'body.packageInfo.label');
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return Promise(deployments.findDeloymentByName(deploymentName, col.appid))
          .then((deploymentInfo) => {
            if (_.isEmpty(deploymentInfo)) {
              throw new AppError("does not find the deployment");
            }
            if (label) {
              return packageManager.findPackageInfoByDeploymentIdAndLabel(deploymentInfo?.id, label)
                .then((data) => {
                  return [deploymentInfo, data];
                });
            } else {
              var deploymentVersionId = deploymentInfo?.last_deployment_version_id;
              return packageManager.findLatestPackageInfoByDeployVersion(deploymentVersionId)
                .then((data) => {
                  return [deploymentInfo, data];
                });
            }
          })
          .spread((deploymentInfo, packageInfo) => {
            if (!packageInfo) {
              throw new AppError("does not find the packageInfo");
            }
            return packageManager.modifyReleasePackage(packageInfo.id, _.get(req, 'body.packageInfo'))
              .then(() => {
                //clear cache if exists.
                if (_.get(config, 'common.updateCheckCache', false) !== false) {
                  Promise.delay(2500)
                    .then(() => {
                      var ClientManager = require('../core/services/client-manager');
                      var clientManager = new ClientManager();
                      clientManager.clearUpdateCheckCache(deploymentInfo.deployment_key, '*', '*', '*');
                    });
                }
              });
          });
      }).then((data) => {
        res.send("");
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });


router.post('/:appName/deployments/:sourceDeploymentName/promote/:destDeploymentName',
  middleware.checkToken, (req, res, next) => {
    log.debug('req.body:', req.body);
    var appName = _.trim(req.params.appName);
    var sourceDeploymentName = _.trim(req.params.sourceDeploymentName);
    var destDeploymentName = _.trim(req.params.destDeploymentName);
    var uid = req.users.id;
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        var appId = col.appid;
        return Promise.all([
          deployments.findDeloymentByName(sourceDeploymentName, appId),
          deployments.findDeloymentByName(destDeploymentName, appId)
        ])
          .spread((sourceDeploymentInfo, destDeploymentInfo) => {
            if (!sourceDeploymentInfo) {
              throw new AppError(`${sourceDeploymentName}  does not exist.`);
            }
            if (!destDeploymentInfo) {
              throw new AppError(`${destDeploymentName}  does not exist.`);
            }
            return [sourceDeploymentInfo, destDeploymentInfo];
          })
          .spread((sourceDeploymentInfo, destDeploymentInfo) => {
            var params = _.get(req.body, 'packageInfo', {});
            _.set(params, 'promoteUid', uid);
            return [packageManager.promotePackage(sourceDeploymentInfo, destDeploymentInfo, params), destDeploymentInfo];
          })
          .spread((packages, destDeploymentInfo) => {
            if (packages) {
              Promise.delay(1000)
                .then(() => {
                  packageManager.createDiffPackagesByLastNums(destDeploymentInfo.appid, packages, _.get(config, 'common.diffNums', 1))
                    .catch((e) => {
                      log.error(e);
                    });
                });
            }
            //clear cache if exists.
            if (_.get(config, 'common.updateCheckCache', false) !== false) {
              Promise.delay(2500)
                .then(() => {
                  var ClientManager = require('../core/services/client-manager');
                  var clientManager = new ClientManager();
                  clientManager.clearUpdateCheckCache(destDeploymentInfo.deployment_key, '*', '*', '*');
                });
            }
            return packages;
          })
      })
      .then((packages) => {
        res.send({ package: packages });
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message);
        } else {
          next(e);
        }
      });
  });

var rollbackCb = function (req, res, next) {
  var appName = _.trim(req.params.appName);
  var deploymentName = _.trim(req.params.deploymentName);
  var uid = req.users.id;
  var targetLabel = _.trim(_.get(req, 'params.label'));
  accountManager.collaboratorCan(uid, appName)
    .then((col) => {
      return deployments.findDeloymentByName(deploymentName, col.appid);
    })
    .then((dep) => {
      return packageManager.rollbackPackage(dep?.last_deployment_version_id, targetLabel, uid)
        .then((packageInfo) => {
          if (packageInfo) {
            Promise.delay(1000)
              .then(() => {
                packageManager.createDiffPackagesByLastNums(dep?.appid, packageInfo, 1)
                  .catch((e) => {
                    log.error(e);
                  });
              });
          }
          //clear cache if exists.
          if (_.get(config, 'common.updateCheckCache', false) !== false) {
            Promise.delay(2500)
              .then(() => {
                var ClientManager = require('../core/services/client-manager');
                var clientManager = new ClientManager();
                clientManager.clearUpdateCheckCache(dep?.deployment_key, '*', '*', '*');
              });
          }
          return packageInfo;
        });
    })
    .then(() => {
      res.send('ok');
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
};

router.post('/:appName/deployments/:deploymentName/rollback',
  middleware.checkToken, rollbackCb);

router.post('/:appName/deployments/:deploymentName/rollback/:label',
  middleware.checkToken, rollbackCb);

router.get('/:appName/collaborators',
  middleware.checkToken, (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var uid = req.users.id;
    accountManager.collaboratorCan(uid, appName)
      .then((col) => {
        return collaborators.listCollaborators(col.appid);
      })
      .then((data) => {
        const rs = _.reduce(data, (result, value: any, key) => {
          if (_.eq(key, req.users.email)) {
            value.isCurrentAccount = true;
          } else {
            value.isCurrentAccount = false;
          }
          result[key] = value;
          return result;
        }, {});
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
  middleware.checkToken, function (req, res, next) {
    var appName = _.trim(req.params.appName)
    var email = _.trim(req.params.email)
    var uid = req.users.id
    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!")
    }
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return accountManager.findUserByEmail(email)
          .then((data) => {
            return collaborators.addCollaborator(col.appid, data?.id)
          })
      })
      .then((data) => {
        res.send(data)
      })
      .catch((e) => {
        if (e instanceof AppError) {
          res.status(406).send(e.message)
        } else {
          next(e)
        }
      })
    return
  });

router.delete('/:appName/collaborators/:email',
  middleware.checkToken, (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var email = _.trim(decodeURI(req.params.email));
    var uid = req.users.id;
    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!");
    }
    accountManager.ownerCan(uid, appName)
      .then((col) => {
        return accountManager.findUserByEmail(email)
          .then((data) => {
            if (_.eq(data?.id, uid)) {
              throw new AppError("can't delete yourself!");
            } else {
              return collaborators.deleteCollaborator(col.appid, data?.id);
            }
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
    return
  });

router.delete('/:appName',
  middleware.checkToken, (req, res, next) => {
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
  middleware.checkToken, (req, res, next) => {
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
  middleware.checkToken, (req, res, next) => {
    var appName = _.trim(req.params.appName);
    var email = _.trim(req.params.email);
    var uid = req.users.id;
    if (!validator.isEmail(email)) {
      return res.status(406).send("Invalid Email!");
    }
    return accountManager.ownerCan(uid, appName)
      .then((col) => {
        return accountManager.findUserByEmail(email)
          .then((data) => {
            if (_.eq(data?.id, uid)) {
              throw new AppError("You can't transfer to yourself!");
            }
            return appManager.transferApp(col.appid, uid, data?.id);
          });
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

router.post('/', middleware.checkToken, (req, res, next) => {
  log.debug("addApp params:", req.body);

  var appName = req.body.name;
  if (_.isEmpty(appName)) {
    return res.status(406).send("Please input name!");
  }
  var osName = _.toLower(req.body.os);
  var os;
  if (osName == _.toLower(constName.IOS_NAME)) {
    os = constName.IOS;
  } else if (osName == _.toLower(constName.ANDROID_NAME)) {
    os = constName.ANDROID;
  } else if (osName == _.toLower(constName.WINDOWS_NAME)) {
    os = constName.WINDOWS;
  } else {
    return res.status(406).send("Please input os [iOS|Android|Windows]!");
  }
  var platformName = _.toLower(req.body.platform);
  var platform;
  if (platformName == _.toLower(constName.REACT_NATIVE_NAME)) {
    platform = constName.REACT_NATIVE;
  } else if (platformName == _.toLower(constName.CORDOVA_NAME)) {
    platform = constName.CORDOVA;
  } else if (platformName == _.toLower(constName.NATIVESCRIPT_NAME)) {
    platform = constName.NATIVESCRIPT;
  } else {
    return res.status(406).send("Please input platform [React-Native|Cordova|NativeScript]!");
  }
  var manuallyProvisionDeployments = req.body.manuallyProvisionDeployments;
  var uid = req.users.id;

  appManager.findAppByName(uid, appName)
    .then((appInfo) => {
      if (!_.isEmpty(appInfo)) {
        throw new AppError(appName + " Exist!");
      }
      return appManager.addApp(uid, appName, os, platform, req.users.identical)
        .then(() => {
          return { name: appName, collaborators: { [req.users.email]: { permission: "Owner" } } };
        });
    })
    .then((data) => {
      res.send({ app: data });
    })
    .catch((e) => {
      if (e instanceof AppError) {
        res.status(406).send(e.message);
      } else {
        next(e);
      }
    });
  return
});

export default router;
