const nodemailer = require("nodemailer");

// const testAccount = await nodemailer.createTestAccount()
const transport = nodemailer.createTransport({
  auth: {
    user: process.env.NODEMAILER_USER,
    pass: process.env.NODEMAILER_PASS,
    // user: testAccount.user,
    // pass: testAccount.pass
  },
  host: "smtp.gmail.com",
  // host: "smtp.etheral.email",
});

const mailer = async ({ subject, to, text, html }) => {
  await transport.sendMail({
    subject: subject || "Test Subject",
    to: to || "rioters2810@gmail.com",
    text: text || "Test nodemailer",
    html: html || "<h1>This is sent from my Express API</h1>",
  });
};

module.exports = mailer;
