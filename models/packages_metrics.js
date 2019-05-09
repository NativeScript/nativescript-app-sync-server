"use strict";

var _ = require('lodash');

module.exports = function(sequelize, DataTypes) {
  var PackagesMetrics = sequelize.define("PackagesMetrics", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    package_id: DataTypes.INTEGER(10),
    active: DataTypes.INTEGER(10),
    downloaded: DataTypes.INTEGER(10),
    failed: DataTypes.INTEGER(10),
    installed: DataTypes.INTEGER(10),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'packages_metrics',
    underscored: true,
    paranoid: true
  });
  return PackagesMetrics;
};
