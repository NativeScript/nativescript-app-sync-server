import { Optional, DataTypes, ModelDefined } from "sequelize";
import { sequelize } from "../db";

export interface UsersAttributes {
  id: number
  username: string
  password: string
  email: string
  identical: string
  ack_code: string
  updated_at?: Date
  created_at?: Date
}

interface UsersCreationAttributes extends Optional<UsersAttributes, "id" | "ack_code" | "identical" | "username"> { }

const UsersModel: ModelDefined<
  UsersAttributes,
  UsersCreationAttributes
> = sequelize.define(
  "Users",
  {
    id: {
      type: DataTypes.BIGINT({ length: 11 }),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    username: DataTypes.STRING(50),
    password: DataTypes.STRING(255),
    email: DataTypes.STRING(100),
    identical: DataTypes.STRING(10),
    ack_code: DataTypes.STRING(10),
    created_at: DataTypes.DATE(),
    updated_at: DataTypes.DATE(),
  }, {
  tableName: 'users',
  underscored: true
});
export default UsersModel