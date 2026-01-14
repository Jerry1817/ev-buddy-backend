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
  from: '"EV Buddy"ajbca2025@gmail.com',
  to: email,
  subject: "Your EV Buddy Verification Code",
  html: `
  <div style="margin:0; padding:0; background-color:#f4f7fb; font-family:Arial, Helvetica, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 0;">
      <tr>
        <td align="center">
          <table width="100%" max-width="480px" cellpadding="0" cellspacing="0" style="background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 8px 30px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#059669,#047857); padding:24px; text-align:center;">
                <h1 style="color:#ffffff; margin:0; font-size:22px;">
                  ⚡ EV Buddy
                </h1>
                <p style="color:#d1fae5; margin:6px 0 0; font-size:14px;">
                  Email Verification
                </p>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <h2 style="margin:0 0 10px; color:#111827; font-size:20px;">
                  Verify your email
                </h2>

                <p style="margin:0 0 20px; color:#4b5563; font-size:14px; line-height:1.6;">
                  Thank you for registering with <b>EV Buddy</b>.  
                  Use the OTP below to verify your email address.
                </p>

                <!-- OTP Box -->
                <div style="background:#ecfdf5; border:1px dashed #10b981; padding:18px; text-align:center; border-radius:10px; margin-bottom:20px;">
                  <p style="margin:0; font-size:14px; color:#065f46;">
                    Your Verification Code
                  </p>
                  <h1 style="margin:10px 0 0; font-size:32px; letter-spacing:6px; color:#047857;">
                    ${otp}
                  </h1>
                </div>

                <p style="margin:0; font-size:13px; color:#6b7280;">
                  ⏱ This OTP will expire in <b>10 minutes</b>.
                </p>

                <p style="margin:16px 0 0; font-size:13px; color:#6b7280;">
                  If you didn’t request this, please ignore this email.
                </p>
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td style="background:#f9fafb; padding:16px; text-align:center;">
                <p style="margin:0; font-size:12px; color:#9ca3af;">
                  © ${new Date().getFullYear()} EV Buddy • All rights reserved
                </p>
              </td>
            </tr>

          </table>
        </td>
      </tr>
    </table>
  </div>
  `,
});

}

module.exports=sendOtpEmail