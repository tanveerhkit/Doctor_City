const nodemailer = require("nodemailer");
require("dotenv").config();

const hasEmailConfig = Boolean(process.env.EMAIL_ADMIN && process.env.ADMIN_PASS);

const transporter = hasEmailConfig
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_ADMIN,
        pass: process.env.ADMIN_PASS,
      },
    })
  : null;

async function sendEmail(to, subject, html) {
  if (!hasEmailConfig || !transporter) {
    console.log(`[email skipped] ${subject} -> ${to}`);
    return { skipped: true };
  }

  await transporter.sendMail({
    from: `"Doctor City" <${process.env.EMAIL_ADMIN}>`,
    to,
    subject,
    html,
  });

  return { skipped: false };
}

module.exports = sendEmail;

