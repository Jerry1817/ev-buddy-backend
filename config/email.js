const nodemailer = require("nodemailer");

async function sendOtpEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: '"EV Buddy" <no-reply@evbuddy.com>',
    to: email,
    subject: "Your OTP for EV Buddy",
    html: `<p>Your verification code is <b>${otp}</b></p>
           <p>This OTP will expire in 10 minutes.</p>`,
  });
}

module.exports=sendOtpEmail