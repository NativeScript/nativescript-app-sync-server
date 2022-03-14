import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'user_tokens'
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
          uid: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          name: {
            type: DataTypes.STRING({ length: 50 }),
            allowNull: false,
            defaultValue: ''
          },
          tokens: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            defaultValue: ''
          },
          created_by: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            defaultValue: ''
          },
          description: {
            type: DataTypes.STRING({ length: 500 }),
            allowNull: false,
            defaultValue: ''
          },
          is_session: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          expires_at: {
            type: DataTypes.DATE,
            defaultValue: null
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
        await queryInterface.addIndex(tableName, ['tokens'], { transaction })
        await queryInterface.addIndex(tableName, ['uid'], { transaction })
      }
    )
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable('user_tokens')
  }
};