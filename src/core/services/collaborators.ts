import * as models from '../../models'
import _ from 'lodash'
import { AppError } from '../app-error'
import Sequelize from 'sequelize'

export const listCollaborators = function (appId) {
  return models.Collaborators.findAll({ where: { appid: appId } })
    .then((data) => {
      return _.reduce(data, function (result: any, value, key) {
        (result['uids'] || (result['uids'] = [])).push(value.uid)
        result[value.uid] = value
        return result;
      }, []);
    })
    .then((coInfo) => {
      return models.Users.findAll({ where: { id: { [Sequelize.Op.in]: coInfo.uids } } })
        .then((data2) => {
          return _.reduce(data2, function (result, value, key) {
            var permission = "";
            if (!_.isEmpty(coInfo[value.id])) {
              permission = coInfo[value.id].roles;
            }
            result[value.email] = { permission: permission };
            return result;
          }, {});
        });
    });
}

export const addCollaborator = async (appId, uid) => {
  const res = await models.Collaborators.findOne({ where: { appid: appId, uid: uid } })
  if (!res)
    return models.Collaborators.create({
      appid: appId,
      uid: uid,
      roles: "Collaborator"
    })
    
  throw new AppError('user already is Collaborator.')
}

export const deleteCollaborator = async function (appId, uid) {
  const res = await models.Collaborators.findOne({ where: { appid: appId, uid: uid } })
  if (!res)
    throw new AppError('user is not a Collaborator')

  return models.Collaborators.destroy({ where: { id: res.id } })
}
