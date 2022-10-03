import {
  DataTypes, Model, Optional
} from '@sequelize/core';
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
  deleted_at?: Date;
}

interface PackagesMetricsCreationAttributes extends Optional<PackagesMetricsAttributes, "id" | "active" | "downloaded" | "failed" | "installed"> { }
interface PackagesMetricsInstance extends Model<PackagesMetricsAttributes, PackagesMetricsCreationAttributes>,
  PackagesMetricsAttributes { }

const PackagesMetricsModel = sequelize.define<PackagesMetricsInstance>("PackagesMetrics", {
  id: {
    type: DataTypes.INTEGER({ length: 11 }),
    allowNull: false,
    autoIncrement: true,
    primaryKey: true
  },
  package_id: DataTypes.INTEGER({ length: 10 }),
  active: DataTypes.INTEGER({ length: 10 }),
  downloaded: DataTypes.INTEGER({ length: 10 }),
  failed: DataTypes.INTEGER({ length: 10 }),
  installed: DataTypes.INTEGER({ length: 10 }),
  created_at: DataTypes.DATE(),
  updated_at: DataTypes.DATE(),
  deleted_at: DataTypes.DATE(),
}, {
  tableName: 'packages_metrics',
  underscored: true,
  paranoid: true
});
export default PackagesMetricsModel