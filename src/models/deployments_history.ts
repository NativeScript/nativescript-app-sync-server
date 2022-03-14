import {
  Sequelize, DataTypes, Model, BuildOptions, Optional
} from '@sequelize/core';
import { sequelize } from "../db";

interface DeploymentsHistoryAttributes {
  id: number;
  deployment_id: number;
  package_id: number;
  created_at?: Date;
}

interface DeploymentsHistoryCreationAttributes extends Optional<DeploymentsHistoryAttributes, "id"> { }
interface DeploymentsHistoryInstance extends Model<DeploymentsHistoryAttributes, DeploymentsHistoryCreationAttributes>,
  DeploymentsHistoryAttributes { }

const DeploymentsHistoryModel = sequelize.define<DeploymentsHistoryInstance>("DeploymentsHistory", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_id: DataTypes.INTEGER({ length: 11 }),
  package_id: DataTypes.INTEGER({ length: 10 }),
  created_at: DataTypes.DATE()
}, {
  tableName: 'deployments_history',
  underscored: true,
  updatedAt: false,
  paranoid: true
});

export default DeploymentsHistoryModel

