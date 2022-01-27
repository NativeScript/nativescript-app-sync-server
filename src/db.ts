import { Dialect, Sequelize } from 'sequelize'
import config from './core/config'

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, { dialect: config.db.dialect as Dialect });

export { sequelize };
