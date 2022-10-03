import * as models from '../../models'
import _ from 'lodash'
import { AppError } from '../app-error'
import Sequelize from '@sequelize/core'
import { ICollaboratorInstance } from '~/models/collaborators';

export const listCollaborators = async function (appId: number) {
  const data = await models.Collaborators.findAll({ where: { appid: appId } })

  const coInfo = data.reduce((result, value) => {
    const uids = result.uids.concat(value.uid)
    return { ...result, uids, [value.uid]: value }
  }, { uids: [] } as { uids: number[], [key: number]: ICollaboratorInstance })

  const data2 = await models.Users.findAll({ where: { id: { [Sequelize.Op.in]: coInfo.uids } } })

  return data2.reduce((result, value) => {
    const permission = !_.isEmpty(coInfo[value.id]) ? coInfo[value.id].roles : "";
    return {
      ...result,
      [value.email]: { permission }
    }
  }, {} as { [key: string]: { permission: string } })
}

export const addCollaborator = async (appId: number, uid: number) => {
  const res = await models.Collaborators.findOne({ where: { appid: appId, uid: uid } })
  if (!res)
    return models.Collaborators.create({
      appid: appId,
      uid: uid,
      roles: "Collaborator"
    })

  throw new AppError('user already is Collaborator.')
}

export const deleteCollaborator = async function (appId: number, uid: number) {
  const res = await models.Collaborators.findOne({ where: { appid: appId, uid: uid } })
  if (!res)
    throw new AppError('user is not a Collaborator')

  return models.Collaborators.destroy({ where: { id: res.id } })
}
