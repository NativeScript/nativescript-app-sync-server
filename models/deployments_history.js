"use strict";
module.exports = function(sequelize, DataTypes) {
  var DeploymentsHistory = sequelize.define("DeploymentsHistory", {
    id: {
      type: DataTypes.INTEGER(10),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    deployment_id: DataTypes.INTEGER(10),
    package_id: DataTypes.INTEGER(10),
    created_at: DataTypes.DATE
  }, {
    tableName: 'deployments_history',
    underscored: true,
    updatedAt: false,
    paranoid: true
  });

  return DeploymentsHistory;
};
