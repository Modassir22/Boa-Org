const { promisePool } = require('../config/database');

// Force reload - Updated: 2026-02-04

// Get all active stats (public endpoint)
exports.getAllStats = async (req, res) => {
  try {
    
    const [stats] = await promisePool.query(
      `SELECT stat_key, stat_value, stat_label, stat_icon, display_order 
       FROM stats 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC`
    );


    // Get total members count from membership_registrations (same as admin panel)
    const [memberCount] = await promisePool.query(
      'SELECT COUNT(*) as count FROM membership_registrations'
    );


    // Update the total_members stat with real count
    const updatedStats = stats.map(stat => {
      if (stat.stat_key === 'total_members') {
        return {
          ...stat,
          stat_value: memberCount[0].count.toString()
        };
      }
      return stat;
    });

    
    // Add no-cache headers
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    res.json({
      success: true,
      stats: updatedStats
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

// Admin: Get all stats (including inactive)
exports.getAdminStats = async (req, res) => {
  try {
    const [stats] = await promisePool.query(
      `SELECT id, stat_key, stat_value, stat_label, stat_icon, display_order, is_active, created_at, updated_at 
       FROM stats 
       ORDER BY display_order ASC`
    );

    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Get admin stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};

// Admin: Create new stat
exports.createStat = async (req, res) => {
  try {
    const { stat_key, stat_value, stat_label, stat_icon, display_order } = req.body;

    // Validate required fields
    if (!stat_key || !stat_value || !stat_label || !stat_icon) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO stats (stat_key, stat_value, stat_label, stat_icon, display_order) 
       VALUES (?, ?, ?, ?, ?)`,
      [stat_key, stat_value, stat_label, stat_icon, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Stat created successfully',
      stat_id: result.insertId
    });
  } catch (error) {
    console.error('Create stat error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Stat key already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to create stat'
    });
  }
};

// Admin: Update stat
exports.updateStat = async (req, res) => {
  try {
    const { id } = req.params;
    const { stat_key, stat_value, stat_label, stat_icon, display_order, is_active } = req.body;

    // Validate required fields
    if (!stat_key || !stat_value || !stat_label || !stat_icon) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    const [result] = await promisePool.query(
      `UPDATE stats 
       SET stat_key = ?, stat_value = ?, stat_label = ?, stat_icon = ?, display_order = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [stat_key, stat_value, stat_label, stat_icon, display_order || 0, is_active !== false, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stat not found'
      });
    }

    res.json({
      success: true,
      message: 'Stat updated successfully'
    });
  } catch (error) {
    console.error('Update stat error:', error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({
        success: false,
        message: 'Stat key already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Failed to update stat'
    });
  }
};

// Admin: Delete stat
exports.deleteStat = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await promisePool.query(
      'DELETE FROM stats WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stat not found'
      });
    }

    res.json({
      success: true,
      message: 'Stat deleted successfully'
    });
  } catch (error) {
    console.error('Delete stat error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete stat'
    });
  }
};

// Admin: Toggle stat status
exports.toggleStatStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await promisePool.query(
      'UPDATE stats SET is_active = NOT is_active, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Stat not found'
      });
    }

    res.json({
      success: true,
      message: 'Stat status updated successfully'
    });
  } catch (error) {
    console.error('Toggle stat status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update stat status'
    });
  }
};