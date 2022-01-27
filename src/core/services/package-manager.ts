import * as models from '../../models'
import * as security from '../utils/security'
import _ from 'lodash'
import formidable from 'formidable'
import yazl from "yazl"
import fs from "fs"
import * as common from '../utils/common'
import DiffMatchPatch from 'diff-match-patch'
import os from 'os'
import path from 'path'
import { AppError } from '../app-error'
import constConfig from '../constants'
import log4js from 'log4js'
import { generateLabelId } from '~/queries'
import * as Promise from 'bluebird'
import * as dataCenterManager from './datacenter-manager'
import { Op } from 'sequelize'
var log = log4js.getLogger("cps:PackageManager");

export const getMetricsbyPackageId = function (packageId) {
  return models.PackagesMetrics.findOne({ where: { package_id: packageId } });
}

export const findPackageInfoByDeploymentIdAndLabel = function (deploymentId, label) {
  return models.Packages.findOne({ where: { deployment_id: deploymentId, label: label } });
}

export const findLatestPackageInfoByDeployVersion = function (deploymentsVersionsId) {
  return models.DeploymentsVersions.findByPk(deploymentsVersionsId)
    .then((deploymentsVersions) => {
      if (!deploymentsVersions || deploymentsVersions.current_package_id < 0) {
        var e = new AppError("not found last packages");
        log.debug(e);
        throw e;
      }
      return models.Packages.findByPk(deploymentsVersions.current_package_id);
    });
}

export const parseReqFile = function (req) {
  log.debug('parseReqFile');
  return new Promise((resolve, reject) => {
    var form = new formidable.IncomingForm();
    form.maxFieldsSize = 200 * 1024 * 1024;
    form.parse(req, (err, fields, files) => {
      if (err) {
        log.debug('parseReqFile:', err);
        reject(new AppError("upload error"));
      } else {
        log.debug('parseReqFile fields:', fields);
        log.debug('parseReqFile file location:', _.get(files, 'package.path'));
        if (_.isEmpty(fields.packageInfo) || _.isEmpty(_.get(files, 'package'))) {
          log.debug('parseReqFile upload info lack');
          reject(new AppError("upload info lack"));
        } else {
          log.debug('parseReqFile is ok');
          resolve({ packageInfo: JSON.parse(fields.packageInfo), package: files.package });
        }
      }
    });
  });
};

export const createDeploymentsVersionIfNotExist = function (deploymentId, appVersion, minVersion, maxVersion, t) {
  return Promise(models.DeploymentsVersions.findOrCreate({
    where: { deployment_id: deploymentId, app_version: appVersion, min_version: minVersion, max_version: maxVersion },
    // @ts-ignore
    defaults: { "current_package_id": 2 },
    transaction: t
  }))
    .spread((data, created) => {
      if (created) {
        log.debug(`createDeploymentsVersionIfNotExist findOrCreate version ${appVersion}`);
      }
      log.debug(`createDeploymentsVersionIfNotExist version data:`, data.get());
      return data;
    });
};

export const isMatchPackageHash = function (packageId, packageHash) {
  if (_.lt(packageId, 0)) {
    log.debug(`isMatchPackageHash packageId is 0`);
    return Promise.resolve(false);
  }
  return models.Packages.findByPk(packageId)
    .then((data) => {
      if (data && _.eq(data.get('package_hash'), packageHash)) {
        log.debug(`isMatchPackageHash data:`, data.get());
        log.debug(`isMatchPackageHash packageHash exist`);
        return true;
      } else {
        log.debug(`isMatchPackageHash package is null`);
        return false;
      }
    });
};

