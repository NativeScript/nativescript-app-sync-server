import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "./db";

interface UsersAttributes {
  id: number
  username: string
  password: string
  email: string
  identical: string
  ack_code: string
  updated_at?: Date
  created_at?: Date
}

interface UsersCreationAttributes extends Optional<UsersAttributes, "id" | "ack_code" | "identical" | "username"> {  }
interface UsersInstance extends Model<UsersAttributes, UsersCreationAttributes>,
  UsersAttributes { }

const UsersModel = sequelize.define<UsersInstance>("Users", {
  id: {
    type: DataTypes.BIGINT(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  username: DataTypes.STRING,
  password: DataTypes.STRING,
  email: DataTypes.STRING,
  identical: DataTypes.STRING,
  ack_code: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'users',
  underscored: true
});
export default UsersModel