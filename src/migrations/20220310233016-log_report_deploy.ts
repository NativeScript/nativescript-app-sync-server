import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'log_report_deploy'
module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => {
    return queryInterface.createTable(tableName, {
      id: {
        type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
        allowNull: false,
        unique: true,
        primaryKey: true,
        autoIncrement: true
      },
      status: {
        type: DataTypes.TINYINT({ length: 3 }),
        allowNull: false,
        defaultValue: 0
      },
      package_id: {
        type: DataTypes.INTEGER({ length: 10 }),
        allowNull: false,
        defaultValue: 0
      },
      client_unique_id: {
        type: DataTypes.STRING({ length: 100 }),
        allowNull: false,
        defaultValue: ''
      },
      previous_label: {
        type: DataTypes.STRING({ length: 20 }),
        allowNull: false,
        unique: true,
        defaultValue: ''
      },
      previous_deployment_key: {
        type: DataTypes.STRING({ length: 64 }),
        allowNull: false,
        defaultValue: ''
      },
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.fn('NOW')
      }
    })
  },

  down: (queryInterface: QueryInterface) => queryInterface.dropTable(tableName)
};