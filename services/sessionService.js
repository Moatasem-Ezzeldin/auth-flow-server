const {
    createAccessJwtToken,
    createRefreshJwtToken,
    createResetJwtToken
} = require("../utils/jwtUtils");

const {
    hashToken,
    createRandomId,
} = require("../utils/tokenUtils");

// **********************************************************************************

// COOKIE OPTIONS
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // secure: false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    // sameSite: "none",
    path: "/",
};

// CLEAN EXPIRED SESSIONS
const cleanExpiredSessions = (user) => {
    if(!Array.isArray(user?.sessions)) return;
    const now = Date.now();
    user.sessions = user.sessions.filter( (session) => {
        const exp = session?.expiresAt ? new Date(session.expiresAt).getTime() : 0;
        return exp > now;
    });
};

// CREATE AUTH SESSION
const createAuthSession = async (user, req, res) => {
    cleanExpiredSessions(user);
    const sessionId = createRandomId();
    const accessToken = createAccessJwtToken(user._id, sessionId);
    const refreshToken = createRefreshJwtToken(user._id, sessionId);
    const hashedRefreshToken = hashToken(refreshToken);

    const MAX_SESSIONS = Number(process.env.MAX_SESSIONS) || 5;
    const ACCESS_TOKEN_EXPIRES = Number(process.env.ACCESS_TOKEN_EXPIRES) || 15 * 60 * 1000;
    const REFRESH_TOKEN_EXPIRES = Number(process.env.REFRESH_TOKEN_EXPIRES) || 30 * 24 * 60 * 60 * 1000;

    if(!Array.isArray(user.sessions)) {
        user.sessions = [];
    }
    const newSession = {
        id: sessionId,
        refreshToken: hashedRefreshToken,
        userAgent: req.headers["user-agent"] || "unknown",
        ip: req.ip || "unknown",
        createdAt: new Date(),
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRES),
    };

    user.sessions.push(newSession);

    // keep only latest sessions
    user.sessions = user.sessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    if(user.sessions.length > MAX_SESSIONS) {
        user.sessions = user.sessions.slice(0, MAX_SESSIONS);
    }
    await user.save({ validateBeforeSave: false });

    user.sessions = user.sessions.filter(Boolean);

    res.cookie("accessToken", accessToken, {
        ...cookieOptions,
        maxAge: ACCESS_TOKEN_EXPIRES,
    });

    res.cookie("refreshToken", refreshToken, {
        ...cookieOptions,
        maxAge: REFRESH_TOKEN_EXPIRES,
    });
};

// CREATE RESET PASSORD SESSION
const createResetSession = async (res, userId, verified, expiresIn, maxAge) => {
    const resetToken = createResetJwtToken(userId, verified, expiresIn)
    res.cookie("resetToken", resetToken, {
        ...cookieOptions,
        maxAge,
    });
};

module.exports = {

    cookieOptions,
    cleanExpiredSessions,
    createAuthSession,
    createResetSession
};
