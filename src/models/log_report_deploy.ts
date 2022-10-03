import {
  DataTypes, Model, Optional
} from '@sequelize/core';
import _ from 'lodash'
import { sequelize } from "../db";

interface LogReportDeployAttributes {
  id: number;
  status: number;
  package_id: number;
  client_unique_id: string;
  previous_label: string;
  previous_deployment_key: string;
  created_at?: Date;
}

interface LogReportDeployCreationAttributes extends Optional<LogReportDeployAttributes, "id"> { }
interface LogReportDeployInstance extends Model<LogReportDeployAttributes, LogReportDeployCreationAttributes>,
  LogReportDeployAttributes { }

const LogReportDeployModel = sequelize.define<LogReportDeployInstance>("LogReportDeploy", {
  id: {
    type: DataTypes.BIGINT({ length: 20 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  status: DataTypes.TINYINT({ length: 3 }),
  package_id: DataTypes.INTEGER({ length: 10 }),
  client_unique_id: DataTypes.STRING(100),
  previous_label: DataTypes.STRING(20),
  previous_deployment_key: DataTypes.STRING(64),
  created_at: DataTypes.DATE(),
}, {
  tableName: 'log_report_deploy',
  underscored: true,
  updatedAt: false,
  paranoid: true
});
export default LogReportDeployModel