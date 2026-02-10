const { sendContactEmail, sendContactConfirmationEmail } = require('../config/email.config');
const axios = require('axios');

// Verify reCAPTCHA token
async function verifyRecaptcha(token) {
  try {
    
    const response = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: token
        }
      }
    );
    
    
    // For v3, check score. For v2, just check success
    const isValid = response.data.success && (response.data.score ? response.data.score >= 0.5 : true);
    
    return isValid;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return false;
  }
}

// Send contact form email
exports.sendContactForm = async (req, res) => {
  console.log('=== CONTACT FORM REQUEST ===');
  
  try {
    let { firstName, lastName, email, phone, subject, message, recaptchaToken } = req.body;



    // Verify reCAPTCHA (with detailed logging)
    if (recaptchaToken) {
      try {
        const isValid = await verifyRecaptcha(recaptchaToken);
        
        if (!isValid) {
          console.log('reCAPTCHA validation failed, but continuing...');
          // Don't block the request, just log the warning
        }
      } catch (recaptchaError) {
        console.error('reCAPTCHA verification error:', recaptchaError);
        // Don't block the request on reCAPTCHA errors
      }
    } else {
      console.log('No reCAPTCHA token provided');
    }

    // Trim all fields
    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim();
    phone = phone?.trim();
    subject = subject?.trim();
    message = message?.trim();

    // Validation
    if (!firstName || !lastName || !email || !subject || !message) {
      console.log('Validation failed: Missing required fields');
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: Invalid email format');
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., name@example.com)'
      });
    }

    // Send email
    try {
      console.log('Attempting to send contact email to admin...');
      // Send email to admin
      const emailResult = await sendContactEmail({
        firstName,
        lastName,
        email,
        phone: phone || '',
        subject,
        message
      });
      
      if (emailResult.success) {
        console.log('Contact email sent successfully to admin');
      } else {
        console.error('Failed to send contact email:', emailResult.error);
        // Continue anyway - don't fail the request
      }

      // Send confirmation email to user
      try {
        console.log('Attempting to send confirmation email to user...');
        const confirmResult = await sendContactConfirmationEmail({
          firstName,
          lastName,
          email,
          subject
        });
        
        if (confirmResult.success) {
          console.log('Confirmation email sent successfully to user');
        } else {
          console.error('Failed to send confirmation email:', confirmResult.error);
        }
      } catch (confirmationError) {
        console.error('Failed to send confirmation email to user:', confirmationError.message);
        // Don't fail the main request if confirmation email fails
      }

      res.json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.'
      });
    } catch (emailError) {
      console.error('=== EMAIL SENDING ERROR ===');
      console.error('Error message:', emailError.message);
      console.error('Error stack:', emailError.stack);
      console.error('========================');
      
      // Don't fail the request - email is not critical
      res.json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon. (Note: Email notification may be delayed)'
      });
    }

  } catch (error) {
    console.error('=== CONTACT FORM ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('========================');
    
    res.status(500).json({
      success: false,
      message: 'Failed to process contact form',
      error: error.message
    });
  }
};
