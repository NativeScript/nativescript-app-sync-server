import * as models from '../../models'
import _ from 'lodash'
import security from '../../core/utils/security'
import { AppError } from '../app-error'
import constName from '../constants'
import Sequelize from 'sequelize'
import { Promise } from 'bluebird'

export const findAppByName = function (uid, appName) {
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

export const deleteApp = function (appId) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Apps.destroy({ where: { id: appId }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId }, transaction: t }),
      models.Deployments.destroy({ where: { appid: appId }, transaction: t })
    ]);
  });
};

export const modifyApp = async (appId, params) => {
  const [affectedCount, affectedRows] = await models.Apps.update(params, { where: { id: appId } })
  if (!_.gt(affectedCount, 0)) {
    throw new AppError('modify errors');
  }
  return affectedCount;
};

export const transferApp = function (appId, fromUid, toUid) {
  return models.sequelize.transaction((t) => {
    return Promise.all([
      models.Apps.update({ uid: toUid }, { where: { id: appId }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId, uid: fromUid }, transaction: t }),
      models.Collaborators.destroy({ where: { appid: appId, uid: toUid }, transaction: t }),
      models.Collaborators.create({ appid: appId, uid: toUid, roles: "Owner" }, { transaction: t })
    ]);
  });
};

export const listApps = function (uid) {
  return models.Collaborators.findAll({ where: { uid: uid } })
    .then((data) => {
      if (_.isEmpty(data)) {
        return [];
      } else {
        var appIds = _.map(data, (v) => { return v.appid });
        return models.Apps.findAll({ where: { id: { [Sequelize.Op.in]: appIds } } });
      }
    })
    .then((appInfos) => {
      var rs = Promise.map(_.values(appInfos), (v) => {
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
    });
};

export const getAppDetailInfo = function (appInfo, currentUid) {
  var appId = appInfo.get('id');
  return Promise.all([
    models.Deployments.findAll({ where: { appid: appId } }),
    models.Collaborators.findAll({ where: { appid: appId } }),
  ])
    .then((res) => {
      const collaboratorInfos = res[1]
      const deploymentInfos = res[0]

      return Promise.props({
        collaborators: Promise.reduce(collaboratorInfos, (allCol, collaborator) => {
          return models.Users.findOne({ where: { id: collaborator.get('uid') } })
            .then((u: any) => {
              var isCurrentAccount = false;
              if (_.eq(u?.get('id'), currentUid)) {
                isCurrentAccount = true;
              }
              allCol[u.get('email')] = { permission: collaborator.get('roles'), isCurrentAccount: isCurrentAccount };
              return allCol;
            });
        }, {}),

        deployments: _.map(deploymentInfos, (item) => {
          return _.get(item, 'name');
        }),
        os: appInfo.get('os'),
        platform: appInfo.get('platform'),
        name: appInfo.get('name'),
        id: appInfo.get('id')
      });
    });
};
