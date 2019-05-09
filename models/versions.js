"use strict";

module.exports = function(sequelize, DataTypes) {
  var Versions = sequelize.define("Versions", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    type: DataTypes.INTEGER,
    version: DataTypes.STRING
  }, {
    tableName: 'versions',
    updatedAt: false,
    createdAt: false
  });

  return Versions;
};
