const nodemailer = require('nodemailer');
require('dotenv').config();
const sendEmail = async (options) => {
  // For production, use a transactional email service like SendGrid, Postmark, or AWS SES.
  // For development, you can use a service like mailtrap.io or a configured Gmail account with an "App Password".
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: '"Opus Sync" <no-reply@opussync.com>', // Use your app's name and email
    to: options.email,
    subject: options.subject,
    text: options.message,
    // html: `<b>${options.message}</b>` // You can also send HTML content
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };