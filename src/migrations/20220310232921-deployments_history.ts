import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'deployments_history'
module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => {
    return queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable(tableName, {
          id: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
            allowNull: false,
            unique: true,
            primaryKey: true,
            autoIncrement: true
          },
          deployment_id: {
            type: DataTypes.INTEGER({ length: 11 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          package_id: {
            type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.fn('NOW')
          },
          deleted_at: {
            type: DataTypes.DATE,
            defaultValue: null
          },
        }, { transaction })
        await queryInterface.addIndex(tableName, ['deployment_id'], { transaction })
      }
    )
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable(tableName)
  }
};