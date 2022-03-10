import { QueryInterface, DataTypes, Sequelize } from 'sequelize';

module.exports = {
  up: (queryInterface: QueryInterface, sequelize: Sequelize) => {
    queryInterface.createTable('collaborators', {
      id: {
        allowNull: false,
        type: DataTypes.BIGINT({ length: 20 }),
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
        type: DataTypes.STRING({ length: 20 }),
        allowNull: false,
        defaultValue: ''
      },
      roles: {
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
    queryInterface.addIndex('collaborators', ['appid', 'uid'])
  },

  down: (queryInterface: QueryInterface) => {
    queryInterface.dropTable('collaborators')
  }
};