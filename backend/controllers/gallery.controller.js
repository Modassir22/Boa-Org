const { promisePool } = require('../config/database');

// Get all active gallery images (public endpoint)
exports.getAllGalleryImages = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = `SELECT id, title, description, image_url, created_at 
                 FROM gallery_images 
                 WHERE status = 'active' 
                 ORDER BY created_at DESC`;
    
    const queryParams = [];
    
    if (limit && !isNaN(parseInt(limit))) {
      query += ` LIMIT ?`;
      queryParams.push(parseInt(limit));
    }

    const [images] = await promisePool.query(query, queryParams);

    res.json({
      success: true,
      images: images
    });
  } catch (error) {
    console.error('Get gallery images error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery images'
    });
  }
};

// Get single gallery image (public endpoint)
exports.getGalleryImageById = async (req, res) => {
  try {
    const { id } = req.params;

    const [images] = await promisePool.query(
      `SELECT id, title, description, image_url, created_at 
       FROM gallery_images 
       WHERE id = ? AND status = 'active'`,
      [id]
    );

    if (images.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Gallery image not found'
      });
    }

    res.json({
      success: true,
      image: images[0]
    });
  } catch (error) {
    console.error('Get single gallery image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery image'
    });
  }
};