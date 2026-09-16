const User = require("../models/userModel");
const ApiError = require("../utils/apiError");

// ******************************************************

// Toggle active user (false or true)
exports.toggleActive = async (userId) => {

    const user = await User.findById(userId);

    if(!user) {
        throw new ApiError("User not found", 404)
    }

    user.active = !user.active;

    user.save();

    return user;

};

// FORCE CHANGE PASSWORD (LOCAL ONLY)
exports.forceChangePassword = async (userId, newPassword) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  if (!user.provider.includes("local")) {
    throw new ApiError("Cannot change password for OAuth user", 400);
  }

  user.password = newPassword;
  user.passwordChangedAt = Date.now();

  await user.save();

  return user;

};

// CHANGE ROLE (user <-> admin)
exports.changeRole = async (userId, role) => {

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError("User not found", 404);
  }

  user.role = role;

  await user.save();

  return user;

};
