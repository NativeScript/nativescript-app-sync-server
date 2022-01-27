import {
  DataTypes, Model, Optional
} from "sequelize";
import { sequelize } from "../db";

interface PackagesMetricsAttributes {
  id: number;
  package_id: number;
  active: number;
  downloaded: number;
  failed: number;
  installed: number;
  created_at?: Date;
  updated_at?: Date;
}

interface PackagesMetricsCreationAttributes extends Optional<PackagesMetricsAttributes, "id" | "active" | "downloaded" | "failed" | "installed"> { }
interface PackagesMetricsInstance extends Model<PackagesMetricsAttributes, PackagesMetricsCreationAttributes>,
  PackagesMetricsAttributes { }

const PackagesMetricsModel = sequelize.define<PackagesMetricsInstance>("PackagesMetrics", {
  id: {
    type: DataTypes.INTEGER(),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  package_id: DataTypes.INTEGER(),
  active: DataTypes.INTEGER(),
  downloaded: DataTypes.INTEGER(),
  failed: DataTypes.INTEGER(),
  installed: DataTypes.INTEGER(),
  created_at: DataTypes.DATE,
  updated_at: DataTypes.DATE,
}, {
  tableName: 'packages_metrics',
  underscored: true,
  paranoid: true
});
export default PackagesMetricsModel