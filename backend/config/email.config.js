const nodemailer = require('nodemailer');

// Email configuration
// Using Hostinger SMTP for custom domain email

// Create transporter with Hostinger SMTP settings
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  pool: true, // Use pooled connections for faster delivery
  maxConnections: 5, // Max simultaneous connections
  maxMessages: 100, // Max messages per connection
  tls: {
    rejectUnauthorized: false // Accept self-signed certificates
  }
});

// Create fallback transporter (Gmail) for development/testing
const fallbackTransporter = nodemailer.createTransport({
  host: process.env.FALLBACK_EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.FALLBACK_EMAIL_PORT) || 587,
  secure: process.env.FALLBACK_EMAIL_SECURE === 'true',
  auth: {
    user: process.env.FALLBACK_EMAIL_USER,
    pass: process.env.FALLBACK_EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Helper function to send email with fallback
async function sendEmailWithFallback(mailOptions) {
  try {
    // Try primary transporter first
    console.log('Attempting to send email with primary transporter...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully with primary transporter:', info.messageId);
    return { success: true, messageId: info.messageId, transporter: 'primary' };
  } catch (primaryError) {
    console.error('Primary transporter failed:', primaryError.message);
    
    // If primary fails and fallback is configured, try fallback
    if (process.env.FALLBACK_EMAIL_USER && process.env.FALLBACK_EMAIL_PASSWORD) {
      try {
        console.log('Attempting to send email with fallback transporter...');
        // Update from address to use fallback email
        const fallbackMailOptions = {
          ...mailOptions,
          from: {
            name: 'Bihar Ophthalmic Association',
            address: process.env.FALLBACK_EMAIL_USER
          }
        };
        
        const info = await fallbackTransporter.sendMail(fallbackMailOptions);
        console.log('Email sent successfully with fallback transporter:', info.messageId);
        return { success: true, messageId: info.messageId, transporter: 'fallback' };
      } catch (fallbackError) {
        console.error('Fallback transporter also failed:', fallbackError.message);
        throw new Error(`Both email services failed. Primary: ${primaryError.message}, Fallback: ${fallbackError.message}`);
      }
    } else {
      throw primaryError;
    }
  }
}

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
    const info = await sendEmailWithFallback(mailOptions);
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
  } catch (primaryError) {
    console.log('Primary transporter verification failed:', primaryError.message);
    
    // Try fallback if configured
    if (process.env.FALLBACK_EMAIL_USER && process.env.FALLBACK_EMAIL_PASSWORD) {
      try {
        await fallbackTransporter.verify();
        console.log('Fallback transporter verification successful');
        return true;
      } catch (fallbackError) {
        console.log('Fallback transporter verification also failed:', fallbackError.message);
        return false;
      }
    }
    
    return false;
  }
};

// Send contact form email - Simple text only
const sendContactEmail = async (contactData) => {
  const { firstName, lastName, email, phone, subject, message } = contactData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: process.env.EMAIL_USER || 'info@boabihar.org',
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
    console.log('Attempting to send contact email...');
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Contact email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact email error:', error.message);
    
    // Log the full error for debugging but don't crash the server
    console.error('Full email error details:', {
      code: error.code,
      response: error.response,
      command: error.command
    });
    
    // Return a user-friendly error
    throw new Error('Failed to send email. Please try again later or contact us directly.');
  }
};

// Send contact form confirmation email to user
const sendContactConfirmationEmail = async (contactData) => {
  const { firstName, lastName, email, subject } = contactData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: email,
    subject: 'Thank you for contacting us - Bihar Ophthalmic Association',
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
            background: #0B3C5D;
            padding: 30px;
            text-align: center;
            color: white;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 10px 0 5px 0;
            font-size: 24px;
          }
          .header p {
            margin: 0;
            font-size: 14px;
            opacity: 0.9;
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
          .info-box {
            background: #f8f9fa;
            border-left: 4px solid #0B3C5D;
            padding: 20px;
            margin: 25px 0;
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
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png" alt="BOA Logo" class="logo">
            <h1>Thank You for Contacting Us</h1>
            <p>Bihar Ophthalmic Association</p>
          </div>
          
          <div class="content">
            <div class="greeting">Dear ${firstName} ${lastName},</div>
            
            <div class="message">
              <p>Thank you for reaching out to the Bihar Ophthalmic Association. We have received your message and will get back to you as soon as possible.</p>
            </div>
            
            <div class="info-box">
              <p><strong>Your Message Subject:</strong> ${subject}</p>
              <p><strong>Reference ID:</strong> BOA-${Date.now()}</p>
              <p><strong>Expected Response Time:</strong> Within 24-48 hours</p>
            </div>
            
            <div class="message">
              <p>Our team will review your inquiry and respond to you at this email address. If you have any urgent matters, please feel free to call us directly.</p>
              
              <p>Thank you for your interest in the Bihar Ophthalmic Association.</p>
            </div>
          </div>
          
          <div class="footer">
            <p><strong>Bihar Ophthalmic Association</strong></p>
            <p>Shivpuri Road, Anishabad, Patna 800002</p>
            <p>Email: info@boabihar.org | Phone: 9334332714</p>
            <p style="margin-top: 15px; color: #999; font-size: 12px;">
              This is an automated confirmation email.
            </p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Sending contact confirmation email to:', email);
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Contact confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Contact confirmation email error:', error.message);
    throw error;
  }
};

