// //api/send-payment-confirmation.ts
// import type { VercelRequest, VercelResponse } from '@vercel/node';
// import fetch from 'node-fetch';

// // Environment variables (configured in Vercel)
// const TENANT_ID = process.env.TENANT_ID!;
// const CLIENT_ID = process.env.CLIENT_ID!;
// const CLIENT_SECRET = process.env.CLIENT_SECRET!;
// const SENDER_EMAIL = process.env.SENDER_EMAIL!; // e.g., "support@applywizz.com"

// // Get Microsoft Graph access token
// async function getAccessToken(): Promise<string> {
//   const url = `https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`;
//   const params = new URLSearchParams();
//   params.append('client_id', CLIENT_ID);
//   params.append('scope', 'https://graph.microsoft.com/.default');
//   params.append('client_secret', CLIENT_SECRET);
//   params.append('grant_type', 'client_credentials');

//   const res = await fetch(url, { method: 'POST', body: params });
//   const data = await res.json();

//   if (!res.ok) throw new Error(`Failed to get access token: ${JSON.stringify(data)}`);
//   return data.access_token;
// }

// // Send email using Microsoft Graph API
// async function sendEmail(to: string, subject: string, htmlBody: string) {
//   const token = await getAccessToken();

//   const payload = {
//     message: {
//       subject,
//       body: {
//         contentType: 'HTML',
//         content: htmlBody,
//       },
//       toRecipients: [{ emailAddress: { address: to } }],
//       from: { emailAddress: { address: 'support@skillpassport.com' } }, // shown as sender
//     },
//     saveToSentItems: 'false',
//   };

//   const res = await fetch(`https://graph.microsoft.com/v1.0/users/${SENDER_EMAIL}/sendMail`, {
//     method: 'POST',
//     headers: {
//       Authorization: `Bearer ${token}`,
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify(payload),
//   });

//   if (!res.ok) {
//     const text = await res.text();
//     throw new Error(`Failed to send email: ${text}`);
//   }
// }

// // Main handler for Vercel
// export default async function handler(req: VercelRequest, res: VercelResponse) {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

//   if (req.method === 'OPTIONS') return res.status(200).end();
//   if (req.method !== 'POST') return res.status(405).send('Method not allowed');

//   try {
//     const { email = "tunguturidineshkumar@gmail.com", name = "Valued Customer", paymentDetails = {} } = req.body;
//     if (!email) return res.status(400).json({ success: false, error: "Email is required" });

//     const formattedDate = new Date(
//       paymentDetails.payment_date || new Date()
//     ).toLocaleDateString("en-US", {
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     });

//     // Build the HTML email template
//     const htmlBody = `
//       <html>
//         <body style="font-family: Arial, sans-serif; background:#f9f9f9; padding:30px;">
//           <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
//             <div style="background:#4F46E5; color:#fff; padding:25px; text-align:center;">
//               <h2>Payment Confirmation – Skill Passport Subscription</h2>
//             </div>
//             <div style="padding:30px; color:#333;">
//               <p>Date: <b>${formattedDate}</b></p>
//               <p>Dear <b>${name}</b>,</p>
//               <p>Thank you for your payment of <b>$${paymentDetails.amount || "14.99"} USD</b> for your <b>Skill Passport Premium Subscription</b>.</p>

//               <div style="background:#f4f4f4; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
//                 <p><b>Transaction ID:</b> ${paymentDetails.transaction_id || "SP-123456789"}</p>
//                 <p><b>Date:</b> ${formattedDate}</p>
//                 <p><b>Payment Method:</b> ${paymentDetails.payment_method || "PayPal"}</p>
//               </div>

//               <p>Your account is now active and ready to use. Below are your login credentials:</p>
//               <div style="background:#eef2ff; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
//                 <p><b>Login Email:</b> ${email}</p>
//                 <p><b>Temporary Password:</b> Created@123</p>
//               </div>

