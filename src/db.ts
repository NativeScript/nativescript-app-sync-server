import { Sequelize } from '@sequelize/core'
import config from './core/config'

const sequelize = new Sequelize(config.db);

export { sequelize };
