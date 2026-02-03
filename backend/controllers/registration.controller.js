const { promisePool } = require('../config/database');
const { ACTIVITY_TYPES, createActivityNotification } = require('../utils/activity-logger');
const { sendSeminarRegistrationConfirmation } = require('../config/email.config');

// Generate registration number
const generateRegistrationNo = () => {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `REG-${year}-${random}`;
};

// Generate membership number based on membership type
const generateMembershipNo = async (connection, membershipType = 'Standard') => {
  // Determine prefix based on membership type
  let prefix = 'STD'; // Default Standard
  
  const typeUpper = membershipType.toUpperCase();
  
  // Check for Lifetime first
  if (typeUpper.includes('LIFETIME') || typeUpper.includes('LIFE')) {
    prefix = 'LM'; // Life Member
  } 
  // Check for 5-Yearly (must check before Yearly to avoid confusion)
  else if (typeUpper.includes('5-YEARLY') || typeUpper.includes('5 YEARLY') || typeUpper.includes('5YEARLY')) {
    prefix = '5YL'; // 5-Yearly
  } 
  // Check for Yearly (any yearly that's not 5-yearly)
  else if (typeUpper.includes('YEARLY') || typeUpper.includes('ANNUAL')) {
    prefix = 'YL'; // Yearly
  } 
  // Check for Student
  else if (typeUpper.includes('STUDENT')) {
    prefix = 'ST'; // Student
  } 
  // Check for Honorary
  else if (typeUpper.includes('HONORARY')) {
    prefix = 'HN'; // Honorary
  }

  // Get the last membership number for this prefix
  const [lastMembership] = await connection.query(
    `SELECT membership_no FROM users 
     WHERE membership_no LIKE ? 
     ORDER BY membership_no DESC LIMIT 1`,
    [`${prefix}%`]
  );

  let serial = 1;
  if (lastMembership.length > 0) {
    // Extract serial number from last membership (format: PREFIX001)
    const lastNo = lastMembership[0].membership_no;
    const numPart = lastNo.replace(prefix, '');
    const lastSerial = parseInt(numPart);
    if (!isNaN(lastSerial)) {
      serial = lastSerial + 1;
    }
  }

  return `${prefix}${serial.toString().padStart(3, '0')}`;
};

