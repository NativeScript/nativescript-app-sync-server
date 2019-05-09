"use strict";

module.exports = function(sequelize, DataTypes) {
  var DeploymentsVersions = sequelize.define("DeploymentsVersions", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    deployment_id: DataTypes.INTEGER(10),
    app_version: DataTypes.STRING,
    current_package_id: DataTypes.INTEGER(10),
    min_version: DataTypes.BIGINT(20),
    max_version: DataTypes.BIGINT(20),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'deployments_versions',
    underscored: true,
    paranoid: true
  });

  return DeploymentsVersions;
};