export const createPackage = function (deploymentId, appVersion, packageHash, manifestHash, blobHash, params) {
  var releaseMethod = params.releaseMethod || constConfig.RELEAS_EMETHOD_UPLOAD;
  var releaseUid = params.releaseUid || 0;
  var isMandatory = params.isMandatory || 0;
  var size = params.size || 0;
  var rollout = params.rollout || 100;
  var description = params.description || "";
  var originalLabel = params.originalLabel || "";
  var isDisabled = params.isDisabled || 0;
  var originalDeployment = params.originalDeployment || "";

  return generateLabelId(deploymentId)
    .then((labelId) => {
      return models.sequelize.transaction((t) => {
        return createDeploymentsVersionIfNotExist(deploymentId, appVersion, params.min_version, params.max_version, t)
          .then((deploymentsVersions) => {
            return models.Packages.create({
              deployment_version_id: deploymentsVersions.id,
              deployment_id: deploymentId,
              description: description,
              package_hash: packageHash,
              blob_url: blobHash,
              size: size,
              manifest_blob_url: manifestHash,
              release_method: releaseMethod,
              label: "v" + labelId,
              released_by: releaseUid,
              is_mandatory: isMandatory,
              is_disabled: isDisabled,
              rollout: rollout,
              original_label: originalLabel,
              original_deployment: originalDeployment
            }, { transaction: t })
              .then((packages) => {
                deploymentsVersions.set('current_package_id', packages.id);
                return Promise.all([
                  deploymentsVersions.save({ transaction: t }),
                  models.Deployments.update(
                    { last_deployment_version_id: deploymentsVersions.id },
                    { where: { id: deploymentId }, transaction: t }
                  ),
                  models.PackagesMetrics.create(
                    { package_id: packages.id },
                    { transaction: t }
                  ),
                  models.DeploymentsHistory.create(
                    { deployment_id: deploymentId, package_id: packages.id },
                    { transaction: t }
                  )
                ])
                  .then(() => packages);
              });
          });
      });
    });
};

export const downloadPackageAndExtract = function (workDirectoryPath, packageHash, blobHash) {

  return dataCenterManager.validateStore(packageHash)
    .then((isValidate) => {
      if (isValidate) {
        return dataCenterManager.getPackageInfo(packageHash);
      } else {
        var downloadURL = common.getBlobDownloadUrl(blobHash);
        return common.createFileFromRequest(downloadURL, path.join(workDirectoryPath, blobHash))
          .then((download) => {
            return common.unzipFile(path.join(workDirectoryPath, blobHash), path.join(workDirectoryPath, 'current'))
              .then((outputPath) => {
                return dataCenterManager.storePackage(outputPath, true);
              });
          });
      }
    });
}

export const zipDiffPackage = function (fileName, files, baseDirectoryPath, hotCodePushFile) {
  return new Promise((resolve, reject) => {
    var zipFile = new yazl.ZipFile();
    var writeStream = fs.createWriteStream(fileName);
    writeStream.on('error', (error) => {
      reject(error);
    })
    zipFile.outputStream.pipe(writeStream)
      .on("error", (error) => {
        reject(error);
      })
      .on("close", () => {
        resolve({ isTemporary: true, path: fileName });
      });
    for (var i = 0; i < files.length; ++i) {
      var file = files[i];
      zipFile.addFile(path.join(baseDirectoryPath, file), common.slash(file));
    }
    zipFile.addFile(hotCodePushFile, constConfig.DIFF_MANIFEST_FILE_NAME);
    zipFile.end();
  });
}