// Send seminar registration confirmation email to user
const sendSeminarRegistrationConfirmation = async (registrationData, seminarData) => {
  const { user_info, amount } = registrationData;
  const { name: seminarName, start_date, end_date, venue, location } = seminarData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: user_info.email,
    subject: `Registration Confirmed - ${seminarName}`,
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
            background: #0B3C5D;
            padding: 30px;
            text-align: center;
            color: white;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 10px 0 5px 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .success-badge {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: bold;
          }
          .details-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: bold;
            color: #0B3C5D;
          }
          .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png" alt="BOA Logo" class="logo">
            <h1>Registration Confirmed!</h1>
            <p>Bihar Ophthalmic Association</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✓ Successfully Registered</div>
            
            <p>Dear ${user_info.title || ''} ${user_info.full_name} ${user_info.surname},</p>
            
            <p>Congratulations! Your registration for <strong>${seminarName}</strong> has been confirmed. We're excited to have you join us for this prestigious event.</p>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Event Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${seminarName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date(start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} - ${new Date(end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Venue:</span>
                <span>${venue}, ${location}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Fee:</span>
                <span>₹${amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration ID:</span>
                <span>BOA-REG-${Date.now()}</span>
              </div>
            </div>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Your Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${user_info.title || ''} ${user_info.full_name} ${user_info.surname}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${user_info.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span>${user_info.mobile}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Organization:</span>
                <span>${user_info.organization || 'Not specified'}</span>
              </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>You will receive further details about the event schedule closer to the date</li>
              <li>Please keep this email as your registration confirmation</li>
              <li>Bring a valid ID for verification at the venue</li>
              <li>Contact us if you have any questions</li>
            </ul>
            
            <p>We look forward to seeing you at the event!</p>
          </div>
          
          <div class="footer">
            <p><strong>Bihar Ophthalmic Association</strong></p>
            <p>Shivpuri Road, Anishabad, Patna 800002</p>
            <p>Email: info@boabihar.org | Phone: 9334332714</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Sending seminar registration confirmation to:', user_info.email);
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Seminar confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Seminar confirmation email error:', error.message);
    throw error;
  }
};

