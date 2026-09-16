const express = require("express");

// Validator
const authValidator = require("../validators/authValidator");

// Controller 
const authController = require("../controllers/authController");
const oauthController = require("../controllers/oauthController");

// Middlewares
const emailLimiter = require("../middlewares/emailLimterMiddlewares");
const ipLimiter = require("../middlewares/ipLimitMiddlewares");
const { protectResetSession, requireUnverifiedResetSession, requireVerifiedResetSession } = require("../middlewares/authMiddlewares");

const router = express.Router();

// Signup & Verify Email & Resend Verifiction Email Url
router.route("/signup").post(
    emailLimiter({ windowMinutes:15, max:3, message: "Too many signup attempts for this email, Please try again later." }),
    ipLimiter({ windowMinutes:15, max:10, message: "Too many signup attempts, Please try again later." }),  
    authValidator.signup, 
    authController.signup
);

// Login
router.route("/login").post(
    emailLimiter({ windowMinutes:15, max:5, message: "Too many login attempts for this email, Please try again later." }),
    ipLimiter({ windowMinutes:15, max:10, message: "Too many login attempts, Please try again later." }), 
    authValidator.login, 
    authController.login
);

// Forgot Password & Resend Reset Code & Verify Password Code & Reset Password
router.route("/forgot-password").post(
    emailLimiter({ windowMinutes:15, max:3, message: "Too many reset requessts for this email, Please try again later." }),
    ipLimiter({ windowMinutes:15, max:5, message: "Too many reset requessts, Please try again later." }),  
    authValidator.forgotPassword, 
    authController.forgotPassword
);
router.route("/reset-password-session").get(  
    protectResetSession,
    authController.resetPasswordSession
);
router.route("/resend-reset-code").post( 
    emailLimiter({ windowMinutes:15, max:2, message: "Too many attempts for this email, Please try again later." }),
    ipLimiter({ windowMinutes:15, max:3, message: "Too many attempts for this device, Please try again later." }),
    protectResetSession,
    requireUnverifiedResetSession, 
    authController.resendResetCode
);
router.route("/verify-reset-code").post(
    ipLimiter({ windowMinutes:15, max:10, message: "Too many attempts, Please try again later." }),
    protectResetSession,
    requireUnverifiedResetSession,
    authValidator.verifyPasswordResetCode, 
    authController.verifyPasswordResetCode
);
router.route("/reset-password").post(
    emailLimiter({ windowMinutes:15, max:5, message: "Too many reset attempts for this email, Please try again later." }),
    ipLimiter({ windowMinutes:15, max:10, message: "Too many reset attempts for this device, Please try again later." }),
    protectResetSession,
    requireVerifiedResetSession,
    authValidator.resetPassword, 
    authController.resetPassword
);
// // Refresh Token
router.route("/refresh-token").post(
    ipLimiter({ windowMinutes:15, max:100, message: "Too many requests for this device, Please try again later." }), 
    authController.refreshToken
);
// // Logout
router.route("/logout").post(
    ipLimiter({ windowMinutes:15, max:200, message: "Too many requests for this device, Please try again later."}), 
    authController.logout
);
// // Delete Acount
// router.route("/delete-acount").delete(protect, deleteAccount);
// // Google
router.route("/google").get(ipLimiter({ windowMinutes:15, max:100 }), oauthController.googleLogin);
router.route("/google/callback").get(ipLimiter({ windowMinutes:15, max:30 }), oauthController.googleCallback);
// // Github
router.route("/github").get(ipLimiter({ windowMinutes:15, max:100 }), oauthController.githubLogin);
router.route("/github/callback").get(ipLimiter({ windowMinutes:15, max:30 }), oauthController.githubCallback);

module.exports = router;