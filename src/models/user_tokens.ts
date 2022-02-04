import { Optional, DataTypes, ModelDefined } from "sequelize";
import { sequelize } from "../db";

interface UserTokensAttributes {
  id: number
  uid: number
  is_session: number
  name: string
  tokens: string
  description: string
  created_by: string
  expires_at: Date | string
  created_at?: Date | string
  deleted_at?: Date | string
}

interface UserTokensCreationAttributes extends Optional<UserTokensAttributes, "id" | "is_session"> { }

const UserTokensModel: ModelDefined<
  UserTokensAttributes,
  UserTokensCreationAttributes
> = sequelize.define(
  "UserTokens",
  {
    id: {
      type: DataTypes.BIGINT({ length: 20 }),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    uid: DataTypes.BIGINT({ length: 20 }),
    name: DataTypes.STRING(50),
    tokens: DataTypes.STRING(64),
    description: DataTypes.STRING(500),
    is_session: DataTypes.TINYINT({ length: 3 }),
    created_by: DataTypes.STRING(64),
    created_at: DataTypes.DATE(),
    expires_at: DataTypes.DATE(),
    deleted_at: DataTypes.DATE()
  }, {
  updatedAt: false,
  tableName: 'user_tokens',
  underscored: true,
  paranoid: true
});
export default UserTokensModel