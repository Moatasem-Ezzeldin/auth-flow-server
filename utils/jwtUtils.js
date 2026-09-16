const jwt = require("jsonwebtoken");

const createAccessJwtToken = (userId, sessionId) => {
    return jwt.sign(
        { userId, sessionId }, 
        process.env.ACCESS_JWT_SECRET_KEY, 
        { expiresIn: process.env.ACCESS_JWT_EXPIRE_TIME }
    );
}; 

const createRefreshJwtToken = (userId, sessionId) => {
    return jwt.sign(
        { userId, sessionId }, 
        process.env.REFRECH_JWT_SECRET_KEY, 
        { expiresIn: process.env.REFRECH_JWT_EXPIRE_TIME }
    );
};

const createResetJwtToken = (userId, verified = false, expiresIn = "30m") => {
    return jwt.sign(
        { 
            userId, 
            verified 
        }, 
        process.env.RESET_JWT_SECRET_KEY, 
        { expiresIn }
    );
};

const verifyJwtToken = (token, secretKey) => {
    return jwt.verify(token, secretKey);
};

module.exports = {
    createAccessJwtToken,
    createRefreshJwtToken,
    createResetJwtToken,
    verifyJwtToken
};
