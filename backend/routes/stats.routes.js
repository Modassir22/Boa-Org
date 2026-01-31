const express = require('express');
const router = express.Router();
const statsController = require('../controllers/stats.controller');

// Get all active stats (public endpoint)
router.get('/', statsController.getAllStats);

module.exports = router;