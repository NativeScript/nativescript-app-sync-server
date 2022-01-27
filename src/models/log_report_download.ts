import {
  DataTypes, Model, Optional
} from "sequelize";
import _ from 'lodash'
import { sequelize } from "./db";

interface LogReportDownloadAttributes {
  id: number;
  package_id: number;
  client_unique_id: string;
  created_at?: Date;
}

interface LogReportDownloadCreationAttributes extends Optional<LogReportDownloadAttributes, "id"> { }
interface LogReportDownloadInstance extends Model<LogReportDownloadAttributes, LogReportDownloadCreationAttributes>,
  LogReportDownloadAttributes { }

const LogReportDownloadModel = sequelize.define<LogReportDownloadInstance>("LogReportDownload", {
  id: {
    type: DataTypes.BIGINT(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  package_id: DataTypes.INTEGER(),
  client_unique_id: DataTypes.STRING,
  created_at: DataTypes.DATE,
}, {
  tableName: 'log_report_download',
  underscored: true,
  updatedAt: false,
  paranoid: true
});
export default LogReportDownloadModel