import {
  DataTypes, Model, Optional
} from '@sequelize/core';
import { sequelize } from "../db";

export interface AppAttributes {
  id: number;
  name: string;
  uid: number;
  os: number | string;
  platform: number | string;
  is_use_diff_text: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AppCreationAttributes extends Optional<AppAttributes, "id" | "is_use_diff_text"> { }
export interface AppInstance extends Model<AppAttributes, AppCreationAttributes>,
  AppAttributes { }

const AppModel = sequelize.define<AppInstance>("Apps", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
  },
  name: DataTypes.STRING(50),
  uid: DataTypes.BIGINT({ length: 8 }),
  os: DataTypes.TINYINT({ length: 3 }),
  platform: DataTypes.TINYINT({ length: 3 }),
  is_use_diff_text: DataTypes.TINYINT({ length: 3 }),
  created_at: DataTypes.DATE(),
  updated_at: DataTypes.DATE(),
}, {
  tableName: 'apps',
  underscored: true,
  paranoid: true,
});

export default AppModel
