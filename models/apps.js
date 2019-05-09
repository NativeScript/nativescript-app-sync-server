"use strict";

module.exports = function(sequelize, DataTypes) {
  var Apps = sequelize.define("Apps", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
    },
    name: DataTypes.STRING,
    uid: DataTypes.BIGINT(20),
    os: DataTypes.INTEGER(3),
    platform: DataTypes.INTEGER(3),
    is_use_diff_text: DataTypes.INTEGER(3),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'apps',
    underscored: true,
    paranoid: true,
  });
  return Apps;
};
