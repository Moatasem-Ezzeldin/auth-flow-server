const asyncHandler = require("express-async-handler");
const userService = require("../services/userService");
const { cookieOptions } = require("../services/sessionService");

// GET ME
exports.getMe = asyncHandler(async (req, res) => {
    const user = await userService.getMe(req.user._id);

    res.status(200).json({
        status: "success",
        data: user,
    });

});

// UP
exports.updateMyInfo = asyncHandler(async (req, res) => {

    const { user, emailChanged } = await userService.updateMyInfo(
        req.user._id,
        req.body
    );

    if(emailChanged) {
        // clear cookies
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
    }

    res.status(200).json({
        status: "success",
        data: user,
        setp: emailChanged ? "verify-email" : "normal",
        redirect: emailChanged ? "verify-email" : null
    });

});

exports.changeMyPassword = asyncHandler(async (req, res, next) => {

    await userService.changeMyPassword(
        req.user._id,
        req.body
    );

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
        status: "success",
        message: "Password changed and logged out from all sessions",
    });

});

exports.setPassword = asyncHandler(async (req, res, next) => {

    await userService.setPassword(
        req.user._id,
        req.body
    );

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
        status: "success",
        message: "Password set successfully. Please login again.",
    });

});

exports.deleteMe = asyncHandler(async (req, res, next) => {

    await userService.deleteMe(req.user._id);

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
        status: "success",
        message: "Account deleted successfully",
    });

});

exports.getMySessions = asyncHandler(async (req, res) => {

    const sessions = await userService.getMySessions(req.user._id, req.sessionId);

    res.status(200).json({
        status: "success",
        results: sessions.length,
        data: sessions,
    });
});

exports.deleteSession = asyncHandler(async (req, res) => {
    const result = await userService.deleteSession(
        req.user._id,
        req.params.id,
        req.cookies.refreshToken
    );

    if(result?.isCurrentSession) {
        // clear cookies
        res.clearCookie("accessToken", cookieOptions);
        res.clearCookie("refreshToken", cookieOptions);
    }

    res.status(200).json({
        status: "success",
        message: "Session removed successfully",
    });
});

exports.deleteAllSessions = asyncHandler(async (req, res) => {

    await userService.deleteAllSessions(req.user._id);

    // clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
        status: "success",
        message: "All sessions removed successfully",
    });
});

exports.uploadAvatar = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const avatar = await userService.uploadAvatar(
        userId,
        req.body.avatar // ← هون اللي بدك ياه
    );

    res.status(200).json({
        status: "success",
        data: avatar,
    });
});

exports.deleteAvatar = asyncHandler(async (req, res) => {

    await userService.deleteAvatar(req.user._id);

    res.status(200).json({
        status: "success",
        message: "Avatar deleted successfully",
    });
});

exports.verifyEmail = asyncHandler(async (req, res) => {

    const user = await userService.verifyEmail(req.query.token);

    // frontend-friendly response
    res.status(200).json({
        status: "success",
        message: "Email verified successfully.",
    });

    // res.redirect(`${process.env.CLIENT_BASE_URL}/dashboard`);

});

exports.resendVerificationEmail = asyncHandler(async (req, res) => {

    await userService.resendVerificationEmail(req.user._id);

    res.status(200).json({
        status: "success",
        step: "verify_email",
        message: "Verification email sent successfully.",
    });

});