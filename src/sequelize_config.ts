const { default: config } = require('./core/config');

module.exports = {
  development: config.db,
  test: config.db,
  production: config.db
};