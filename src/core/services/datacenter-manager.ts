
import _ from 'lodash'
import fs from 'fs'
import os from 'os'
import * as security from '../utils/security'
import * as common from '../utils/common'
import { AppError } from '../app-error'
import log4js from 'log4js'
import path from 'path'
const MANIFEST_FILE_NAME = 'manifest.json';
const CONTENTS_NAME = 'contents';

const log = log4js.getLogger("cps:DataCenterManager");

export const getDataDir = function () {
  var dataDir = _.get(require('../config'), 'common.dataDir', {});
  if (_.isEmpty(dataDir)) {
    dataDir = os.tmpdir();
  }
  return dataDir;
}

export const hasPackageStoreSync = function (packageHash) {
  var dataDir = getDataDir();
  var packageHashPath = path.join(dataDir, packageHash);
  var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
  var contentPath = path.join(packageHashPath, CONTENTS_NAME);
  return fs.existsSync(manifestFile) && fs.existsSync(contentPath);
}

export const getPackageInfo = function (packageHash) {
  if (hasPackageStoreSync(packageHash)) {
    var dataDir = getDataDir();
    var packageHashPath = path.join(dataDir, packageHash);
    var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
    var contentPath = path.join(packageHashPath, CONTENTS_NAME);
    return buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
  } else {
    throw new AppError('can\'t get PackageInfo');
  }
}

export const buildPackageInfo = function (packageHash, packageHashPath, contentPath, manifestFile) {
  return {
    packageHash: packageHash,
    path: packageHashPath,
    contentPath: contentPath,
    manifestFilePath: manifestFile
  }
}

export const validateStore = function (providePackageHash) {
  var dataDir = getDataDir();
  var packageHashPath = path.join(dataDir, providePackageHash);
  var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
  var contentPath = path.join(packageHashPath, CONTENTS_NAME);
  if (!hasPackageStoreSync(providePackageHash)) {
    log.debug(`validateStore providePackageHash not exist`);
    return Promise.resolve(false);
  }
  return security.calcAllFileSha256(contentPath)
    .then((manifestJson) => {
      var packageHash = security.packageHashSync(manifestJson);
      log.debug(`validateStore packageHash:`, packageHash);
      try {
        var manifestJsonLocal = JSON.parse(fs.readFileSync(manifestFile, 'utf-8'));
      } catch (e) {
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

export const storePackage = function (sourceDst, force?: boolean) {
  log.debug(`storePackage sourceDst:`, sourceDst);
 
  return security.calcAllFileSha256(sourceDst)
    .then((manifestJson) => {
      var packageHash = security.packageHashSync(manifestJson);
      log.debug('storePackage manifestJson packageHash:', packageHash);
      var dataDir = getDataDir();
      var packageHashPath = path.join(dataDir, packageHash);
      var manifestFile = path.join(packageHashPath, MANIFEST_FILE_NAME);
      var contentPath = path.join(packageHashPath, CONTENTS_NAME);
      return validateStore(packageHash)
        .then((isValidate) => {
          if (!force && isValidate) {
            return buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
          } else {
            log.debug(`storePackage cover from sourceDst:`, sourceDst);
            return common.createEmptyFolder(packageHashPath)
              .then(() => {
                return common.copy(sourceDst, contentPath)
                  .then(() => {
                    var manifestString = JSON.stringify(manifestJson);
                    fs.writeFileSync(manifestFile, manifestString);
                    return buildPackageInfo(packageHash, packageHashPath, contentPath, manifestFile);
                  });
              });
          }
        });
    });
}
