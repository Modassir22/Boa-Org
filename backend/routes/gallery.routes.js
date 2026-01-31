const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');

// Get all active gallery images (public endpoint)
router.get('/', galleryController.getAllGalleryImages);

// Get single gallery image (public endpoint)
router.get('/:id', galleryController.getGalleryImageById);

module.exports = router;