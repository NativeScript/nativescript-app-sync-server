'use strict';
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import * as fs from 'fs'
import qeTagFunc from '../utils/qetag'
import _, { toPairs } from 'lodash'
import { mapObjIndexed, mergeAll } from 'ramda'
import log4js from 'log4js'
import randtoken from 'rand-token'
import recursive from "recursive-readdir"
import path from 'path'
import constName from '../constants'
import { AppError } from '../app-error'
import { slash } from './common';
import { Stream } from 'stream';
const log = log4js.getLogger("cps:utils:security")

randtoken.generator({
  chars: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  source: crypto.randomBytes
})

export const md5 = function (str: string) {
  const md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
}

export const passwordHashSync = function (password: string) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(12));
}

export const passwordVerifySync = function (password: string, hash: string) {
  return bcrypt.compareSync(password, hash)
}

export const randToken = function (num: number) {
  return randtoken.generate(num);
}

export const parseToken = function (token: string) {
  return { identical: token.substring(-9, 9), token: token.substring(0, 28) }
}

export const fileSha256 = function (file: fs.PathLike) {
  return new Promise<string>((resolve, reject) => {
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

export const stringSha256Sync = function (contents: crypto.BinaryLike) {
  var sha256 = crypto.createHash('sha256');
  sha256.update(contents);
  return sha256.digest('hex');
}

export const packageHashSync = function (jsonData: { [key: string]: unknown }) {
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
export const qetag = function (buffer: string | Stream | Buffer): Promise<string> {
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

  return qeTagFunc(buffer)
}

/**
 * @function sha256AllFiles
 * @param filePaths 
 * @returns {} - { [filepath]: hash } 
 */
export const sha256AllFiles = async (filePaths: string[]) => {
  const hashedFiles = await Promise.all(filePaths.map(async filePath => ({ [filePath]: await fileSha256(filePath) })))
  return mergeAll(hashedFiles)
}

export const uploadPackageType = async function (directoryPath: string) {
  try {
    const files = await recursive(directoryPath)
    if (files.length == 0) {
      log.debug(`uploadPackageType empty files`);
      throw new AppError("empty files")
    }
    const AREGEX = /android\.bundle/
    const AREGEX_IOS = /main\.jsbundle/

    const androidMatch = files.find(value => AREGEX.test(value))
    const iOSMatch = files.find(value => AREGEX_IOS.test(value))
    const packageType = androidMatch ? constName.ANDROID : iOSMatch ? constName.IOS : 0

    log.debug(`uploadPackageType packageType: ${packageType}`);

    return packageType
  }
  catch (e: any) {
    log.error(new AppError(e.error));
    throw new AppError(e.message)
  }
}

// some files are ignored in calc hash in client sdk
// https://github.com/Microsoft/react-native-code-push/pull/974/files#diff-21b650f88429c071b217d46243875987R15
export const isHashIgnored = function (relativePath: string) {
  if (!relativePath) {
    return true;
  }

  const IgnoreMacOSX = '__MACOSX/';
  const IgnoreDSStore = '.DS_Store';

  return relativePath.startsWith(IgnoreMacOSX)
    || relativePath === IgnoreDSStore
    || relativePath.endsWith(IgnoreDSStore);
}

export const isPackageHashIgnored = function (relativePath: string) {
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


export const calcAllFileSha256 = async function (directoryPath: string) {
  try {
    const results = await recursive(directoryPath)
    const files = results.filter((file) => {
      var relative = path.relative(directoryPath, file);
      return !isHashIgnored(relative);
    })

    if (files.length == 0) {
      log.debug(`calcAllFileSha256 empty files in directoryPath:`, directoryPath);
      throw new AppError("empty files")
    }

    const hashedFiles = await sha256AllFiles(files)

    /// creates a map of relative path and actual path of files { [relativePath]: filePath }
    const data = mergeAll(toPairs(hashedFiles).map(([filePath, hash]) => {
      const relativePath = slash((path.relative(directoryPath, hash)))
      return { [relativePath]: filePath }
    }))

    log.debug(`calcAllFileSha256 files:`, data);

    return data

  } catch (error) {
    log.error(error);
    if (error instanceof Error || error instanceof AppError)
      throw new AppError(error.message)
  }
  return
}

export const sortJsonToArr = function (json: { [key: string]: unknown }) {
  var rs: any = [];
  _.forIn(json, (value, key) => {
    rs.push({ path: key, hash: value })
  });
  return _.sortBy(rs, (o) => o.path);
}
