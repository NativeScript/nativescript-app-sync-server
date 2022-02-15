import * as models from '../../models'
import * as security from '../../core/utils/security'
import * as common from '../../core/utils/common'
import bluebird from 'bluebird'
import _ from 'lodash'
import moment from 'moment'
import { AppError } from '../app-error'
import log4js from 'log4js'
import { DeploymentsInstance } from '~/models/deployments'
import { UsersInstance } from '~/models/users'
import { PackagesInstance } from '~/models/packages'
import { DeploymentsVersionsInstance } from '~/models/deployments_versions'

const log = log4js.getLogger("cps:deployments")

export const getAllPackageIdsByDeploymentsId = function (deploymentsId: number) {
  return models.Packages.findAll({ where: { deployment_id: deploymentsId } });
};

export const existDeloymentName = async function (appId: number, name: string) {
  const data = await models.Deployments.findOne({ where: { appid: appId, name } })
  if (!_.isEmpty(data)) {
    throw new AppError(name + " name does Exist!")
  } else {
    return data;
  }
};

export const addDeloyment = async function (name: string, appId: number, uid: number) {
  const user = await models.Users.findByPk(uid)
  if (_.isEmpty(user)) {
    throw new AppError('can\'t find user');
  }

  await existDeloymentName(appId, name)

  const identical = user?.identical;
  const deploymentKey = security.randToken(28) + identical;

  return models.Deployments.create({
    appid: appId,
    name: name,
    deployment_key: deploymentKey,
    last_deployment_version_id: 0,
    label_id: 0
  });
};

export const renameDeloymentByName = async function (deploymentName: string, appId: number, newName: string) {
  await existDeloymentName(appId, newName)

  const [affectedCount, affectedRow] = await models.Deployments.update(
    { name: newName },
    { where: { name: deploymentName, appid: appId } }
  )
  if (_.gt(affectedCount, 0)) {
    return { name: newName };
  } else {
    throw new AppError(`does not find the deployment "${deploymentName}"`);
  }
};

export const deleteDeloymentByName = async function (deploymentName: string, appId: number | undefined) {
  const rowNum = await models.Deployments.destroy({
    where: { name: deploymentName, appid: appId }
  })
  if (_.gt(rowNum, 0)) {
    return { name: `${deploymentName}` };
  } else {
    throw new AppError(`does not find the deployment "${deploymentName}"`);
  }
};

export const findDeloymentByName = function (deploymentName: string, appId: number | undefined) {
  log.debug(`findDeloymentByName name:${deploymentName},appId: ${appId}`);
  return models.Deployments.findOne({
    where: { name: deploymentName, appid: appId }
  });
};

type FindPackagesAndOtherInfosResponse = {
  packageInfo: PackagesInstance;
  packageDiffMap: {
    [key: string]: {
      size: number;
      url: string;
    };
  } | null;
  userInfo: UsersInstance | null;
  deploymentsVersions: DeploymentsVersionsInstance | null;
} | null
export const findPackagesAndOtherInfos = async function (packageId: number | undefined)
  : Promise<FindPackagesAndOtherInfosResponse> {
  const packageInfo = await models.Packages.findOne({
    where: { id: packageId }
  })
  if (!packageInfo) {
    return null;
  }
  return bluebird.props({
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
          }, {} as { [key: string]: { size: number, url: string } });
        }
        return null;
      }),
    userInfo: models.Users.findOne({ where: { id: packageInfo.released_by } }),
    deploymentsVersions: models.DeploymentsVersions.findByPk(packageInfo.deployment_version_id)
  });
};

export const findDeloymentsPackages = function (deploymentsVersionsId: number) {
  return models.DeploymentsVersions.findOne({ where: { id: deploymentsVersionsId } })
    .then((deploymentsVersionsInfo) => {
      if (deploymentsVersionsInfo) {
        return findPackagesAndOtherInfos(deploymentsVersionsInfo.current_package_id);
      }
      return null;
    });
};

export const formatPackage = function (packageVersion: FindPackagesAndOtherInfosResponse) {
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

export const listDeloyments = async function (appId: number) {
  const deploymentsInfos = await models.Deployments.findAll({ where: { appid: appId } })
  if (_.isEmpty(deploymentsInfos)) {
    return [];
  }
  return bluebird.map(deploymentsInfos, (v) => {
    return listDeloyment(v);
  })
};

export const listDeloyment = function (deploymentInfo: DeploymentsInstance) {
  return bluebird.props({
    createdTime: parseInt(moment(deploymentInfo.created_at).format('x')),
    id: `${deploymentInfo.id}`,
    key: deploymentInfo.deployment_key,
    name: deploymentInfo.name,
    package: findDeloymentsPackages(deploymentInfo.last_deployment_version_id).then(formatPackage)
  });
}

export const getDeploymentHistory = function (deploymentId: number) {
  return models.DeploymentsHistory.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 15 })
    .then((history) => {
      return _.map(history, (v) => { return v.package_id });
    })
    .then((packageIds) => {
      return bluebird.map(packageIds, (v) => {
        return findPackagesAndOtherInfos(v).then(formatPackage);
      });
    });
};

export const deleteDeploymentHistory = function (deploymentId: number) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Deployments.update(
        { last_deployment_version_id: 0, label_id: 0 },
        { where: { id: deploymentId }, transaction: t }
      ),
      models.DeploymentsHistory.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return bluebird.map(rs, (v) => {
            return v.destroy({ transaction: t });
          });
        }),
      models.DeploymentsVersions.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return bluebird.map(rs, (v) => {
            return v.destroy({ transaction: t });
          });
        }),
      models.Packages.findAll({ where: { deployment_id: deploymentId }, order: [['id', 'desc']], limit: 1000 })
        .then((rs) => {
          return bluebird.map(rs, (v) => {
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


