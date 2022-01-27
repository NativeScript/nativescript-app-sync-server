import {
  DataTypes, Model, Optional
} from "sequelize";
import _ from 'lodash'
import { AppError } from '../core/app-error'
import { sequelize } from "./db";

interface DeploymentsAttributes {
  id: number;
  appid: number;
  name: string;
  description: string;
  deployment_key: string;
  last_deployment_version_id: number;
  label_id: number;
  created_at?: Date;
  updated_at?: Date;
}

interface DeploymentsCreationAttributes extends Optional<DeploymentsAttributes, "id"> { }
interface DeploymentsInstance extends Model<DeploymentsAttributes, DeploymentsCreationAttributes>,
  DeploymentsAttributes { }

const Deployments = sequelize.define<DeploymentsInstance>("Deployments", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  appid: DataTypes.INTEGER(),
  name: DataTypes.STRING,
  description: DataTypes.STRING,
  deployment_key: DataTypes.STRING,
  last_deployment_version_id: DataTypes.INTEGER(),
  label_id: DataTypes.INTEGER(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'deployments',
  underscored: true,
  paranoid: true
});


export const generateLabelId = function (deploymentId: number) {
  return sequelize.transaction(function (t) {
    return Deployments.findOne({ where: { id: deploymentId }, lock: t.LOCK.UPDATE, transaction: t }).then(function (data) {
      if (!data) {
        throw new AppError("does not find deployment");
      }

      data.label_id = data.label_id + 1;
      return data.save({ transaction: t })
        .then(function (data) {
          return data.label_id;
        });
    });
  });
};

export default Deployments