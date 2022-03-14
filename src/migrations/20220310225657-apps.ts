import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'apps'
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
          name: {
            type: DataTypes.STRING({ length: 50 }),
            allowNull: false,
            defaultValue: ''
          },
          uid: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          os: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          platform: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          is_use_diff_text: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
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
        await queryInterface.addIndex(tableName, { fields: [{ name: 'name', length: 12 }], transaction })
      })
  },

  down: (queryInterface: QueryInterface) => queryInterface.dropTable(tableName)
};