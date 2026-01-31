const { promisePool } = require('../config/database');

// Get all active news (public endpoint)
exports.getAllNews = async (req, res) => {
  try {
    const { limit } = req.query;
    let query = `SELECT id, title, content, image_url, created_at, status 
                 FROM news 
                 WHERE status = 'active' 
                 ORDER BY created_at DESC`;
    
    const queryParams = [];
    
    if (limit && !isNaN(parseInt(limit))) {
      query += ` LIMIT ?`;
      queryParams.push(parseInt(limit));
    }

    const [news] = await promisePool.query(query, queryParams);

    res.json({
      success: true,
      news: news
    });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news'
    });
  }
};

// Get single news item (public endpoint)
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;

    const [news] = await promisePool.query(
      `SELECT id, title, content, image_url, created_at, status 
       FROM news 
       WHERE id = ? AND status = 'active'`,
      [id]
    );

    if (news.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'News not found'
      });
    }

    res.json({
      success: true,
      news: news[0]
    });
  } catch (error) {
    console.error('Get single news error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch news'
    });
  }
};