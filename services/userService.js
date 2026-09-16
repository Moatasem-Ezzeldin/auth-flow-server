const User = require("../models/userModel");
const ApiError = require("../utils/apiError");
const { comparePassword } = require("../utils/passwordUtils");
const { hashToken, createRandomToken } = require("../utils/tokenUtils");
const sendEmail = require("../utils/sendEmail");

// ***************************************************************

// GET MY PROFILE
exports.getMe = async (userId) => {

    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    return user;

};

exports.updateMyInfo = async (userId, data) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    let emailChanged = false;
    let emailVerifyToken = null;
    let newEmail = null;

    // ======================
    // EMAIL PREPARATION ONLY (NO SAVE YET)
    // ======================
    if (data.email) {
        const email = data.email.toLowerCase().trim();

        if (email !== user.email) {
            const emailExists = await User.findOne({
                email,
                _id: { $ne: userId },
            });

            if (emailExists) {
                throw new ApiError("Email already exists", 409);
            }

            emailVerifyToken = createRandomToken(32);
            newEmail = email;

            emailChanged = true;
        }
    }

    // ======================
    // SEND EMAIL FIRST (critical step)
    // ======================
    if (emailChanged) {
        try { 
            await sendEmail({
                email: user.email,
                subject: "Verify your email",
                message:`Hi ${user.name},\n\nClick the link below to verify your account:\n\n${process.env.SERVER_BASE_URL}/api/v1/auth/verify-email?token=${emailVerifyToken}\n\nThis link is valid for 15 minutes.\n\nThe E-shop Team`,
            });

        } catch (err) {
            throw new ApiError("Failed to send verification email, no changes applied", 500);
        }
    }

    // APPLY CHANGES ONLY AFTER SUCCESS
    if (emailChanged) {
        user.email = newEmail;
        user.isVerified = false;
        user.sessions = [];

        user.emailVerifyToken = hashToken(emailVerifyToken);
        user.emailVerifyExpires =
            Date.now() +
            (Number(process.env.EMAIL_VERIFY_EXPIRES) || 15 * 60 * 1000);

        user.emailVerifyLastSentAt = Date.now();
    }

    if (data.name) user.name = data.name;
    if (data.phone) user.phone = data.phone;

    await user.save();

    return {
        user,
        emailChanged,
    };
};

exports.changeMyPassword = async (userId, data) => {
    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // ensure local account
    if (user.provider && !(user.provider.includes("local")) ) {
        throw new ApiError("OAuth users cannot change password here", 400);
    }

    // check current password
    const isMatch = await comparePassword(
        data.currentPassword,
        user.password
    );

    if (!isMatch) {
        throw new ApiError("Current password is incorrect", 401);
    }

    // set new password
    user.password = data.newPassword;

    // optional: password changed timestamp
    user.passwordChangedAt = Date.now();

    // logout all sessions
    user.sessions = [];

    await user.save();

    return true;
};

exports.setPassword = async (userId, data) => {
    const user = await User.findById(userId).select("+password");

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // لازم يكون OAuth (ما عنده local)
    if (user.provider?.includes("local")) {
        throw new ApiError("Password already exists", 400);
    }

    // منع التكرار
    if (user.password) {
        throw new ApiError("Password already set", 400);
    }

    // set password
    user.password = data.newPassword;

    // إضافة local provider بدون تكرار
    user.provider = [...new Set([...(user.provider || []), "local"])];

    // security timestamp
    user.passwordChangedAt = Date.now();

    // logout all sessions
    user.sessions = [];

    await user.save();

    return true;

};

exports.deleteMe = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // soft delete
    user.active = false;

    // logout all sessions
    user.sessions = [];

    await user.save();

    return true;

};

