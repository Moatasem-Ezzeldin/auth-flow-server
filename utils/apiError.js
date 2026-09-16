class ApiError extends Error {
  constructor(message, statusCode, data = null) {
    super(message);

    this.statusCode = statusCode || 500;
    this.status =
      this.statusCode >= 400 && this.statusCode < 500
        ? "fail"
        : "error";
    this.data = data;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;