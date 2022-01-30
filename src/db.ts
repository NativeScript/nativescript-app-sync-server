import { Dialect, Sequelize } from 'sequelize'
import config from './core/config'

const sequelize = new Sequelize(config.db.database, config.db.username, config.db.password, {
    dialect: 'mysql',
    host: config.db.host,
    port: config.db.port
});

export { sequelize };
