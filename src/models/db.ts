import { Sequelize } from 'sequelize'
import _ from 'lodash'

const config = _.get(require(__dirname + '/../core/config'), 'db', {});
const sequelize = new Sequelize(config.database, config.username, config.password, config);

export { sequelize };
