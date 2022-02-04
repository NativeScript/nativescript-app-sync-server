import { Optional, DataTypes, ModelDefined } from "sequelize";
import { sequelize } from "../db";

export interface ICollaboratorAttributes {
  id: number;
  appid: number;
  uid: number;
  roles: string;
  created_at?: Date;
  updated_at?: Date;
}

interface ICollaboratorCreationAttributes extends Optional<ICollaboratorAttributes, "id"> { }

const CollaboratorsModel: ModelDefined<
  ICollaboratorAttributes,
  ICollaboratorCreationAttributes
> = sequelize.define(
  "Collaborators",
  {
    id: {
      type: DataTypes.BIGINT({ length: 20 }),
      allowNull: false,
      autoIncrement: true,
      primaryKey: true
    },
    appid: DataTypes.INTEGER({ length: 10 }),
    uid: DataTypes.BIGINT({ length: 20 }),
    roles: DataTypes.STRING(20),
    created_at: DataTypes.DATE(),
    updated_at: DataTypes.DATE(),
  }, {
  tableName: 'collaborators',
  underscored: true,
  paranoid: true
});

export default CollaboratorsModel

