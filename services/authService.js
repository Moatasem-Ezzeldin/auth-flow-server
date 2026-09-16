const asyncHandler = require("express-async-handler");
const slugify = require("slugify");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const sendEmail = require("../utils/sendEmail");
const { verifyToken, } = require("../utils/jwtUtils");
const { hashToken, createRandomToken, createOtp } = require("../utils/tokenUtils");
const { comparePassword } = require("../utils/passwordUtils");
const { createAccessJwtToken, createRefreshJwtToken, verifyJwtToken } = require("../utils/jwtUtils");
const { cleanExpiredSessions } = require("./sessionService");

// **************************************************************************************************

// Create new user account and send verification email
exports.signup = async (data) => {
    const { name, email, password } = data;
    const normalizeEmail = email.toLowerCase().trim();
    const normalizeName = name.trim();
    const existingUser = await User.findOne({ email: normalizeEmail });
    if(existingUser) {
        throw new ApiError("User already exists", 409);
    }
    const EMAIL_VERIFY_EXPIRES = Number(process.env.EMAIL_VERIFY_EXPIRES) || 900000;
    const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN ) || 2 * 60 * 1000;
    const emailVerifyToken = createRandomToken(32);
    const hashEmailVerifyToken = hashToken(emailVerifyToken);
    const user = await User.create({
        name: normalizeName,
        email: normalizeEmail,
        password: password,
        isVerified: false,
        emailVerifyToken: hashEmailVerifyToken,
        emailVerifyExpires: Date.now() + EMAIL_VERIFY_EXPIRES,
        emailResendAvailableAt: Date.now() + RESEND_COOLDOWN,
        emailVerifyLastSentAt: Date.now(),
    });

    try { 
        await sendEmail({
            email: user.email,
            subject: "Verify your email",
            message:`Hi ${user.name},\n\nClick the link below to verify your account:\n\n${process.env.CLIENT_BASE_URL}/auth/verify-email?token=${emailVerifyToken}\n\nThis link is valid for 15 minutes.\n\nDev.moatasem`,
        });

    } catch (err) {
        // مهم جداً: ما نخلي user معلّق بدون email
        await User.findByIdAndDelete(user._id);
        throw new ApiError("Email sending failed, try again", 500);
    }
    return user;
};

// login
exports.login = async (data) => {
    const { email, password } = data;
    const normalizeEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizeEmail, }).select("+password");

    if (!user || !(await comparePassword(password, user.password))) {
        throw new ApiError("Invalid email or password", 401);
    }

    // if (!user.isVerified) {
    //   throw new ApiError("Please verify your email first", 401);
    // }
    console.log("user-befor: ", user);
    if (!user.active) {
      throw new ApiError("Account has been disabled", 403);
    }
    console.log("user-after: ", user);
    return user;
};

// send code like (123456) to your gmail
exports.forgotPassword = async (email) => {

    const normalizeEmail = email.toLowerCase().trim();

    const user = await User.findOne({ email: normalizeEmail });

    if (!user) {
        throw new ApiError("No user found with this email", 404);
    }

    if (!user.isVerified) {
      throw new ApiError("Please verify your email first", 401);
    }

    if (!user.active) {
      throw new ApiError("Account has been disabled", 403);
    }

    const resetCode = createOtp(6);
    const PASSWORD_CODE_VERIFY_EXPIRES = Number(process.env.PASSWORD_CODE_VERIFY_EXPIRES) || 600000;
    const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN ) || 2 * 60 * 1000;

    const message = `Hi ${user.name},\n\nYour password reset code is:\n\n${resetCode}\n\nThis code is valid for 10 minutes.\n\nThe E-shop Team`;
    try {

        await sendEmail({
            email: user.email,
            subject: "Password Reset Code",
            message: message,
        });

        user.passwordResetCode = hashToken(resetCode);
        user.passwordResetExpires = Date.now() + PASSWORD_CODE_VERIFY_EXPIRES;
        user.passwordResendAvailableAt = Date.now() + RESEND_COOLDOWN,
        user.passwordResetLastSentAt = Date.now();
        user.passwordResetVerified = false;

        await user.save({ validateBeforeSave: false });

    } catch (err) {

        user.passwordResetCode = undefined;
        user.passwordResetExpires = undefined;
        user.passwordResetVerified = undefined;
        user.passwordResetLastSentAt = undefined;
        user.passwordResendAvailableAt = undefined;

        await user.save({ validateBeforeSave: false });

        throw new ApiError("Failed to send email", 500);

    }

    return user;

};

exports.resetPasswordSession = async ({ userId, verified }) => {

    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return {
        _id: user._id,
        email: user.email,
        passwordResetExpires: user.passwordResetExpires,
        passwordResendAvailableAt: user.passwordResendAvailableAt,
        passwordResetLastSentAt: user.passwordResetLastSentAt,
        passwordResetVerified: user.passwordResetVerified,
    };
};

