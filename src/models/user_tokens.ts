import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "./db";

interface UserTokensAttributes {
  id: number
  uid: number
  name: string
  tokens: string
  description: string
  created_by: string
  expires_at: Date | string
  created_at?: Date | string
}

interface UserTokensCreationAttributes extends Optional<UserTokensAttributes, "id"> { }
interface UserTokensInstance extends Model<UserTokensAttributes, UserTokensCreationAttributes>,
  UserTokensAttributes { }

const UserTokensModel = sequelize.define<UserTokensInstance>("UserTokens", {
  id: {
    type: DataTypes.BIGINT(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  uid: DataTypes.BIGINT(),
  name: DataTypes.STRING,
  tokens: DataTypes.STRING,
  description: DataTypes.STRING,
  is_session: DataTypes.INTEGER(),
  created_by: DataTypes.STRING,
  created_at: DataTypes.DATE,
  expires_at: DataTypes.DATE
}, {
  updatedAt: false,
  tableName: 'user_tokens',
  underscored: true,
  paranoid: true
});
export default UserTokensModel