import {
  DataTypes, Model, Optional
} from "sequelize";
import _ from 'lodash'
import { sequelize } from "../db";

interface LogReportDeployAttributes {
  id: number;
  status: number;
  package_id: number;
  client_unique_id: string;
  previous_label: string;
  previous_deployment_key: number;
  created_at?: Date;
}

interface LogReportDeployCreationAttributes extends Optional<LogReportDeployAttributes, "id"> { }
interface LogReportDeployInstance extends Model<LogReportDeployAttributes, LogReportDeployCreationAttributes>,
  LogReportDeployAttributes { }

const LogReportDeployModel = sequelize.define<LogReportDeployInstance>("LogReportDeploy", {
  id: {
    type: DataTypes.BIGINT(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  status: DataTypes.INTEGER(),
  package_id: DataTypes.INTEGER(),
  client_unique_id: DataTypes.STRING,
  previous_label: DataTypes.STRING,
  previous_deployment_key: DataTypes.STRING,
  created_at: DataTypes.DATE,
}, {
  tableName: 'log_report_deploy',
  underscored: true,
  updatedAt: false,
  paranoid: true
});
export default LogReportDeployModel