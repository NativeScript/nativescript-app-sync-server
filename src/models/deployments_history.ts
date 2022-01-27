import {
  Sequelize, DataTypes, Model, BuildOptions, Optional
} from "sequelize";
import { sequelize } from "./db";

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
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_id: DataTypes.INTEGER(),
  package_id: DataTypes.INTEGER(),
  created_at: DataTypes.DATE
}, {
  tableName: 'deployments_history',
  underscored: true,
  updatedAt: false,
  paranoid: true
});

export default DeploymentsHistoryModel

