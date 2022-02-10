import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

export interface PackagesAttributes {
  id: number;
  deployment_version_id: number,
  deployment_id: number,
  description: string,
  package_hash: string,
  blob_url: string,
  size: number,
  manifest_blob_url: string,
  release_method: string,
  label: string,
  original_label: string,
  original_deployment: string,
  released_by: string,
  is_mandatory: number,
  is_disabled: number,
  rollout: number,
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date;
}

export interface PackagesCreationAttributes extends Optional<PackagesAttributes, "id"> { }
export interface PackagesInstance extends Model<PackagesAttributes, PackagesCreationAttributes>,
  PackagesAttributes { }

const PackagesModel = sequelize.define<PackagesInstance>("Packages", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_version_id: DataTypes.INTEGER({ length: 10 }),
  deployment_id: DataTypes.INTEGER({ length: 10 }),
  description: DataTypes.STRING(500),
  package_hash: DataTypes.STRING(64),
  blob_url: DataTypes.STRING(255),
  size: DataTypes.INTEGER({ length: 11 }),
  manifest_blob_url: DataTypes.STRING(255),
  release_method: DataTypes.STRING(20),
  label: DataTypes.STRING(20),
  original_label: DataTypes.STRING(20),
  original_deployment: DataTypes.STRING(20),
  released_by: DataTypes.BIGINT({ length: 20 }),
  is_mandatory: DataTypes.TINYINT({ length: 3 }),
  is_disabled: DataTypes.TINYINT({ length: 3 }),
  rollout: DataTypes.TINYINT({ length: 3 }),
  created_at: DataTypes.DATE(),
  updated_at: DataTypes.DATE(),
  deleted_at: DataTypes.DATE()
}, {
  tableName: 'packages',
  underscored: true,
  paranoid: true
});
export default PackagesModel