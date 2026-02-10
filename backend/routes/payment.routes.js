const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/database');
const razorpayService = require('../services/razorpay.service');
const { sendMembershipConfirmation, sendSeminarRegistrationConfirmation, sendMembershipAdminNotification, sendSeminarAdminNotification } = require('../config/email.config');

// Helper function to format title consistently
const formatTitle = (title) => {
  const titleMap = {
    'dr': 'Dr.',
    'mr': 'Mr.',
    'mrs': 'Mrs.',
    'ms': 'Ms.',
    'prof': 'Prof.'
  };
  return titleMap[title?.toLowerCase()] || title || '';
};

// Helper function to log to file
function logToFile(message) {
  const logPath = path.join(__dirname, '..', 'payment-debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Helper function to generate membership number based on type
async function generateMembershipNo(membershipType = 'Standard') {
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
  const [lastMembership] = await promisePool.query(
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
}

// Handle preflight requests
router.options('/create-order', (req, res) => {
  logToFile('OPTIONS request received for /create-order');
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Create Razorpay order for seminar registration
router.post('/create-order', async (req, res) => {
  try {
    logToFile('=== CREATE ORDER REQUEST ===');
    logToFile(`Headers: ${JSON.stringify(req.headers)}`);
    logToFile(`Body: ${JSON.stringify(req.body)}`);
    logToFile(`Raw body type: ${typeof req.body}`);
    
    const { amount, currency = 'INR', receipt, metadata = {} } = req.body;

    logToFile(`Parsed values: ${JSON.stringify({ amount, currency, receipt, metadata })}`);
    // Validate amount
    if (!amount) {
      logToFile(`Missing amount in request`);
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    if (typeof amount !== 'number' || amount <= 0) {
      logToFile(`Invalid amount: ${amount} (type: ${typeof amount})`);
      return res.status(400).json({
        success: false,
        message: 'Invalid amount provided'
      });
    }

    // Create Razorpay order
    const orderResult = await razorpayService.createOrder(amount, currency, receipt);

    logToFile(`Order result: ${JSON.stringify(orderResult)}`);

    if (!orderResult.success) {
      logToFile(`Order creation failed: ${orderResult.error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to create payment order',
        error: orderResult.error
      });
    }

    logToFile(`Order created successfully: ${orderResult.order.id}`);

    // Store order in database for tracking
    await promisePool.query(
      `INSERT INTO payment_orders (order_id, amount, currency, status, metadata, created_at)
       VALUES (?, ?, ?, 'created', ?, NOW())`,
      [orderResult.order.id, amount, currency, JSON.stringify(metadata)]
    );

    const response = {
      success: true,
      order: orderResult.order,
      key_id: process.env.RAZORPAY_KEY_ID
    };

    logToFile(`Sending response: ${JSON.stringify(response)}`);
    res.json(response);

  } catch (error) {
    logToFile(`Create order error: ${error.message}`);
    logToFile(`Error stack: ${error.stack}`);
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment order'
    });
  }
});

// Verify payment and update status
router.post('/verify-payment', async (req, res) => {
  try {
    logToFile('=== VERIFY PAYMENT REQUEST ===');
    logToFile(`Headers: ${JSON.stringify(req.headers)}`);
    logToFile(`Body: ${JSON.stringify(req.body)}`);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      registration_data,
      payment_type = 'seminar' // 'seminar' or 'membership'
    } = req.body;

    logToFile(`Payment verification data: order_id=${razorpay_order_id}, payment_id=${razorpay_payment_id}, type=${payment_type}`);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      logToFile('Missing required payment verification data');
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification data'
      });
    }

    // Verify payment signature
    const isValidSignature = razorpayService.verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    logToFile(`Signature verification result: ${isValidSignature}`);

    if (!isValidSignature) {
      logToFile('Invalid payment signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid payment signature'
      });
    }

    // Get payment details from Razorpay
    logToFile('Fetching payment details from Razorpay...');
    const paymentResult = await razorpayService.getPaymentDetails(razorpay_payment_id);

    logToFile(`Payment details result: ${JSON.stringify(paymentResult)}`);

    if (!paymentResult.success) {
      logToFile(`Failed to fetch payment details: ${paymentResult.error}`);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch payment details'
      });
    }

    const payment = paymentResult.payment;

    // Update order status in database
    await promisePool.query(
      `UPDATE payment_orders 
       SET status = 'paid', payment_id = ?, payment_method = ?, updated_at = NOW()
       WHERE order_id = ?`,
      [razorpay_payment_id, payment.method, razorpay_order_id]
    );

    // Process based on payment type
    let result = {};

    if (payment_type === 'seminar' && registration_data) {
      // Process seminar registration
      result = await processSeminarRegistration(registration_data, {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: payment.amount / 100, // Convert from paise to rupees
        status: 'completed'
      });
    } else if (payment_type === 'membership' && registration_data) {
      // Process membership registration
      result = await processMembershipRegistration(registration_data, {
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        amount: payment.amount / 100,
        status: 'completed'
      });
    }

    res.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      amount: payment.amount / 100,
      ...result
    });

  } catch (error) {
    logToFile(`Verify payment error: ${error.message}`);
    logToFile(`Error stack: ${error.stack}`);
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
      details: error.toString()
    });
  }
});

// Process seminar registration after successful payment
async function processSeminarRegistration(registrationData, paymentInfo) {
  const connection = await promisePool.getConnection();
  
  try {
    logToFile('=== PROCESSING SEMINAR REGISTRATION ===');
    logToFile(`Registration data: ${JSON.stringify(registrationData)}`);
    logToFile(`Payment info: ${JSON.stringify(paymentInfo)}`);
    
    await connection.beginTransaction();

    const {
      user_id,
      user_info,
      seminar_id,
      category_id,
      slab_id,
      delegate_type,
      additional_persons = []
    } = registrationData;

    logToFile(`Extracted user_id: ${user_id}, user_info: ${JSON.stringify(user_info)}`);

    // We don't create users in payment flow - just process the registration
    // user_id will be null for guest registrations, which is fine

    // Transform delegate_type to match database enum values
    let normalizedDelegateType = 'non-boa-member'; // Default fallback
    
    // Normalize delegate_type to match database ENUM values exactly
    if (delegate_type) {
      const lowerType = delegate_type.toLowerCase().trim();
      
      logToFile(`Lowercase type: ${lowerType}`);
      logToFile(`Checking conditions for: "${lowerType}"`);
      
      // Check for life-member variations (but not non-boa-member)
      if ((lowerType.includes('life') && lowerType.includes('member')) || 
          (lowerType.includes('boa') && lowerType.includes('member') && !lowerType.includes('non'))) {
        logToFile(`✓ Matched life-member condition`);
        normalizedDelegateType = 'life-member';
      } 
      // Check for non-boa-member variations
      else if (lowerType.includes('non') && lowerType.includes('boa')) {
        logToFile(`✓ Matched non-boa-member condition`);
        normalizedDelegateType = 'non-boa-member';
      } 
      // Check for accompanying person variations (spouse, family, etc.)
      else if (lowerType.includes('accompanying') || lowerType.includes('spouse') || lowerType.includes('family')) {
        logToFile(`✓ Matched accompanying-person condition`);
        normalizedDelegateType = 'accompanying-person';
      }
      // Map specific categories to appropriate ENUM values
      else if (lowerType === 'student' || lowerType.includes('student')) {
        logToFile(`✓ Matched student category: ${lowerType}`);
        normalizedDelegateType = 'non-boa-member'; // Students are typically non-members
      }
      else if (lowerType === 'trade' || lowerType.includes('trade')) {
        logToFile(`✓ Matched trade category: ${lowerType}`);
        normalizedDelegateType = 'non-boa-member'; // Trade participants are typically non-members
      }
      else if (lowerType === 'spouse') {
        logToFile(`✓ Matched spouse category: ${lowerType}`);
        normalizedDelegateType = 'accompanying-person'; // Spouse is an accompanying person
      }
      // For any other value, default to non-boa-member
      else {
        logToFile(`⚠️ Unknown delegate_type "${delegate_type}" (lowercase: "${lowerType}"), defaulting to non-boa-member`);
        normalizedDelegateType = 'non-boa-member';
      }
    }

    logToFile(`Original delegate_type: ${delegate_type}, Normalized: ${normalizedDelegateType}`);

    // Store the original delegate type name for display purposes
    const originalCategoryName = delegate_type;

    // Check if registration already exists with this order_id
    const [existingReg] = await connection.query(
      'SELECT id, registration_no FROM registrations WHERE razorpay_order_id = ?',
      [paymentInfo.order_id]
    );

    let registrationId;
    let registration_no;

    if (existingReg.length > 0) {
      // Update existing registration
      registrationId = existingReg[0].id;
      registration_no = existingReg[0].registration_no;
      
      logToFile(`Found existing registration ID: ${registrationId}, updating status to completed`);
      
      await connection.query(
        `UPDATE registrations 
         SET status = ?, transaction_id = ?, payment_method = ?, payment_date = NOW(), 
             razorpay_payment_id = ?
         WHERE id = ?`,
        [paymentInfo.status, paymentInfo.payment_id, 'razorpay', paymentInfo.payment_id, registrationId]
      );
      
      logToFile(`Registration ${registration_no} updated successfully`);
    } else {
      // Create new registration (for cases where registration wasn't pre-created)
      registration_no = `REG-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

      logToFile(`No existing registration found, creating new one: ${registration_no}`);

      // Prepare guest information for logging and insertion
      const guestName = user_id ? null : (user_info ? `${formatTitle(user_info.title || '')} ${user_info.full_name || user_info.first_name || ''} ${user_info.surname || ''}`.trim() : null);
      const guestEmail = user_id ? null : (user_info ? user_info.email : null);
      const guestMobile = user_id ? null : (user_info ? user_info.mobile : null);
      const guestAddress = user_id ? null : (user_info ? user_info.address : null);

      logToFile(`Guest info being inserted: name="${guestName}", email="${guestEmail}", mobile="${guestMobile}", address="${guestAddress}"`);

      // Insert main registration (user_id can be null for guest registrations)
      const [regResult] = await connection.query(
        `INSERT INTO registrations 
         (registration_no, user_id, seminar_id, category_id, slab_id, delegate_type, category_name,
          amount, status, transaction_id, payment_method, payment_date, razorpay_order_id, razorpay_payment_id,
          guest_name, guest_email, guest_mobile, guest_address)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?)`,
        [
          registration_no,
          user_id || null, // Explicitly set to null if user_id is falsy
          seminar_id,
          category_id,
          slab_id,
          normalizedDelegateType,
          originalCategoryName,
          paymentInfo.amount,
          paymentInfo.status,
          paymentInfo.payment_id, // transaction_id
          'razorpay', // payment_method
          paymentInfo.order_id, // razorpay_order_id
          paymentInfo.payment_id, // razorpay_payment_id
          // Guest information (will be null if user_id exists)
          guestName,
          guestEmail,
          guestMobile,
          guestAddress
        ]
      );

      registrationId = regResult.insertId;
      logToFile(`Registration inserted with ID: ${registrationId}`);
    }

    // Insert additional persons if any
    if (additional_persons.length > 0) {
      logToFile(`Inserting ${additional_persons.length} additional persons`);
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
      logToFile('Additional persons inserted successfully');
    }

    await connection.commit();
    logToFile('Registration transaction committed successfully');

    // Send confirmation email to user
    try {
      if (user_info && user_info.email) {
        // Get seminar details for email
        const [seminarDetails] = await connection.query(
          'SELECT name, start_date, end_date, venue, location FROM seminars WHERE id = ?',
          [seminar_id]
        );

        if (seminarDetails.length > 0) {
          const registrationEmailData = {
            user_info: {
              title: user_info.title,
              full_name: user_info.full_name,
              surname: user_info.surname,
              email: user_info.email,
              mobile: user_info.mobile,
              organization: user_info.organization || 'Not specified'
            },
            amount: paymentInfo.amount
          };

          try {
            const emailResult = await sendSeminarRegistrationConfirmation(registrationEmailData, seminarDetails[0]);
            if (emailResult.success) {
              logToFile(`Seminar registration confirmation email sent to: ${user_info.email}`);
            } else {
              logToFile(`Failed to send seminar confirmation email: ${emailResult.error}`);
            }
          } catch (emailError) {
            logToFile(`Email error: ${emailError.message}`);
            // Don't fail the payment if email fails
          }
          
          // Generate and send PDF receipt via email
          try {
            const { generateAndSendPDFReceipt } = require('../controllers/admin.controller');
            const pdfResult = await generateAndSendPDFReceipt(`sem_${registrationId}`, 'seminar');
            if (pdfResult.success) {
              logToFile(`PDF receipt email sent successfully to: ${user_info.email}`);
            } else {
              logToFile(`Failed to send PDF receipt email: ${pdfResult.message}`);
            }
          } catch (pdfError) {
            logToFile(`PDF receipt generation error: ${pdfError.message}`);
          }
        }
      }
    } catch (emailError) {
      logToFile(`Failed to send seminar confirmation email: ${emailError.message}`);
      // Don't fail the registration if email fails
    }

    return {
      registration_id: registrationId,
      registration_no
    };

  } catch (error) {
    logToFile(`Registration processing error: ${error.message}`);
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// Process membership registration after successful payment
async function processMembershipRegistration(membershipData, paymentInfo) {
  try {
    logToFile('=== PROCESSING MEMBERSHIP REGISTRATION ===');
    logToFile(`Membership data: ${JSON.stringify(membershipData)}`);
    logToFile(`Payment info: ${JSON.stringify(paymentInfo)}`);

    // Check if user has already submitted membership form
    const [existingMembership] = await promisePool.query(
      'SELECT id, name, email, payment_status FROM membership_registrations WHERE email = ?',
      [membershipData.email]
    );

    if (existingMembership.length > 0) {
      logToFile(`Duplicate membership registration attempt for email: ${membershipData.email}`);
      throw new Error(`You have already submitted a membership application. Only one application per email is allowed.`);
    }

    // Calculate valid_from and valid_until based on membership type
    const validFrom = new Date();
    let validUntil = null;
    
    const membershipType = membershipData.membership_type.toLowerCase();
    
    if (membershipType.includes('lifetime') || membershipType.includes('life')) {
      // Lifetime membership - no expiry
      validUntil = null;
    } else if (membershipType.includes('5-yearly') || membershipType.includes('5 yearly')) {
      // 5 year membership
      validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 5);
    } else if (membershipType.includes('yearly') || membershipType.includes('annual')) {
      // 1 year membership
      validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    } else {
      // Default to 1 year if type is unclear
      validUntil = new Date();
      validUntil.setFullYear(validUntil.getFullYear() + 1);
    }

    logToFile(`Calculated validity: From ${validFrom.toISOString()}, Until ${validUntil ? validUntil.toISOString() : 'Lifetime'}`);

    // Generate membership number based on membership type
    const membershipNo = await generateMembershipNo(membershipData.membership_type);
    logToFile(`Generated membership number: ${membershipNo}`);

    const [result] = await promisePool.query(
      `INSERT INTO membership_registrations 
       (name, father_name, qualification, year_passing, dob, institution, working_place, 
        sex, age, address, mobile, email, membership_type, payment_type, transaction_id, payment_status, 
        payment_method, payment_date, razorpay_order_id, razorpay_payment_id, amount, valid_from, valid_until)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
      [
        membershipData.name,
        membershipData.father_name,
        membershipData.qualification,
        membershipData.year_passing,
        membershipData.dob,
        membershipData.institution,
        membershipData.working_place,
        membershipData.sex,
        membershipData.age,
        membershipData.address,
        membershipData.mobile,
        membershipData.email,
        membershipData.membership_type,
        membershipData.payment_type || null,
        paymentInfo.payment_id,
        'completed',
        'razorpay',
        paymentInfo.order_id,
        paymentInfo.payment_id,
        paymentInfo.amount,
        validFrom,
        validUntil
      ]
    );

    logToFile(`Membership registration inserted with ID: ${result.insertId}`);

    // Update user's membership number if user exists
    const [existingUser] = await promisePool.query(
      'SELECT id FROM users WHERE email = ?',
      [membershipData.email]
    );

    if (existingUser.length > 0) {
      await promisePool.query(
        'UPDATE users SET membership_no = ?, is_boa_member = TRUE WHERE email = ?',
        [membershipNo, membershipData.email]
      );
      logToFile(`Updated user membership number: ${membershipNo} for ${membershipData.email}`);
    } else {
      logToFile(`User not found for email: ${membershipData.email}, membership number not assigned to user table`);
    }

    // Send confirmation email to user
    try {
      const membershipConfirmationData = {
        name: membershipData.name,
        email: membershipData.email,
        mobile: membershipData.mobile,
        membership_duration: membershipData.membership_type,
        payment_type: membershipData.payment_type || 'professional', // Default to professional if not specified
        amount: paymentInfo.amount
      };

      try {
        const emailResult = await sendMembershipConfirmation(membershipConfirmationData);
        if (emailResult.success) {
          logToFile(`Membership confirmation email sent to: ${membershipData.email}`);
        } else {
          logToFile(`Failed to send membership confirmation email: ${emailResult.error}`);
        }
      } catch (emailError) {
        logToFile(`Email error: ${emailError.message}`);
        // Don't fail the payment if email fails
      }
      
      // Generate and send PDF receipt via email
      try {
        const { generateAndSendPDFReceipt } = require('../controllers/admin.controller');
        const pdfResult = await generateAndSendPDFReceipt(`mem_${result.insertId}`, 'membership');
        if (pdfResult.success) {
          logToFile(`PDF receipt email sent successfully to: ${membershipData.email}`);
        } else {
          logToFile(`Failed to send PDF receipt email: ${pdfResult.message}`);
        }
      } catch (pdfError) {
        logToFile(`PDF receipt generation error: ${pdfError.message}`);
      }
    } catch (emailError) {
      logToFile(`Failed to send membership confirmation email: ${emailError.message}`);
      // Don't fail the registration if email fails
    }

    return {
      membership_id: result.insertId
    };

  } catch (error) {
    logToFile(`Membership processing error: ${error.message}`);
    throw error;
  }
}

// Webhook endpoint for Razorpay
router.post('/webhook', async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const webhookBody = JSON.stringify(req.body);

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(webhookBody)
      .digest('hex');

    if (webhookSignature !== expectedSignature) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const event = req.body.event;
    const paymentEntity = req.body.payload.payment.entity;

    // Handle different webhook events
    switch (event) {
      case 'payment.captured':
        await handlePaymentCaptured(paymentEntity);
        break;
      case 'payment.failed':
        await handlePaymentFailed(paymentEntity);
        break;
      default:
        }

    res.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

async function handlePaymentCaptured(payment) {
  try {
    // Update payment status in database
    await promisePool.query(
      `UPDATE payment_orders 
       SET status = 'captured', updated_at = NOW()
       WHERE payment_id = ?`,
      [payment.id]
    );

    } catch (error) {
    console.error('Handle payment captured error:', error);
  }
}

async function handlePaymentFailed(payment) {
  try {
    // Update payment status in database
    await promisePool.query(
      `UPDATE payment_orders 
       SET status = 'failed', updated_at = NOW()
       WHERE payment_id = ?`,
      [payment.id]
    );

    } catch (error) {
    console.error('Handle payment failed error:', error);
  }
}

// Store pending payments in memory (in production, use Redis or database)
const pendingPayments = new Map();

// Create payment request
router.post('/create-payment', async (req, res) => {
  try {
    const { transaction_id, amount, user_data } = req.body;

    // Store payment request
    pendingPayments.set(transaction_id, {
      amount,
      user_data,
      status: 'pending',
      created_at: new Date(),
      verified: false
    });

    res.json({
      success: true,
      transaction_id,
      message: 'Payment request created'
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create payment request'
    });
  }
});

// Check payment status (polling endpoint)
router.post('/check-payment', async (req, res) => {
  try {
    const { transaction_id } = req.body;

    const payment = pendingPayments.get(transaction_id);

    if (!payment) {
      return res.json({
        success: false,
        payment_verified: false,
        message: 'Payment not found'
      });
    }

    // Check if payment is verified
    if (payment.verified) {
      // Payment successful - save to database
      const userData = payment.user_data;
      
      // Insert membership data
      const [result] = await promisePool.query(
        `INSERT INTO membership_registrations 
        (name, father_name, qualification, year_passing, dob, institution, working_place, 
         sex, age, address, mobile, email, membership_type, transaction_id, payment_status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', NOW())`,
        [
          userData.name,
          userData.father_name,
          userData.qualification,
          userData.year_passing,
          userData.dob,
          userData.institution,
          userData.working_place,
          userData.sex,
          userData.age,
          userData.address,
          userData.mobile,
          userData.email,
          userData.membership_type,
          transaction_id
        ]
      );

      // Send confirmation emails
      try {
        const membershipConfirmationData = {
          name: userData.name,
          email: userData.email,
          mobile: userData.mobile,
          membership_duration: userData.membership_type,
          payment_type: userData.payment_type || 'professional',
          amount: payment.amount || 0
        };

        // Send user confirmation
        const emailResult = await sendMembershipConfirmation(membershipConfirmationData);
        if (emailResult.success) {
          logToFile(`Membership confirmation email sent to: ${userData.email}`);
        } else {
          logToFile(`Failed to send membership confirmation email: ${emailResult.error}`);
        }
        
        // Generate and send PDF receipt via email
        try {
          const { generateAndSendPDFReceipt } = require('../controllers/admin.controller');
          const pdfResult = await generateAndSendPDFReceipt(`mem_${result.insertId}`, 'membership');
          if (pdfResult.success) {
            logToFile(`PDF receipt email sent successfully to: ${userData.email}`);
          } else {
            logToFile(`Failed to send PDF receipt email: ${pdfResult.message}`);
          }
        } catch (pdfError) {
          logToFile(`PDF receipt generation error: ${pdfError.message}`);
        }
      } catch (emailError) {
        logToFile(`Failed to send membership confirmation email: ${emailError.message}`);
        // Don't fail the registration if email fails
      }

      // Remove from pending
      pendingPayments.delete(transaction_id);

      return res.json({
        success: true,
        payment_verified: true,
        registration_id: result.insertId,
        message: 'Payment verified and membership registered'
      });
    }

    // Payment still pending
    res.json({
      success: true,
      payment_verified: false,
      message: 'Payment pending'
    });

  } catch (error) {
    console.error('Check payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check payment status'
    });
  }
});

// Webhook endpoint for payment gateway (simulate payment success)
router.post('/webhook/payment-success', async (req, res) => {
  try {
    const { transaction_id, amount, upi_ref } = req.body;

    const payment = pendingPayments.get(transaction_id);

    if (payment) {
      // Mark payment as verified
      payment.verified = true;
      payment.upi_ref = upi_ref;
      payment.verified_at = new Date();
      pendingPayments.set(transaction_id, payment);

      }

    res.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false });
  }
});

// Manual payment verification (for testing)
router.post('/verify-manual', async (req, res) => {
  try {
    const { transaction_id } = req.body;

    const payment = pendingPayments.get(transaction_id);

    if (payment) {
      payment.verified = true;
      payment.verified_at = new Date();
      pendingPayments.set(transaction_id, payment);

      res.json({
        success: true,
        message: 'Payment manually verified'
      });
    } else {
      res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }
  } catch (error) {
    console.error('Manual verify error:', error);
    res.status(500).json({ success: false });
  }
});

module.exports = router;
