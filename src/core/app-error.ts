export class AppError extends Error {
  status: number;
  
  constructor(msg?: string, constr?: any) {
    super()
    if (msg) {
      msg = msg.toString();
    }
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Error'
    this.name = 'AppError'
    this.status = 200
  }
}

export class InvalidInputError extends Error {
  status: number;
  
  constructor(msg?: string, constr?: any) {
    super()
    if (msg) {
      msg = msg.toString();
    }
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Error'
    this.name = 'InvalidInputError'
    this.status = 400
  }
}

export class NotFoundError extends AppError {
  constructor(msg?: string, constr?: any) {
    super(msg, constr)
    if (msg) {
      msg = msg.toString();
    }
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Not Found';
    this.name = 'NotFoundError'
    this.status = 404
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg?: string, constr?: any) {
    super(msg, constr)
  
    this.message = msg || `401 Unauthorized`;
    this.name = 'UnauthorizedError'
    this.status = 401
  }
}
