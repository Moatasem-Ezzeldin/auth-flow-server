// Middlewares
const { protect, allowedTo } = require("../middlewares/authMiddlewares");
const { smartDelete } = require("../middlewares/smartDelete");
const loadExistingDoc = require("../middlewares/loadExistingDocMiddlewares");

// Validator
const adminValidator = require("../validators/adminValidator");
// Controllers
const adminController = require("../controllers/adminController");
const factory = require("../controllers/handlersFactory");

const User = require("../models/userModel");
const express = require("express");
const router = express.Router();

// Protect + admin only
router.use(protect, allowedTo("admin"));

router.route('/')
    .get(factory.getAll(User, ["name", "email"]))
    .post(adminValidator.createOne, factory.createOne(User))
;

router.route('/:id')
    .get(adminValidator.getOne, factory.getOne(User))
    .put(adminValidator.updateOne, factory.updateOne(User))
    .delete(
        adminValidator.deleteOne,
        loadExistingDoc(User), 
        smartDelete({
            fields: ["avatar"],
        }),
        factory.deleteOne(User)
    )
;

router.route('/:id/toggle-active')
    .put(adminValidator.toggleActive, adminController.toggleActive)
;

router.route('/:id/change-password')
    .put(adminValidator.forceChangePassword, adminController.forceChangePassword)
;

router.route('/:id/change-role')
    .put(adminValidator.changeRole, adminController.changeRole)
;







module.exports = router;