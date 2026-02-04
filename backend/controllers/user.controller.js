const { promisePool } = require('../config/database');

// Get User Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await promisePool.query(
      `SELECT u.*, a.house, a.street, a.landmark, a.city, a.state, a.country, a.pin_code,
       mr.membership_no, mr.membership_type,
       CASE WHEN mr.membership_type IS NOT NULL THEN 1 ELSE 0 END as has_active_membership
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       LEFT JOIN membership_registrations mr ON u.email = mr.email AND mr.payment_status IN ('active', 'paid', 'completed')
       WHERE u.id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];
    delete user.password;

    res.json({
      success: true,
      user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile',
      error: error.message
    });
  }
};

// Update User Profile
exports.updateProfile = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const userId = req.user.id;
    const {
      title, first_name, surname, email, mobile, phone, gender, dob,
      house, street, landmark, city, state, country, pin_code
    } = req.body;


    // Format DOB to MySQL DATE format (YYYY-MM-DD)
    let formattedDob = dob;
    if (dob) {
      const dobDate = new Date(dob);
      if (!isNaN(dobDate.getTime())) {
        formattedDob = dobDate.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        formattedDob = null;
      }
    }

    // Get current email before update (to update membership_registrations if email changes)
    const [currentUser] = await connection.query(
      'SELECT email FROM users WHERE id = ?',
      [userId]
    );
    const oldEmail = currentUser[0]?.email;

    // Update user
    await connection.query(
      `UPDATE users SET 
       title = COALESCE(?, title), 
       first_name = COALESCE(?, first_name), 
       surname = COALESCE(?, surname),
       email = COALESCE(?, email), 
       mobile = COALESCE(?, mobile), 
       phone = ?, 
       gender = COALESCE(?, gender), 
       dob = ?
       WHERE id = ?`,
      [title, first_name, surname, email, mobile, phone, gender, formattedDob, userId]
    );

    

    // If email changed, update membership_registrations table as well
    if (email && oldEmail && email !== oldEmail) {
      await connection.query(
        'UPDATE membership_registrations SET email = ? WHERE email = ?',
        [email, oldEmail]
      );
      
    }

    // Check if address exists
    const [existingAddress] = await connection.query(
      'SELECT id FROM addresses WHERE user_id = ?',
      [userId]
    );

    if (existingAddress.length > 0) {
      // Update existing address
      await connection.query(
        `UPDATE addresses SET 
         house = ?, 
         street = ?, 
         landmark = ?, 
         city = ?, 
         state = ?, 
         country = ?, 
         pin_code = ?
         WHERE user_id = ?`,
        [house || '', street || '', landmark || '', city || '', state || '', country || 'India', pin_code || '000000', userId]
      );
    } else if (city || state) {
      // Insert new address only if at least city or state is provided
      await connection.query(
        `INSERT INTO addresses (user_id, house, street, landmark, city, state, country, pin_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, house || '', street || '', landmark || '', city || '', state || '', country || 'India', pin_code || '000000']
      );
    }

    await connection.commit();

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    await connection.rollback();
    console.error('Update profile error:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Change Password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters'
      });
    }

    // Get user with password
    const [users] = await promisePool.query(
      'SELECT id, password FROM users WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const user = users[0];

    // Verify current password
    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(current_password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // Update password
    await promisePool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, userId]
    );

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password',
      error: error.message
    });
  }
};

// Get user membership details
exports.getMembershipDetails = async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userId = req.user.id;

    // Get user details with membership information and payment details
    const [user] = await promisePool.query(`
      SELECT u.*, 
             mr.membership_no, mr.membership_type, mr.payment_type, mr.payment_status as status, mr.valid_from, mr.valid_until, mr.notes,
             mr.amount, mr.payment_status, mr.payment_method, mr.transaction_id,
             mr.razorpay_payment_id, mr.payment_date, mr.qualification, mr.year_passing,
             mr.institution, mr.working_place,
             mr.created_at as membership_created_at,
             mc.title as category_title, mc.price as category_price
      FROM users u
      LEFT JOIN membership_registrations mr ON u.email = mr.email
      LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
      WHERE u.id = ?
    `, [userId]);

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user[0];
    delete userData.password;

    res.json({
      success: true,
      membership: userData
    });
  } catch (error) {
    console.error('Get membership details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership details',
      error: error.message
    });
  }
};

// Verify BOA Membership Number
exports.verifyMembership = async (req, res) => {
  try {
    const { membershipNo } = req.body;

    if (!membershipNo) {
      return res.status(400).json({
        success: false,
        message: 'Membership number is required'
      });
    }

    // Check in users table for BOA members
    const [users] = await promisePool.query(
      `SELECT u.id, u.first_name, u.surname, u.email, u.membership_no, u.is_boa_member, u.created_at,
              mr.payment_status as membership_status
       FROM users u
       LEFT JOIN membership_registrations mr ON u.email = mr.email
       WHERE u.membership_no = ? AND u.is_boa_member = TRUE AND u.is_active = TRUE`,
      [membershipNo]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid membership number or user is not an active BOA member',
        verified: false
      });
    }

    const user = users[0];

    // Check if membership is active
    if (user.membership_status && user.membership_status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'No active membership found. Please contact admin for membership activation.',
        verified: false
      });
    }

    res.json({
      success: true,
      message: 'Membership verified successfully',
      verified: true,
      membership: {
        membershipNo: membershipNo,
        name: `${user.first_name} ${user.surname}`,
        email: user.email,
        memberSince: user.created_at
      }
    });

  } catch (error) {
    console.error('Verify membership error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify membership',
      error: error.message,
      verified: false
    });
  }
};
