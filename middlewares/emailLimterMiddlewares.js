const redis = require("../config/redis");

const emailLimiter = ({ windowMinutes = 15, max = 5 }) => async (req, res, next) => {

    try{

        const email = req.body.email?.toLowerCase();
        if (!email) return next();

        const key = `rl:email:${req.method}:${req.baseUrl}${req.route?.path}${email}`;
        const windowSec = windowMinutes * 60;

        const current = await redis.get(key);

        if (!current) {
            await redis.set(key, 1, { ex: windowSec });
            return next();
        }

        if (Number(current) >= max) {
            return res.status(429).json({
                status: "error",
                message: "Too many attempts, try later",
            });
        }

        await redis.incr(key);

        next();

    } catch(err) {

        console.log("Email Limiter Error: ", err.message);

        next();

    }

};

module.exports = emailLimiter;