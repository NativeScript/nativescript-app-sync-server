import Promise from 'bluebird'
import fs from "fs"
import fsextra from "fs-extra"
import extract from 'extract-zip'
import config from '../config'
import _ from 'lodash'
import validator from 'validator'
import { AppError } from '../app-error'
import jschardet from "jschardet"
import log4js from 'log4js'
import path from 'path'
import AWS from 'aws-sdk'
import request from 'request'

const log = log4js.getLogger("cps:utils:common")

export const slash = (path: string) => {
  const isExtendedLengthPath = /^\\\\\?\\/.test(path);
  const hasNonAscii = /[^\u0000-\u0080]+/.test(path); // eslint-disable-line no-control-regex

  if (isExtendedLengthPath || hasNonAscii) {
    return path;
  }

  return path.replace(/\\/g, '/');
}


export const detectIsTextFile = function (filePath) {
  var fd = fs.openSync(filePath, 'r');
  var buffer = new Buffer(4096);
  fs.readSync(fd, buffer, 0, 4096, 0);
  fs.closeSync(fd);
  var rs = jschardet.detect(buffer);
  log.debug('detectIsTextFile:', filePath, rs);
  if (rs.confidence == 1) {
    return true;
  }
  return false;
}

export const parseVersion = function (versionNo) {
  var version = '0';
  var data = null;
  if (data = versionNo.match(/^([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    // "1.2.3"
    version = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
  } else if (data = versionNo.match(/^([0-9]{1,3}).([0-9]{1,5})$/)) {
    // "1.2"
    version = data[1] + _.padStart(data[2], 5, '0') + _.padStart('0', 10, '0');
  }
  return version;
};

export const validatorVersion = function (versionNo) {
  var flag = false;
  var min = '0';
  var max = '9999999999999999999';
  var data = null;
  if (versionNo == "*") {
    // "*"
    flag = true;
  } else if (data = versionNo.match(/^([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    // "1.2.3"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
    max = data[1] + _.padStart(data[2], 5, '0') + _.padStart((String(data[3]) + 1), 10, '0');
  } else if (data = versionNo.match(/^([0-9]{1,3}).([0-9]{1,5})(\.\*){0,1}$/)) {
    // "1.2" "1.2.*"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart('0', 10, '0');
    max = data[1] + _.padStart((String(data[2]) + 1), 5, '0') + _.padStart('0', 10, '0');
  } else if (data = versionNo.match(/^\~([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    //"~1.2.3"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
    max = data[1] + _.padStart((String(data[2]) + 1), 5, '0') + _.padStart('0', 10, '0');
  } else if (data = versionNo.match(/^\^([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    //"^1.2.3"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
    max = _.toString((parseInt(data[1]) + 1)) + _.padStart('0', 5, '0') + _.padStart('0', 10, '0');
  } else if (data = versionNo.match(/^([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})\s?-\s?([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    // "1.2.3 - 1.2.7"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
    max = data[4] + _.padStart(data[5], 5, '0') + _.padStart((String(data[6]) + 1), 10, '0');
  } else if (data = versionNo.match(/^>=([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})\s?<([0-9]{1,3}).([0-9]{1,5}).([0-9]{1,10})$/)) {
    // ">=1.2.3 <1.2.7"
    flag = true;
    min = data[1] + _.padStart(data[2], 5, '0') + _.padStart(data[3], 10, '0');
    max = data[4] + _.padStart(data[5], 5, '0') + _.padStart(data[6], 10, '0');
  }
  return [flag, min, max];
};

export const createFileFromRequest = function (url, filePath) {
  return new Promise((resolve, reject) => {
    fs.exists(filePath, function (exists) {
      if (!exists) {
        log.debug(`createFileFromRequest url:${url}`)
        request(url).on('error', function (error) {
          reject(error);
        })
          .on('response', function (response) {
            if (response.statusCode == 200) {
              let stream = fs.createWriteStream(filePath);
              response.pipe(stream);
              stream.on('close', function () {
                resolve(null);
              });
              stream.on('error', function (error) {
                reject(error)
              })
            } else {
              reject({ message: 'request fail' })
            }
          });
      } else {
        resolve(null);
      }
    });
  });
};

export const copySync = function (sourceDst, targertDst) {
  return fsextra.copySync(sourceDst, targertDst, { overwrite: true });
};

export const copy = function (sourceDst, targertDst) {
  return new Promise((resolve, reject) => {
    fsextra.copy(sourceDst, targertDst, { overwrite: true }, function (err) {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        log.debug(`copy success sourceDst:${sourceDst} targertDst:${targertDst}`);
        resolve();
      }
    });
  });
};

export const move = function (sourceDst, targertDst) {
  return new Promise((resolve, reject) => {
    fsextra.move(sourceDst, targertDst, { overwrite: true }, function (err) {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        log.debug(`move success sourceDst:${sourceDst} targertDst:${targertDst}`);
        resolve();
      }
    });
  });
};

export const deleteFolder = function (folderPath) {
  return new Promise((resolve, reject) => {
    fsextra.remove(folderPath, function (err) {
      if (err) {
        log.error(err);
        reject(err);
      } else {
        log.debug(`deleteFolder delete ${folderPath} success.`);
        resolve(null);
      }
    });
  });
};

export const deleteFolderSync = function (folderPath) {
  return fsextra.removeSync(folderPath);
};

export const createEmptyFolder = function (folderPath) {
  return new Promise((resolve, reject) => {
    log.debug(`createEmptyFolder Create dir ${folderPath}`);
    return deleteFolder(folderPath)
      .then((data) => {
        fsextra.mkdirs(folderPath, (err) => {
          if (err) {
            log.error(err);
            reject(new AppError(err.message));
          } else {
            resolve(folderPath);
          }
        });
      });
  });
};

export const createEmptyFolderSync = function (folderPath) {
  deleteFolderSync(folderPath);
  return fsextra.mkdirsSync(folderPath);
};

export const unzipFile = function (zipFile, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      log.debug(`unzipFile check zipFile ${zipFile} fs.constants.R_OK`);
      fs.accessSync(zipFile, fs.constants.R_OK);
      log.debug(`Pass unzipFile file ${zipFile}`);
    } catch (e: any) {
      log.error(e);
      return reject(new AppError(e.message))
    }
    extract(zipFile, { dir: outputPath }).then(function (res) {
      log.debug(`unzipFile success`);
      resolve(outputPath);
    }).catch((err) => {
      if (err)
        log.error(err);
      reject(new AppError(`it's not a zipFile`))
    })
  });
};

export const uploadFileToStorage = function (key, filePath) {
  var storageType = _.get(config, 'export const storageType');
  console.log(">>>> storageType: " + storageType);
  console.log(">>>> storageType, key: " + key);
  console.log(">>>> storageType, filePath: " + filePath);
  if (storageType === 'local') {
    return uploadFileToLocal(key, filePath);
  } else if (storageType === 's3') {
    return uploadFileToS3(key, filePath);
  }
  throw new AppError(`${storageType} storageType does not support.`);
};

export const uploadFileToLocal = function (key, filePath) {
  return new Promise((resolve, reject) => {
    var storageDir = _.get(config, 'local.storageDir');
    if (!storageDir) {
      throw new AppError('please set config local storageDir');
    }
    if (key.length < 3) {
      log.error(`generate key is too short, key value:${key}`);
      throw new AppError('generate key is too short.');
    }
    try {
      log.debug(`uploadFileToLocal check directory ${storageDir} fs.constants.R_OK`);
      fs.accessSync(storageDir, fs.constants.W_OK);
      log.debug(`uploadFileToLocal directory ${storageDir} fs.constants.R_OK is ok`);
    } catch (e: any) {
      log.error(e);
      throw new AppError(e.message);
    }
    var subDir = key.substr(0, 2).toLowerCase();
    var finalDir = path.join(storageDir, subDir);
    var fileName = path.join(finalDir, key);
    if (fs.existsSync(fileName)) {
      return resolve(key);
    }
    var stats = fs.statSync(storageDir);
    if (!stats.isDirectory()) {
      var e = new AppError(`${storageDir} must be directory`);
      log.error(e);
      throw e;
    }
    if (!fs.existsSync(`${finalDir}`)) {
      fs.mkdirSync(`${finalDir}`);
      log.debug(`uploadFileToLocal mkdir:${finalDir}`);
    }
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
    } catch (e: any) {
      log.error(e);
      throw new AppError(e.message);
    }
    stats = fs.statSync(filePath);
    if (!stats.isFile()) {
      var e = new AppError(`${filePath} must be file`);
      log.error(e);
      throw e;
    }
    fsextra.copy(filePath, fileName, (err) => {
      if (err) {
        log.error(new AppError(err.message));
        return reject(new AppError(err.message));
      }
      log.debug(`uploadFileToLocal copy file ${key} success.`);
      resolve(key);
    });
  });
};

export const getBlobDownloadUrl = function (blobUrl) {
  var fileName = blobUrl;
  var storageType = _.get(config, 'export const storageType');
  var downloadUrl = _.get(config, `${storageType}.downloadUrl`);
  if (storageType === 'local') {
    fileName = blobUrl.substr(0, 2).toLowerCase() + '/' + blobUrl;
  }
  if (!validator.isURL(downloadUrl)) {
    var e = new AppError(`Please config ${storageType}.downloadUrl in config.js`);
    log.error(e);
    throw e;
  }
  return `${downloadUrl}/${fileName}`
};

export const uploadFileToS3 = function (key, filePath) {
  console.log(">>>>>> uploadFileToS3 accessKeyId " + _.get(config, 's3.accessKeyId'));
  console.log(">>>>>> uploadFileToS3 secretAccessKey " + _.get(config, 's3.secretAccessKey'));
  console.log(">>>>>> uploadFileToS3 sessionToken " + _.get(config, 's3.sessionToken'));
  console.log(">>>>>> uploadFileToS3 region " + _.get(config, 's3.region'));
  console.log(">>>>>> uploadFileToS3 bucketName " + _.get(config, 's3.bucketName'));
  return (
    new Promise((resolve, reject) => {
      AWS.config.update({
        accessKeyId: _.get(config, 's3.accessKeyId'),
        secretAccessKey: _.get(config, 's3.secretAccessKey'),
        sessionToken: _.get(config, 's3.sessionToken'),
        region: _.get(config, 's3.region')
      });
      const s3 = new AWS.S3()

      fs.readFile(filePath, (err, data) => {
        s3.upload({
          Bucket: _.get(config, 's3.bucketName'),
          Key: key,
          Body: data,
          ACL: 'public-read',
        }, (err, response) => {
          console.log(">>>>>> uploadFileToS3 response " + response);
          if (err) {
            console.log(">>>>>> uploadFileToS3 err " + JSON.stringify(err));
            reject(new AppError(JSON.stringify(err)));
          } else {
            resolve(response.ETag)
          }
        })
      });
    })
  );
};

export const diffCollectionsSync = function (collection1, collection2) {
  var diffFiles: any = [];
  var collection1Only: any = [];
  var newCollection2 = Object.assign({}, collection2);
  if (collection1 instanceof Object) {
    for (var key of Object.keys(collection1)) {
      if (_.isEmpty(newCollection2[key])) {
        collection1Only.push(key);
      } else {
        if (!_.eq(collection1[key], newCollection2[key])) {
          diffFiles.push(key);
        }
        delete newCollection2[key];
      }
    }
  }
  return { diff: diffFiles, collection1Only: collection1Only, collection2Only: Object.keys(newCollection2) }
};
