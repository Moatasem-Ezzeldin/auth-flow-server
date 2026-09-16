const cloudinary = require("../config/cloudinary");
const ApiError = require("../utils/apiError");

const removeFile = async (file) => {
  if (!file?.public_id) return;

  await cloudinary.uploader.destroy(file.public_id, {
    resource_type: file.type || "image",
  });
};

exports.smartDelete = (options={}) =>
  async (req, res, next) => {
    const existing = req.existingDoc || req.user;
    if (!existing) return next(new ApiError("Document not found", 404));

    // حذف كل الملفات داخل أي field
    const fields = options.fields || [];
    for (const field of fields) {
      const value = existing[field];
      if(!value) continue;

      if (Array.isArray(value)) {
        await Promise.all(value.map(removeFile));
      } else {
        await removeFile(value);
      }
    }

    return next();
  };