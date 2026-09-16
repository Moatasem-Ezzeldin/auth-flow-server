const asyncHandler = require("express-async-handler");
const adminService = require("../services/adminService");

exports.toggleActive = asyncHandler(async (req, res) => {

    const user = await adminService.toggleActive(req.params.id);

    res.status(200).json({
        status: "success",
        message: `toggle successfully user active is ${user.active}`,
        user,
    });

});

exports.forceChangePassword = asyncHandler(async (req, res) => {

    const user = await adminService.forceChangePassword(
        req.params.id,
        req.body.newPassword
    );

    res.status(200).json({
        status: "success",
        message: "Change password user successfully",
        data: user,
    });

});

// CHANGE ROLE
exports.changeRole = asyncHandler(async (req, res) => {
    const user = await adminService.changeRole(
        req.params.id,
        req.body.role
    );

    res.status(200).json({
        status: "success",
        message: "Change role user successfully",
        data: user,
    });

});