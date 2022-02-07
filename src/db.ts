import { Sequelize } from 'sequelize'
import config from './core/config'

const sequelize = new Sequelize(config.db);

export { sequelize };
