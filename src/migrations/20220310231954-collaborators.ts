import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'collaborators'
module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) =>
    queryInterface.sequelize.transaction(
      async (transaction) => {
        await queryInterface.createTable('collaborators', {
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
          uid: {
            type: DataTypes.BIGINT({ length: 20 }),
            allowNull: false,
            defaultValue: 0
          },
          roles: {
            type: DataTypes.STRING({ length: 20 }),
            allowNull: false,
            defaultValue: ''
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
        await queryInterface.addIndex(tableName, ['uid'], { transaction })
      }
    ),

  down: (queryInterface: QueryInterface) => queryInterface.dropTable(tableName)
};