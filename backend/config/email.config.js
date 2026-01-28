const nodemailer = require('nodemailer');

// Email configuration
// For Gmail, you need to:
// 1. Enable 2-factor authentication in your Google account
// 2. Generate an "App Password" from Google Account settings
// 3. Use that app password here (not your regular Gmail password)

// Create transporter directly with optimized settings
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  pool: true, // Use pooled connections for faster delivery
  maxConnections: 5, // Max simultaneous connections
  maxMessages: 100 // Max messages per connection
});

// Send password reset email with link
const sendPasswordResetEmail = async (to, resetLink, userName) => {
  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'biharophthalmic2022@gmail.com'
    },
    to: to,
    subject: 'Reset Your Password - Bihar Ophthalmic Association',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border: 1px solid #ddd;
          }
          .header {
            background: white;
            padding: 30px;
            text-align: center;
            border-bottom: 2px solid #0B3C5D;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            color: #0B3C5D;
            margin: 10px 0 5px 0;
            font-size: 24px;
          }
          .header p {
            color: #666;
            margin: 0;
            font-size: 14px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .greeting {
            font-size: 16px;
            color: #333;
            margin-bottom: 20px;
          }
          .message {
            color: #555;
            margin-bottom: 30px;
            font-size: 15px;
            line-height: 1.6;
          }
          .button-container {
            text-align: center;
            margin: 30px 0;
          }
          .reset-button {
            display: inline-block;
            padding: 14px 35px;
            background: #0B3C5D;
            color: white !important;
            text-decoration: none;
            border-radius: 5px;
            font-weight: 600;
            font-size: 16px;
          }
          .info-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin: 25px 0;
            border-radius: 4px;
          }
          .info-box p {
            margin: 5px 0;
            font-size: 14px;
            color: #666;
          }
          .link-text {
            word-break: break-all;
            color: #0B3C5D;
            font-size: 12px;
            margin-top: 15px;
            padding: 10px;
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 4px;
          }
          .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
          }
          .footer p {
            margin: 5px 0;
            color: #666;
            font-size: 13px;
          }
          .footer-note {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid #dee2e6;
            color: #999;
            font-size: 12px;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <!-- Header with Logo -->
          <div class="header">
            <img src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png" alt="BOA Logo" class="logo">
            <h1>Password Reset Request</h1>
            <p>Bihar Ophthalmic Association</p>
          </div>
          
          <!-- Main Content -->
          <div class="content">
            <div class="greeting">Hello ${userName || 'User'},</div>
            
            <div class="message">
              <p>We received a request to reset your password for your Bihar Ophthalmic Association account.</p>
              <p>Click the button below to create a new password:</p>
            </div>
            
            <!-- Reset Button -->
            <div class="button-container">
              <a href="${resetLink}" class="reset-button">Reset My Password</a>
            </div>
            
            <!-- Info Box -->
            <div class="info-box">
              <p><strong>This link will expire in 30 minutes</strong></p>
              <p>For security reasons, please reset your password as soon as possible.</p>
            </div>
            
            <!-- Alternative Link -->
            <p style="font-size: 13px; color: #666; text-align: center; margin-top: 25px;">
              If the button doesn't work, copy and paste this link into your browser:
            </p>
            <div class="link-text">${resetLink}</div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">
              If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <!-- Footer -->
          <div class="footer">
            <p><strong>Bihar Ophthalmic Association</strong></p>
            <p>Shivpuri Road, Anishabad, Patna 800002</p>
            <p>Email: biharophthalmic2022@gmail.com | Phone: 9334332714</p>
            <div class="footer-note">
              This is an automated email. Please do not reply to this message.<br>
              © ${new Date().getFullYear()} Bihar Ophthalmic Association. All rights reserved.
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    throw error;
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

// Send contact form email - Simple text only
const sendContactEmail = async (contactData) => {
  const { firstName, lastName, email, phone, subject, message } = contactData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'biharophthalmic2022@gmail.com'
    },
    to: process.env.EMAIL_USER || 'biharophthalmic2022@gmail.com',
    replyTo: email,
    subject: `Contact Form: ${subject}`,
    text: `
New Contact Form Submission

From: ${firstName} ${lastName}
Email: ${email}
Phone: ${phone || 'Not provided'}

Subject: ${subject}

Message:
${message}

---
This email was sent from the BOA website contact form.
    `,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
          }
          .email-container {
            max-width: 600px;
            margin: 30px auto;
            background: white;
            border: 1px solid #ddd;
          }
          .header {
            background: white;
            padding: 20px 30px;
            text-align: center;
            border-bottom: 2px solid #0B3C5D;
          }
          .logo {
            max-width: 100px;
            height: auto;
            margin-bottom: 10px;
          }
          .header h1 {
            color: #0B3C5D;
            margin: 10px 0 0 0;
            font-size: 20px;
          }
          .content {
            padding: 30px;
            background: white;
          }
          .field {
            margin-bottom: 20px;
          }
          .field-label {
            font-weight: bold;
            color: #0B3C5D;
            margin-bottom: 5px;
          }
          .field-value {
            color: #555;
          }
          .message-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 15px;
            margin-top: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #999;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png" alt="BOA Logo" class="logo">
            <h1>New Contact Form Submission</h1>
          </div>
          
          <div class="content">
            <div class="field">
              <div class="field-label">From:</div>
              <div class="field-value">${firstName} ${lastName}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Email:</div>
              <div class="field-value">${email}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Phone:</div>
              <div class="field-value">${phone || 'Not provided'}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Subject:</div>
              <div class="field-value">${subject}</div>
            </div>
            
            <div class="field">
              <div class="field-label">Message:</div>
              <div class="message-box">${message}</div>
            </div>
          </div>
          
          <div class="footer">
            This email was sent from the BOA website contact form.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact email error:', error.message);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendContactEmail,
  testEmailConfig
};
