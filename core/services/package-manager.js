'use strict';
var Promise = require('bluebird');
var models = require('../../models');
var security = require('../utils/security');
var _ = require('lodash');
var qetag = require('../utils/qetag');
var formidable = require('formidable');
var yazl = require("yazl");
var fs = require("fs");
var slash = require("slash");
var common = require('../utils/common');
var os = require('os');
var path = require('path');
var AppError = require('../app-error');
var constConfig = require('../const');
var log4js = require('log4js');
var log = log4js.getLogger("cps:PackageManager");

var proto = module.exports = function (){
  function PackageManager() {

  }
  PackageManager.__proto__ = proto;
  return PackageManager;
};

proto.getMetricsbyPackageId = function(packageId) {
  return models.PackagesMetrics.findOne({where: {package_id: packageId}});
}

proto.findPackageInfoByDeploymentIdAndLabel = function (deploymentId, label) {
  return models.Packages.findOne({where: {deployment_id: deploymentId, label:label}});
}

proto.findLatestPackageInfoByDeployVersion = function (deploymentsVersionsId) {
    return models.DeploymentsVersions.findById(deploymentsVersionsId)
    .then((deploymentsVersions)=>{
        if (!deploymentsVersions || deploymentsVersions.current_package_id < 0) {
          var e = new AppError.AppError("not found last packages");
          log.debug(e);
          throw e;
        }
        return models.Packages.findById(deploymentsVersions.current_package_id);
    });
}

proto.parseReqFile = function (req) {
  log.debug('parseReqFile');
  return new Promise((resolve, reject) => {
    var form = new formidable.IncomingForm();
    form.maxFieldsSize = 200 * 1024 * 1024;
    form.parse(req, (err, fields, files) => {
      if (err) {
        log.debug('parseReqFile:', err);
        reject(new AppError.AppError("upload error"));
      } else {
        log.debug('parseReqFile fields:', fields);
        log.debug('parseReqFile file location:', _.get(files,'package.path'));
        if (_.isEmpty(fields.packageInfo) || _.isEmpty(_.get(files,'package'))) {
          log.debug('parseReqFile upload info lack');
          reject(new AppError.AppError("upload info lack"));
        } else {
          log.debug('parseReqFile is ok');
          resolve({packageInfo: JSON.parse(fields.packageInfo), package: files.package});
        }
      }
    });
  });
};

proto.createDeploymentsVersionIfNotExist = function (deploymentId, appVersion, minVersion, maxVersion, t) {
  return models.DeploymentsVersions.findOrCreate({
    where: {deployment_id: deploymentId, app_version: appVersion, min_version:minVersion, max_version:maxVersion},
    defaults: {current_package_id: 0},
    transaction: t
  })
  .spread((data, created)=>{
    if (created) {
      log.debug(`createDeploymentsVersionIfNotExist findOrCreate version ${appVersion}`);
    }
    log.debug(`createDeploymentsVersionIfNotExist version data:`, data.get());
    return data;
  });
};

proto.isMatchPackageHash = function (packageId, packageHash) {
  if (_.lt(packageId, 0)) {
    log.debug(`isMatchPackageHash packageId is 0`);
    return Promise.resolve(false);
  }
  return models.Packages.findById(packageId)
  .then((data) => {
    if (data && _.eq(data.get('package_hash'), packageHash)){
      log.debug(`isMatchPackageHash data:`, data.get());
      log.debug(`isMatchPackageHash packageHash exist`);
      return true;
    }else {
      log.debug(`isMatchPackageHash package is null`);
      return false;
    }
  });
};

proto.createPackage = function (deploymentId, appVersion, packageHash, manifestHash, blobHash, params) {
  var releaseMethod = params.releaseMethod || constConfig.RELEAS_EMETHOD_UPLOAD;
  var releaseUid = params.releaseUid || 0;
  var isMandatory = params.isMandatory || 0;
  var size = params.size || 0;
  var rollout = params.rollout || 100;
  var description = params.description || "";
  var originalLabel = params.originalLabel || "";
  var isDisabled = params.isDisabled || 0;
  var originalDeployment = params.originalDeployment || "";
  var self = this;
  return models.Deployments.generateLabelId(deploymentId)
  .then((labelId) => {
    return models.sequelize.transaction((t) => {
      return self.createDeploymentsVersionIfNotExist(deploymentId, appVersion, params.min_version, params.max_version, t)
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
        },{transaction: t})
        .then((packages) => {
          deploymentsVersions.set('current_package_id', packages.id);
          return Promise.all([
            deploymentsVersions.save({transaction: t}),
            models.Deployments.update(
              {last_deployment_version_id: deploymentsVersions.id},
              {where: {id: deploymentId}, transaction: t}
            ),
            models.PackagesMetrics.create(
              {package_id: packages.id},
              {transaction: t}
            ),
            models.DeploymentsHistory.create(
              {deployment_id: deploymentId,package_id: packages.id},
              {transaction: t}
            )
          ])
          .then(() => packages);
        });
      });
    });
  });
};

