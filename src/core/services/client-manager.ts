import * as models from '../../models'
import _ from 'lodash'
import * as common from '../utils/common'
import constConfig from '../constants';
import { getRedisClient } from '../utils/redis'
import { AppError } from '../app-error'
import * as config from '../config'
import log4js from 'log4js'
import Sequelize from 'sequelize'
import BPromise from 'bluebird'

const log = log4js.getLogger("cps:ClientManager")

const UPDATE_CHECK = "UPDATE_CHECK";
const CHOSEN_MAN = "CHOSEN_MAN";
const EXPIRED = 600;

export const getUpdateCheckCacheKey = function (deploymentKey, appVersion, label, packageHash) {
  return [UPDATE_CHECK, deploymentKey, appVersion, label, packageHash].join(':');
}

export const clearUpdateCheckCache = async function (deploymentKey, appVersion, label, packageHash) {
  log.debug('clear cache Deployments key:', deploymentKey);
  let redisCacheKey = getUpdateCheckCacheKey(deploymentKey, appVersion, label, packageHash);
  const client = await getRedisClient()

  return client.keys(redisCacheKey)
    .then((data) => {
      if (_.isArray(data)) {
        return BPromise.map(data, (key) => {
          return client.del(key);
        });
      }
      return null;
    })
    .finally(() => client.quit());
}

export const updateCheckFromCache = async function (deploymentKey, appVersion, label, packageHash, clientUniqueId) {
  var updateCheckCache = _.get(config, 'common.updateCheckCache', false);
  if (updateCheckCache === false) {
    return updateCheck(deploymentKey, appVersion, label, packageHash);
  }
  let redisCacheKey = getUpdateCheckCacheKey(deploymentKey, appVersion, label, packageHash);
  const client = await getRedisClient()

  return client.get(redisCacheKey)
    .then((data) => {
      if (data) {
        try {
          log.debug('updateCheckFromCache read from catch');
          var obj = JSON.parse(data);
          return obj;
        } catch (e) {
        }
      }
      return updateCheck(deploymentKey, appVersion, label, packageHash, clientUniqueId)
        .then((rs) => {
          try {
            log.debug('updateCheckFromCache read from db');
            var strRs = JSON.stringify(rs);
            client.setEx(redisCacheKey, EXPIRED, strRs);
          } catch (e) {
          }
          return rs;
        });
    })
    .finally(() => client.quit());
}

export const getChosenManCacheKey = function (packageId, rollout, clientUniqueId) {
  return [CHOSEN_MAN, packageId, rollout, clientUniqueId].join(':');
}

export const random = function (rollout) {
  var r = Math.ceil(Math.random() * 10000);
  if (r < rollout * 100) {
    return BPromise.resolve(true);
  } else {
    return BPromise.resolve(false);
  }
}

export const chosenMan = function (packageId, rollout, clientUniqueId) {
  if (rollout >= 100) {
    return BPromise.resolve(true);
  }
  var rolloutClientUniqueIdCache = _.get(config, 'common.rolloutClientUniqueIdCache', false);
  if (rolloutClientUniqueIdCache === false) {
    return random(rollout);
  } else {
    var client = client
    var redisCacheKey = getChosenManCacheKey(packageId, rollout, clientUniqueId);
    return client.get(redisCacheKey)
      .then((data) => {
        if (Number(data) == 1) {
          return true;
        } else if (Number(data) == 2) {
          return false;
        } else {
          return random(rollout)
            .then((r) => {
              return client.setEx(redisCacheKey as any, 60 * 60 * 24 * 7, r ? '1' : '2')
                .then(() => {
                  return r;
                });
            });
        }
      })
      .finally(() => client.quit());
  }
}

