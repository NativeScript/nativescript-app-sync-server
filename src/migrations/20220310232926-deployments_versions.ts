import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'deployments_versions'
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
            type: DataTypes.INTEGER({ length: 11 }),
            allowNull: false,
            defaultValue: 0
          },
          app_version: {
            type: DataTypes.STRING({ length: 100 }),
            allowNull: false,
            defaultValue: ''
          },
          current_package_id: {
            type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          min_version: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          max_version: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
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
        })
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `, { transaction })
        await queryInterface.addIndex(tableName, ['deployment_id', 'min_version'], { transaction })
        await queryInterface.addIndex(tableName, ['deployment_id', 'max_version'], { transaction })
        await queryInterface.addIndex(tableName, { fields: [{ name: 'app_version', length: 30 }, { name: 'deployment_id' }], transaction })
      },

    )
  },
  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable(tableName)
  }
};