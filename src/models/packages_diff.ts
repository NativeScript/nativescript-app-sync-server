import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "./db";

interface PackagesDiffAttributes {
  id: number;
  package_id: number;
  diff_against_package_hash: string;
  diff_blob_url: string;
  diff_size: string;
  created_at?: Date;
  updated_at?: Date;
}

interface PackagesDiffCreationAttributes extends Optional<PackagesDiffAttributes, "id"> { }
interface PackagesDiffInstance extends Model<PackagesDiffAttributes, PackagesDiffCreationAttributes>,
  PackagesDiffAttributes { }

const PackagesDiffModel = sequelize.define<PackagesDiffInstance>("PackagesDiff", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  package_id: DataTypes.INTEGER(),
  diff_against_package_hash: DataTypes.STRING,
  diff_blob_url: DataTypes.STRING,
  diff_size: DataTypes.INTEGER(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'packages_diff',
  underscored: true,
  paranoid: true
});
export default PackagesDiffModel