const bcrypt = require("bcryptjs");

const hashPassword = async (password, char = 12) => await bcrypt.hash(password, char);

const comparePassword = async (plainPassword, hashedPassword) => await bcrypt.compare(plainPassword, hashedPassword);

module.exports = {
    hashPassword,
    comparePassword
};
