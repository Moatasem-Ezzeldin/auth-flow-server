const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // 1) Create transporter ( services that will send email like "gmail", "mialtrap", "sendGrid" )
    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT, // if secure false port = 587,  if secure true port = 465
        secure: true,
        // service: "gmail",
        auth: {
            user: process.env.EMAIL_AUTH_USER,
            pass: process.env.EMAIL_AUTH_PASS,
        },
    });

    // 2) Define email options ( like from, to, subject, email, content )
    const mailOptions = {
        from: "E-shop App <mo@gmail.com>",
        to: options.email,
        subject: options.subject,
        text: options.message,

    };

    // 3) Send email
    await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;