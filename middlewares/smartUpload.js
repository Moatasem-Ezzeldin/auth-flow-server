const uploadToCloudinary = require("../utils/upload/uploadToCloudinary");
const asyncHandler = require("express-async-handler");

exports.smartUpload = (modelName) => asyncHandler(async (req, res, next) => {
  if (!req.files || Object.keys(req.files).length === 0) return next();

  for (const field in req.files) {
    const files = req.files[field];

    const uploaded = await Promise.all(
      files.map(file =>
        uploadToCloudinary(file, modelName, field)
      )
    );

    // إذا ملف واحد → object
    req.body[field] = files.length === 1 ? (uploaded[0]) : (uploaded);
  }
  next();
});