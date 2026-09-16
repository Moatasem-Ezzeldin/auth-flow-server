const ApiError = require("../utils/apiError");

// DEVELOPMENT response
const sendErrorForDev = (err, res) => {
  return res.status(err.statusCode || 500).json({
    status: err.status || "error",
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// PRODUCTION response
const sendErrorForProd = (err, res) => {
  return res.status(err.statusCode || 500).json({
    status: err.status || "error",
    message: err.isOperational
      ? err.message
      : "Something went wrong",
  });
};

const globalError = (err, req, res, next) => {
  // default values
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // =========================
  // MONGOOSE ERRORS
  // =========================

  // Duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    err = new ApiError(`${field} already exists`, 400);
  }

  // Invalid ObjectId
  if (err.name === "CastError") {
    err = new ApiError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Schema validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    err = new ApiError(messages, 400);
  }

  // =========================
  // JWT ERRORS
  // =========================

  if (err.name === "JsonWebTokenError") {
    err = new ApiError("Invalid token, please login again", 401);
  }

  if (err.name === "TokenExpiredError") {
    err = new ApiError("Token expired, please login again", 401);
  }

  // =========================
  // RESPONSE MODES
  // =========================

  if (process.env.NODE_ENV === "development") {
    return sendErrorForDev(err, res);
  }

  return sendErrorForProd(err, res);
};

module.exports = globalError;