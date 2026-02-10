const { promisePool } = require('../config/database');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { sendPasswordResetEmail } = require('../config/email.config');

// Store reset tokens temporarily (in production, use Redis or database with expiry)
const tokenStore = new Map();

// Generate secure reset token
const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send password reset link
exports.sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    // Check if user exists
    const [users] = await promisePool.query(
      'SELECT id, email, first_name, surname FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email address'
      });
    }

    const user = users[0];
    const userName = `${user.first_name} ${user.surname}`;

    // Generate reset token
    const resetToken = generateResetToken();
    
    // Store token with 30 minute expiry
    tokenStore.set(resetToken, {
      email,
      expiresAt: Date.now() + 30 * 60 * 1000, // 30 minutes
      used: false
    });

    // Create reset link
    const resetLink = `http://localhost:8080/reset-password?token=${resetToken}`;

    // Send reset link via email
    try {
      const emailResult = await sendPasswordResetEmail(email, resetLink, userName);
      
      if (emailResult.success) {
        res.json({
          success: true,
          message: 'Password reset link sent to your email. Please check your inbox.'
        });
      } else {
        console.error('Failed to send password reset email:', emailResult.error);
        res.status(500).json({
          success: false,
          message: 'Failed to send reset email. Please try again or contact support.'
        });
      }
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      
      res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again or contact support.'
      });
    }

  } catch (error) {
    console.error('Send reset link error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reset link',
      error: error.message
    });
  }
};

// Verify reset token
exports.verifyToken = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Reset token is required'
      });
    }

    const storedData = tokenStore.get(token);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link'
      });
    }

    if (Date.now() > storedData.expiresAt) {
      tokenStore.delete(token);
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    if (storedData.used) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      email: storedData.email
    });

  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify token',
      error: error.message
    });
  }
};

// Reset password with token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    const storedData = tokenStore.get(token);

    if (!storedData) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset link'
      });
    }

    if (Date.now() > storedData.expiresAt) {
      tokenStore.delete(token);
      return res.status(400).json({
        success: false,
        message: 'Reset link has expired. Please request a new one.'
      });
    }

    if (storedData.used) {
      return res.status(400).json({
        success: false,
        message: 'This reset link has already been used'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password in database
    await promisePool.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, storedData.email]
    );

    // Mark token as used
    storedData.used = true;
    tokenStore.set(token, storedData);

    // Delete token after 5 minutes
    setTimeout(() => {
      tokenStore.delete(token);
    }, 5 * 60 * 1000);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset password',
      error: error.message
    });
  }
};
