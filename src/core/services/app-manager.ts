import * as models from '../../models'
import _ from 'lodash'
import bluebird from 'bluebird'
import * as security from '../../core/utils/security'
import { AppError } from '../app-error'
import constName from '../constants'
import Sequelize from 'sequelize'
import { AppAttributes, AppInstance } from '~/models/apps'
import { UpdateModelAttrs } from '~/types'

export const findAppByName = function (uid: number, appName: string) {
  return models.Apps.findOne({ where: { name: appName, uid: uid } });
};

export const addApp = function (uid: number, appName: string, os: number, platform: number, identical: string) {
  return models.sequelize.transaction((t) => {
    return models.Apps.create({
      name: appName,
      uid: uid,
      os: os,
      platform: platform
    }, {
      transaction: t
    })
      .then((apps) => {

        let appId = apps.id;
        let deployments: any = [];
        let deploymentKey = security.randToken(28) + identical;
        deployments.push({
          appid: appId,
          name: constName.PRODUCTION,
          last_deployment_version_id: 0,
          label_id: 0,
          deployment_key: deploymentKey
        });
        deploymentKey = security.randToken(28) + identical;
        deployments.push({
          appid: appId,
          name: constName.STAGING,
          last_deployment_version_id: 0,
          label_id: 0,
          deployment_key: deploymentKey
        });
        return Promise.all([
          models.Collaborators.create({ appid: appId, uid: uid, roles: "Owner" }, { transaction: t }),
          models.Deployments.bulkCreate(deployments, { transaction: t })
        ]);
      });
  });
};

export const deleteApp = function (appId: number) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Apps.destroy({ where: { id: appId }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId }, transaction: t }),
      models.Deployments.destroy({ where: { appid: appId }, transaction: t })
    ]);
  });
};

export const modifyApp = async (appId: number, params: UpdateModelAttrs<AppAttributes>) => {

  const [affectedCount, affectedRows] = await models.Apps.update(params, { where: { id: appId } })
  if (!_.gt(affectedCount, 0)) {
    throw new AppError('modify errors');
  }
  return affectedCount;
};

export const transferApp = function (appId: number, fromUid: number, toUid: number) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Apps.update({ uid: toUid }, { where: { id: appId }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId, uid: fromUid }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId, uid: toUid }, transaction: t }),
      models.Collaborators.create({ appid: appId, uid: toUid, roles: "Owner" }, { transaction: t })
    ]);
  });
};

export const listApps = async function (uid: number) {
  const col = await models.Collaborators.findAll({ where: { uid } })
  const appIds = _.map(col, (v) => v.appid);

  const appInfos = !_.isEmpty(col) ? await models.Apps.findAll({ where: { id: { [Sequelize.Op.in]: appIds } } }) : []

  var rs = bluebird.map(_.values(appInfos), (v) => {
    return getAppDetailInfo(v, uid)
      .then((info) => {
        if (info.os == constName.IOS) {
          info.os = constName.IOS_NAME;
        } else if (info.os == constName.ANDROID) {
          info.os = constName.ANDROID_NAME;
        } else if (info.os == constName.WINDOWS) {
          info.os = constName.WINDOWS_NAME;
        }
        if (info.platform == constName.REACT_NATIVE) {
          info.platform = constName.REACT_NATIVE_NAME;
        } else if (info.platform == constName.CORDOVA) {
          info.platform = constName.CORDOVA_NAME;
        } else if (info.platform == constName.NATIVESCRIPT) {
          info.platform = constName.NATIVESCRIPT_NAME;
        }
        return info;
      });
  });
  return rs;
};

export const getAppDetailInfo = async function (appInfo: AppInstance, currentUid: number) {
  const appId = appInfo.get('id')
  const [deploymentInfos, collaboratorInfos] = await Promise.all([
    models.Deployments.findAll({ where: { appid: appId } }),
    models.Collaborators.findAll({ where: { appid: appId } }),
  ])

  return bluebird.props({
    collaborators: bluebird.reduce(collaboratorInfos, async (allCol, collaborator) => {
      const user = await models.Users.findOne({ where: { id: collaborator.get('uid') } })

      const isCurrentAccount = _.eq(user?.get('id'), currentUid);
      const permissions = { permission: collaborator.get('roles'), isCurrentAccount }

      allCol[String(user?.get('email'))] = permissions

      return allCol;
    }, {} as {
      [key: string]: {
        permission: string;
        isCurrentAccount: boolean;
      }
    }),

    deployments: _.map(deploymentInfos, (item) => {
      return _.get(item, 'name');
    }),
    os: appInfo.get('os'),
    platform: appInfo.get('platform'),
    name: appInfo.get('name'),
    id: appInfo.get('id')
  });
};
