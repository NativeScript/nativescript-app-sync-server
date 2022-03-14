import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'deployments'
module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => queryInterface.sequelize.transaction(
    async (transaction) => {
      await queryInterface.createTable(tableName, {
        id: {
          type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
          allowNull: false,
          unique: true,
          primaryKey: true,
          autoIncrement: true
        },
        appid: {
          type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        name: {
          type: DataTypes.STRING({ length: 20 }),
          allowNull: false,
          defaultValue: ''
        },
        description: {
          type: DataTypes.STRING({ length: 500 }),
          allowNull: false,
          defaultValue: ''
        },
        deployment_key: {
          type: DataTypes.STRING({ length: 64 }),
          allowNull: false
        },
        last_deployment_version_id: {
          type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
          allowNull: false,
          defaultValue: 0
        },
        label_id: {
          type: DataTypes.INTEGER({ length: 11 }).UNSIGNED,
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
      await queryInterface.sequelize.query(`
        ALTER TABLE ${tableName}
        ADD COLUMN updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
     `, { transaction })
      await queryInterface.addIndex(tableName, ['appid'], { transaction })
      await queryInterface.addIndex(tableName, { fields: [{ name: 'deployment_key', length: 40 }], transaction })
    }
  ),

  down: (queryInterface: QueryInterface) => queryInterface.dropTable(tableName)
};