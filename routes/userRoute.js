// model
const User = require("../models/userModel");

// Validators
const userValidator = require("../validators/userValidator");

// Controllers (CRUD)
const userController = require("../Controllers/userController");

// upload sestem
const upload = require("../utils/upload/multer");

// middlewares 
const { protect } = require("../middlewares/authMiddlewares");
const smartFileGuard = require("../middlewares/smartFileGuardMiddlewares");
const loadExistingDoc = require("../middlewares/loadExistingDocMiddlewares");
const {smartUpload} = require("../middlewares/smartUpload");
const {smartUpdate} = require("../middlewares/smartUpdate");
const {smartDelete} = require("../middlewares/smartDelete");

const express = require("express");
const router = express.Router();

// Protect 
router.use(protect);

router.route("/")
    .get(userController.getMe)
    .patch(userValidator.updateMyInfo, userController.updateMyInfo)
    .delete(userController.deleteMe)
;
// *************
router.route("/verify-email").get(
    userValidator.verifyEmail, 
    userController.verifyEmail
);
router.route("/resend-verification").post( 
    userController.resendVerificationEmail
);
// ***********************
router.route("/change-password")
    .patch(userValidator.changeMyPassword, userController.changeMyPassword)
;

router.route("/set-password")
    .patch(userValidator.setPassword, userController.setPassword)
;

router.route("/sessions")
    .get(userController.getMySessions)
    .delete(userController.deleteAllSessions)
;

router.route("/sessions/:id")
    .delete(userValidator.deleteSession, userController.deleteSession)
;

router.route("/avatar")
    .post(
        upload.fields([
            {name: "avatar", maxCount: 1},
        ]),
        smartFileGuard({
            avatar: {
                type: "image",
                allowed: [],
                maxSize: 2 * 1024 * 1024,
                required: true,
            },
        }),
        smartUpdate("user"), 
        userController.uploadAvatar
    )
    .delete(
        smartDelete({
            fields: ["avatar"],
        }),
        userController.deleteAvatar  
    )
;

module.exports = router;
