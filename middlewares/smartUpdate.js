const cloudinary = require("../config/cloudinary");
const uploadToCloudinary =
require("../utils/upload/uploadToCloudinary");
const asyncHandler =
require("express-async-handler");

// حذف من Cloudinary
const removeFile = async (file) => {
  if (!file?.public_id) return;

  await cloudinary.uploader.destroy(file.public_id, {
    resource_type: file.type || "image",
  });
};

exports.smartUpdate = (modelName, options = { mode: "replace" }) =>
asyncHandler(async (req, res, next) => {

  const existing = req.existingDoc || req.user;
  if (!existing) return next();

  if (!req.files || Object.keys(req.files).length === 0)
    return next();

  for (const field in req.files) {

    const newFiles = req.files[field];
    if (!newFiles || newFiles.length === 0) continue;

    const uploaded = await Promise.all(
      newFiles.map(file =>
        uploadToCloudinary(file, modelName, field)
      )
    );

    const isArray = Array.isArray(existing[field]);

    // 🟡 SINGLE FILE (imageCover)
    if (!isArray) {

      await removeFile(existing[field]);

      req.body[field] = uploaded[0];
    }

    // 🟢 ARRAY FILES
    else {

      // 🔴 REPLACE (default)
      if (options.mode === "replace") {

        await Promise.all(
          (existing[field] || []).map(removeFile)
        );

        req.body[field] = uploaded;
      }

      // 🟡 MERGE (optional)
      else if (options.mode === "merge") {

        req.body[field] = [
          ...(existing[field] || []),
          ...uploaded
        ];
      }
    }
  }

  next();
});