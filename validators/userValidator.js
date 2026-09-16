const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/validatorMiddleware");
// const ApiError = require("../utils/apiError");

exports.updateMyInfo= [
    ,
    check("name")
        .optional()
        .isLength({ min:3, max:100 }).withMessage("User name must be between 3 and 100 characters")
    ,
    check("email")
        .optional()
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    check("phone")
        .optional()
        .isMobilePhone("ar-SY").withMessage("Invalid phone nomber only accepted Syria number")
    ,
    validatorMiddleware,
];

exports.changeMyPassword = [
    check("currentPassword")
        .notEmpty().withMessage("Current Password is required")
        .isLength({min: 6}).withMessage("Too short Current Password")
    ,
    check("newPassword")
        .notEmpty().withMessage("New password is required")
        .isLength({min: 6}).withMessage("Too short new password")
    ,
    check("confirmNewPassword")
        .notEmpty().withMessage("Confirm New Password is required")
        .isLength({min: 6}).withMessage("Too short confirm new password")
        .custom((val, {req}) => {
            if(val !== req.body.newPassword) {
                    throw new ApiError("Passwords do not match", 400);
                }
            return true
        })
    ,
    validatorMiddleware,
];

exports.setPassword = [
    check("newPassword")
        .notEmpty().withMessage("New password is required")
        .isLength({min: 6}).withMessage("Too short new password")
    ,
    check("confirmNewPassword")
        .notEmpty().withMessage("Confirm New Password is required")
        .isLength({min: 6}).withMessage("Too short confirm new password")
        .custom((val, {req}) => {
            if(val !== req.body.newPassword) {
                    throw new ApiError("Passwords do not match", 400);
                }
            return true
        })
    ,
    validatorMiddleware,
];

exports.deleteSession = [
    check("id")
        .notEmpty().withMessage("Session id is required")
    ,
    validatorMiddleware,
];

exports.verifyEmail = [
    check("token")
        .notEmpty().withMessage("Verify token is required")
    ,
    validatorMiddleware,
];

