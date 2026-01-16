const express = require('express');
const router = express.Router();
const { promisePool } = require('../config/database');

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

      console.log(`✅ Payment verified: ${transaction_id}`);
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
