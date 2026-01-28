const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { promisePool } = require('../config/database');
const razorpayService = require('../services/razorpay.service');

// Helper function to log to file
function logToFile(message) {
  const logPath = path.join(__dirname, '..', 'payment-debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Simple connectivity test endpoint
router.get('/test-connection', (req, res) => {
  logToFile('Frontend connectivity test called');
  res.json({
    success: true,
    message: 'Backend is reachable',
    timestamp: new Date().toISOString()
  });
});

// Handle preflight requests
router.options('/create-order', (req, res) => {
  logToFile('OPTIONS request received for /create-order');
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.sendStatus(200);
});

// Test endpoint for debugging
router.post('/test', async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Test endpoint working',
      received: req.body
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed'
    });
  }
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
      seminar_id,
      category_id,
      slab_id,
      delegate_type,
      additional_persons = []
    } = registrationData;

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

    // Generate registration number
    const registration_no = `REG-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;

    logToFile(`Generated registration number: ${registration_no}`);

    // Insert main registration
    const [regResult] = await connection.query(
      `INSERT INTO registrations 
       (registration_no, user_id, seminar_id, category_id, slab_id, delegate_type, category_name,
        amount, status, transaction_id, payment_method, payment_date, razorpay_order_id, razorpay_payment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)`,
      [
        registration_no,
        user_id,
        seminar_id,
        category_id,
        slab_id,
        normalizedDelegateType,
        originalCategoryName,
        paymentInfo.amount,
        paymentInfo.status,
        paymentInfo.payment_id,
        'razorpay',
        paymentInfo.order_id,
        paymentInfo.payment_id
      ]
    );

    const registrationId = regResult.insertId;
    logToFile(`Registration inserted with ID: ${registrationId}`);

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

    const [result] = await promisePool.query(
      `INSERT INTO membership_registrations 
       (name, father_name, qualification, year_passing, dob, institution, working_place, 
        sex, age, address, mobile, email, membership_type, transaction_id, payment_status, 
        payment_method, payment_date, razorpay_order_id, razorpay_payment_id, amount)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?)`,
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
        paymentInfo.payment_id,
        'completed',
        'razorpay',
        paymentInfo.order_id,
        paymentInfo.payment_id,
        paymentInfo.amount
      ]
    );

    logToFile(`Membership registration inserted with ID: ${result.insertId}`);

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
