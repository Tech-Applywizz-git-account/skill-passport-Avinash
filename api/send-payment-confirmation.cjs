// api/send-payment-confirmation.js
const nodemailer = require("nodemailer");
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || 'https://xficomhdacoloehbzmlt.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Email transporter setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'support@skillpassportai.com',
    pass: process.env.EMAIL_APP_PASSWORD || 'lppi zufm myrp vwlc'
  }
});

// Verify email configuration on startup
transporter.verify(function (error, success) {
  if (error) {
    console.error('❌ Email transporter error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});

// Function to send payment confirmation email
const sendPaymentConfirmationEmail = async (userEmail, userName, paymentDetails = {}) => {
  const formattedDate = new Date(paymentDetails.payment_date || new Date()).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const mailOptions = {
    from: '"Skill Passport" <support@skillpassportai.com>',
    to: userEmail,
    subject: 'Payment Confirmation – Skill Passport Premium Subscription',
    text: `
Dear ${userName},

Thank you for your payment of $${paymentDetails.amount || '29.99'} USD for your Skill Passport Premium Subscription.

Transaction Details:
- Transaction ID: ${paymentDetails.transaction_id || 'Pending'}
- Date: ${formattedDate}
- Payment Method: ${paymentDetails.payment_method || 'Credit Card'}
- Amount: $${paymentDetails.amount || '29.99'} USD

Your account is now active and ready to use. You can access all premium features immediately.

If you have any questions or need assistance, please contact us at support@skillpassport.com.

— The Skill Passport Team
    `.trim(),
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4F46E5; color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { padding: 30px; background: #f9f9f9; border-radius: 0 0 8px 8px; }
    .footer { padding: 20px; text-align: center; font-size: 14px; color: #666; }
    .payment-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4F46E5; }
    .button { background: #4F46E5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Payment Confirmed!</h1>
    </div>
    <div class="content">
      <p>Dear <strong>${userName}</strong>,</p>
      <p>Thank you for your payment for your <strong>Skill Passport Premium Subscription</strong>.</p>
      
      <div class="payment-details">
        <h3 style="margin-top: 0;">Transaction Details</h3>
        <p><strong>Amount:</strong> $${paymentDetails.amount || '29.99'} USD</p>
        <p><strong>Transaction ID:</strong> ${paymentDetails.transaction_id || 'Pending'}</p>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Payment Method:</strong> ${paymentDetails.payment_method || 'Credit Card'}</p>
      </div>
      
      <p>Your account is now active and ready to use. You can access all premium features immediately.</p>
      
      <a href="https://your-app-url.com/dashboard" class="button">Go to Dashboard</a>
      
      <p>If you have any questions or need assistance, please don't hesitate to contact our support team at <a href="mailto:support@skillpassport.com">support@skillpassport.com</a>.</p>
      
      <p>Best regards,<br>The Skill Passport Team</p>
    </div>
    <div class="footer">
      <p>Skill Passport &copy; ${new Date().getFullYear()}. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `.trim()
  };

  try {
    console.log(`📧 Sending payment confirmation to: ${userEmail}`);
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${userEmail}, Message ID: ${info.messageId}`);
    return { 
      success: true, 
      messageId: info.messageId,
      email: userEmail
    };
  } catch (error) {
    console.error(`❌ Error sending email to ${userEmail}:`, error);
    throw new Error(`Failed to send email to ${userEmail}: ${error.message}`);
  }
};

// Main function to handle the API request
const handlePaymentConfirmation = async (userEmail, userName, paymentDetails) => {
  try {
    console.log(`\n🚀 Processing payment confirmation for: ${userEmail}`);
    
    // Validate required parameters
    if (!userEmail) {
      throw new Error('User email is required');
    }

    if (!userName) {
      // Try to get user name from Supabase if not provided
      console.log('🔍 Fetching user details from Supabase...');
      const { data: users, error } = await supabase.auth.admin.listUsers();
      
      if (!error && users) {
        const user = users.users.find(u => u.email === userEmail);
        if (user && user.user_metadata?.full_name) {
          userName = user.user_metadata.full_name;
          console.log(`👤 Found user name: ${userName}`);
        }
      }
      
      // If still no name, use default
      if (!userName) {
        userName = 'Valued Customer';
        console.log('⚠️ Using default user name');
      }
    }

    // If payment details are not provided, try to fetch from database
    if (!paymentDetails || Object.keys(paymentDetails).length === 0) {
      console.log('🔍 Fetching payment details from database...');
      
      // Get user ID first
      const { data: users, error: userError } = await supabase.auth.admin.listUsers();
      if (!userError && users) {
        const user = users.users.find(u => u.email === userEmail);
        if (user) {
          const { data: payments, error: paymentError } = await supabase
            .from('paymentssupertable')
            .select('user_id, amount, transaction_id, payment_date, payment_method')
            .eq('user_id', user.id)
            .order('payment_date', { ascending: false })
            .limit(1);

          if (!paymentError && payments && payments.length > 0) {
            paymentDetails = payments[0];
            console.log(`💰 Found payment: $${paymentDetails.amount}`);
          }
        }
      }
    }

    // Send the email
    const result = await sendPaymentConfirmationEmail(userEmail, userName, paymentDetails);
    
    console.log(`🎉 Successfully processed payment confirmation for ${userEmail}`);
    return result;
    
  } catch (error) {
    console.error(`💥 Payment confirmation failed for ${userEmail}:`, error.message);
    throw error;
  }
};

// API Handler
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed. Use POST.' 
    });
  }

  try {
    const { email, name, paymentDetails } = req.body;

    console.log('📨 Received API request:', { email, name });

    // Validate required fields
    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required'
      });
    }

    // Process the payment confirmation
    const result = await handlePaymentConfirmation(email, name, paymentDetails);

    // Return success response
    return res.status(200).json({
      success: true,
      message: 'Payment confirmation email sent successfully',
      data: result
    });

  } catch (error) {
    console.error('💥 API Error:', error);
    
    // Return error response
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
};