const { validationResult } = require("express-validator");
const ApiError = require("../utils/apiError");

const validatorMiddleware = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        const msg = errors.array().map(e => e.msg).join(", ");
        return next(new ApiError(msg, 400));
    }

    next();
};

module.exports = validatorMiddleware;