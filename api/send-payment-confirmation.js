import nodemailer from "nodemailer";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")
    return res.status(405).json({ success: false, error: "Method not allowed" });

  try {
    const { email, name = "Valued Customer", paymentDetails = {} } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "Email is required" });

    const formattedDate = new Date(
      paymentDetails.payment_date || new Date()
    ).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // ✅ Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER || "support@skillpassportai.com",
        pass: process.env.EMAIL_APP_PASSWORD || "lppi zufm myrp vwlc",
      },
    });

    // ✅ Build the HTML email template
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background:#f9f9f9; padding:30px;">
        <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <div style="background:#4F46E5; color:#fff; padding:25px; text-align:center;">
            <h2>Payment Confirmation – Skill Passport Subscription</h2>
          </div>
          <div style="padding:30px; color:#333;">
            <p>Date: <b>${formattedDate}</b></p>
            <p>Dear <b>${name}</b>,</p>
            <p>Thank you for your payment of <b>$${paymentDetails.amount || "14.99"} USD</b> for your <b>Skill Passport Premium Subscription</b>.</p>

            <div style="background:#f4f4f4; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
              <p><b>Transaction ID:</b> ${paymentDetails.transaction_id || "SP-123456789"}</p>
              <p><b>Date:</b> ${formattedDate}</p>
              <p><b>Payment Method:</b> ${paymentDetails.payment_method || "PayPal"}</p>
            </div>

            <p>Your account is now active and ready to use. Below are your login credentials:</p>
            <div style="background:#eef2ff; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
              <p><b>Login Email:</b> ${email}</p>
              <p><b>Temporary Password:</b> Created@123</p>
            </div>

            <p>You can log in to your dashboard using the credentials above and change your password after logging in.</p>

            <div style="text-align:center; margin:30px 0;">
              <a href="https://skillpassportai.com/dashboard" 
                 style="background:#4F46E5; color:#fff; padding:12px 25px; text-decoration:none; border-radius:5px;">
                 Go to Dashboard
              </a>
            </div>

            <p>If you have any questions, contact us at 
              <a href="mailto:support@skillpassport.com">support@skillpassport.com</a>.
            </p>

            <p style="margin-top:30px;">— The Skill Passport Team</p>
          </div>
        </div>
      </body>
    </html>`;

    // ✅ Mail options
    const mailOptions = {
      from: '"Skill Passport" <support@skillpassportai.com>',
      to: email,
      subject: "Payment Confirmation – Skill Passport Subscription",
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent to ${email} (Message ID: ${info.messageId})`);

    return res.status(200).json({
      success: true,
      message: `Email sent to ${email}`,
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("💥 Email send failed:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Internal Server Error",
    });
  }
}
