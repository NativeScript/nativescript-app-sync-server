import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'packages_diff'
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
          package_id: {
            type: DataTypes.INTEGER({ length: 11 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          diff_against_package_hash: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            defaultValue: ''
          },
          blob_url: {
            type: DataTypes.STRING({ length: 255 }),
            allowNull: false,
            defaultValue: ''
          },
          diff_size: {
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
        await queryInterface.addIndex(tableName, { fields: [{ name: 'package_id' }, { name: 'diff_against_package_hash', length: 40 }], transaction })
      }
    )
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable('packages_diff')
  }
};