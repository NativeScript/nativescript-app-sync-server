import { QueryInterface, DataTypes, Sequelize } from '@sequelize/core';

const tableName = 'users'
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
          username: {
            type: DataTypes.STRING({ length: 50 }),
            allowNull: false,
            defaultValue: ''
          },
          password: {
            type: DataTypes.STRING({ length: 255 }),
            allowNull: false,
            defaultValue: ''
          },
          email: {
            type: DataTypes.STRING({ length: 100 }),
            allowNull: false,
            defaultValue: ''
          },
          identical: {
            type: DataTypes.STRING({ length: 10 }),
            allowNull: false,
            unique: true,
            defaultValue: ''
          },
          ack_code: {
            type: DataTypes.STRING({ length: 10 }),
            allowNull: false,
            defaultValue: ''
          },
          created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: sequelize.fn('NOW')
          }
        }, { transaction })
        await queryInterface.sequelize.query(`
          ALTER TABLE ${tableName}
          ADD COLUMN updated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        `, { transaction })
        await queryInterface.addIndex(tableName, ['username'], { transaction })
        await queryInterface.addIndex(tableName, ['email'], { transaction })
        
      }
    )
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable(tableName)
  }
};