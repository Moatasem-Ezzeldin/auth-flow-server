const ApiError = require("../utils/apiError");
const fileType = require("file-type");
const asyncHandler = require("express-async-handler");

// check required + size + type (3 in 1)
const smartFileGuard = (rules = {}, mode = "edit") => asyncHandler( async(req, res, next) => {
    const filesObj = req.files;
    // 1) not found files at all 
    if(!filesObj || Object.keys(filesObj).length === 0) {
        if(mode === "add") {
            return next(new ApiError(`Files are required`, 400)); 
        }
        return next();
    }
    // 2) loop fields
    for (const field in rules) {
        const files = filesObj[field];
        const config = rules[field];
        const maxSizeMB = config.maxSize ? config.maxSize / (1024 * 1024) : null;

        // if field requred return error
        if(config.required && (!files || files.length === 0)) 
            return next(new ApiError(`${field} is required`, 400)); 
        // if field not requred continue new field check
        if(!files || files.length === 0) 
            continue;

        // 3) loop files 
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const fileIndex = i + 1;
            // SIZE CHECK
            if(config.maxSize && file.size > config.maxSize) 
                return next(new ApiError(`${field} file #${fileIndex} exceeds ${maxSizeMB}MB limit`, 400));

            // TYPE DETECTION
            const detected = await fileType.fromBuffer(file.buffer);

            if (!detected) 
                return next(new ApiError(`${field} file #${fileIndex} has unknown type`, 400));

            // =========================
            // 🖼 IMAGE SMART CHECK
            // =========================
            if (config.type === "image") {
                if (config.allowed && config.allowed.length > 0) {
                    if (!config.allowed.includes(detected.mime)) 
                        return next(new ApiError(`${field} file #${fileIndex} image type not allowed`, 400));
                } else {
                    if (!detected.mime.startsWith("image/"))
                        return next(new ApiError(`${field} file #${fileIndex} must be an image`, 400));
                }
            }

            // =========================
            // 🎥 VIDEO SMART CHECK
            // =========================
            if (config.type === "video") {
                if (config.allowed && config.allowed.length > 0) {
                    if (!config.allowed.includes(detected.mime)) 
                        return next(new ApiError(`${field} file #${fileIndex} video type not allowed`, 400));
                } else {
                    if (!detected.mime.startsWith("video/"))
                        return next(new ApiError(`${field} file #${fileIndex} must be a video`, 400));
                }
            }

            // =========================
            // 🎥 AUDIO SMART CHECK
            // =========================
            if (config.type === "audio") {
                if (config.allowed && config.allowed.length > 0) {
                    if (!config.allowed.includes(detected.mime)) 
                        return next(new ApiError(`${field} file #${fileIndex} audio type not allowed`, 400));
                } else {
                    if (!detected.mime.startsWith("audio/"))
                        return next(new ApiError(`${field} file #${fileIndex} must be a audio`, 400));
                }
            }

            // =========================
            // 📦 RAW SMART CHECK
            // =========================
            if (config.type === "raw") {
                if (config.allowed && config.allowed.length > 0) {
                    if (!config.allowed.includes(detected.mime)) 
                        return next(new ApiError(`${field} file #${fileIndex} type not allowed`, 400));
                }
                // fallback (no allowed list)
                // يعني يقبل أي fileType detected (raw system)
            }

            // attach metadata
            file.detectedType = {
            mime: detected.mime,
            ext: detected.ext,
            type: config.type,
            };
        }

        next();
    }
});

module.exports = smartFileGuard;