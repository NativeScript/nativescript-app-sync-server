"use strict";

module.exports = function(sequelize, DataTypes) {
  var LogReportDeploy = sequelize.define("LogReportDeploy", {
    id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    status: DataTypes.INTEGER(3),
    package_id : DataTypes.INTEGER(10),
    client_unique_id : DataTypes.STRING,
    previous_label : DataTypes.STRING,
    previous_deployment_key : DataTypes.STRING,
    created_at: DataTypes.DATE,
  }, {
    tableName: 'log_report_deploy',
    underscored: true,
    updatedAt: false,
    paranoid: true
  });
  return LogReportDeploy;
};
