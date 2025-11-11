// server.js
const nodemailer = require("nodemailer");
const { createClient } = require('@supabase/supabase-js');
const cron = require('node-cron');

// Supabase connection setup
const supabaseUrl = 'https://your-supabase-url.supabase.co'; // Replace with your Supabase URL
const supabaseKey = 'your-supabase-key'; // Replace with your Supabase API key
const supabase = createClient(supabaseUrl, supabaseKey);

// Email setup using Nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail', // Change if using a different service
  auth: {
    user: 'support@skillpassportai.com',
    pass: 'lppi zufm myrp vwlc' // App password
  }
});

// Function to send email
const sendEmail = async (userEmail, userName, paymentDetails) => {
  const mailOptions = {
    from: 'support@skillpassport.com', // Sender email address
    to: userEmail, // Recipient email address
    subject: 'Payment Confirmation – Skill Passport Subscription',
    text: `
    Dear ${userName},
    
    Thank you for your payment of $${paymentDetails.amount} USD for your Skill Passport Premium Subscription.
    Transaction ID: ${paymentDetails.transaction_id}
    Date: ${paymentDetails.payment_date}
    Payment Method: ${paymentDetails.payment_method}
    
    Your account is now active and ready to use.
    
    If you have any questions, contact us at support@skillpassport.com.
    
    — The Skill Passport Team
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${userEmail}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// Fetch users and their payment details
const fetchUsersAndPayments = async () => {
  try {
    // Fetch users from the users table
    const { data: users, error: usersError } = await supabase
      .from('public.users')
      .select('id, email, full_name'); // Adjust fields as needed

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    // Fetch payment details from the paymentssupertable
    const { data: payments, error: paymentsError } = await supabase
      .from('public.paymentssupertable')
      .select('user_id, amount, transaction_id, payment_date, payment_method'); // Adjust fields as needed

    if (paymentsError) {
      console.error('Error fetching payments:', paymentsError);
      return;
    }

    // For each user, send the payment confirmation email
    for (const user of users) {
      const payment = payments.find(p => p.user_id === user.id);
      
      if (payment) {
        await sendEmail(user.email, user.full_name, payment);
      } else {
        console.log(`No payment found for user: ${user.email}`);
      }
    }
  } catch (error) {
    console.error('Error in fetching data:', error);
  }
};

// Schedule the task to run every day at 9 AM
cron.schedule('0 9 * * *', () => {
  console.log('Running payment confirmation email task...');
  fetchUsersAndPayments();
});

console.log('Server is running and cron job is set up.');
