const asyncHandler = require("express-async-handler");
const oauthService = require("../services/oauthService");
const { createAuthSession } = require("../services/sessionService");

// ********************************************************

/**
 * @desc    Google Login OAuth google
 * @route   GET /api/v1/auth/google
 * @access  Public
*/
exports.googleLogin = (req, res) => {

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${process.env.GOOGLE_CLIENT_ID}&redirect_uri=${process.env.GOOGLE_REDIRECT_URI}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

    res.redirect(url);
};

/**
 * @desc    Google Callback OAuth google
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
*/
exports.googleCallback = asyncHandler(async (req, res, next) => {
    const user = await oauthService.googleCallback(req);

    await createAuthSession(user, req, res);

    // 7) Response (API mode)
    // res.status(200).json({
    //     status: "success",
    //     message: "Logged in successfully",
    //     user,
    // });
    res.redirect(`${process.env.CLIENT_BASE_URL}/`);
});

/**
 * @desc    Github Login OAuth github
 * @route   GET /api/v1/auth/github
 * @access  Public
*/
exports.githubLogin = (req, res) => {

    const url = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}&response_type=code&scope=user:email`;
  
    res.redirect(url);
};

/**
 * @desc    Github Callback OAuth github
 * @route   GET /api/v1/auth/github/callback
 * @access  Public
*/
exports.githubCallback = asyncHandler(async (req, res, next) => {
    const user = await oauthService.githubCallback(req);

    await createAuthSession(user, req, res);

    // return res.status(200).json({
    //     status: "success",
    //     message: "Logged in successfully",
    //     user,
    // });
    res.redirect(`${process.env.CLIENT_BASE_URL}/`);
});
