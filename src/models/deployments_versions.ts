import {
  DataTypes, Model, Optional
} from '@sequelize/core';
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
export interface DeploymentsVersionsInstance extends Model<DeploymentsVersionsAttributes, DeploymentsVersionsCreationAttributes>,
  DeploymentsVersionsAttributes { }

const DeploymentsVersions = sequelize.define<DeploymentsVersionsInstance>("DeploymentsVersions", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_id: DataTypes.INTEGER({ length: 11 }),
  app_version: DataTypes.STRING(100),
  current_package_id: DataTypes.INTEGER({ length: 10 }),
  min_version: DataTypes.BIGINT({ length: 20 }),
  max_version: DataTypes.BIGINT({ length: 20 }),
  created_at: DataTypes.DATE(),
  updated_at: DataTypes.DATE(),
}, {
  tableName: 'deployments_versions',
  underscored: true,
  paranoid: true
});
export default DeploymentsVersions