export const generateOneDiffPackage = function (
  workDirectoryPath,
  packageId,
  originDataCenter,
  oldPackageDataCenter,
  diffPackageHash,
  diffManifestBlobHash,
  isUseDiffText
) {

  return models.PackagesDiff.findOne({
    where: {
      package_id: packageId,
      diff_against_package_hash: diffPackageHash
    }
  })
    .then((diffPackage) => {
      if (!_.isEmpty(diffPackage)) {
        return;
      }
      log.debug('originDataCenter', originDataCenter);
      log.debug('oldPackageDataCenter', oldPackageDataCenter);
      var downloadURL = common.getBlobDownloadUrl(diffManifestBlobHash);
      return common.createFileFromRequest(downloadURL, path.join(workDirectoryPath, diffManifestBlobHash))
        .then(() => {
          var dataCenterContentPath = path.join(workDirectoryPath, 'dataCenter');
          common.copySync(originDataCenter.contentPath, dataCenterContentPath);
          var oldPackageDataCenterContentPath = oldPackageDataCenter.contentPath;
          var originManifestJson = JSON.parse(fs.readFileSync(originDataCenter.manifestFilePath, "utf8"))
          var diffManifestJson = JSON.parse(fs.readFileSync(path.join(workDirectoryPath, diffManifestBlobHash), "utf8"))
          var json = common.diffCollectionsSync(originManifestJson, diffManifestJson);
          var files = _.concat(json.diff, json.collection1Only);
          var hotcodepush: any = { deletedFiles: json.collection2Only, patchedFiles: [] as any };
          if (isUseDiffText == constConfig.IS_USE_DIFF_TEXT_YES) {
            //使用google diff-match-patch
            _.forEach(json.diff, function (tmpFilePath) {
              var dataCenterContentPathTmpFilePath = path.join(dataCenterContentPath, tmpFilePath);
              var oldPackageDataCenterContentPathTmpFilePath = path.join(oldPackageDataCenterContentPath, tmpFilePath);
              if (
                fs.existsSync(dataCenterContentPathTmpFilePath)
                && fs.existsSync(oldPackageDataCenterContentPathTmpFilePath)
                && common.detectIsTextFile(dataCenterContentPathTmpFilePath)
                && common.detectIsTextFile(oldPackageDataCenterContentPathTmpFilePath)
              ) {
                var textOld = fs.readFileSync(oldPackageDataCenterContentPathTmpFilePath, 'utf-8');
                var textNew = fs.readFileSync(dataCenterContentPathTmpFilePath, 'utf-8');
                if (!textOld || !textNew) {
                  return;
                }

                var dmp = new DiffMatchPatch();
                var patchs = dmp.patch_make(textOld, textNew);
                var patchText = dmp.patch_toText(patchs);
                if (patchText && patchText.length < textNew.length * 0.8) {
                  fs.writeFileSync(dataCenterContentPathTmpFilePath, patchText);
                  hotcodepush.patchedFiles.push(tmpFilePath);
                }
              }
            });
          }
          var hotCodePushFile = path.join(workDirectoryPath, `${diffManifestBlobHash}_hotappsync`);
          fs.writeFileSync(hotCodePushFile, JSON.stringify(hotcodepush));
          var fileName = path.join(workDirectoryPath, `${diffManifestBlobHash}.zip`);
          return zipDiffPackage(fileName, files, dataCenterContentPath, hotCodePushFile)
            .then((data: any) => {
              return security.qetag(data.path)
                .then((diffHash) => {
                  return common.uploadFileToStorage(diffHash, fileName)
                    .then(() => {
                      var stats = fs.statSync(fileName);
                      return models.PackagesDiff.create({
                        package_id: packageId,
                        diff_against_package_hash: diffPackageHash,
                        diff_blob_url: diffHash,
                        diff_size: stats.size
                      });
                    })
                });
            });
        });
    });
};

export const createDiffPackagesByLastNums = function (appId, originalPackage, num) {
  var packageId = originalPackage.id;
  return Promise.all([
    models.Packages.findAll({
      where: {
        deployment_version_id: originalPackage.deployment_version_id,
        id: { [Op.lt]: packageId }
      },
      order: [['id', 'desc']],
      limit: num
    }),
    models.Packages.findAll({
      where: {
        deployment_version_id: originalPackage.deployment_version_id,
        id: { [Op.lt]: packageId }
      },
      order: [['id', 'asc']],
      limit: 2
    }),
    models.Apps.findByPk(appId),
  ])
    .spread((lastNumsPackages, basePackages, appInfo) => {
      return [_.uniqBy(_.unionBy(lastNumsPackages, basePackages, 'id'), 'package_hash'), appInfo];
    })
    .spread((lastNumsPackages, appInfo) => {
      return createDiffPackages(originalPackage, lastNumsPackages, _.get(appInfo, 'is_use_diff_text', constConfig.IS_USE_DIFF_TEXT_NO));
    });
};

export const createDiffPackages = function (originalPackage, destPackages, isUseDiffText) {
  if (!_.isArray(destPackages)) {
    return Promise.reject(new AppError('第二个参数必须是数组'));
  }
  if (destPackages.length <= 0) {
    return null;
  }
  var package_hash = _.get(originalPackage, 'package_hash');
  var manifest_blob_url = _.get(originalPackage, 'manifest_blob_url');
  var blob_url = _.get(originalPackage, 'blob_url');
  var workDirectoryPath = path.join(os.tmpdir(), 'appsync_' + security.randToken(32));
  log.debug('workDirectoryPath', workDirectoryPath);
  return common.createEmptyFolder(workDirectoryPath)
    .then(() => downloadPackageAndExtract(workDirectoryPath, package_hash, blob_url))
    .then((originDataCenter) => Promise.map(destPackages,
      (v) => {
        var diffWorkDirectoryPath = path.join(workDirectoryPath, _.get(v, 'package_hash'));
        common.createEmptyFolderSync(diffWorkDirectoryPath);
        return downloadPackageAndExtract(diffWorkDirectoryPath, _.get(v, 'package_hash'), _.get(v, 'blob_url'))
          .then((oldPackageDataCenter) =>
            generateOneDiffPackage(
              diffWorkDirectoryPath,
              originalPackage.id,
              originDataCenter,
              oldPackageDataCenter,
              v.package_hash,
              v.manifest_blob_url,
              isUseDiffText
            )
          )
      }
    ))
    .finally(() => common.deleteFolderSync(workDirectoryPath));
}

