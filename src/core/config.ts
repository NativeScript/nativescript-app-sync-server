import _ from 'lodash'
import path from 'path'
import log4js from 'log4js'

const log = log4js.getLogger("cps:config");
let CONFIG_PATH = path.join(__dirname, '../config/config.js');
const env = process.env.NODE_ENV || 'development';

if (process.env.CONFIG_FILE) {
  CONFIG_PATH = path.join(__dirname, path.relative(__dirname, process.env.CONFIG_FILE));
  log.info(`process.env.CONFIG_FILE value: ${process.env.CONFIG_FILE}`)
}
log.info(`use config file ${CONFIG_PATH}`)
log.info(`use env ${env}`)
var config = _.get(require(CONFIG_PATH), env);
if (_.isEmpty(config)) {
  throw new Error(`config is {}, check the env and config`);
}
module.exports = config;
