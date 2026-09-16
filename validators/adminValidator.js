const { check } = require("express-validator");
const validatorMiddleware = require("../middlewares/validatorMiddleware");
// const ApiError = require("../utils/apiError");


exports.getOne= [
    check('id').isMongoId().withMessage("Invalid user id"),
    validatorMiddleware,
];

exports.createOne= [
    check("name")
        .notEmpty().withMessage("User name is required")
        .isLength({min: 3}, {max: 100}).withMessage("User name must be between 3 and 100 characters")
    ,
    check("email")
        .notEmpty().withMessage("User email is required")
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    check("password")
        .notEmpty().withMessage("User password is required")
        .isLength({min: 6}).withMessage("User password must be at least 6 characters")
    ,
    check("role")
        .optional()
        .isIn(["user", "admin"])
    ,
    check("isVerified")
        .optional()
        .isBoolean()
    ,
    validatorMiddleware,
];

exports.updateOne= [
    check('id').isMongoId().withMessage("Invalid user id")
    ,
    check("name")
        .optional()
        .isLength({min: 3, max: 100}).withMessage("User name must be between 3 and 100 characters")
    ,
    check("email")
        .optional()
        .isEmail().withMessage("Invalid email address")
        .normalizeEmail()
    ,
    check("role")
        .optional()
        .isIn(["user", "admin"])
    ,
    check("isVerified")
        .optional()
        .isBoolean()
    ,
    validatorMiddleware,
];

exports.deleteOne= [
    check('id').isMongoId().withMessage("Invalid user id"),
    validatorMiddleware,
];

exports.toggleActive= [
    check('id').isMongoId().withMessage("Invalid user id"),
    validatorMiddleware,
];
exports.forceChangePassword= [
    check('id').isMongoId().withMessage("Invalid user id"),
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

exports.changeRole= [
    check('id').isMongoId().withMessage("Invalid user id"),
    check("role")
        .notEmpty().withMessage("Role user is required")
        .isIn(["user", "admin"]).withMessage("Role must be (user or admin) only")
    ,
    validatorMiddleware,
];
