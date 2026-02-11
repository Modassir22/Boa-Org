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

// Admin: Get year-wise statistics for charts
exports.getYearWiseStats = async (req, res) => {
  try {
    // Get year-wise seminar payment amounts with online/offline breakdown
    const [seminarPaymentsByYear] = await promisePool.query(
      `SELECT 
        YEAR(created_at) as year,
        COUNT(*) as total_payments,
        SUM(amount) as total_amount,
        SUM(CASE WHEN transaction_id IS NOT NULL AND transaction_id != '' THEN amount ELSE 0 END) as online_amount,
        SUM(CASE WHEN transaction_id IS NULL OR transaction_id = '' THEN amount ELSE 0 END) as offline_amount,
        COUNT(CASE WHEN transaction_id IS NOT NULL AND transaction_id != '' THEN 1 END) as online_count,
        COUNT(CASE WHEN transaction_id IS NULL OR transaction_id = '' THEN 1 END) as offline_count
       FROM registrations
       WHERE status = 'completed'
       GROUP BY YEAR(created_at)
       ORDER BY year ASC`
    );

    // Get year-wise membership payment amounts with online/offline breakdown
    const [membershipPaymentsByYear] = await promisePool.query(
      `SELECT 
        YEAR(mr.created_at) as year,
        COUNT(*) as total_payments,
        SUM(CASE WHEN mr.amount > 1 THEN mr.amount ELSE COALESCE(mc.price, 0) END) as total_amount,
        SUM(CASE WHEN mr.transaction_id IS NOT NULL AND mr.transaction_id != '' 
            THEN (CASE WHEN mr.amount > 1 THEN mr.amount ELSE COALESCE(mc.price, 0) END)
            ELSE 0 END) as online_amount,
        SUM(CASE WHEN mr.transaction_id IS NULL OR mr.transaction_id = '' 
            THEN (CASE WHEN mr.amount > 1 THEN mr.amount ELSE COALESCE(mc.price, 0) END)
            ELSE 0 END) as offline_amount,
        COUNT(CASE WHEN mr.transaction_id IS NOT NULL AND mr.transaction_id != '' THEN 1 END) as online_count,
        COUNT(CASE WHEN mr.transaction_id IS NULL OR mr.transaction_id = '' THEN 1 END) as offline_count
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       WHERE mr.payment_status IN ('completed', 'paid', 'active')
       GROUP BY YEAR(mr.created_at)
       ORDER BY year ASC`
    );
    
   

    // Get year-wise registrations count (all registrations)
    const [registrationsByYear] = await promisePool.query(
      `SELECT 
        YEAR(created_at) as year,
        COUNT(*) as total_registrations
       FROM registrations
       GROUP BY YEAR(created_at)
       ORDER BY year ASC`
    );

    // Get year-wise membership count
    const [membershipsByYear] = await promisePool.query(
      `SELECT 
        YEAR(created_at) as year,
        COUNT(*) as total_members
       FROM membership_registrations
       GROUP BY YEAR(created_at)
       ORDER BY year ASC`
    );

    // Combine all data by year
    const yearData = {};
    
    // Add seminar payments
    seminarPaymentsByYear.forEach(row => {
      if (!yearData[row.year]) {
        yearData[row.year] = {
          year: row.year,
          total_payments: 0,
          total_amount: 0,
          seminar_amount: 0,
          seminar_online_amount: 0,
          seminar_offline_amount: 0,
          membership_amount: 0,
          membership_online_amount: 0,
          membership_offline_amount: 0,
          total_online_amount: 0,
          total_offline_amount: 0,
          membership_online_count: 0,
          membership_offline_count: 0,
          total_registrations: 0,
          total_members: 0
        };
      }
      yearData[row.year].seminar_amount = parseFloat(row.total_amount) || 0;
      yearData[row.year].seminar_online_amount = parseFloat(row.online_amount) || 0;
      yearData[row.year].seminar_offline_amount = parseFloat(row.offline_amount) || 0;
      yearData[row.year].total_payments += row.total_payments;
      yearData[row.year].total_amount += parseFloat(row.total_amount) || 0;
      yearData[row.year].total_online_amount += parseFloat(row.online_amount) || 0;
      yearData[row.year].total_offline_amount += parseFloat(row.offline_amount) || 0;
      
    });

    // Add membership payments with online/offline breakdown
    membershipPaymentsByYear.forEach(row => {
      if (!yearData[row.year]) {
        yearData[row.year] = {
          year: row.year,
          total_payments: 0,
          total_amount: 0,
          seminar_amount: 0,
          seminar_online_amount: 0,
          seminar_offline_amount: 0,
          membership_amount: 0,
          membership_online_amount: 0,
          membership_offline_amount: 0,
          total_online_amount: 0,
          total_offline_amount: 0,
          membership_online_count: 0,
          membership_offline_count: 0,
          total_registrations: 0,
          total_members: 0
        };
      }
      yearData[row.year].membership_amount = parseFloat(row.total_amount) || 0;
      yearData[row.year].membership_online_amount = parseFloat(row.online_amount) || 0;
      yearData[row.year].membership_offline_amount = parseFloat(row.offline_amount) || 0;
      yearData[row.year].membership_online_count = row.online_count || 0;
      yearData[row.year].membership_offline_count = row.offline_count || 0;
      yearData[row.year].total_payments += row.total_payments;
      yearData[row.year].total_amount += parseFloat(row.total_amount) || 0;
      yearData[row.year].total_online_amount += parseFloat(row.online_amount) || 0;
      yearData[row.year].total_offline_amount += parseFloat(row.offline_amount) || 0;
      
    });

    // Add registrations count
    registrationsByYear.forEach(row => {
      if (!yearData[row.year]) {
        yearData[row.year] = {
          year: row.year,
          total_payments: 0,
          total_amount: 0,
          seminar_amount: 0,
          membership_amount: 0,
          membership_online_amount: 0,
          membership_offline_amount: 0,
          membership_online_count: 0,
          membership_offline_count: 0,
          total_registrations: 0,
          total_members: 0
        };
      }
      yearData[row.year].total_registrations = row.total_registrations;
    });

    // Add memberships count
    membershipsByYear.forEach(row => {
      if (!yearData[row.year]) {
        yearData[row.year] = {
          year: row.year,
          total_payments: 0,
          total_amount: 0,
          seminar_amount: 0,
          membership_amount: 0,
          membership_online_amount: 0,
          membership_offline_amount: 0,
          membership_online_count: 0,
          membership_offline_count: 0,
          total_registrations: 0,
          total_members: 0
        };
      }
      yearData[row.year].total_members = row.total_members;
    });

    // Convert to array and sort by year
    const yearWiseData = Object.values(yearData).sort((a, b) => a.year - b.year);

    res.json({
      success: true,
      data: yearWiseData
    });
  } catch (error) {
    console.error('Get year-wise stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch year-wise statistics'
    });
  }
};