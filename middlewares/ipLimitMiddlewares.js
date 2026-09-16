const redis = require("../config/redis");

const ipLimiter = ({ windowMinutes = 15, max = 100, message }) => async (req, res, next) => {
    try{
        const ip = req.ip;

        const key = `rl:${req.method}:${req.baseUrl}${req.route?.path}ip:${ip}`;
        const windowSec = windowMinutes * 60;

        const current = await redis.get(key);

        if (!current) {
            await redis.set(key, 1, { ex: windowSec });
            return next();
        }

        if (Number(current) >= max) {
            return res.status(429).json({
                status: "error",
                message: message || "Too many requests",
            });
        }

        await redis.incr(key);

        next();

    } catch(err) {

        console.log("IP Limiter Error: ", err.message);

        next();

    }

};

module.exports = ipLimiter;