//               <p>You can log in to your dashboard using the credentials above and change your password after logging in.</p>

//               <div style="text-align:center; margin:30px 0;">
//                 <a href="https://skillpassportai.com/dashboard" 
//                    style="background:#4F46E5; color:#fff; padding:12px 25px; text-decoration:none; border-radius:5px;">
//                    Go to Dashboard
//                 </a>
//               </div>

//               <p>If you have any questions, contact us at 
//                 <a href="mailto:support@skillpassport.com">support@skillpassport.com</a>.
//               </p>

//               <p style="margin-top:30px;">— The Skill Passport Team</p>
//             </div>
//           </div>
//         </body>
//       </html>
//     `;

//     await sendEmail(email, 'Payment Confirmation – Skill Passport Subscription', htmlBody);

//     return res.status(200).json({ success: true, message: `Email sent to ${email}` });
//   } catch (err) {
//     console.error('💥 Email send failed:', err);
//     return res.status(500).json({ success: false, error: (err as Error).message });
//   }
// }



import { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

// Function to send email to the user
const sendPaymentConfirmation = async (userEmail: string, userFullName: string, orderId: string, paymentDetails: any) => {
  try {
    // Configure the email transporter (using Gmail in this case)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || 'support@skillpassportai.com', // Replace with your Gmail email
        pass: process.env.EMAIL_APP_PASSWORD || 'lppi zufm myrp vwlc', // Replace with your Gmail app password
      },
    });

    // HTML email template
    const html = `
    <html>
      <body style="font-family: Arial, sans-serif; background:#f9f9f9; padding:30px;">
        <div style="max-width:600px; margin:auto; background:#fff; border-radius:8px; overflow:hidden; box-shadow:0 0 10px rgba(0,0,0,0.1);">
          <div style="background:#4F46E5; color:#fff; padding:25px; text-align:center;">
            <h2>Payment Confirmation – Skill Passport Subscription</h2>
          </div>
          <div style="padding:30px; color:#333;">
            <p>Date: <b>${new Date().toLocaleDateString("en-US")}</b></p>
            <p>Dear <b>${userFullName}</b>,</p>
            <p>Thank you for your payment of <b>$${paymentDetails.amount || '14.99'} USD</b> for your <b>Skill Passport Premium Subscription</b>.</p>

            <div style="background:#f4f4f4; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
              <p><b>Transaction ID:</b> ${paymentDetails.transaction_id || orderId}</p>
              <p><b>Payment Date:</b> ${new Date(paymentDetails.payment_date).toLocaleString()}</p>
              <p><b>Payment Method:</b> ${paymentDetails.payment_method || 'PayPal'}</p>
            </div>

            <p>Your account is now active and ready to use. Below are your login credentials:</p>
            <div style="background:#eef2ff; padding:15px 20px; border-left:4px solid #4F46E5; border-radius:5px; margin:20px 0;">
              <p><b>Login Email:</b> ${userEmail}</p>
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

    // Mail options
    const mailOptions = {
      from: '"Skill Passport" <support@skillpassportai.com>',
      to: userEmail,
      subject: 'Payment Confirmation – Skill Passport Subscription',
      html, // Pass the HTML content
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Payment confirmation email sent to ${userEmail} (Message ID: ${info.messageId})`);

    return { success: true, message: `Email sent to ${userEmail}`, messageId: info.messageId };
  } catch (error) {
    console.error('💥 Payment email send failed:', error);
    return { success: false, error: error.message || 'Internal Server Error' };
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  try {
    const { email, name, paymentDetails } = req.body;

    if (!email || !name || !paymentDetails) {
      return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    // Send the payment confirmation email
    const result = await sendPaymentConfirmation(email, name, paymentDetails.transaction_id, paymentDetails);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    return res.status(200).json({ success: true, message: result.message, messageId: result.messageId });
  } catch (error) {
    console.error('💥 Error processing payment confirmation:', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal Server Error' });
  }
}
