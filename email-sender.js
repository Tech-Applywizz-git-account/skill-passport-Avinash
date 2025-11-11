// email-sender.js
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');

// Supabase configuration
const supabaseUrl = 'https://xficomhdacoloehbzmlt.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhmaWNvbWhkYWNvbG9laGJ6bWx0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODY5Mzc0MSwiZXhwIjoyMDc0MjY5NzQxfQ.wlqCw_-Nb-cznPYPzYbFYWi_ttzyZeNjEpw5jcxwWwc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// SMTP configuration - USING YOUR CREDENTIALS
const smtpConfig = {
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'support@skillpassportai.com',
    pass: 'lppi zufm myrp vwlc'
  },
  tls: {
    rejectUnauthorized: false
  }
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

async function verifySMTPConnection() {
  try {
    console.log('🔧 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully');
    return true;
  } catch (error) {
    console.error('❌ SMTP connection failed:', error);
    return false;
  }
}

async function sendPendingEmails() {
  try {
    console.log('\n📧 Checking for pending emails...');

    // Get pending emails (oldest first)
    const { data: pendingEmails, error } = await supabase
      .from('pending_emails')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error) {
      console.error('Error fetching pending emails:', error);
      return;
    }

    if (pendingEmails.length === 0) {
      console.log('✅ No pending emails found.');
      return;
    }

    console.log(`📨 Found ${pendingEmails.length} pending emails`);

    let successCount = 0;
    let failCount = 0;

    for (const email of pendingEmails) {
      try {
        console.log(`\n🔄 Processing email for: ${email.to_email}`);

        // Parse the email content to extract subject and body
        const emailLines = email.email_content.split('\n');
        let subject = '';
        let body = '';
        let inBody = false;

        for (const line of emailLines) {
          if (line.startsWith('Subject: ')) {
            subject = line.replace('Subject: ', '');
          } else if (line.startsWith('Date: ')) {
            // Skip date line
          } else if (line.startsWith('From: ')) {
            // Skip from line
          } else if (line.startsWith('To: ')) {
            // Skip to line
          } else if (line.trim() === '') {
            inBody = true;
          } else if (inBody) {
            body += line + '\n';
          }
        }

        // Create email message
        const mailOptions = {
          from: 'Skill Passport <support@skillpassportai.com>',
          to: `${email.to_name} <${email.to_email}>`,
          subject: subject.trim(),
          text: body.trim(),
          html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .transaction-details { background: #f8f9fa; padding: 20px; margin: 20px 0; border-left: 4px solid #667eea; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Payment Confirmed!</h1>
            <p>Your Skill Passport Premium Subscription is now active</p>
        </div>
        <div class="content">
            <p>Dear <strong>${email.to_name}</strong>,</p>
            <p>Thank you for your payment of <strong>${email.amount} ${email.currency}</strong> for your Skill Passport Premium Subscription.</p>
            
            <div class="transaction-details">
                <h3>📋 Transaction Details</h3>
                <p><strong>Transaction ID:</strong> ${email.order_id}</p>
                <p><strong>Date:</strong> ${new Date(email.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                <p><strong>Payment Method:</strong> PayPal</p>
                <p><strong>Amount:</strong> ${email.amount} ${email.currency}</p>
            </div>

            <p><strong>Your login details:</strong></p>
            <p>Email: ${email.to_email}</p>
            <p>Password: Created@123 (You can change this after login)</p>

            <p>Your account is now active and ready to use. You can access all premium features immediately.</p>
            
            <p>If you have any questions or need assistance with your account, please don't hesitate to contact our support team.</p>
            
            <p>Welcome aboard and best of luck in your job search! 🚀</p>
        </div>
        <div class="footer">
            <p><strong>— The Skill Passport Team</strong></p>
            <p>Email: <a href="mailto:support@skillpassportai.com">support@skillpassportai.com</a></p>
        </div>
    </div>
</body>
</html>`
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully to ${email.to_email}`);
        console.log(`   Message ID: ${info.messageId}`);

        // Update status in database
        await supabase
          .from('pending_emails')
          .update({
            status: 'sent',
            sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        successCount++;

        // Small delay between emails to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (emailError) {
        console.error(`❌ Failed to send email to ${email.to_email}:`, emailError.message);
        
        // Update status to failed
        await supabase
          .from('pending_emails')
          .update({
            status: 'failed',
            error_message: emailError.message,
            updated_at: new Date().toISOString()
          })
          .eq('id', email.id);

        failCount++;
      }
    }

    console.log(`\n📊 Email sending completed:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   ⏰ Next check in 1 minute...`);
    
  } catch (error) {
    console.error('❌ Error in email sending process:', error);
  }
}

// Main function
async function main() {
  console.log('🚀 Starting Skill Passport Email Sender');
  console.log('========================================');
  
  // Verify SMTP connection first
  const isConnected = await verifySMTPConnection();
  if (!isConnected) {
    console.log('❌ Cannot start email sender due to SMTP connection issues');
    process.exit(1);
  }

  console.log('\n📧 Email Sender Started Successfully!');
  console.log('   SMTP: support@skillpassportai.com');
  console.log('   Database: xficomhdacoloehbzmlt.supabase.co');
  console.log('   Check interval: Every 1 minute');
  console.log('========================================\n');

  // Run immediately
  await sendPendingEmails();

  // Then run every 1 minute
  setInterval(sendPendingEmails, 1 * 60 * 1000);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down email sender...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Shutting down email sender...');
  process.exit(0);
});

// Start the application
main().catch(console.error);