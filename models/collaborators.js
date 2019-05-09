"use strict";

module.exports = function(sequelize, DataTypes) {
  var Collaborators = sequelize.define("Collaborators", {
    id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    appid: DataTypes.INTEGER(10),
    uid: DataTypes.BIGINT(20),
    roles : DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'collaborators',
    underscored: true,
    paranoid: true
  });
  Collaborators.findByAppNameAndUid = function (uid, appName) {
    var sql = "SELECT b.* FROM `apps` as a left join `collaborators` as b  on (a.id = b.appid) where a.name= :appName and b.uid = :uid and a.`deleted_at` IS NULL and b.`deleted_at` IS NULL limit 0,1";
    return sequelize.query(sql, { replacements: { appName: appName, uid: uid }, model: Collaborators})
    .then(function(data) {
      return data.pop();
    });
  };
  return Collaborators;
};
