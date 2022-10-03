import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'log_report_download'
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
      created_at: {
        type: DataTypes.DATE,
        defaultValue: sequelize.fn('NOW')
      }
    })
  },

  down: (queryInterface: QueryInterface) => queryInterface.dropTable(tableName)
};