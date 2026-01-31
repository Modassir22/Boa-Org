const express = require('express');
const router = express.Router();
const newsController = require('../controllers/news.controller');

// Get all active news (public endpoint)
router.get('/', newsController.getAllNews);

// Get single news item (public endpoint)
router.get('/:id', newsController.getNewsById);

module.exports = router;