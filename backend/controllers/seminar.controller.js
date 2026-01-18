const { promisePool } = require('../config/database');

// Get all seminars
exports.getAllSeminars = async (req, res) => {
  try {
    const [seminars] = await promisePool.query(
      'SELECT * FROM seminars ORDER BY start_date DESC'
    );

    res.json({
      success: true,
      count: seminars.length,
      seminars
    });

  } catch (error) {
    console.error('Get seminars error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seminars',
      error: error.message
    });
  }
};

// Get seminar by ID with fee structure
exports.getSeminarById = async (req, res) => {
  try {
    const { id } = req.params;

    // Get seminar
    const [seminars] = await promisePool.query(
      'SELECT * FROM seminars WHERE id = ?',
      [id]
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Seminar not found'
      });
    }

    const seminar = seminars[0];

    // Get fee categories
    const [categories] = await promisePool.query(
      'SELECT * FROM fee_categories WHERE seminar_id = ? AND is_enabled = TRUE',
      [id]
    );

    // Get fee slabs
    const [slabs] = await promisePool.query(
      'SELECT * FROM fee_slabs WHERE seminar_id = ?',
      [id]
    );

    // Get fee structure
    const [feeStructure] = await promisePool.query(
      `SELECT fs.*, fc.name as category_name, fsl.label as slab_label
       FROM fee_structure fs
       JOIN fee_categories fc ON fs.category_id = fc.id
       JOIN fee_slabs fsl ON fs.slab_id = fsl.id
       WHERE fc.seminar_id = ?`,
      [id]
    );

    // Get delegate categories
    const [delegateCategories] = await promisePool.query(
      'SELECT * FROM delegate_categories WHERE seminar_id = ? AND is_enabled = TRUE ORDER BY display_order',
      [id]
    );

    // Format fee structure
    const formattedCategories = categories.map(cat => {
      const fees = {};
      feeStructure
        .filter(fs => fs.category_id === cat.id)
        .forEach(fs => {
          const slab = slabs.find(s => s.id === fs.slab_id);
          if (slab) {
            fees[slab.id] = parseFloat(fs.amount);
          }
        });
      
      return {
        ...cat,
        fees
      };
    });

    res.json({
      success: true,
      seminar: {
        ...seminar,
        categories: formattedCategories,
        slabs,
        delegateCategories
      }
    });

  } catch (error) {
    console.error('Get seminar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch seminar',
      error: error.message
    });
  }
};

// Get active seminar
exports.getActiveSeminar = async (req, res) => {
  try {
    const [seminars] = await promisePool.query(
      'SELECT * FROM seminars WHERE is_active = TRUE ORDER BY start_date DESC LIMIT 1'
    );

    if (seminars.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active seminar found'
      });
    }

    const seminar = seminars[0];

    // Get fee categories and structure
    const [categories] = await promisePool.query(
      'SELECT * FROM fee_categories WHERE seminar_id = ? AND is_enabled = TRUE',
      [seminar.id]
    );

    const [slabs] = await promisePool.query(
      'SELECT * FROM fee_slabs WHERE seminar_id = ?',
      [seminar.id]
    );

    const [feeStructure] = await promisePool.query(
      `SELECT fs.*, fc.name as category_name
       FROM fee_structure fs
       JOIN fee_categories fc ON fs.category_id = fc.id
       WHERE fc.seminar_id = ?`,
      [seminar.id]
    );

    // Get delegate categories
    const [delegateCategories] = await promisePool.query(
      'SELECT * FROM delegate_categories WHERE seminar_id = ? AND is_enabled = TRUE ORDER BY display_order',
      [seminar.id]
    );

    const formattedCategories = categories.map(cat => {
      const fees = {};
      feeStructure
        .filter(fs => fs.category_id === cat.id)
        .forEach(fs => {
          const slab = slabs.find(s => s.id === fs.slab_id);
          if (slab) {
            fees[slab.id] = parseFloat(fs.amount);
          }
        });
      
      return {
        ...cat,
        fees
      };
    });

    res.json({
      success: true,
      seminar: {
        ...seminar,
        categories: formattedCategories,
        slabs,
        delegateCategories
      }
    });

  } catch (error) {
    console.error('Get active seminar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch active seminar',
      error: error.message
    });
  }
};