proto.downloadPackageAndExtract = function (workDirectoryPath, packageHash, blobHash) {
  var dataCenterManager = require('./datacenter-manager')();
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

proto.zipDiffPackage = function (fileName, files, baseDirectoryPath, hotCodePushFile) {
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
      zipFile.addFile(path.join(baseDirectoryPath, file), slash(file));
    }
    zipFile.addFile(hotCodePushFile, constConfig.DIFF_MANIFEST_FILE_NAME);
    zipFile.end();
  });
}

proto.generateOneDiffPackage = function (
  workDirectoryPath,
  packageId,
  originDataCenter,
  oldPackageDataCenter,
  diffPackageHash,
  diffManifestBlobHash,
  isUseDiffText
) {
  var self = this;
  return models.PackagesDiff.findOne({
    where:{
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
    return common.createFileFromRequest(downloadURL, path.join(workDirectoryPath,diffManifestBlobHash))
    .then(() => {
      var dataCenterContentPath = path.join(workDirectoryPath, 'dataCenter');
      common.copySync(originDataCenter.contentPath, dataCenterContentPath);
      var oldPackageDataCenterContentPath = oldPackageDataCenter.contentPath;
      var originManifestJson = JSON.parse(fs.readFileSync(originDataCenter.manifestFilePath, "utf8"))
      var diffManifestJson = JSON.parse(fs.readFileSync(path.join(workDirectoryPath, diffManifestBlobHash), "utf8"))
      var json = common.diffCollectionsSync(originManifestJson, diffManifestJson);
      var files = _.concat(json.diff, json.collection1Only);
      var hotcodepush = {deletedFiles: json.collection2Only, patchedFiles:[]};
      if (isUseDiffText == constConfig.IS_USE_DIFF_TEXT_YES) {
        //使用google diff-match-patch
        _.forEach(json.diff, function(tmpFilePath) {
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
            var DiffMatchPatch = require('diff-match-patch');
            var dmp = new DiffMatchPatch();
            var patchs = dmp.patch_make(textOld, textNew);
            var patchText = dmp.patch_toText(patchs);
            if (patchText && patchText.length < _.parseInt(textNew.length * 0.8)) {
              fs.writeFileSync(dataCenterContentPathTmpFilePath, patchText);
              hotcodepush.patchedFiles.push(tmpFilePath);
            }
          }
        });
      }
      var hotCodePushFile = path.join(workDirectoryPath,`${diffManifestBlobHash}_hotcodepush`);;
      fs.writeFileSync(hotCodePushFile, JSON.stringify(hotcodepush));
      var fileName = path.join(workDirectoryPath,`${diffManifestBlobHash}.zip`);;
      return self.zipDiffPackage(fileName, files, dataCenterContentPath, hotCodePushFile)
      .then((data) => {
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

proto.createDiffPackagesByLastNums = function (appId, originalPackage, num) {
  var self = this;
  var Sequelize = require('sequelize');
  var packageId = originalPackage.id;
  return Promise.all([
    models.Packages.findAll({
      where:{
        deployment_version_id: originalPackage.deployment_version_id,
        id: {[Sequelize.Op.lt]: packageId}},
        order: [['id','desc']],
        limit: num
    }),
    models.Packages.findAll({
      where:{
        deployment_version_id: originalPackage.deployment_version_id,
        id: {[Sequelize.Op.lt]: packageId}},
        order: [['id','asc']],
        limit: 2
    }),
    models.Apps.findById(appId),
  ])
  .spread((lastNumsPackages, basePackages, appInfo) => {
    return [_.uniqBy(_.unionBy(lastNumsPackages, basePackages, 'id'), 'package_hash'), appInfo];
  })
  .spread((lastNumsPackages, appInfo) => {
    return self.createDiffPackages(originalPackage, lastNumsPackages, _.get(appInfo, 'is_use_diff_text', constConfig.IS_USE_DIFF_TEXT_NO));
  });
};

proto.createDiffPackages = function (originalPackage, destPackages, isUseDiffText) {
  if (!_.isArray(destPackages)) {
    return Promise.reject(new AppError.AppError('第二个参数必须是数组'));
  }
  if (destPackages.length <= 0) {
    return null;
  }
  var self = this;
  var package_hash = _.get(originalPackage, 'package_hash');
  var manifest_blob_url = _.get(originalPackage, 'manifest_blob_url');
  var blob_url = _.get(originalPackage, 'blob_url');
  var workDirectoryPath = path.join(os.tmpdir(), 'codepush_' + security.randToken(32));
  log.debug('workDirectoryPath', workDirectoryPath);
  return common.createEmptyFolder(workDirectoryPath)
  .then(() => self.downloadPackageAndExtract(workDirectoryPath, package_hash, blob_url))
  .then((originDataCenter) => Promise.map(destPackages,
    (v) => {
      var diffWorkDirectoryPath = path.join(workDirectoryPath, _.get(v, 'package_hash'));
      common.createEmptyFolderSync(diffWorkDirectoryPath);
      return self.downloadPackageAndExtract(diffWorkDirectoryPath, _.get(v, 'package_hash'), _.get(v, 'blob_url'))
      .then((oldPackageDataCenter) =>
        self.generateOneDiffPackage(
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

proto.releasePackage = function (appId, deploymentId, packageInfo, filePath, releaseUid) {
  var self = this;
  var appVersion = packageInfo.appVersion;
  var versionInfo = common.validatorVersion(appVersion);
  if (!versionInfo[0]) {
    log.debug(`releasePackage targetBinaryVersion ${appVersion} not support.`);
    return Promise.reject(new AppError.AppError(`targetBinaryVersion ${appVersion} not support.`))
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
      return models.Apps.findById(appId).then((appInfo)=>{
        if (type > 0 && appInfo.os > 0 && appInfo.os != type) {
            var e = new AppError.AppError("it must be publish it by ios type");
            log.debug(e);
            throw e;
        } else {
          //不验证
          log.debug(`Unknown package type:`, type, ',db os:', appInfo.os);
        }
        return blobHash;
      });
    });
  })
  .then((blobHash) => {
    var dataCenterManager = require('./datacenter-manager')();
    return dataCenterManager.storePackage(directoryPath)
    .then((dataCenter) => {
      var packageHash = dataCenter.packageHash;
      var manifestFile = dataCenter.manifestFilePath;
      return models.DeploymentsVersions.findOne({where: {deployment_id: deploymentId, app_version:appVersion}})
      .then((deploymentsVersions) => {
        if (!deploymentsVersions) {
          return false;
        }
        return self.isMatchPackageHash(deploymentsVersions.get('current_package_id'), packageHash);
      })
      .then((isExist) => {
        if (isExist){
          var e = new AppError.AppError("The uploaded package is identical to the contents of the specified deployment's current release.");
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
    return self.createPackage(deploymentId, appVersion, packageHash, manifestHash, blobHash, params);
  })
  .finally(() => common.deleteFolderSync(directoryPathParent))
};

proto.modifyReleasePackage = function(packageId, params) {
  var appVersion = _.get(params, 'appVersion');
  var description = _.get(params, 'description');
  var isMandatory = _.get(params, 'isMandatory');
  var isDisabled = _.get(params, 'isDisabled');
  var rollout = _.get(params, 'rollout');
  return models.Packages.findById(packageId)
  .then((packageInfo) => {
    if (!packageInfo) {
      throw new AppError.AppError(`packageInfo not found`);
    }
    if (!_.isNull(appVersion)) {
       var versionInfo = common.validatorVersion(appVersion);
       if (!versionInfo[0]) {
          throw new AppError.AppError(`--targetBinaryVersion ${appVersion} not support.`);
       }
       return Promise.all([
            models.DeploymentsVersions.findOne({where: {deployment_id:packageInfo.deployment_id, app_version:appVersion}}),
            models.DeploymentsVersions.findById(packageInfo.deployment_version_id)
        ])
       .spread((v1, v2) => {
          if (v1 && !_.eq(v1.id, v2.id)) {
            log.debug(v1);
            throw new AppError.AppError(`${appVersion} already exist.`);
          }
          if (!v2) {
            throw new AppError.AppError(`packages not found.`);
          }
          return models.DeploymentsVersions.update({
            app_version:appVersion,
            min_version:versionInfo[1],
            max_version:versionInfo[2]
          },{where: {id:v2.id}});
       })
       .then(()=>{
        return packageInfo
       });
    }
    return packageInfo;
  })
  .then((packageInfo) => {
    var new_params = {
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
    return models.Packages.update(new_params,{where: {id: packageId}});
  });
};

proto.promotePackage = function (sourceDeploymentInfo, destDeploymentInfo, params) {
  var self = this;
  var appVersion = _.get(params,'appVersion', null);
  var label = _.get(params,'label', null);
  return new Promise((resolve, reject) => {
    if (label) {
      return models.Packages.findOne({where: {deployment_id: sourceDeploymentInfo.id, label:label}})
      .then((sourcePack)=>{
        if (!sourcePack) {
          throw new AppError.AppError('label does not exist.');
        }
        return models.DeploymentsVersions.findById(sourcePack.deployment_version_id)
        .then((deploymentsVersions)=>{
          if (!deploymentsVersions) {
            throw new AppError.AppError('deploymentsVersions does not exist.');
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
        throw new AppError.AppError(`does not exist last_deployment_version_id.`);
      }
      return models.DeploymentsVersions.findById(lastDeploymentVersionId)
      .then((deploymentsVersions)=>{
        var sourcePackId = _.get(deploymentsVersions, 'current_package_id', 0);
        if (_.lte(sourcePackId, 0)) {
          throw new AppError.AppError(`packageInfo not found.`);
        }
        return models.Packages.findById(sourcePackId)
        .then((sourcePack) =>{
          if (!sourcePack) {
            throw new AppError.AppError(`packageInfo not found.`);
          }
          resolve([sourcePack, deploymentsVersions]);
        });
      })
      .catch((e) => {
        reject(e);
      });
    }
  })
  .spread((sourcePack, deploymentsVersions)=>{
    var appFinalVersion = appVersion || deploymentsVersions.app_version;
    log.debug('sourcePack',sourcePack);
    log.debug('deploymentsVersions',deploymentsVersions);
    log.debug('appFinalVersion', appFinalVersion);
    return models.DeploymentsVersions.findOne({where: {
      deployment_id:destDeploymentInfo.id,
      app_version: appFinalVersion,
    }})
    .then((destDeploymentsVersions)=>{
      if (!destDeploymentsVersions) {
        return false;
      }
      return self.isMatchPackageHash(destDeploymentsVersions.get('current_package_id'), sourcePack.package_hash);
    })
    .then((isExist) => {
      if (isExist){
        throw new AppError.AppError("The uploaded package is identical to the contents of the specified deployment's current release.");
      }
      return [sourcePack, deploymentsVersions, appFinalVersion];
    });
  })
  .spread((sourcePack, deploymentsVersions, appFinalVersion) => {
    var versionInfo = common.validatorVersion(appFinalVersion);
    if (!versionInfo[0]) {
      log.debug(`targetBinaryVersion ${appVersion} not support.`);
      throw new AppError.AppError(`targetBinaryVersion ${appVersion} not support.`);
    }
    var create_params = {
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
    return self.createPackage(
      destDeploymentInfo.id,
      appFinalVersion,
      sourcePack.package_hash,
      sourcePack.manifest_blob_url,
      sourcePack.blob_url,
      create_params
    );
  });
};

proto.rollbackPackage = function (deploymentVersionId, targetLabel, rollbackUid) {
  var self = this;
  return models.DeploymentsVersions.findById(deploymentVersionId)
  .then((deploymentsVersions) => {
    if (!deploymentsVersions) {
      throw new AppError.AppError("您之前还没有发布过版本");
    }
    return models.Packages.findById(deploymentsVersions.current_package_id)
    .then((currentPackageInfo) => {
      if (targetLabel) {
        return models.Packages.findAll({where: {deployment_version_id: deploymentVersionId, label: targetLabel}, limit: 1})
        .then((rollbackPackageInfos) => {
          return [currentPackageInfo, rollbackPackageInfos]
        });
      } else {
        return self.getCanRollbackPackages(deploymentVersionId)
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
      throw new AppError.AppError("没有可供回滚的版本");
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
      return self.createPackage(deploymentsVersions.deployment_id,
        deploymentsVersions.app_version,
        rollbackPackage.package_hash,
        rollbackPackage.manifest_blob_url,
        rollbackPackage.blob_url,
        params
      );
    });
  });
}

proto.getCanRollbackPackages = function (deploymentVersionId) {
  var Sequelize = require('sequelize');
  return models.Packages.findAll({
    where: {
      deployment_version_id: deploymentVersionId,
      release_method: {[Sequelize.Op.in]: [constConfig.RELEAS_EMETHOD_UPLOAD, constConfig.RELEAS_EMETHOD_PROMOTE] }
    }, order: [['id','desc']], limit: 2
  });
}