export const releasePackage = function (appId, deploymentId, packageInfo, filePath, releaseUid) {

  var appVersion = packageInfo.appVersion;
  var versionInfo = common.validatorVersion(appVersion);
  if (!versionInfo[0]) {
    log.debug(`releasePackage targetBinaryVersion ${appVersion} not support.`);
    return Promise.reject(new AppError(`targetBinaryVersion ${appVersion} not support.`))
  }
  var description = packageInfo.description; //描述
  var isDisabled = packageInfo.isDisabled; //是否立刻下载
  var rollout = packageInfo.rollout; //灰度百分比
  var isMandatory = packageInfo.isMandatory; //是否强制更新，无法跳过
  var tmpDir = os.tmpdir();
  var directoryPathParent = path.join(tmpDir, 'codepuh_' + security.randToken(32));
  var directoryPath = path.join(directoryPathParent, 'current');
  log.debug(`releasePackage generate an random dir path: ${directoryPath}`);
  return Promise.all([
    security.qetag(filePath),
    common.createEmptyFolder(directoryPath)
      .then(() => {
        return common.unzipFile(filePath, directoryPath)
      })
  ])
    .spread((blobHash) => {
      return security.uploadPackageType(directoryPath)
        .then((type) => {
          return models.Apps.findByPk(appId).then((appInfo) => {
            if (appInfo && type > 0 && appInfo.os > 0 && appInfo.os != type) {
              var e = new AppError("it must be publish it by ios type");
              log.debug(e);
              throw e;
            } else {
              //不验证
              log.debug(`Unknown package type:`, type, ',db os:', appInfo?.os);
            }
            return blobHash;
          });
        });
    })
    .then((blobHash) => {

      return dataCenterManager.storePackage(directoryPath)
        .then((dataCenter) => {
          var packageHash = dataCenter.packageHash;
          var manifestFile = dataCenter.manifestFilePath;
          return models.DeploymentsVersions.findOne({ where: { deployment_id: deploymentId, app_version: appVersion } })
            .then((deploymentsVersions) => {
              if (!deploymentsVersions) {
                return false;
              }
              return isMatchPackageHash(deploymentsVersions.get('current_package_id'), packageHash);
            })
            .then((isExist) => {
              if (isExist) {
                var e = new AppError("The uploaded package is identical to the contents of the specified deployment's current release.");
                log.debug(e.message);
                throw e;
              }
              return security.qetag(manifestFile);
            })
            .then((manifestHash) => {
              return Promise.all([
                common.uploadFileToStorage(manifestHash, manifestFile),
                common.uploadFileToStorage(blobHash, filePath)
              ])
                .then(() => [packageHash, manifestHash, blobHash]);
            })
        });
    })
    .spread((packageHash, manifestHash, blobHash) => {
      var stats = fs.statSync(filePath);
      var params = {
        releaseMethod: constConfig.RELEAS_EMETHOD_UPLOAD,
        releaseUid: releaseUid,
        isMandatory: isMandatory ? constConfig.IS_MANDATORY_YES : constConfig.IS_MANDATORY_NO,
        isDisabled: isDisabled ? constConfig.IS_DISABLED_YES : constConfig.IS_DISABLED_NO,
        rollout: rollout,
        size: stats.size,
        description: description,
        min_version: versionInfo[1],
        max_version: versionInfo[2],
      }
      return createPackage(deploymentId, appVersion, packageHash, manifestHash, blobHash, params);
    })
    .finally(() => common.deleteFolderSync(directoryPathParent))
};

