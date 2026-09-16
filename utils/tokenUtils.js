const crypto = require("crypto");

const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const createRandomId = () => crypto.randomUUID();

const createRandomToken = (size = 32) => crypto.randomBytes(size).toString("hex");

const createOtp = (length = 6) => Math.floor(10 ** (length - 1) + Math.random() * 9 * 10 ** (length - 1)).toString();


module.exports = {
    hashToken,
    createRandomId,
    createRandomToken,
    createOtp
};