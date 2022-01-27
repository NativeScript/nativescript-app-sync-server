import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

interface DeploymentsVersionsAttributes {
  id: number;
  deployment_id: number;
  app_version: string;
  current_package_id: number;
  min_version: number;
  max_version: number;
  created_at?: Date;
  updated_at?: Date;
}

interface DeploymentsVersionsCreationAttributes extends Optional<DeploymentsVersionsAttributes, "id"> { }
interface DeploymentsVersionsInstance extends Model<DeploymentsVersionsAttributes, DeploymentsVersionsCreationAttributes>,
  DeploymentsVersionsAttributes {  }

const DeploymentsVersions = sequelize.define<DeploymentsVersionsInstance>("DeploymentsVersions", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_id: DataTypes.INTEGER(),
  app_version: DataTypes.STRING,
  current_package_id: DataTypes.INTEGER(),
  min_version: DataTypes.BIGINT(),
  max_version: DataTypes.BIGINT(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'deployments_versions',
  underscored: true,
  paranoid: true
});
export default DeploymentsVersions