// resend code like (123456) to your gmail
exports.resendResetCode = async (userId) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (!user.isVerified) {
      throw new ApiError("Please verify your email first", 401);
    }

    if (!user.active) {
      throw new ApiError("Account has been disabled", 403);
    }

    // rate limit قوي
    const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN ) || 2 * 60 * 1000;
 
    if (
        user.passwordResendAvailableAt &&
        user.passwordResendAvailableAt > Date.now()
    ) {
        throw new ApiError("Cooldown active", 429);
    }

    try {

        const resetCode = createOtp(6);
        const PASSWORD_CODE_VERIFY_EXPIRES = Number(process.env.PASSWORD_CODE_VERIFY_EXPIRES) || 600000;
        const message = `Hi ${user.name},\n\nYour password reset code is:\n\n${resetCode}\n\nThis code is valid for 10 minutes.\n\nThe E-shop Team`;

        await sendEmail({
            email: user.email,
            subject: "Password Reset Code",
            message: message,
        });

        user.passwordResetCode = hashToken(resetCode);
        user.passwordResetExpires = Date.now() + PASSWORD_CODE_VERIFY_EXPIRES;
        user.passwordResendAvailableAt = Date.now() + RESEND_COOLDOWN;
        user.passwordResetLastSentAt = Date.now();
        user.passwordResetVerified = false;

        await user.save({ validateBeforeSave: false });

    } catch(err) {
        throw new ApiError("Email sending failed", 500);
    }
};

// check hash reset code is true and not expired
exports.verifyPasswordResetCode = async (userId, resetCode) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (user.passwordResetExpires < Date.now()) {
        throw new ApiError("Invalid or expired code", 400);
    }
    const hashedCode = hashToken(resetCode);

    if (user.passwordResetCode !== hashedCode) {
        throw new ApiError("Invalid or expired code", 400);
    }

    user.passwordResetVerified = true;
    user.passwordResetCode = undefined;
    user.passwordResetExpires = undefined;
    user.passwordResendAvailableAt = undefined;

    await user.save({ validateBeforeSave: false });

    return user;

};

// reset a new password 
exports.resetPassword = async (userId, newPassword) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }
    
    if (!user.passwordResetVerified) {
    throw new ApiError("Reset code not verified", 400);
    }

    user.password = newPassword;

    user.passwordResetCode = undefined;

    user.passwordResetExpires = undefined;
    user.passwordResendAvailableAt = undefined;
    user.passwordResetLastSentAt = undefined;

    user.passwordResetVerified = undefined;

    user.sessions = [];

    await user.save();

    // return user;
};

// make new token after 15 min if old token expired
exports.refreshToken = async (req) => {
    const refreshToken = req.cookies?.refreshToken;
    // 1) check token exists
    if (!refreshToken) {
        throw new ApiError("No refresh token provided", 401);
    }

    // 2) verify JWT
    let decoded;
    try {
        decoded = verifyJwtToken(
        refreshToken,
        process.env.REFRECH_JWT_SECRET_KEY
        );
    } catch (error) {
        throw new ApiError("Invalid refresh token", 401);
    }
    // 3) find user
    const user = await User.findById(decoded.userId);
    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // 4) clean expired sessions
    cleanExpiredSessions(user);

    const hashedRefreshToken = hashToken(refreshToken);

    // 5) find session
    const sessionIndex = user.sessions.findIndex(
        (s) => s.refreshToken === hashedRefreshToken
    );

    if (sessionIndex === -1) {
        throw new ApiError("Session expired or invalid", 401);
    }

    const oldSession = user.sessions[sessionIndex];

    if (oldSession.id !== decoded.sessionId) {
        throw new ApiError("Invalid session", 401);
    }

    // 6) remove old session (rotation)
    user.sessions.splice(sessionIndex, 1);

    // 7) generate new tokens
    const newAccessToken = createAccessJwtToken(user._id, oldSession.id);
    const newRefreshToken = createRefreshJwtToken(user._id, oldSession.id);

    const ACCESS_TOKEN_EXPIRES = Number(process.env.ACCESS_TOKEN_EXPIRES) || 15 * 60 * 1000;
    const REFRESH_TOKEN_EXPIRES = Number(process.env.REFRESH_TOKEN_EXPIRES) || 30 * 24 * 60 * 60 * 1000;

    // 8) add new session (keep same metadata)
    user.sessions.push({
        id: oldSession.id,
        refreshToken: hashToken(newRefreshToken),
        userAgent: oldSession.userAgent,
        ip: oldSession.ip,
        createdAt: oldSession.createdAt,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES),
    });

    // 9) save user
    await user.save({ validateBeforeSave: false });

    // 10) return 
    return {
        accessToken: newAccessToken,
        accessTokenExpires: ACCESS_TOKEN_EXPIRES,
        refreshToken: newRefreshToken,
        refreshTokenExpires: REFRESH_TOKEN_EXPIRES,
    };
    
};


// clear sission
exports.logout = async (req) => {

    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
        throw new ApiError("No refresh token found", 401);
    };

    const hashedRefreshToken = hashToken(refreshToken);

    // remove ONLY current session
    const result = await User.updateOne(
        {
            "sessions.refreshToken": hashedRefreshToken,
        },
        {
            $pull: {
                sessions: {
                    refreshToken: hashedRefreshToken,
                },
            },
        }
    );  

};