// Create registration
exports.createRegistration = async (req, res) => {
  let connection;

  try {
    connection = await promisePool.getConnection();
    await connection.beginTransaction();
    const userId = req.user.id;
    const {
      seminar_id,
      category_id,
      slab_id,
      delegate_type,
      amount,
      additional_persons = [],
      razorpay_order_id,
      razorpay_payment_id
    } = req.body;

    // Check if user has already registered for this seminar
    const [existingRegistration] = await connection.query(
      'SELECT id, registration_no, status FROM registrations WHERE user_id = ? AND seminar_id = ?',
      [userId, seminar_id]
    );

    if (existingRegistration.length > 0) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: 'You have already registered for this seminar',
        existing_registration: {
          registration_no: existingRegistration[0].registration_no,
          status: existingRegistration[0].status
        }
      });
    }

    // Convert delegate_type to proper format for ENUM
    // "BOA Member" -> "boa-member", "Non BOA Member" -> "non-boa-member", "Accompanying Person" -> "accompanying-person"
    let normalizedDelegateType = delegate_type
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-');

    // Handle special case for "boa" to ensure it stays as "boa-member" not "b-o-a-member"
    normalizedDelegateType = normalizedDelegateType
      .replace('b-o-a', 'boa')
      .replace('non-boa', 'non-boa');

    // Generate registration number
    const registration_no = generateRegistrationNo();
    // Calculate total amount
    const additionalAmount = additional_persons.reduce((sum, person) => sum + parseFloat(person.amount), 0);
    const totalAmount = parseFloat(amount) + additionalAmount;
    // Check if user already has membership number
    const [userCheck] = await connection.query(
      'SELECT membership_no FROM users WHERE id = ?',
      [userId]
    );

    let membershipNo = userCheck[0].membership_no;

    // If user doesn't have membership number, generate one
    if (!membershipNo) {
      membershipNo = await generateMembershipNo(connection);

      // Update user with membership number
      await connection.query(
        'UPDATE users SET membership_no = ?, is_boa_member = TRUE WHERE id = ?',
        [membershipNo, userId]
      );

    } else {
    }

    // Determine payment status based on Razorpay data
    const paymentStatus = razorpay_payment_id ? 'confirmed' : 'pending';
    const paymentMethod = razorpay_payment_id ? 'razorpay' : null;

    // Insert registration
    const [regResult] = await connection.query(
      `INSERT INTO registrations 
       (registration_no, user_id, seminar_id, category_id, slab_id, delegate_type, amount, status, 
        payment_method, payment_date, razorpay_order_id, razorpay_payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        registration_no,
        userId,
        seminar_id,
        category_id,
        slab_id,
        normalizedDelegateType,
        totalAmount,
        paymentStatus,
        paymentMethod,
        razorpay_payment_id ? new Date() : null,
        razorpay_order_id,
        razorpay_payment_id
      ]
    );

    const registrationId = regResult.insertId;

    // Insert additional persons
    if (additional_persons.length > 0) {
      const personValues = additional_persons.map(person => [
        registrationId,
        person.name,
        person.category_id,
        person.slab_id,
        person.amount
      ]);

      await connection.query(
        `INSERT INTO additional_persons (registration_id, name, category_id, slab_id, amount)
         VALUES ?`,
        [personValues]
      );
    }

    await connection.commit();

    // Get user and seminar details for notification and email
    const [userDetails] = await connection.query(
      'SELECT CONCAT(first_name, " ", surname) as full_name, email, mobile, title FROM users WHERE id = ?',
      [userId]
    );

    const [seminarDetails] = await connection.query(
      'SELECT name, start_date, end_date, venue, location FROM seminars WHERE id = ?',
      [seminar_id]
    );

    // Create activity notification for admin only if payment is confirmed
    if (paymentStatus === 'confirmed') {
      await createActivityNotification(ACTIVITY_TYPES.NEW_REGISTRATION, {
        name: userDetails[0]?.full_name || 'User',
        seminar_name: seminarDetails[0]?.name || 'Seminar',
        seminar_id: seminar_id
      });

      // Send confirmation email to user
      try {
        const registrationData = {
          user_info: {
            title: userDetails[0]?.title,
            full_name: userDetails[0]?.full_name?.split(' ')[0] || 'User',
            surname: userDetails[0]?.full_name?.split(' ').slice(1).join(' ') || '',
            email: userDetails[0]?.email,
            mobile: userDetails[0]?.mobile,
            organization: 'Not specified' // You can add this field to users table if needed
          },
          amount: totalAmount
        };

        await sendSeminarRegistrationConfirmation(registrationData, seminarDetails[0]);
      } catch (emailError) {
        console.error('Failed to send registration confirmation email:', emailError.message);
        // Don't fail the registration if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      registration: {
        id: registrationId,
        registration_no,
        membership_no: membershipNo,
        amount: totalAmount,
        status: paymentStatus
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('=== CREATE REGISTRATION ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error code:', error.code);
    console.error('SQL Message:', error.sqlMessage);
    console.error('SQL:', error.sql);
    console.error('Request body:', req.body);
    console.error('User ID:', req.user?.id);
    console.error('================================');
    res.status(500).json({
      success: false,
      message: 'Failed to create registration',
      error: error.message,
      details: error.sqlMessage || error.message
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Get user registrations
exports.getUserRegistrations = async (req, res) => {
  try {
    
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      console.log('ERROR: No user authentication found');
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required',
        registrations: []
      });
    }

    const userId = req.user.id;

    // First, check if user exists
    const [userCheck] = await promisePool.query(
      'SELECT id, email, first_name, surname FROM users WHERE id = ?',
      [userId]
    );

    if (userCheck.length === 0) {
      console.log('ERROR: User not found in database');
      return res.status(404).json({
        success: false,
        message: 'User not found',
        registrations: []
      });
    }

    // Check all registrations in database for this user
    const [allRegs] = await promisePool.query(
      'SELECT * FROM registrations WHERE user_id = ?',
      [userId]
    );

    const [registrations] = await promisePool.query(
      `SELECT r.*, s.name as seminar_name, s.location, s.start_date, s.end_date,
       fc.name as category_name, fs.label as slab_label
       FROM registrations r
       LEFT JOIN seminars s ON r.seminar_id = s.id
       LEFT JOIN fee_categories fc ON r.category_id = fc.id
       LEFT JOIN fee_slabs fs ON r.slab_id = fs.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [userId]
    );

    

    // Get additional persons for each registration
    for (let reg of registrations) {
      const [persons] = await promisePool.query(
        `SELECT ap.*, fc.name as category_name, fs.label as slab_label
         FROM additional_persons ap
         LEFT JOIN fee_categories fc ON ap.category_id = fc.id
         LEFT JOIN fee_slabs fs ON ap.slab_id = fs.id
         WHERE ap.registration_id = ?`,
        [reg.id]
      );
      reg.additional_persons = persons;
    }


    res.json({
      success: true,
      count: registrations.length,
      registrations: registrations
    });

  } catch (error) {
    console.error('=== GET REGISTRATIONS ERROR ===');
    console.error('Error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message,
      registrations: []
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transaction_id, payment_method } = req.body;

    await promisePool.query(
      `UPDATE registrations 
       SET status = ?, transaction_id = ?, payment_method = ?, payment_date = NOW()
       WHERE id = ?`,
      [status, transaction_id, payment_method, id]
    );

    // If payment confirmed, create notification
    if (status === 'confirmed') {
      const [regDetails] = await promisePool.query(
        `SELECT r.amount, u.full_name, s.name as seminar_name, s.id as seminar_id
         FROM registrations r
         JOIN users u ON r.user_id = u.id
         JOIN seminars s ON r.seminar_id = s.id
         WHERE r.id = ?`,
        [id]
      );

      if (regDetails.length > 0) {
        await createActivityNotification(ACTIVITY_TYPES.PAYMENT_RECEIVED, {
          name: regDetails[0].full_name,
          amount: regDetails[0].amount,
          seminar_name: regDetails[0].seminar_name,
          seminar_id: regDetails[0].seminar_id
        });
      }
    }

    res.json({
      success: true,
      message: 'Payment status updated successfully'
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update payment status',
      error: error.message
    });
  }
};
