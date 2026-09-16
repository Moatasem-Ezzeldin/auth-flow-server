const asyncHandler = require("express-async-handler");
const ApiError = require("../utils/apiError");
const User = require("../models/userModel");
const { verifyJwtToken } = require("../utils/jwtUtils");

// PROTECT check on auth (logged in)
exports.protect = asyncHandler(async (req, res, next) => {
    const accessToken = req.cookies.accessToken;

    if (!accessToken) {
      return next(new ApiError("You are not logged in", 401));
    }

    let decoded;

    try {
      decoded = verifyJwtToken(accessToken, process.env.ACCESS_JWT_SECRET_KEY);
    } catch (error) {
      return next(new ApiError("Invalid or expired token",401));
    }

    const currentUser = await User.findById(decoded.userId);

    if (!currentUser) {
      return next(
        new ApiError("User no longer exists", 401));
    }

    if (!currentUser.active) {
      return next(
        new ApiError("Account has been disabled", 403));
    }

    if (currentUser.passwordChangedAt && currentUser.passwordChangedAt.getTime() / 1000 > decoded.iat) {
        return next(
            new ApiError("Password changed recently, please login again", 401)
        );
    }

    req.user = currentUser;
    req.sessionId = decoded.sessionId;
    console.log(decoded);

    next();
});

exports.isVerified = () => (req, res, next) => {

    if (!req.user) {
    return next(new ApiError("Unauthorized access",401));
    }

    if (!req.user.isVerified) {
      return next(
        new ApiError("Plese verify your email first", 403));
    }

    return next();
};

// ALLOWED TO check on role

exports.allowedTo = (...roles) => (req, res, next) => {

    if (!req.user) {
    return next(new ApiError("Unauthorized access",401));
    }

    if (!roles.includes(req.user.role)) {
    return next(new ApiError("You are not allowed to access this route",403));
    }

    return next();
};

exports.protectResetSession = asyncHandler(async (req, res, next) => {
  const resetToken = req.cookies.resetToken;

    if (!resetToken) {
      return next(new ApiError("Reset session expired", 401));
    }

    let decoded;

    try {
      decoded = verifyJwtToken(resetToken, process.env.RESET_JWT_SECRET_KEY);
    } catch (error) {
      return next(new ApiError("Invalid or expired reset token", 401));
    }

    req.resetSession = decoded;

    next();
});

exports.requireVerifiedResetSession = asyncHandler(async (req, res, next) => {
  if(!req.resetSession.verified) {
    return next(new ApiError("Reset code not verified", 400));
  }
  next();
});

exports.requireUnverifiedResetSession = asyncHandler(async (req, res, next) => {
  if(req.resetSession.verified) {
    return next(new ApiError("Reset code already verified", 400));
  }
  next();
});