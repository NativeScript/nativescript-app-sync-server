import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

interface AppAttributes {
  id: number;
  name: string;
  uid: number;
  os: number;
  platform: number;
  is_use_diff_text: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AppCreationAttributes extends Optional<AppAttributes, "id" | "is_use_diff_text"> { }
interface AppInstance extends Model<AppAttributes, AppCreationAttributes>,
  AppAttributes { }

const AppModel = sequelize.define<AppInstance>("Apps", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  name: DataTypes.STRING,
  uid: DataTypes.BIGINT(),
  os: DataTypes.INTEGER(),
  platform: DataTypes.INTEGER(),
  is_use_diff_text: DataTypes.INTEGER(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'apps',
  underscored: true,
  paranoid: true,
});

export default AppModel
