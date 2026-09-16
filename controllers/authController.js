const asyncHandler = require("express-async-handler");
const authService = require("../services/authService");
const {
    cookieOptions,
    createAuthSession,
    createResetSession
} = require("../services/sessionService");

// **************************************************************

/**
 * @desc    Signup New User
 * @route   POST /api/v1/auth/signup 
 * @access  Public
*/
exports.signup = asyncHandler(async (req, res) => {

    const user = await authService.signup(req.body);

    await createAuthSession(user, req, res);

    res.status(201).json({
        status: "success",
        step: "verify_email",
        message: "Account created and logged in successfully.",
        data: {
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isVerified: user.isVerified
            }
        }
    });

});

/**
 * @desc    Login  
 * @route   POST /api/v1/auth/login
 * @access  Public
*/
exports.login = asyncHandler(async (req, res) => {

    const user = await authService.login(req.body);

    await createAuthSession(user, req, res);

    res.status(200).json({ status: "success", message: "Logged in successfully." });

});

/**
 * @desc    Forgot Password  
 * @route   POST /api/v1/auth/forgot-password
 * @access  Public
*/
exports.forgotPassword = asyncHandler(async (req, res) => {
    const expiresIn = process.env.RESET_JWT_PRE_VERIFY_EXPIRE_TIM || "30m"
    const maxAge = Number(process.env.RESET_TOKEN_PRE_VERIFY_EXPIRES) || 1800000
    const user = await authService.forgotPassword(req.body.email);
    await createResetSession(res, user._id, false, expiresIn, maxAge)
    res.status(200).json({
        status: "success",
        message: "Reset code have been sent.",
    });

});

exports.resetPasswordSession = asyncHandler(async (req, res) => {
    const user = await authService.resetPasswordSession(req.resetSession);

    res.status(200).json({
        status: "success",
        data: user,
    })
});

/**
 * @desc    Resent Reset Password Code 
 * @route   POST /api/v1/auth/resend-reset-code
 * @access  Public
*/
exports.resendResetCode = asyncHandler(async (req, res) => {

    await authService.resendResetCode(req.resetSession.userId);

    res.status(200).json({
        status: "success",
        message: "Reset code sent successfully",
    });

});

/**
 * @desc    Verify Reset Password Code 
 * @route   POST /api/v1/auth/verify-reset-code
 * @access  Public
*/
exports.verifyPasswordResetCode = asyncHandler(async (req, res) => {

    const user = await authService.verifyPasswordResetCode(req.resetSession.userId, req.body.resetCode);
    const expiresIn = process.env.RESET_JWT_POST_VERIFY_EXPIRE_TIME || "15m"
    const maxAge = Number(process.env.RESET_TOKEN_POST_VERIFY_EXPIRES) || 900000
    await createResetSession(res, user._id, true, expiresIn, maxAge)
    res.status(200).json({
        status: "success",
        message: "Code verified successfully",
    });

});

/**
 * @desc    Reset Password
 * @route   POST /api/v1/auth/reset-password
 * @access  Public
*/
exports.resetPassword = asyncHandler(async (req, res) => {

    await authService.resetPassword(req.resetSession.userId, req.body.newPassword);
    res.clearCookie("resetToken", cookieOptions);
    // await createAuthSession(user, req, res);

    res.status(200).json({ status: "success", message: "Password has been reset successfully" });

});

/**
 * @desc    Refresh Token
 * @route   POST /api/v1/auth/refresh-token
 * @access  Public
*/
exports.refreshToken = asyncHandler(async (req, res) => {

    const result = await authService.refreshToken(req);

    res.cookie("accessToken", result.accessToken, {
        ...cookieOptions,
        maxAge: result.accessTokenExpires,
    });

    res.cookie("refreshToken", result.refreshToken, {
        ...cookieOptions,
        maxAge: result.refreshTokenExpires,
    });

    res.status(200).json({ status: "success" });

});

/**
 * @desc    Logout
 * @route   POST /api/v1/auth/logout
 * @access  Public
*/
exports.logout = asyncHandler(async (req, res) => {

    await authService.logout(req);

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
        status: "success",
        message: "Logged out successfully",
    });

});
