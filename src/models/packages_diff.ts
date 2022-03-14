import {
  DataTypes, Model, Optional
} from '@sequelize/core';
import { sequelize } from "../db";

interface PackagesDiffAttributes {
  id: number;
  package_id: number;
  diff_against_package_hash: string;
  diff_blob_url: string;
  diff_size: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PackagesDiffCreationAttributes extends Optional<PackagesDiffAttributes, "id"> { }
interface PackagesDiffInstance extends Model<PackagesDiffAttributes, PackagesDiffCreationAttributes>,
  PackagesDiffAttributes { }

const PackagesDiffModel = sequelize.define<PackagesDiffInstance>("PackagesDiff", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  package_id: DataTypes.INTEGER({ length: 11 }),
  diff_against_package_hash: DataTypes.STRING(64),
  diff_blob_url: DataTypes.STRING(255),
  diff_size: DataTypes.INTEGER({ length: 11 }),
  created_at: DataTypes.DATE(),
  updated_at: DataTypes.DATE(),
}, {
  tableName: 'packages_diff',
  underscored: true,
  paranoid: true
});
export default PackagesDiffModel