// Send membership application confirmation email to user
const sendMembershipConfirmation = async (membershipData) => {
  const { name, email, mobile, membership_duration, payment_type, amount } = membershipData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: email,
    subject: 'Membership Application Confirmed - Bihar Ophthalmic Association',
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
            background: #0B3C5D;
            padding: 30px;
            text-align: center;
            color: white;
          }
          .logo {
            max-width: 120px;
            height: auto;
            margin-bottom: 15px;
          }
          .header h1 {
            margin: 10px 0 5px 0;
            font-size: 24px;
          }
          .content {
            padding: 40px 30px;
            background: white;
          }
          .success-badge {
            background: #28a745;
            color: white;
            padding: 10px 20px;
            border-radius: 25px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: bold;
          }
          .details-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 25px 0;
            border-radius: 8px;
          }
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: bold;
            color: #0B3C5D;
          }
          .footer {
            background: #f8f9fa;
            padding: 25px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <img src="https://res.cloudinary.com/derzj7d4u/image/upload/v1768477374/boa-certificates/pjm2se9296raotekzmrc.png" alt="BOA Logo" class="logo">
            <h1>Membership Application Confirmed!</h1>
            <p>Bihar Ophthalmic Association</p>
          </div>
          
          <div class="content">
            <div class="success-badge">✓ Application Submitted</div>
            
            <p>Dear ${name},</p>
            
            <p>Thank you for applying for membership with the Bihar Ophthalmic Association. Your application has been successfully submitted and payment confirmed.</p>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Membership Details</h3>
              <div class="detail-row">
                <span class="detail-label">Membership Type:</span>
                <span>${membership_duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span>${payment_type === 'student' ? 'Student' : 'Professional/Passout'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Membership Fee:</span>
                <span>₹${amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Application ID:</span>
                <span>BOA-MEM-${Date.now()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Application Date:</span>
                <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Contact Information</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span>${mobile}</span>
              </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
              <li>Your application will be reviewed by our membership committee</li>
              <li>You will receive your membership certificate and ID within 7-10 working days</li>
              <li>Keep this email as your application confirmation</li>
              <li>You can contact us for any queries regarding your membership</li>
            </ul>
            
            <p>Welcome to the Bihar Ophthalmic Association family!</p>
          </div>
          
          <div class="footer">
            <p><strong>Bihar Ophthalmic Association</strong></p>
            <p>Shivpuri Road, Anishabad, Patna 800002</p>
            <p>Email: info@boabihar.org | Phone: 9334332714</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Sending membership confirmation to:', email);
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Membership confirmation email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Membership confirmation email error:', error.message);
    throw error;
  }
};

// Send admin notification for new membership application
const sendMembershipAdminNotification = async (membershipData) => {
  const { name, email, mobile, membership_duration, payment_type, amount } = membershipData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'info@boabihar.org',
    subject: 'New Membership Application - Bihar Ophthalmic Association',
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
            background: #0B3C5D;
            padding: 20px 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .content {
            padding: 30px;
            background: white;
          }
          .alert-badge {
            background: #dc3545;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .details-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .detail-row {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: bold;
            color: #0B3C5D;
            display: inline-block;
            width: 150px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>New Membership Application</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Bihar Ophthalmic Association</p>
          </div>
          
          <div class="content">
            <div class="alert-badge">🔔 New Application</div>
            
            <p>A new membership application has been submitted and payment confirmed.</p>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Applicant Details</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${name}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span>${mobile}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Membership Type:</span>
                <span>${membership_duration}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Category:</span>
                <span>${payment_type === 'student' ? 'Student' : 'Professional/Passout'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Fee Paid:</span>
                <span>₹${amount.toLocaleString()}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Application Date:</span>
                <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Review the membership application in the admin panel</li>
              <li>Process the membership certificate and ID</li>
              <li>Update membership records</li>
            </ul>
          </div>
          
          <div class="footer">
            This is an automated notification from the BOA website.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Sending membership admin notification...');
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Membership admin notification sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Membership admin notification error:', error.message);
    throw error;
  }
};

// Send admin notification for new seminar registration
const sendSeminarAdminNotification = async (registrationData, seminarData) => {
  const { user_info, amount } = registrationData;
  const { name: seminarName, start_date, end_date } = seminarData;

  const mailOptions = {
    from: {
      name: 'Bihar Ophthalmic Association',
      address: process.env.EMAIL_USER || 'info@boabihar.org'
    },
    to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER || 'info@boabihar.org',
    subject: `New Seminar Registration - ${seminarName}`,
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
            background: #0B3C5D;
            padding: 20px 30px;
            text-align: center;
            color: white;
          }
          .header h1 {
            margin: 0;
            font-size: 20px;
          }
          .content {
            padding: 30px;
            background: white;
          }
          .alert-badge {
            background: #28a745;
            color: white;
            padding: 8px 16px;
            border-radius: 20px;
            display: inline-block;
            margin-bottom: 20px;
            font-weight: bold;
            font-size: 14px;
          }
          .details-box {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
          }
          .detail-row {
            margin-bottom: 10px;
            padding-bottom: 10px;
            border-bottom: 1px solid #eee;
          }
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          .detail-label {
            font-weight: bold;
            color: #0B3C5D;
            display: inline-block;
            width: 150px;
          }
          .footer {
            background: #f8f9fa;
            padding: 20px 30px;
            text-align: center;
            border-top: 1px solid #dee2e6;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>New Seminar Registration</h1>
            <p style="margin: 5px 0 0 0; font-size: 14px;">Bihar Ophthalmic Association</p>
          </div>
          
          <div class="content">
            <div class="alert-badge">🎯 New Registration</div>
            
            <p>A new registration has been received for <strong>${seminarName}</strong>.</p>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Event Details</h3>
              <div class="detail-row">
                <span class="detail-label">Event:</span>
                <span>${seminarName}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Date:</span>
                <span>${new Date(start_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} - ${new Date(end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Fee:</span>
                <span>₹${amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div class="details-box">
              <h3 style="margin-top: 0; color: #0B3C5D;">Participant Details</h3>
              <div class="detail-row">
                <span class="detail-label">Name:</span>
                <span>${user_info.title || ''} ${user_info.full_name} ${user_info.surname}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Email:</span>
                <span>${user_info.email}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Mobile:</span>
                <span>${user_info.mobile}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Organization:</span>
                <span>${user_info.organization || 'Not specified'}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Registration Date:</span>
                <span>${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
            
            <p><strong>Action Required:</strong></p>
            <ul>
              <li>Review the registration in the admin panel</li>
              <li>Update participant records</li>
              <li>Prepare event materials if needed</li>
            </ul>
          </div>
          
          <div class="footer">
            This is an automated notification from the BOA website.
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    console.log('Sending seminar admin notification...');
    const info = await sendEmailWithFallback(mailOptions);
    console.log('Seminar admin notification sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Seminar admin notification error:', error.message);
    throw error;
  }
};

module.exports = {
  sendPasswordResetEmail,
  sendContactEmail,
  sendContactConfirmationEmail,
  sendSeminarRegistrationConfirmation,
  sendMembershipConfirmation,
  sendMembershipAdminNotification,
  sendSeminarAdminNotification,
  testEmailConfig
};