exports.getMySessions = async (userId, currentSessionId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // تنظيف المنتهي أولاً
    user.sessions = user.sessions.filter(
        s => s.expiresAt > Date.now()
    );

    await user.save();

    return user.sessions.map(s => ({
        id: s.id,
        userAgent: s.userAgent,
        ip: s.ip,
        createdAt: s.createdAt,
        lastUsedAt: s.lastUsedAt,
        expiresAt: s.expiresAt,
        isCurrentSession: s.id === currentSessionId,
    }));
};

exports.deleteSession = async (userId, sessionId, currentRefreshToken) => {
    const user = await User.findById(userId);

    const hashedCurrent = hashToken(currentRefreshToken);        

    const sessionToDelete = user.sessions.find(
        s => s.id === sessionId
    );

    if (!sessionToDelete) {
        throw new ApiError("Session not found", 404);
    };

    const isCurrentSession =
        hashedCurrent &&
        sessionToDelete.refreshToken === hashedCurrent;

    // remove session
    user.sessions = user.sessions.filter(
        s => s.id !== sessionId
    );

    await user.save();

    return { isCurrentSession };
};

exports.deleteAllSessions = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    user.sessions = [];

    await user.save();

    return true;
};

exports.uploadAvatar = async (userId, avatarData) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    // upsert logic (create or update)
    user.avatar = avatarData;

    await user.save();

    return user.avatar;
};

exports.deleteAvatar = async (userId) => {
    await User.findByIdAndUpdate(
        userId,
        {
            avatar: {},
        },
        {
            new: true,
            runValidators: true,
        }
    );
};

// make user valid (isVerified = true)
exports.verifyEmail = async (token) => {
    const hashedToken = hashToken(token);

    const user = await User.findOne({
        emailVerifyToken: hashedToken,
        emailVerifyExpires: { $gt: Date.now() },
    });

    if (!user) {
        throw new ApiError("Invalid or expired link", 400);
    }

    if (user.isVerified) {
        throw new ApiError("Account already verified", 400);
    }

    if (!user.active) {
        throw new ApiError("Account is disabled", 403);
    }

    user.isVerified = true;
    user.emailVerifyToken = undefined;
    user.emailVerifyExpires = undefined;
    user.emailResendAvailableAt = undefined;
    user.emailVerifyLastSentAt = undefined;

    await user.save({ validateBeforeSave: false });

    return user;
};

// resend url to email in klick it make isVerified = true 
exports.resendVerificationEmail = async (userId) => {
    const user = await User.findById(userId);

    if (!user) {
        throw new ApiError("User not found", 404);
    }

    if (!user.active) {
        throw new ApiError("Account is disabled", 403);
    }

    if (user.isVerified) {
        throw new ApiError("Account already verified", 400);
    }

    // rate limit قوي
    const RESEND_COOLDOWN = Number(process.env.RESEND_COOLDOWN ) || 2 * 60 * 1000;
    const EMAIL_VERIFY_EXPIRES = Number(process.env.EMAIL_VERIFY_EXPIRES) || 900000;

    if (
        user.emailResendAvailableAt &&
        user.emailResendAvailableAt > Date.now()
    ) {
        throw new ApiError("Cooldown active", 429);
    }

    try {
        const emailVerifyToken = createRandomToken(32);

        await sendEmail({
            email: user.email,
            subject: "Verify your email",
            message:`Hi ${user.name},\n\nClick the link below to verify your account:\n\n${process.env.CLIENT_BASE_URL}/auth/verify-email?token=${emailVerifyToken}\n\nThis link is valid for 15 minutes.\n\nThe E-shop Team`,
        });

        user.emailVerifyToken = hashToken(emailVerifyToken);
        user.emailVerifyExpires = Date.now() + EMAIL_VERIFY_EXPIRES;
        user.emailResendAvailableAt = Date.now() + RESEND_COOLDOWN;
        user.emailVerifyLastSentAt = Date.now();

        await user.save({ validateBeforeSave: false });

    } catch (err) {
        throw new ApiError("Email sending failed", 500);
    }

    return user;
};