export const modifyReleasePackage = function (packageId, params) {
  var appVersion = _.get(params, 'appVersion');
  var description = _.get(params, 'description');
  var isMandatory = _.get(params, 'isMandatory');
  var isDisabled = _.get(params, 'isDisabled');
  var rollout = _.get(params, 'rollout');
  return models.Packages.findByPk(packageId)
    .then((packageInfo) => {
      if (!packageInfo) {
        throw new AppError(`packageInfo not found`);
      }
      if (!_.isNull(appVersion)) {
        var versionInfo = common.validatorVersion(appVersion);
        if (!versionInfo[0]) {
          throw new AppError(`--targetBinaryVersion ${appVersion} not support.`);
        }
        return Promise.all([
          models.DeploymentsVersions.findOne({ where: { deployment_id: packageInfo.deployment_id, app_version: appVersion } }),
          models.DeploymentsVersions.findByPk(packageInfo.deployment_version_id)
        ])
          .spread((v1, v2) => {
            if (v1 && !_.eq(v1.id, v2.id)) {
              log.debug(v1);
              throw new AppError(`${appVersion} already exist.`);
            }
            if (!v2) {
              throw new AppError(`packages not found.`);
            }
            return models.DeploymentsVersions.update({
              app_version: appVersion,
              min_version: Number(versionInfo[1]),
              max_version: Number(versionInfo[2])
            }, { where: { id: v2.id } });
          })
          .then(() => {
            return packageInfo
          });
      }
      return packageInfo;
    })
    .then((packageInfo) => {
      var new_params: any = {
        description: description || packageInfo.description,
      };
      if (_.isInteger(rollout)) {
        new_params.rollout = rollout;
      }
      if (_.isBoolean(isMandatory)) {
        new_params.is_mandatory = isMandatory ? constConfig.IS_MANDATORY_YES : constConfig.IS_MANDATORY_NO;
      }
      if (_.isBoolean(isDisabled)) {
        new_params.is_disabled = isDisabled ? constConfig.IS_DISABLED_YES : constConfig.IS_DISABLED_NO;
      }
      return models.Packages.update(new_params, { where: { id: packageId } });
    });
};

export const promotePackage = function (sourceDeploymentInfo, destDeploymentInfo, params) {
  var appVersion = _.get(params, 'appVersion', null);
  var label = _.get(params, 'label', null);
  return new Promise((resolve, reject) => {
    if (label) {
      return models.Packages.findOne({ where: { deployment_id: sourceDeploymentInfo.id, label: label } })
        .then((sourcePack) => {
          if (!sourcePack) {
            throw new AppError('label does not exist.');
          }
          return models.DeploymentsVersions.findByPk(sourcePack.deployment_version_id)
            .then((deploymentsVersions) => {
              if (!deploymentsVersions) {
                throw new AppError('deploymentsVersions does not exist.');
              }
              resolve([sourcePack, deploymentsVersions]);
            });
        })
        .catch((e) => {
          reject(e);
        });
    } else {
      var lastDeploymentVersionId = _.get(sourceDeploymentInfo, 'last_deployment_version_id', 0);
      if (_.lte(lastDeploymentVersionId, 0)) {
        throw new AppError(`does not exist last_deployment_version_id.`);
      }
      return models.DeploymentsVersions.findByPk(lastDeploymentVersionId)
        .then((deploymentsVersions) => {
          var sourcePackId = _.get(deploymentsVersions, 'current_package_id', 0);
          if (_.lte(sourcePackId, 0)) {
            throw new AppError(`packageInfo not found.`);
          }
          return models.Packages.findByPk(sourcePackId)
            .then((sourcePack) => {
              if (!sourcePack) {
                throw new AppError(`packageInfo not found.`);
              }
              resolve([sourcePack, deploymentsVersions]);
            });
        })
        .catch((e) => {
          reject(e);
        });
    }
  })
    .spread((sourcePack, deploymentsVersions) => {
      var appFinalVersion = appVersion || deploymentsVersions.app_version;
      log.debug('sourcePack', sourcePack);
      log.debug('deploymentsVersions', deploymentsVersions);
      log.debug('appFinalVersion', appFinalVersion);
      return models.DeploymentsVersions.findOne({
        where: {
          deployment_id: destDeploymentInfo.id,
          app_version: appFinalVersion,
        }
      })
        .then((destDeploymentsVersions) => {
          if (!destDeploymentsVersions) {
            return false;
          }
          return isMatchPackageHash(destDeploymentsVersions.get('current_package_id'), sourcePack.package_hash);
        })
        .then((isExist) => {
          if (isExist) {
            throw new AppError("The uploaded package is identical to the contents of the specified deployment's current release.");
          }
          return [sourcePack, deploymentsVersions, appFinalVersion];
        });
    })
    .spread((sourcePack, deploymentsVersions, appFinalVersion) => {
      var versionInfo = common.validatorVersion(appFinalVersion);
      if (!versionInfo[0]) {
        log.debug(`targetBinaryVersion ${appVersion} not support.`);
        throw new AppError(`targetBinaryVersion ${appVersion} not support.`);
      }
      var create_params: any = {
        releaseMethod: constConfig.RELEAS_EMETHOD_PROMOTE,
        releaseUid: params.promoteUid || 0,
        rollout: params.rollout || 100,
        size: sourcePack.size,
        description: params.description || sourcePack.description,
        originalLabel: sourcePack.label,
        originalDeployment: sourceDeploymentInfo.name,
        min_version: versionInfo[1],
        max_version: versionInfo[2],
      };
      if (_.isBoolean(params.isMandatory)) {
        create_params.isMandatory = params.isMandatory ? constConfig.IS_MANDATORY_YES : constConfig.IS_MANDATORY_NO;
      } else {
        create_params.isMandatory = sourcePack.is_mandatory
      }
      if (_.isBoolean(params.isDisabled)) {
        create_params.isDisabled = params.isDisabled ? constConfig.IS_DISABLED_YES : constConfig.IS_DISABLED_NO;
      } else {
        create_params.isDisabled = sourcePack.is_disabled
      }
      return createPackage(
        destDeploymentInfo.id,
        appFinalVersion,
        sourcePack.package_hash,
        sourcePack.manifest_blob_url,
        sourcePack.blob_url,
        create_params
      );
    });
};

