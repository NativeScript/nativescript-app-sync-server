import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'packages'
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
          deployment_version_id: {
            type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          deployment_id: {
            type: DataTypes.INTEGER({ length: 10 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          description: {
            type: DataTypes.STRING({ length: 500 }),
            allowNull: false,
            defaultValue: ''
          },
          package_hash: {
            type: DataTypes.STRING({ length: 64 }),
            allowNull: false,
            defaultValue: ''
          },
          blob_url: {
            type: DataTypes.STRING({ length: 255 }),
            allowNull: false,
            defaultValue: ''
          },
          manifest_blob_url: {
            type: DataTypes.STRING({ length: 255 }),
            allowNull: false,
            defaultValue: ''
          },
          release_method: {
            type: DataTypes.STRING({ length: 20 }),
            allowNull: false,
            defaultValue: ''
          },
          label: {
            type: DataTypes.STRING({ length: 20 }),
            allowNull: false,
            defaultValue: ''
          },
          original_label: {
            type: DataTypes.STRING({ length: 20 }),
            allowNull: false,
            defaultValue: ''
          },
          original_deployment: {
            type: DataTypes.STRING({ length: 20 }),
            allowNull: false,
            defaultValue: ''
          },
          size: {
            type: DataTypes.INTEGER({ length: 11 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          released_by: {
            type: DataTypes.BIGINT({ length: 20 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          is_mandatory: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          is_disabled: {
            type: DataTypes.TINYINT({ length: 3 }).UNSIGNED,
            allowNull: false,
            defaultValue: 0
          },
          rollout: {
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
        await queryInterface.addIndex(tableName, ['deployment_version_id'], { transaction })
        await queryInterface.addIndex(tableName, { fields: [{ name: 'deployment_id' }, { name: 'label', length: 8 }], transaction })
      }
    )
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable('packages')
  }
};