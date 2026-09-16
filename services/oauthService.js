const { OAuth2Client } = require("google-auth-library");
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const axios = require("axios");
const User = require("../models/userModel");
const ApiError = require("../utils/apiError");

// *************************************

/**
 * @desc    Google Callback OAuth google
 * @route   GET /api/v1/auth/google/callback
 * @access  Public
*/
exports.googleCallback = async (req) => {
  const { code } = req.query;

  if (!code) {
    throw new ApiError("Authorization code missing", 400);
  }

  // 1) Exchange code for tokens (correct form-urlencoded way)
  const params = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    redirect_uri: process.env.GOOGLE_REDIRECT_URI,
    grant_type: "authorization_code",
  });

  const tokenResponse = await axios.post(
    "https://oauth2.googleapis.com/token",
    params.toString(),
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  const { id_token } = tokenResponse.data;

  if (!id_token) {
    throw new ApiError("Google authentication failed", 400);
  }

  // 2) Verify token
  const ticket = await googleClient.verifyIdToken({
    idToken: id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();

  const {
    sub: googleId,
    email,
    name,
    picture,
    email_verified,
  } = payload;

  if (!email || !email_verified) {
    return next(new ApiError("Invalid Google account", 400));
  }

  // 3) Find user by email (clean approach)
  let user = await User.findOne({ email });

  // 4) If user exists → link google
  if (user) {
    if (user.googleId && user.googleId !== googleId) {
      throw new ApiError("Google account mismatch", 400);
    }

    if (!user.googleId) user.googleId = googleId;

    if (!user.provider.includes("google")) {
      user.provider.push("google");
    }

    if (picture && (!user.avatar || !user.avatar.url)) {
      user.avatar = { url: picture };
    }

    user.isVerified = true;

    await user.save({ validateBeforeSave: false });
  }

  // 5) If user doesn't exist → create new
  if (!user) {
    user = await User.create({
      name,
      email,
      googleId,
      provider: ["google"],
      isVerified: true,
      avatar: picture ? { url: picture } : undefined,
      active: true,
    });
  }

  return user;

};

/**
 * @desc    Github Callback OAuth github
 * @route   GET /api/v1/auth/github/callback
 * @access  Public
*/
exports.githubCallback = async (req) => {
    const { code } = req.query;

    if (!code) {
        throw new ApiError("Authorization code missing", 400);
    }

    const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
        },
        {
        headers: {
            Accept: "application/json",
        },
        }
    );

    const { access_token } = tokenResponse.data;

    if (!access_token) {
        throw new ApiError("GitHub authentication failed", 400);
    }

    const userResponse = await axios.get("https://api.github.com/user", {
        headers: {
        Authorization: `Bearer ${access_token}`,
        },
    });

    const emailsResponse = await axios.get("https://api.github.com/user/emails", {
        headers: {
        Authorization: `Bearer ${access_token}`,
        },
    });

    const primaryEmail = emailsResponse.data.find(
        (e) => e.primary && e.verified
    );

    if (!primaryEmail?.email) {
        throw new ApiError("Verified GitHub email not found", 400);
    }

    const githubUser = userResponse.data;

    const githubId = String(githubUser.id);
    const email = primaryEmail.email.toLowerCase().trim();
    const name = githubUser.name || githubUser.login;
    const picture = githubUser.avatar_url;

    let user = await User.findOne({ email });

    if (user) {
        if (user.githubId && user.githubId !== githubId) {
        throw new ApiError("GitHub account mismatch", 400);
        }

        if (!user.githubId) user.githubId = githubId;

        if (!user.provider.includes("github")) {
        user.provider.push("github");
        }

        if (picture && (!user.avatar || !user.avatar.url)) {
        user.avatar = { url: picture };
        }

        user.isVerified = true;

        await user.save({ validateBeforeSave: false });
    }

    if (!user) {
        user = await User.create({
        name,
        email,
        githubId,
        provider: ["github"],
        isVerified: true,
        avatar: picture ? { url: picture } : undefined,
        active: true,
        });
    }

    return user;
};