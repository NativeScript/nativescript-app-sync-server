import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => {
    queryInterface.createTable('apps', {
      id: {
        allowNull: false,
        type: DataTypes.BIGINT({ length: 20 }),
        unique: true,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: DataTypes.STRING({ length: 50 }),
        allowNull: false
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
      updated_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: sequelize.fn('NOW')
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
    queryInterface.addIndex('apps', ['name'], { fields: [{ name: 'name', length: 12 }] })
  },

  down: (queryInterface: QueryInterface) => {
    queryInterface.dropTable('apps')
  }
};