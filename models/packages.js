"use strict";

module.exports = function(sequelize, DataTypes) {
  var Packages = sequelize.define("Packages", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    deployment_version_id: DataTypes.INTEGER(10),
    deployment_id: DataTypes.INTEGER(10),
    description: DataTypes.STRING,
    package_hash: DataTypes.STRING,
    blob_url: DataTypes.STRING,
    size: DataTypes.INTEGER(10),
    manifest_blob_url: DataTypes.STRING,
    release_method: DataTypes.STRING,
    label: DataTypes.STRING,
    original_label: DataTypes.STRING,
    original_deployment: DataTypes.STRING,
    released_by: DataTypes.STRING,
    is_mandatory: DataTypes.INTEGER(3),
    is_disabled: DataTypes.INTEGER(3),
    rollout: DataTypes.INTEGER(3),
    created_at: DataTypes.DATE,
    updated_at: DataTypes.DATE,
  }, {
    tableName: 'packages',
    underscored: true,
    paranoid: true
  });

  return Packages;
};
