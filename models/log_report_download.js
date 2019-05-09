"use strict";

module.exports = function(sequelize, DataTypes) {
  var LogReportDownload = sequelize.define("LogReportDownload", {
    id: {
      type: DataTypes.BIGINT(20),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    package_id : DataTypes.INTEGER(10),
    client_unique_id : DataTypes.STRING,
    created_at: DataTypes.DATE,
  }, {
    tableName: 'log_report_download',
    underscored: true,
    updatedAt: false,
    paranoid: true
  });
  return LogReportDownload;
};
