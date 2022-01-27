import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

interface PackagesAttributes {
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
}

interface PackagesCreationAttributes extends Optional<PackagesAttributes, "id"> { }
interface PackagesInstance extends Model<PackagesAttributes, PackagesCreationAttributes>,
  PackagesAttributes { }

const PackagesModel = sequelize.define<PackagesInstance>("Packages", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  deployment_version_id: DataTypes.INTEGER(),
  deployment_id: DataTypes.INTEGER(),
  description: DataTypes.STRING,
  package_hash: DataTypes.STRING,
  blob_url: DataTypes.STRING,
  size: DataTypes.INTEGER(),
  manifest_blob_url: DataTypes.STRING,
  release_method: DataTypes.STRING,
  label: DataTypes.STRING,
  original_label: DataTypes.STRING,
  original_deployment: DataTypes.STRING,
  released_by: DataTypes.STRING,
  is_mandatory: DataTypes.INTEGER(),
  is_disabled: DataTypes.INTEGER(),
  rollout: DataTypes.INTEGER(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'packages',
  underscored: true,
  paranoid: true
});
export default PackagesModel