export const rollbackPackage = function (deploymentVersionId, targetLabel, rollbackUid) {
  return models.DeploymentsVersions.findByPk(deploymentVersionId)
    .then((deploymentsVersions) => {
      if (!deploymentsVersions) {
        throw new AppError("You have not published a version before");
      }
      return Promise(models.Packages.findByPk(deploymentsVersions.current_package_id))
        .then((currentPackageInfo) => {
          if (targetLabel) {
            return models.Packages.findAll({ where: { deployment_version_id: deploymentVersionId, label: targetLabel }, limit: 1 })
              .then((rollbackPackageInfos) => {
                return [currentPackageInfo, rollbackPackageInfos]
              });
          } else {
            return getCanRollbackPackages(deploymentVersionId)
              .then((rollbackPackageInfos) => {
                return [currentPackageInfo, rollbackPackageInfos]
              });
          }
        })
        .spread((currentPackageInfo, rollbackPackageInfos) => {
          if (currentPackageInfo && rollbackPackageInfos.length > 0) {
            for (var i = rollbackPackageInfos.length - 1; i >= 0; i--) {
              if (rollbackPackageInfos[i].package_hash != currentPackageInfo.package_hash) {
                return rollbackPackageInfos[i];
              }
            }
          }
          throw new AppError("No previous AppSync'ed version found for this app version to roll back to.");
        })
        .then((rollbackPackage) => {
          var params = {
            releaseMethod: 'Rollback',
            releaseUid: rollbackUid,
            isMandatory: rollbackPackage.is_mandatory,
            isDisabled: rollbackPackage.is_disabled,
            rollout: rollbackPackage.rollout,
            size: rollbackPackage.size,
            description: rollbackPackage.description,
            originalLabel: rollbackPackage.label,
            originalDeployment: '',
            min_version: deploymentsVersions.min_version,
            max_version: deploymentsVersions.max_version,
          };
          return createPackage(deploymentsVersions.deployment_id,
            deploymentsVersions.app_version,
            rollbackPackage.package_hash,
            rollbackPackage.manifest_blob_url,
            rollbackPackage.blob_url,
            params
          );
        });
    });
}

export const getCanRollbackPackages = function (deploymentVersionId) {
  return models.Packages.findAll({
    where: {
      deployment_version_id: deploymentVersionId,
      release_method: { [Op.in]: [constConfig.RELEAS_EMETHOD_UPLOAD, constConfig.RELEAS_EMETHOD_PROMOTE] }
    }, order: [['id', 'desc']], limit: 2
  });
}
