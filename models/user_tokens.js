"use strict";

module.exports = function(sequelize, DataTypes) {
  var UserTokens = sequelize.define("UserTokens", {
    id:{
      type: DataTypes.BIGINT(20),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    uid: DataTypes.BIGINT(20),
    name: DataTypes.STRING,
    tokens: DataTypes.STRING,
    description: DataTypes.STRING,
    is_session: DataTypes.INTEGER(3),
    created_by: DataTypes.STRING,
    created_at: DataTypes.DATE,
    expires_at : DataTypes.DATE
  }, {
    updatedAt: false,
    tableName: 'user_tokens',
    underscored: true,
    paranoid: true
  });

  return UserTokens;
};
