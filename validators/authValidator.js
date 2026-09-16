const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/validatorMiddleware");

exports.signup = [
    check("name")
        .notEmpty().withMessage("User name is required")
        .isLength({ min: 3, max: 100 }).withMessage("User name must be between 3 and 100 characters")
        .trim()
    ,
    check("email")
        .notEmpty().withMessage("User email is required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    check("password")
        .notEmpty().withMessage("User password is required")
        .isLength({min: 6, max:50}).withMessage("User password must be at least 6-50 characters")
    ,
    check("passwordConfirm")
        .notEmpty().withMessage("User passwordConfirm is required")
        .custom((val, {req}) => {
            if(val !== req.body.password) {
                throw new Error("Password Confirm incorrect");
            }
            return true
        })
    ,
    validatorMiddleware,
];

exports.login = [
    check("email")
        .notEmpty().withMessage("User email required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    check("password")
        .notEmpty().withMessage("User password required")
        .isLength({min: 6}).withMessage("Too short user password")
    ,
    validatorMiddleware,
];

exports.forgotPassword = [
    check("email")
        .notEmpty().withMessage("User email is required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    validatorMiddleware,
];

exports.verifyPasswordResetCode = [
   check("resetCode")
        .notEmpty().withMessage("Reset Code is required")
    ,
    validatorMiddleware,
];

exports.resetPassword = [
    check("newPassword")
        .notEmpty().withMessage("User newPassword is required")
        .isLength({min: 6}).withMessage("User password must be at least 6 characters")
    ,
    check("newPasswordConfirm")
        .notEmpty().withMessage("User newPasswordConfirm is required")
        .isLength({min: 6}).withMessage("User newPpasswordConfirm must be at least 6 characters")
        .custom((val, {req}) => {
            if(val !== req.body.newPassword) {
                throw new Error("New Password Confirm incorrect");
            }
            return true
        })
    ,
    validatorMiddleware,
];