export const updateCheck = function (deploymentKey: string, appVersion: string, label: string, packageHash: string, clientUniqueId?: number) {
  var rs = {
    packageId: 0,
    downloadURL: "",
    downloadUrl: "",
    description: "",
    isAvailable: false,
    isMandatory: false,
    appVersion: appVersion,
    packageHash: "",
    label: "",
    packageSize: 0,
    updateAppVersion: false,
    shouldRunBinaryVersion: false,
    rollout: 100
  };

  if (_.isEmpty(deploymentKey) || _.isEmpty(appVersion)) {
    return BPromise.reject(new AppError("please input deploymentKey and appVersion"))
  }
  return models.Deployments.findOne({ where: { deployment_key: deploymentKey } })
    .then((dep) => {
      if (_.isEmpty(dep)) {
        throw new AppError('Not found deployment, check deployment key is right.');
      }
      var version = common.parseVersion(appVersion);
      return models.DeploymentsVersions.findAll({
        where: {
          deployment_id: dep?.id,
          min_version: { [Sequelize.Op.lte]: version },
          max_version: { [Sequelize.Op.gt]: version }
        }
      })
        .then((deploymentsVersionsMore) => {
          var distance = 0;
          var item = null;
          _.map(deploymentsVersionsMore, function (value, index) {
            if (index == 0) {
              // @ts-ignore
              item = value;
              distance = value.max_version - value.min_version;
            } else {
              if (distance > (value.max_version - value.min_version)) {
                distance = value.max_version - value.min_version;
                // @ts-ignore
                item = value;
              }
            }
          });
          log.debug(item);
          return item;
        });
    })
    .then((deploymentsVersions: any) => {
      var packageId = _.get(deploymentsVersions, 'current_package_id', 0);
      if (_.eq(packageId, 0)) {
        return;
      }
      return models.Packages.findByPk(packageId)
        .then((packages) => {
          if (packages
            && _.eq(packages.deployment_id, deploymentsVersions.deployment_id)
            && !_.eq(packages.package_hash, packageHash)) {
            rs.packageId = packageId;
            rs.downloadUrl = rs.downloadURL = common.getBlobDownloadUrl(_.get(packages, 'blob_url'));
            rs.description = _.get(packages, 'description', '');
            rs.isAvailable = _.eq(packages.is_disabled, 1) ? false : true;
            rs.isMandatory = _.eq(packages.is_mandatory, 1) ? true : false;
            rs.appVersion = appVersion;
            rs.packageHash = _.get(packages, 'package_hash', '');
            rs.label = _.get(packages, 'label', '');
            rs.packageSize = _.get(packages, 'size', 0);
            rs.rollout = _.get(packages, 'rollout', 100);
          }
          return packages;
        })
        .then((packages) => {
          //增量更新
          if (!_.isEmpty(packages) && !_.eq(_.get(packages, 'package_hash', ""), packageHash)) {
            return models.PackagesDiff.findOne({ where: { package_id: packages?.id, diff_against_package_hash: packageHash } })
              .then((diffPackage) => {
                if (!_.isEmpty(diffPackage)) {
                  rs.downloadURL = common.getBlobDownloadUrl(_.get(diffPackage, 'diff_blob_url'));
                  rs.downloadUrl = common.getBlobDownloadUrl(_.get(diffPackage, 'diff_blob_url'));
                  rs.packageSize = _.get(diffPackage, 'diff_size', 0);
                }
                return;
              });
          } else {
            return;
          }
        });
    })
    .then(() => {
      return rs;
    });
};

export const getPackagesInfo = function (deploymentKey, label) {
  if (_.isEmpty(deploymentKey) || _.isEmpty(label)) {
    return BPromise.reject(new AppError("please input deploymentKey and label"))
  }
  return models.Deployments.findOne({ where: { deployment_key: deploymentKey } })
    .then((dep) => {
      if (_.isEmpty(dep)) {
        throw new AppError('does not found deployment');
      }
      return models.Packages.findOne({ where: { deployment_id: dep?.id, label: label } });
    })
    .then((packages) => {
      if (_.isEmpty(packages)) {
        throw new AppError('does not found packages');
      }
      return packages;
    });
};

export const reportStatusDownload = function (deploymentKey, label, clientUniqueId) {
  return getPackagesInfo(deploymentKey, label)
    .then((packages) => {
      return BPromise.all([
        models.PackagesMetrics.findOne({ where: { package_id: packages.id } })
          .then((metrics) => {
            if (metrics) {
              return metrics.increment('downloaded');
            }
            return;
          }),
        models.LogReportDownload.create({
          package_id: packages.id,
          client_unique_id: clientUniqueId
        })
      ]);
    });
};

export const reportStatusDeploy = function (deploymentKey, label, clientUniqueId, others) {
  return getPackagesInfo(deploymentKey, label)
    .then((packages) => {
      var statusText = _.get(others, "status");
      var status = 0;
      if (_.eq(statusText, "DeploymentSucceeded")) {
        status = constConfig.DEPLOYMENT_SUCCEEDED;
      } else if (_.eq(statusText, "DeploymentFailed")) {
        status = constConfig.DEPLOYMENT_FAILED;
      }
      var packageId = packages.id;
      var previous_deployment_key = _.get(others, 'previousDeploymentKey');
      var previous_label = _.get(others, 'previousLabelOrAppVersion');
      if (status > 0) {
        return BPromise.all([
          models.LogReportDeploy.create({
            package_id: packageId,
            client_unique_id: clientUniqueId,
            previous_label: previous_label,
            previous_deployment_key: previous_deployment_key,
            status: status
          }),
          models.PackagesMetrics.findOne({ where: { package_id: packageId } })
            .then((metrics) => {
              if (_.isEmpty(metrics)) {
                return;
              }
              if (constConfig.DEPLOYMENT_SUCCEEDED) {
                return metrics?.increment(['installed', 'active'], { by: 1 });
              } else {
                return metrics?.increment(['installed', 'failed'], { by: 1 });
              }
            })
        ])
          .then(() => {
            if (previous_deployment_key && previous_label) {
              return models.Deployments.findOne({ where: { deployment_key: previous_deployment_key } })
                .then((dep) => {
                  if (_.isEmpty(dep)) {
                    return;
                  }
                  return models.Packages.findOne({ where: { deployment_id: dep?.id, label: previous_label } })
                    .then((p) => {
                      if (_.isEmpty(p)) {
                        return;
                      }
                      return models.PackagesMetrics.findOne({ where: { package_id: p?.id } });
                    });
                })
                .then((metrics) => {
                  if (metrics) {
                    return metrics.decrement('active');
                  }
                  return;
                });
            }
            return;
          });
      } else {
        return;
      }
    });
};
