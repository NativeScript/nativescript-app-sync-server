"use strict";

module.exports = function(sequelize, DataTypes) {
  var Users = sequelize.define("Users", {
    id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    username: DataTypes.STRING,
    password: DataTypes.STRING,
    email: DataTypes.STRING,
    identical: DataTypes.STRING,
    ack_code: DataTypes.STRING,
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'users',
    underscored: true
  });

  return Users;
};
