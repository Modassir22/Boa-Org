const { sendContactEmail, sendContactConfirmationEmail } = require('../config/email.config');

// Send contact form email
exports.sendContactForm = async (req, res) => {
  try {
    let { firstName, lastName, email, phone, subject, message } = req.body;

    // Trim all fields
    firstName = firstName?.trim();
    lastName = lastName?.trim();
    email = email?.trim();
    phone = phone?.trim();
    subject = subject?.trim();
    message = message?.trim();

    // Validation
    if (!firstName || !lastName || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address (e.g., name@example.com)'
      });
    }

    // Send email
    try {
      // Send email to admin
      await sendContactEmail({
        firstName,
        lastName,
        email,
        phone: phone || '',
        subject,
        message
      });

      // Send confirmation email to user
      try {
        await sendContactConfirmationEmail({
          firstName,
          lastName,
          email,
          subject
        });
        console.log('Contact confirmation email sent to user:', email);
      } catch (confirmationError) {
        console.error('Failed to send confirmation email to user:', confirmationError.message);
        // Don't fail the main request if confirmation email fails
      }

      res.json({
        success: true,
        message: 'Thank you for contacting us! We will get back to you soon.'
      });
    } catch (emailError) {
      console.error('Failed to send contact email:', emailError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send message. Please try again or contact us directly.'
      });
    }

  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process contact form',
      error: error.message
    });
  }
};
