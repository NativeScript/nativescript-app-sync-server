import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

interface VersionsAttributes {
  id: number
  type: number
  version: number
}

interface VersionsCreationAttributes extends Optional<VersionsAttributes, "id"> { }
interface VersionsInstance extends Model<VersionsAttributes, VersionsCreationAttributes>,
  VersionsAttributes { }

const VersionsModel = sequelize.define<VersionsInstance>("Versions", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  type: DataTypes.TINYINT({ length: 3 }),
  version: DataTypes.STRING(10)
}, {
  tableName: 'versions',
  updatedAt: false,
  createdAt: false
});

export default VersionsModel