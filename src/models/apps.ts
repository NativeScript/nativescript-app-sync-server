import {
  DataTypes, Optional, ModelDefined
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

const AppModel: ModelDefined<
AppAttributes,
AppCreationAttributes
> = sequelize.define(
  "Apps",
  {
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
