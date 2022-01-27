import { Optional, Model, Sequelize, DataTypes } from "sequelize";
import { sequelize } from "../db";

export interface ICollaboratorAttributes {
  id: number;
  appid: number;
  uid: number;
  roles: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IF_UserAttributes extends Model {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly role: string;
}

interface ICollaboratorCreationAttributes extends Optional<ICollaboratorAttributes, "id"> { }
export interface ICollaboratorInstance extends Model<ICollaboratorAttributes, ICollaboratorCreationAttributes>,
  ICollaboratorAttributes { }

const CollaboratorsModel = sequelize.define<ICollaboratorInstance>("Collaborators", {
  id: {
    type: DataTypes.BIGINT(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  appid: DataTypes.INTEGER(),
  uid: DataTypes.BIGINT(),
  roles: DataTypes.STRING,
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {

  tableName: 'collaborators',
  underscored: true,
  paranoid: true
});

export default CollaboratorsModel

