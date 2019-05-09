'use strict';
var models = require('../../models');
var _ = require('lodash');
var AppError = require('../app-error');

var proto = module.exports = function (){
  function Collaborators() {

  }
  Collaborators.__proto__ = proto;
  return Collaborators;
};

proto.listCollaborators = function (appId) {
  return models.Collaborators.findAll({where: {appid: appId}})
  .then((data) => {
    return _.reduce(data, function(result, value, key) {
      (result['uids'] || (result['uids'] = [])).push(value.uid);
      result[value.uid] = value;
      return result;
    }, []);
  })
  .then((coInfo) => {
    var Sequelize = require('sequelize');
    return models.Users.findAll({where: {id: {[Sequelize.Op.in]: coInfo.uids}}})
    .then((data2) => {
      return _.reduce(data2, function (result, value, key) {
        var permission = "";
        if (!_.isEmpty(coInfo[value.id])) {
          permission = coInfo[value.id].roles;
        }
        result[value.email] = {permission: permission};
        return result;
      }, {});
    });
  });
};

proto.addCollaborator = function (appId, uid) {
  return models.Collaborators.findOne({where: {appid: appId, uid: uid}})
  .then((data) => {
    if (_.isEmpty(data)){
      return models.Collaborators.create({
        appid: appId,
        uid: uid,
        roles: "Collaborator"
      });
    }else {
      throw new AppError.AppError('user already is Collaborator.');
    }
  });
};

proto.deleteCollaborator = function (appId, uid) {
  return models.Collaborators.findOne({where: {appid: appId, uid: uid}})
  .then((data) => {
    if (_.isEmpty(data)){
      throw new AppError.AppError('user is not a Collaborator');
    }else {
      return models.Collaborators.destroy({where: {id: data.id}});
    }
  });
};
