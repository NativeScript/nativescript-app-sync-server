import * as models from '../../models'
import * as security from '../../core/utils/security'
import * as common from '../../core/utils/common'
import * as Promise from 'bluebird'
import _ from 'lodash'
import moment from 'moment'
import { AppError } from '../app-error'
import log4js from 'log4js'

const log = log4js.getLogger("cps:deployments")

export const getAllPackageIdsByDeploymentsId = function (deploymentsId) {
  return models.Packages.findAll({ where: { deployment_id: deploymentsId } });
};

export const existDeloymentName = function (appId, name) {
  return models.Deployments.findOne({ where: { appid: appId, name: name } })
    .then((data) => {
      if (!_.isEmpty(data)) {
        throw new AppError(name + " name does Exist!")
      } else {
        return data;
      }
    });
};

export const addDeloyment = function (name, appId, uid) {
  return models.Users.findByPk(uid)
    .then((user) => {
      if (_.isEmpty(user)) {
        throw new AppError('can\'t find user');
      }
      return existDeloymentName(appId, name)
        .then(() => {
          var identical = user?.identical;
          var deploymentKey = security.randToken(28) + identical;
          return models.Deployments.create({
            appid: appId,
            name: name,
            deployment_key: deploymentKey,
            last_deployment_version_id: 0,
            label_id: 0
          });
        });
    });
};

export const renameDeloymentByName = function (deploymentName, appId, newName) {
  return existDeloymentName(appId, newName)
    .then(() => {
      return Promise(models.Deployments.update(
        { name: newName },
        { where: { name: deploymentName, appid: appId } }
      ))
        .spread((affectedCount, affectedRow) => {
          if (_.gt(affectedCount, 0)) {
            return { name: newName };
          } else {
            throw new AppError(`does not find the deployment "${deploymentName}"`);
          }
        });
    });
};

export const deleteDeloymentByName = function (deploymentName, appId) {
  return models.Deployments.destroy({
    where: { name: deploymentName, appid: appId }
  })
    .then((rowNum) => {
      if (_.gt(rowNum, 0)) {
        return { name: `${deploymentName}` };
      } else {
        throw new AppError(`does not find the deployment "${deploymentName}"`);
      }
    });
};

export const findDeloymentByName = function (deploymentName, appId) {
  log.debug(`findDeloymentByName name:${deploymentName},appId: ${appId}`);
  return models.Deployments.findOne({
    where: { name: deploymentName, appid: appId }
  });
};

export const findPackagesAndOtherInfos = function (packageId) {
  return models.Packages.findOne({
    where: { id: packageId }
  })
    .then((packageInfo) => {
      if (!packageInfo) {
        return null;
      }
      return Promise.props({
        packageInfo: packageInfo,
        packageDiffMap: models.PackagesDiff.findAll({ where: { package_id: packageId } })
          .then((diffs) => {
            if (diffs.length > 0) {
              return _.reduce(diffs, (result, v) => {
                result[_.get(v, 'diff_against_package_hash')] = {
                  size: _.get(v, 'diff_size'),
                  url: common.getBlobDownloadUrl(_.get(v, 'diff_blob_url')),
                };
                return result;
              }, {});
            }
            return null;
          }),
        userInfo: models.Users.findOne({ where: { id: packageInfo.released_by } }),
        deploymentsVersions: models.DeploymentsVersions.findByPk(packageInfo.deployment_version_id)
      });
    });
};

export const findDeloymentsPackages = function (deploymentsVersionsId) {
  return models.DeploymentsVersions.findOne({ where: { id: deploymentsVersionsId } })
    .then((deploymentsVersionsInfo) => {
      if (deploymentsVersionsInfo) {
        return findPackagesAndOtherInfos(deploymentsVersionsInfo.current_package_id);
      }
      return null;
    });
};

export const formatPackage = function (packageVersion) {
  if (!packageVersion) {
    return null;
  }
  return {
    description: _.get(packageVersion, "packageInfo.description"),
    isDisabled: false,
    isMandatory: _.get(packageVersion, "packageInfo.is_mandatory") == 1 ? true : false,
    rollout: 100,
    appVersion: _.get(packageVersion, "deploymentsVersions.app_version"),
    packageHash: _.get(packageVersion, "packageInfo.package_hash"),
    blobUrl: common.getBlobDownloadUrl(_.get(packageVersion, "packageInfo.blob_url")),
    size: _.get(packageVersion, "packageInfo.size"),
    manifestBlobUrl: common.getBlobDownloadUrl(_.get(packageVersion, "packageInfo.manifest_blob_url")),
    diffPackageMap: _.get(packageVersion, 'packageDiffMap'),
    releaseMethod: _.get(packageVersion, "packageInfo.release_method"),
    uploadTime: parseInt(moment(_.get(packageVersion, "packageInfo.updated_at")).format('x')),
    originalLabel: _.get(packageVersion, "packageInfo.original_label"),
    originalDeployment: _.get(packageVersion, "packageInfo.original_deployment"),
    label: _.get(packageVersion, "packageInfo.label"),
    releasedBy: _.get(packageVersion, "userInfo.email"),
  };
};

export const listDeloyments = function (appId) {
  return models.Deployments.findAll({ where: { appid: appId } })
    .then((deploymentsInfos) => {
      if (_.isEmpty(deploymentsInfos)) {
        return [];
      }
      return Promise.map(deploymentsInfos, (v) => {
        return listDeloyment(v);
      })
    });
};

export const listDeloyment = function (deploymentInfo) {
  return Promise.props({
    createdTime: parseInt(moment(deploymentInfo.created_at).format('x')),
    id: `${deploymentInfo.id}`,
    key: deploymentInfo.deployment_key,
    name: deploymentInfo.name,
    package: findDeloymentsPackages([deploymentInfo.last_deployment_version_id]).then(formatPackage)
  });
}

export const getDeploymentHistory = function (deploymentId) {
  return models.DeploymentsHistory.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 15 })
    .then((history) => {
      return _.map(history, (v) => { return v.package_id });
    })
    .then((packageIds) => {
      return Promise.map(packageIds, (v) => {
        return findPackagesAndOtherInfos(v).then(formatPackage);
      });
    });
};

export const deleteDeploymentHistory = function (deploymentId) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Deployments.update(
        { last_deployment_version_id: 0, label_id: 0 },
        { where: { id: deploymentId }, transaction: t }
      ),
      models.DeploymentsHistory.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return Promise.map(rs, (v) => {
            return v.destroy({ transaction: t });
          });
        }),
      models.DeploymentsVersions.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return Promise.map(rs, (v) => {
            return v.destroy({ transaction: t });
          });
        }),
      models.Packages.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return Promise.map(rs, (v) => {
            return v.destroy({ transaction: t })
              .then(() => {
                return Promise.all([
                  models.PackagesMetrics.destroy({ where: { package_id: v.get('id') }, transaction: t }),
                  models.PackagesDiff.destroy({ where: { package_id: v.get('id') }, transaction: t })
                ]);
              });
          });
        })
    ]);
  });
}

