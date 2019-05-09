'use strict';
var Promise = require('bluebird');
var models = require('../../models');
var _ = require('lodash');
var fs = require('fs');
var os = require('os');
var security = require('../utils/security');
var common = require('../utils/common');
const MANIFEST_FILE_NAME = 'manifest.json';
const CONTENTS_NAME = 'contents';
var AppError = require('../app-error');
var log4js = require('log4js');
var log = log4js.getLogger("cps:DataCenterManager");
var path = require('path');

var proto = module.exports = function (){
  function DataCenterManager() {

  }
  DataCenterManager.__proto__ = proto;
  return DataCenterManager;
};

proto.getDataDir = function () {
  var dataDir = _.get(require('../config'), 'common.dataDir', {});
  if (_.isEmpty(dataDir)) {
    dataDir = os.tmpdir();
  }
  return dataDir;
}

proto.hasPackageStoreSync = function (packageHash) {
  var dataDir = this.getDataDir();
  var packageHashPath = path.join(dataDir, packageHash);
  var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
  var contentPath = path.join(packageHashPath, CONTENTS_NAME);
  return fs.existsSync(manifestFile) && fs.existsSync(contentPath);
}

proto.getPackageInfo = function (packageHash) {
  if (this.hasPackageStoreSync(packageHash)){
    var dataDir = this.getDataDir();
    var packageHashPath = path.join(dataDir, packageHash);
    var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
    var contentPath = path.join(packageHashPath, CONTENTS_NAME);
    return this.buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
  } else {
    throw new AppError.AppError('can\'t get PackageInfo');
  }
}

proto.buildPackageInfo = function (packageHash, packageHashPath, contentPath, manifestFile) {
  return {
    packageHash: packageHash,
    path: packageHashPath,
    contentPath: contentPath,
    manifestFilePath:manifestFile
  }
}

proto.validateStore = function (providePackageHash) {
  var dataDir = this.getDataDir();
  var packageHashPath = path.join(dataDir, providePackageHash);
  var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
  var contentPath = path.join(packageHashPath, CONTENTS_NAME);
  if (!this.hasPackageStoreSync(providePackageHash)) {
    log.debug(`validateStore providePackageHash not exist`);
    return Promise.resolve(false);
  }
  return security.calcAllFileSha256(contentPath)
  .then((manifestJson) => {
    var packageHash = security.packageHashSync(manifestJson);
    log.debug(`validateStore packageHash:`, packageHash);
    try {
      var manifestJsonLocal = JSON.parse(fs.readFileSync(manifestFile));
    }catch(e) {
      log.debug(`validateStore manifestFile contents invilad`);
      return false;
    }
    var packageHashLocal = security.packageHashSync(manifestJsonLocal);
    log.debug(`validateStore packageHashLocal:`, packageHashLocal);
    if (_.eq(providePackageHash, packageHash) && _.eq(providePackageHash, packageHashLocal)) {
      log.debug(`validateStore store files is ok`);
      return true;
    }
    log.debug(`validateStore store files broken`);
    return false;
  });
}

proto.storePackage = function (sourceDst, force) {
  log.debug(`storePackage sourceDst:`, sourceDst);
  if (_.isEmpty(force)){
    force = false;
  }
  var self = this;
  return security.calcAllFileSha256(sourceDst)
  .then((manifestJson) => {
    var packageHash = security.packageHashSync(manifestJson);
    log.debug('storePackage manifestJson packageHash:', packageHash);
    var dataDir = self.getDataDir();
    var packageHashPath = path.join(dataDir, packageHash);
    var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
    var contentPath = path.join(packageHashPath, CONTENTS_NAME);
    return self.validateStore(packageHash)
    .then((isValidate) => {
      if (!force && isValidate) {
        return self.buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
      } else {
        log.debug(`storePackage cover from sourceDst:`, sourceDst);
        return common.createEmptyFolder(packageHashPath)
        .then(() => {
          return common.copy(sourceDst, contentPath)
          .then(() => {
            var manifestString = JSON.stringify(manifestJson);
            fs.writeFileSync(manifestFile, manifestString);
            return self.buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
          });
        });
      }
    });
  });
}
