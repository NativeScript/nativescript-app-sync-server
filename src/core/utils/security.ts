'use strict';
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import * as fs from 'fs'
import Promise from 'bluebird'
import qeTag from '../utils/qetag'
import _ from 'lodash'
import log4js from 'log4js'
import randtoken from 'rand-token'
import recursive from "recursive-readdir"
import path from 'path'
import constName from '../constants'
import { AppError } from '../app-error'
import { slash } from './common';
const log = log4js.getLogger("cps:utils:security")

randtoken.generator({
  chars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  source: crypto.randomBytes
})

export const md5 = function (str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

export const passwordHashSync = function (password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(12));
}

export const passwordVerifySync = function (password, hash) {
  return bcrypt.compareSync(password, hash)
}

export const randToken = function (num) {
  return randtoken.generate(num);
}

export const parseToken = function (token) {
  return { identical: token.substr(-9, 9), token: token.substr(0, 28) }
}

export const fileSha256 = function (file) {
  return new Promise((resolve, reject) => {
    var rs = fs.createReadStream(file);
    var hash = crypto.createHash('sha256');
    rs.on('data', hash.update.bind(hash));
    rs.on('error', (e) => {
      reject(e);
    });
    rs.on('end', () => {
      resolve(hash.digest('hex'));
    });
  });
}

export const stringSha256Sync = function (contents) {
  var sha256 = crypto.createHash('sha256');
  sha256.update(contents);
  return sha256.digest('hex');
}

export const packageHashSync = function (jsonData) {
  var sortedArr = sortJsonToArr(jsonData);
  var manifestData = _.filter(sortedArr, (v) => {
    return !isPackageHashIgnored(v.path);
  }).map((v) => {
    return v.path + ':' + v.hash;
  });
  log.debug('packageHashSync manifestData:', manifestData);
  var manifestString = JSON.stringify(manifestData.sort());
  manifestString = _.replace(manifestString, /\\\//g, '/');
  log.debug('packageHashSync manifestString:', manifestData);
  return stringSha256Sync(manifestString);
}

// The parameter is buffer or readableStream or file path
export const qetag = function (buffer) {
  if (typeof buffer === 'string') {
    try {
      log.debug(`Check upload file ${buffer} fs.R_OK`);
      fs.accessSync(buffer, fs.constants.R_OK);
      log.debug(`Pass upload file ${buffer}`);
    } catch (e: any) {
      log.error(e);
      return Promise.reject(new AppError(e.message))
    }
  }
  log.debug(`generate file identical`)
  return new Promise((resolve, reject) => {
    qeTag(buffer, (data) => {
      log.debug('identical:', data);
      resolve(data)
    });
  });
}

export const sha256AllFiles = function (files) {
  return new Promise((resolve, reject) => {
    var results = {};
    var length = files.length;
    var count = 0;
    files.forEach((file) => {
      fileSha256(file)
        .then((hash) => {
          results[file] = hash;
          count++;
          if (count == length) {
            resolve(results);
          }
        });
    });
  });
}

export const uploadPackageType = function (directoryPath) {
  return new Promise((resolve, reject) => {

    recursive(directoryPath, (err, files) => {
      if (err) {
        log.error(new AppError(err.message));
        reject(new AppError(err.message));
      } else {
        if (files.length == 0) {
          log.debug(`uploadPackageType empty files`);
          reject(new AppError("empty files"));
        } else {
          const AREGEX = /android\.bundle/
          const AREGEX_IOS = /main\.jsbundle/
          var packageType = 0;
          _.forIn(files, function (value) {
            if (AREGEX.test(value)) {
              packageType = constName.ANDROID;
              return false;
            }
            if (AREGEX_IOS.test(value)) {
              packageType = constName.IOS;
              return false;
            }
            return
          });
          log.debug(`uploadPackageType packageType: ${packageType}`);
          resolve(packageType);
        }
      }
    });
  });
}

// some files are ignored in calc hash in client sdk
// https://github.com/Microsoft/react-native-code-push/pull/974/files#diff-21b650f88429c071b217d46243875987R15
export const isHashIgnored = function (relativePath) {
  if (!relativePath) {
    return true;
  }

  const IgnoreMacOSX = '__MACOSX/';
  const IgnoreDSStore = '.DS_Store';

  return relativePath.startsWith(IgnoreMacOSX)
    || relativePath === IgnoreDSStore
    || relativePath.endsWith(IgnoreDSStore);
}

export const isPackageHashIgnored = function (relativePath) {
  if (!relativePath) {
    return true;
  }

  // .appsyncrelease contains code sign JWT
  // it should be ignored in package hash but need to be included in package manifest
  const IgnoreCodePushMetadata = '.appsyncrelease';
  return relativePath === IgnoreCodePushMetadata
    || relativePath.endsWith(IgnoreCodePushMetadata)
    || isHashIgnored(relativePath);
}


export const calcAllFileSha256 = function (directoryPath) {
  return new Promise((resolve, reject) => {
    recursive(directoryPath, (error, files) => {
      if (error) {
        log.error(error);
        reject(new AppError(error.message));
      } else {
        // filter files that should be ignored
        files = files.filter((file) => {
          var relative = path.relative(directoryPath, file);
          return !isHashIgnored(relative);
        });

        if (files.length == 0) {
          log.debug(`calcAllFileSha256 empty files in directoryPath:`, directoryPath);
          reject(new AppError("empty files"));
        } else {
          sha256AllFiles(files)
            .then((results) => {
              var data = {};
              _.forIn(results, (value, key) => {
                var relativePath = path.relative(directoryPath, key);
                relativePath = slash(relativePath);
                data[relativePath] = value;
              });
              log.debug(`calcAllFileSha256 files:`, data);
              resolve(data);
            });
        }
      }
    });
  });
}

export const sortJsonToArr = function (json) {
  var rs: any = [];
  _.forIn(json, (value, key) => {
    rs.push({ path: key, hash: value })
  });
  return _.sortBy(rs, (o) => o.path);
}
