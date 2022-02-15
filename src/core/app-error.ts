export class AppError extends Error {
  status: number;
  
  constructor(msg: string, status?: number, constr?: any) {
    super()
    if (msg) {
      msg = msg.toString();
    }
    Error.captureStackTrace(this, constr || this)
    this.message = msg || 'Error'
    this.name = 'AppError'
    this.status = status || 406
  }
}

export class IoTsValidationError extends AppError {
  status = 400;
  name = "IoTsValidationError";

  constructor(message: string) {
    super(message);
    this.message = message;
  }
}

export class UnauthorizedError extends AppError {
  constructor(msg = '', constr?: any) {
    super(msg, constr)
  
    this.message = msg || `401 Unauthorized`;
    this.name = 'UnauthorizedError'
    this.status = 401
  }
}
