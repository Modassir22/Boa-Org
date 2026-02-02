const express = require('express');
const router = express.Router();
const registrationController = require('../controllers/registration.controller');
const auth = require('../middleware/auth.middleware');

// Add logging middleware for all registration routes
router.use((req, res, next) => {
  next();
});

// Test endpoint
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Registration routes working' });
});

// Simple test POST endpoint
router.post('/test-post', (req, res) => {
  res.json({ success: true, message: 'POST test working', user_id: req.user?.id });
});

// Create registration (no auth required)
router.post('/', registrationController.createRegistration);

// Get user registrations (requires auth)
router.get('/my-registrations', auth, registrationController.getUserRegistrations);

// Update payment status (no auth required)
router.put('/:id/payment', registrationController.updatePaymentStatus);

module.exports = router;
