var util = require('util')

var AppError = function (msg, constr) {
  if(msg) {
    msg = msg.toString();
  }
  Error.captureStackTrace(this, constr || this)
  this.message = msg || 'Error'
  this.name = 'AppError'
  this.status = 200
}
util.inherits(AppError, Error)

var NotFoundError = function(msg) {
  NotFoundError.super_.call(this, msg, this.constructor)
  this.message = msg || 'Not Found';
  this.name = 'NotFoundError'
  this.status = 404
}
util.inherits(NotFoundError, AppError)

var UnauthorizedError = function(msg) {
  UnauthorizedError.super_.call(this, msg, this.constructor)
  this.message = msg || `401 Unauthorized`;
  this.name = 'UnauthorizedError'
  this.status = 401
}
util.inherits(UnauthorizedError, AppError)

module.exports = {
  AppError: AppError,
  NotFound: NotFoundError,
  Unauthorized: UnauthorizedError
}

