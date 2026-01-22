const ExcelJS = require('exceljs');
const { promisePool } = require('../config/database');
const { ACTIVITY_TYPES, createActivityNotification } = require('../utils/activity-logger');

// Helper function to format title consistently
const formatTitle = (title) => {
  const titleMap = {
    'dr': 'Dr.',
    'mr': 'Mr.',
    'mrs': 'Mrs.',
    'ms': 'Ms.',
    'prof': 'Prof.'
  };
  return titleMap[title?.toLowerCase()] || title || '';
};

// ============ SEMINARS CRUD ============

// Get all seminars (admin)
exports.getAllSeminarsAdmin = async (req, res) => {
  try {
    const [seminars] = await promisePool.query(
      'SELECT * FROM seminars ORDER BY created_at DESC'
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

// Create seminar
exports.createSeminar = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const {
      name, title, location, venue, start_date, end_date,
      registration_start, registration_end, description, offline_form_html, image_url, is_active, status,
      color, online_registration_enabled
    } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO seminars (name, title, location, venue, start_date, end_date, 
       registration_start, registration_end, description, offline_form_html, image_url, is_active, status,
       color, online_registration_enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, title, location, venue, start_date, end_date, registration_start, 
       registration_end, description, offline_form_html || '', image_url, is_active || true, status || 'active',
       color || '#0B3C5D', online_registration_enabled !== false ? 1 : 0]
    );

    const seminarId = result.insertId;

    // Copy fee structure from the most recent seminar
    const [lastSeminar] = await connection.query(
      'SELECT id FROM seminars WHERE id != ? ORDER BY id DESC LIMIT 1',
      [seminarId]
    );

    if (lastSeminar.length > 0) {
      const lastSeminarId = lastSeminar[0].id;

      // Copy fee categories
      await connection.query(
        `INSERT INTO fee_categories (seminar_id, name, description, is_popular, is_enabled)
         SELECT ?, name, description, is_popular, is_enabled
         FROM fee_categories WHERE seminar_id = ?`,
        [seminarId, lastSeminarId]
      );

      // Copy fee slabs
      await connection.query(
        `INSERT INTO fee_slabs (seminar_id, label, date_range, start_date, end_date)
         SELECT ?, label, date_range, start_date, end_date
         FROM fee_slabs WHERE seminar_id = ?`,
        [seminarId, lastSeminarId]
      );

      // Copy fee structure with mapping
      await connection.query(
        `INSERT INTO fee_structure (category_id, slab_id, amount)
         SELECT 
           new_cat.id,
           new_slab.id,
           old_fee.amount
         FROM fee_structure old_fee
         JOIN fee_categories old_cat ON old_fee.category_id = old_cat.id
         JOIN fee_slabs old_slab ON old_fee.slab_id = old_slab.id
         JOIN fee_categories new_cat ON new_cat.seminar_id = ? AND new_cat.name = old_cat.name
         JOIN fee_slabs new_slab ON new_slab.seminar_id = ? AND new_slab.label = old_slab.label
         WHERE old_cat.seminar_id = ?`,
        [seminarId, seminarId, lastSeminarId]
      );
    }

    // If seminar is active, create notification
    if (is_active) {
      await connection.query(
        'INSERT INTO notifications (title, seminar_id, message, is_active) VALUES (?, ?, ?, ?)',
        [name, seminarId, `New seminar: ${name}`, true]
      );
    }

    await connection.commit();

    res.status(201).json({
      success: true,
      message: 'Seminar created successfully with fee structure copied from previous seminar',
      seminar_id: seminarId
    });
  } catch (error) {
    await connection.rollback();
    console.error('Create seminar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create seminar',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// Update seminar
exports.updateSeminar = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, title, location, venue, start_date, end_date,
      registration_start, registration_end, description, offline_form_html, image_url, is_active, status,
      color, online_registration_enabled
    } = req.body;

    await promisePool.query(
      `UPDATE seminars SET name = ?, title = ?, location = ?, venue = ?, start_date = ?, 
       end_date = ?, registration_start = ?, registration_end = ?, 
       description = ?, offline_form_html = ?, image_url = ?, is_active = ?, status = ?, 
       color = ?, online_registration_enabled = ? WHERE id = ?`,
      [name, title, location, venue, start_date, end_date, registration_start, 
       registration_end, description, offline_form_html || '', image_url, is_active, status || 'active',
       color || '#0B3C5D', online_registration_enabled !== false ? 1 : 0, id]
    );

    // Check if notification exists for this seminar
    const [existingNotif] = await promisePool.query(
      'SELECT id FROM notifications WHERE seminar_id = ?',
      [id]
    );

    if (is_active) {
      // If active and notification exists, update it
      if (existingNotif.length > 0) {
        await promisePool.query(
          'UPDATE notifications SET title = ?, message = ?, is_active = ? WHERE seminar_id = ?',
          [name, `New seminar: ${name}`, true, id]
        );
      } else {
        // If active but no notification, create one
        await promisePool.query(
          'INSERT INTO notifications (title, seminar_id, message, is_active) VALUES (?, ?, ?, ?)',
          [name, id, `New seminar: ${name}`, true]
        );
      }
    } else {
      // If inactive, delete notification
      await promisePool.query('DELETE FROM notifications WHERE seminar_id = ?', [id]);
    }

    res.json({
      success: true,
      message: 'Seminar updated successfully'
    });
  } catch (error) {
    console.error('Update seminar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update seminar',
      error: error.message
    });
  }
};

// Delete seminar
exports.deleteSeminar = async (req, res) => {
  const connection = await promisePool.getConnection();
  
  try {
    const { id } = req.params;

    await connection.beginTransaction();

    // Delete in correct order to avoid foreign key constraints
    
    // 1. Delete additional persons from registrations
    await connection.query(
      `DELETE ap FROM additional_persons ap
       INNER JOIN registrations r ON ap.registration_id = r.id
       WHERE r.seminar_id = ?`,
      [id]
    );

    // 2. Delete registrations
    await connection.query('DELETE FROM registrations WHERE seminar_id = ?', [id]);

    // 3. DO NOT DELETE FEE STRUCTURE - Keep it for reuse with new seminars
    // Fee structure will be updated when new seminar is created

    // 4. Delete delegate categories
    await connection.query('DELETE FROM delegate_categories WHERE seminar_id = ?', [id]);

    // 5. Delete notifications
    await connection.query('DELETE FROM notifications WHERE seminar_id = ?', [id]);

    // 6. Finally delete seminar
    await connection.query('DELETE FROM seminars WHERE id = ?', [id]);

    await connection.commit();

    res.json({
      success: true,
      message: 'Seminar deleted successfully. Fee structure preserved for reuse.'
    });
  } catch (error) {
    await connection.rollback();
    console.error('Delete seminar error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete seminar. It may have related data.',
      error: error.message
    });
  } finally {
    connection.release();
  }
};

// ============ USERS CRUD ============

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await promisePool.query(
      `SELECT u.*, a.house, a.street, a.city, a.state, a.country, a.pin_code
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       ORDER BY u.created_at DESC`
    );

    // Remove passwords
    users.forEach(user => delete user.password);

    res.json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
};

// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user',
      error: error.message
    });
  }
};

// Get user details with membership, bookings, and payments
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;

    // Get membership details
    const [membership] = await promisePool.query(
      `SELECT mr.*, mc.title as category_title, mc.price as category_price
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       WHERE mr.email IN (SELECT email FROM users WHERE id = ?)
       ORDER BY mr.created_at DESC
       LIMIT 1`,
      [id]
    );

    // Get seminar bookings with payment info
    const [bookings] = await promisePool.query(
      `SELECT r.*, s.name as seminar_name, s.start_date as seminar_start_date, 
              s.end_date as seminar_end_date, dc.name as delegate_category,
              r.amount as total_amount
       FROM registrations r
       LEFT JOIN seminars s ON r.seminar_id = s.id
       LEFT JOIN delegate_categories dc ON r.category_id = dc.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [id]
    );

    // Get all payments (from registrations + membership)
    const payments = [];
    
    // Add seminar registration payments
    bookings.forEach(booking => {
      payments.push({
        id: `reg_${booking.id}`,
        amount: booking.amount,
        payment_type: `Seminar Registration - ${booking.seminar_name}`,
        payment_method: booking.payment_method || 'N/A',
        transaction_id: booking.transaction_id,
        status: booking.status,
        created_at: booking.payment_date || booking.created_at
      });
    });

    // Add membership payment if exists
    if (membership.length > 0 && membership[0].payment_status) {
      payments.push({
        id: `mem_${membership[0].id}`,
        amount: membership[0].category_price || 0,
        payment_type: `Membership - ${membership[0].membership_type}`,
        payment_method: 'Online',
        transaction_id: membership[0].transaction_id,
        status: membership[0].payment_status === 'completed' ? 'completed' : 'pending',
        created_at: membership[0].created_at
      });
    }

    // Sort payments by date
    payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    res.json({
      success: true,
      details: {
        membership: membership[0] || null,
        bookings: bookings || [],
        payments: payments || []
      }
    });
  } catch (error) {
    console.error('Get user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user details',
      error: error.message
    });
  }
};

// Export single user details to Excel
exports.exportUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const ExcelJS = require('exceljs');

    // Get user info
    const [users] = await promisePool.query(
      `SELECT u.*, a.house, a.street, a.city, a.state, a.country, a.pin_code
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       WHERE u.id = ?`,
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    delete user.password;

    // Get membership
    const [membership] = await promisePool.query(
      `SELECT mr.*, mc.title as category_title, mc.price as category_price
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       WHERE mr.email = ?`,
      [user.email]
    );

    // Get bookings
    const [bookings] = await promisePool.query(
      `SELECT r.*, s.name as seminar_name, s.start_date, s.end_date, 
              dc.name as delegate_category
       FROM registrations r
       LEFT JOIN seminars s ON r.seminar_id = s.id
       LEFT JOIN delegate_categories dc ON r.category_id = dc.id
       WHERE r.user_id = ?`,
      [id]
    );

    // Prepare payments data
    const payments = [];
    
    // Add seminar payments
    bookings.forEach(booking => {
      payments.push({
        transaction_id: booking.transaction_id || 'N/A',
        amount: booking.amount,
        type: `Seminar - ${booking.seminar_name}`,
        method: booking.payment_method || 'N/A',
        status: booking.status,
        date: booking.payment_date || booking.created_at
      });
    });

    // Add membership payment
    if (membership.length > 0) {
      payments.push({
        transaction_id: membership[0].transaction_id || 'N/A',
        amount: membership[0].category_price || 0,
        type: `Membership - ${membership[0].membership_type}`,
        method: 'Online',
        status: membership[0].payment_status || 'pending',
        date: membership[0].created_at
      });
    }

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // User Info Sheet
    const userSheet = workbook.addWorksheet('User Info');
    userSheet.columns = [
      { header: 'Field', key: 'field', width: 20 },
      { header: 'Value', key: 'value', width: 40 }
    ];
    userSheet.addRows([
      { field: 'Name', value: `${formatTitle(user.title)} ${user.first_name} ${user.surname}` },
      { field: 'Email', value: user.email },
      { field: 'Mobile', value: user.mobile },
      { field: 'DOB', value: user.dob },
      { field: 'Address', value: `${user.house || ''} ${user.street || ''}, ${user.city || ''}, ${user.state || ''} ${user.pin_code || ''}` },
      { field: 'Membership No', value: user.membership_no || 'N/A' },
      { field: 'Registration Date', value: user.created_at }
    ]);

    // Membership Sheet
    if (membership.length > 0) {
      const membershipSheet = workbook.addWorksheet('Membership');
      membershipSheet.columns = [
        { header: 'Membership No', key: 'membership_no', width: 20 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount Paid', key: 'amount', width: 15 },
        { header: 'Date', key: 'date', width: 15 }
      ];
      membershipSheet.addRows(membership.map(m => ({
        membership_no: m.membership_no,
        category: m.category_title,
        amount: m.amount_paid,
        date: m.created_at
      })));
    }

    // Bookings Sheet
    if (bookings.length > 0) {
      const bookingsSheet = workbook.addWorksheet('Seminar Bookings');
      bookingsSheet.columns = [
        { header: 'Seminar', key: 'seminar', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 15 }
      ];
      bookingsSheet.addRows(bookings.map(b => ({
        seminar: b.seminar_name,
        category: b.delegate_category,
        amount: b.amount,
        status: b.status,
        date: b.created_at
      })));
    }

    // Payments Sheet
    if (payments.length > 0) {
      const paymentsSheet = workbook.addWorksheet('Payments');
      paymentsSheet.columns = [
        { header: 'Transaction ID', key: 'transaction_id', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Type', key: 'type', width: 30 },
        { header: 'Method', key: 'method', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 15 }
      ];
      paymentsSheet.addRows(payments);
    }

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=user_${id}_details.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export user details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export user details',
      error: error.message
    });
  }
};

// Export all users to Excel
exports.exportAllUsers = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');

    // Get all users
    const [users] = await promisePool.query(
      `SELECT u.*, a.house, a.street, a.city, a.state, a.country, a.pin_code
       FROM users u
       LEFT JOIN addresses a ON u.id = a.user_id
       ORDER BY u.created_at DESC`
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('All Users');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'DOB', key: 'dob', width: 15 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Membership No', key: 'membership_no', width: 20 },
      { header: 'Role', key: 'role', width: 15 },
      { header: 'Registration Date', key: 'created_at', width: 20 }
    ];

    worksheet.addRows(users.map(user => ({
      id: user.id,
      name: `${formatTitle(user.title)} ${user.first_name} ${user.surname}`,
      email: user.email,
      mobile: user.mobile,
      dob: user.dob,
      city: user.city || 'N/A',
      state: user.state || 'N/A',
      membership_no: user.membership_no || 'N/A',
      role: user.role,
      created_at: user.created_at
    })));

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=all_users_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export users',
      error: error.message
    });
  }
};


// ============ REGISTRATIONS CRUD ============

// Get all registrations (admin)
exports.getAllRegistrations = async (req, res) => {
  try {
    const { seminar_id, status } = req.query;

    let query = `
      SELECT r.*, 
        u.title, u.first_name, u.surname, u.email, u.mobile,
        s.name as seminar_name, s.location as seminar_location,
        fc.name as category_name, fs.label as slab_label
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN seminars s ON r.seminar_id = s.id
      JOIN fee_categories fc ON r.category_id = fc.id
      JOIN fee_slabs fs ON r.slab_id = fs.id
    `;

    const params = [];
    const conditions = [];

    if (seminar_id) {
      conditions.push('r.seminar_id = ?');
      params.push(seminar_id);
    }

    if (status) {
      conditions.push('r.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY r.created_at DESC';

    const [registrations] = await promisePool.query(query, params);

    // Get additional persons
    for (let reg of registrations) {
      const [persons] = await promisePool.query(
        `SELECT ap.*, fc.name as category_name, fs.label as slab_label
         FROM additional_persons ap
         JOIN fee_categories fc ON ap.category_id = fc.id
         JOIN fee_slabs fs ON ap.slab_id = fs.id
         WHERE ap.registration_id = ?`,
        [reg.id]
      );
      reg.additional_persons = persons;
    }

    res.json({
      success: true,
      count: registrations.length,
      registrations
    });
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch registrations',
      error: error.message
    });
  }
};

// Update registration status
exports.updateRegistrationStatus = async (req, res) => {
  try {
    console.log('=== UPDATE REGISTRATION STATUS ===');
    console.log('Registration ID:', req.params.id);
    console.log('New Status:', req.body.status);
    console.log('==================================');
    
    const { id } = req.params;
    const { status } = req.body;

    // First check if this is a completed Razorpay payment
    const [existing] = await promisePool.query(
      'SELECT status, payment_method, razorpay_payment_id FROM registrations WHERE id = ?',
      [id]
    );

    if (existing.length > 0) {
      const registration = existing[0];
      
      // Prevent editing completed Razorpay payments
      if (registration.status === 'completed' && 
          registration.payment_method === 'razorpay' && 
          registration.razorpay_payment_id) {
        return res.status(400).json({
          success: false,
          message: 'Cannot modify status of completed Razorpay payments'
        });
      }
    }

    const [result] = await promisePool.query(
      'UPDATE registrations SET status = ? WHERE id = ?',
      [status, id]
    );

    console.log('Update result:', result);

    res.json({
      success: true,
      message: 'Registration status updated successfully'
    });
  } catch (error) {
    console.error('=== UPDATE REGISTRATION STATUS ERROR ===');
    console.error('Error:', error);
    console.error('========================================');
    res.status(500).json({
      success: false,
      message: 'Failed to update registration',
      error: error.message
    });
  }
};

// Delete registration
exports.deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    // Get registration details before deleting
    const [regDetails] = await promisePool.query(
      `SELECT CONCAT(u.first_name, ' ', u.surname) as full_name, s.name as seminar_name, s.id as seminar_id
       FROM registrations r
       JOIN users u ON r.user_id = u.id
       JOIN seminars s ON r.seminar_id = s.id
       WHERE r.id = ?`,
      [id]
    );

    await promisePool.query('DELETE FROM registrations WHERE id = ?', [id]);

    // Create cancellation notification
    if (regDetails.length > 0) {
      await createActivityNotification(ACTIVITY_TYPES.REGISTRATION_CANCELLED, {
        name: regDetails[0].full_name,
        seminar_name: regDetails[0].seminar_name,
        seminar_id: regDetails[0].seminar_id
      });
    }

    res.json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    console.error('Delete registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete registration',
      error: error.message
    });
  }
};

// ============ NOTIFICATIONS CRUD ============

// Create notification
exports.createNotification = async (req, res) => {
  try {
    const { title, seminar_id, message, is_active } = req.body;

    // Convert empty string to null for seminar_id
    const seminarIdValue = seminar_id === '' || seminar_id === undefined ? null : seminar_id;

    const [result] = await promisePool.query(
      'INSERT INTO notifications (title, seminar_id, message, is_active) VALUES (?, ?, ?, ?)',
      [title, seminarIdValue, message, is_active !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      notification_id: result.insertId
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create notification',
      error: error.message
    });
  }
};

// Update notification
exports.updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, seminar_id, message, is_active } = req.body;

    // Convert empty string to null for seminar_id
    const seminarIdValue = seminar_id === '' || seminar_id === undefined ? null : seminar_id;

    await promisePool.query(
      'UPDATE notifications SET title = ?, seminar_id = ?, message = ?, is_active = ? WHERE id = ?',
      [title, seminarIdValue, message, is_active, id]
    );

    res.json({
      success: true,
      message: 'Notification updated successfully'
    });
  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update notification',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM notifications WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// ============ MEMBERSHIP MANAGEMENT ============

// Get all members for admin management
exports.getAllMembers = async (req, res) => {
  try {
    const [members] = await promisePool.query(`
      SELECT u.*, 
             mr.membership_type, mr.status, mr.valid_from, mr.valid_until, mr.notes,
             mr.created_at as membership_created_at
      FROM users u
      LEFT JOIN membership_registrations mr ON u.email = mr.email
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    // Remove passwords
    members.forEach(member => delete member.password);

    res.json({
      success: true,
      count: members.length,
      members
    });
  } catch (error) {
    console.error('Get all members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch members',
      error: error.message
    });
  }
};

// Update membership details
exports.updateMembershipDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { membership_no, membership_type, status, valid_from, valid_until, notes } = req.body;

    console.log('=== UPDATE MEMBERSHIP DEBUG ===');
    console.log('User ID:', id);
    console.log('Data:', { membership_no, membership_type, status, valid_from, valid_until, notes });

    // Check if membership number already exists (excluding current user)
    if (membership_no) {
      const [existing] = await promisePool.query(
        'SELECT id, CONCAT(first_name, " ", surname) as name FROM users WHERE membership_no = ? AND id != ?',
        [membership_no, id]
      );

      if (existing.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Membership number ${membership_no} is already assigned to ${existing[0].name}`,
          conflict: true
        });
      }
    }

    // Update user's membership number (allow NULL/empty to remove membership)
    await promisePool.query(
      'UPDATE users SET membership_no = ? WHERE id = ?',
      [membership_no || null, id]
    );

    console.log('✓ Updated user membership_no');

    // Get user's email for membership_registrations update
    const [user] = await promisePool.query('SELECT email FROM users WHERE id = ?', [id]);
    
    if (user.length > 0) {
      const userEmail = user[0].email;
      
      // Check if membership registration exists
      const [existing] = await promisePool.query(
        'SELECT id FROM membership_registrations WHERE email = ?',
        [userEmail]
      );

      if (existing.length > 0) {
        // Update existing membership registration
        await promisePool.query(`
          UPDATE membership_registrations 
          SET membership_type = ?, status = ?, valid_from = ?, valid_until = ?, notes = ?
          WHERE email = ?
        `, [membership_type, status, valid_from || null, valid_until || null, notes, userEmail]);
        console.log('✓ Updated membership_registrations');
      } else if (membership_type) {
        // Create new membership registration record only if membership_type is provided
        await promisePool.query(`
          INSERT INTO membership_registrations 
          (email, name, membership_type, status, valid_from, valid_until, notes, created_at)
          SELECT email, CONCAT(title, ' ', first_name, ' ', surname), ?, ?, ?, ?, ?, NOW()
          FROM users WHERE id = ?
        `, [membership_type, status, valid_from || null, valid_until || null, notes, id]);
        console.log('✓ Created membership_registrations');
      }
    }

    res.json({
      success: true,
      message: 'Membership details updated successfully'
    });
  } catch (error) {
    console.error('Update membership details error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership details',
      error: error.message
    });
  }
};

// Check membership number availability
exports.checkMembershipAvailability = async (req, res) => {
  try {
    const { membership_no, user_id } = req.query;

    if (!membership_no) {
      return res.status(400).json({
        success: false,
        message: 'Membership number is required'
      });
    }

    // Check if membership number exists (excluding current user if provided)
    let query = 'SELECT id, CONCAT(first_name, " ", surname) as name FROM users WHERE membership_no = ?';
    let params = [membership_no];

    if (user_id) {
      query += ' AND id != ?';
      params.push(user_id);
    }

    const [existing] = await promisePool.query(query, params);

    if (existing.length > 0) {
      return res.json({
        success: false,
        available: false,
        message: `Membership number ${membership_no} is already assigned to ${existing[0].name}`,
        conflict: {
          user_id: existing[0].id,
          user_name: existing[0].name
        }
      });
    }

    res.json({
      success: true,
      available: true,
      message: `Membership number ${membership_no} is available`
    });

  } catch (error) {
    console.error('Check membership availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check membership availability',
      error: error.message
    });
  }
};

// Export members list
exports.exportMembers = async (req, res) => {
  try {
    const [members] = await promisePool.query(`
      SELECT u.id, u.membership_no, u.title, u.first_name, u.surname, u.email, u.mobile, u.gender, u.dob,
             a.city, a.state, a.country, a.pin_code,
             mr.membership_type, mr.status, mr.valid_from, mr.valid_until, mr.notes,
             u.created_at as registration_date
      FROM users u
      LEFT JOIN addresses a ON u.id = a.user_id
      LEFT JOIN membership_registrations mr ON u.email = mr.email
      WHERE u.role = 'user'
      ORDER BY u.created_at DESC
    `);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BOA Members');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Membership No', key: 'membership_no', width: 20 },
      { header: 'Name', key: 'name', width: 30 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'DOB', key: 'dob', width: 15 },
      { header: 'City', key: 'city', width: 20 },
      { header: 'State', key: 'state', width: 20 },
      { header: 'Country', key: 'country', width: 15 },
      { header: 'Pin Code', key: 'pin_code', width: 10 },
      { header: 'Membership Type', key: 'membership_type', width: 20 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Valid From', key: 'valid_from', width: 15 },
      { header: 'Valid Until', key: 'valid_until', width: 15 },
      { header: 'Registration Date', key: 'registration_date', width: 20 },
      { header: 'Notes', key: 'notes', width: 30 }
    ];

    worksheet.addRows(members.map(member => ({
      id: member.id,
      membership_no: member.membership_no || 'Not Assigned',
      name: `${formatTitle(member.title)} ${member.first_name} ${member.surname}`,
      email: member.email,
      mobile: member.mobile,
      gender: member.gender,
      dob: member.dob ? new Date(member.dob).toLocaleDateString() : '',
      city: member.city || '',
      state: member.state || '',
      country: member.country || '',
      pin_code: member.pin_code || '',
      membership_type: member.membership_type || 'Standard',
      status: member.status || 'Active',
      valid_from: member.valid_from ? new Date(member.valid_from).toLocaleDateString() : '',
      valid_until: member.valid_until ? new Date(member.valid_until).toLocaleDateString() : 'Lifetime',
      registration_date: new Date(member.registration_date).toLocaleDateString(),
      notes: member.notes || ''
    })));

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0B3C5D' }
    };

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=BOA_Members_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export members',
      error: error.message
    });
  }
};

// Export all registrations to Excel
exports.exportRegistrations = async (req, res) => {
  try {
    const { seminar_id } = req.query;

    let query = `
      SELECT 
        r.registration_no,
        r.created_at as registration_date,
        r.status,
        r.amount as total_amount,
        r.transaction_id,
        r.payment_date,
        r.payment_method,
        r.delegate_type,
        u.title,
        u.first_name,
        u.surname,
        u.email,
        u.mobile,
        u.phone,
        u.gender,
        u.dob,
        u.membership_no,
        a.house,
        a.street,
        a.landmark,
        a.city,
        a.state,
        a.country,
        a.pin_code,
        s.name as seminar_name,
        s.location as seminar_location,
        s.start_date as seminar_start_date,
        fc.name as category_name,
        fs.label as fee_slab
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN addresses a ON u.id = a.user_id
      JOIN seminars s ON r.seminar_id = s.id
      JOIN fee_categories fc ON r.category_id = fc.id
      JOIN fee_slabs fs ON r.slab_id = fs.id
    `;

    const params = [];
    if (seminar_id) {
      query += ' WHERE r.seminar_id = ?';
      params.push(seminar_id);
    }

    query += ' ORDER BY r.created_at DESC';

    const [registrations] = await promisePool.query(query, params);

    // Get additional persons for each registration
    const [additionalPersons] = await promisePool.query(`
      SELECT 
        ap.registration_id,
        ap.name,
        ap.amount,
        fc.name as category_name,
        fs.label as fee_slab
      FROM additional_persons ap
      JOIN fee_categories fc ON ap.category_id = fc.id
      JOIN fee_slabs fs ON ap.slab_id = fs.id
    `);

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Registrations');

    // Define columns
    worksheet.columns = [
      { header: 'Registration No', key: 'registration_no', width: 20 },
      { header: 'Registration Date', key: 'registration_date', width: 20 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Title', key: 'title', width: 8 },
      { header: 'First Name', key: 'first_name', width: 15 },
      { header: 'Surname', key: 'surname', width: 15 },
      { header: 'Email', key: 'email', width: 25 },
      { header: 'Mobile', key: 'mobile', width: 15 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Gender', key: 'gender', width: 10 },
      { header: 'Date of Birth', key: 'dob', width: 15 },
      { header: 'Membership No', key: 'membership_no', width: 20 },
      { header: 'Delegate Type', key: 'delegate_type', width: 20 },
      { header: 'House/Flat', key: 'house', width: 15 },
      { header: 'Street', key: 'street', width: 20 },
      { header: 'Landmark', key: 'landmark', width: 20 },
      { header: 'City', key: 'city', width: 15 },
      { header: 'State', key: 'state', width: 15 },
      { header: 'Country', key: 'country', width: 12 },
      { header: 'Pin Code', key: 'pin_code', width: 10 },
      { header: 'Seminar Name', key: 'seminar_name', width: 30 },
      { header: 'Seminar Location', key: 'seminar_location', width: 25 },
      { header: 'Seminar Date', key: 'seminar_start_date', width: 15 },
      { header: 'Category', key: 'category_name', width: 20 },
      { header: 'Fee Slab', key: 'fee_slab', width: 20 },
      { header: 'Registration Amount', key: 'total_amount', width: 18 },
      { header: 'Additional Persons', key: 'additional_persons', width: 30 },
      { header: 'Additional Amount', key: 'additional_amount', width: 18 },
      { header: 'Total Amount', key: 'final_amount', width: 15 },
      { header: 'Payment Method', key: 'payment_method', width: 15 },
      { header: 'Transaction ID', key: 'transaction_id', width: 25 },
      { header: 'Payment Date', key: 'payment_date', width: 20 },
    ];

    // Style header row
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF0080808' }
    };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    registrations.forEach(reg => {
      // Find additional persons for this registration
      const regId = reg.registration_no;
      const additionalForReg = additionalPersons.filter(ap => {
        // Match by registration_no since we need to join
        const [regData] = registrations.filter(r => r.registration_no === regId);
        return regData && ap.registration_id === regData.id;
      });

      const additionalNames = additionalForReg.map(ap => 
        `${ap.name} (${ap.category_name} - ${ap.fee_slab})`
      ).join(', ');

      const additionalAmount = additionalForReg.reduce((sum, ap) => sum + parseFloat(ap.amount), 0);
      const finalAmount = parseFloat(reg.total_amount);

      const row = worksheet.addRow({
        ...reg,
        registration_date: new Date(reg.registration_date).toLocaleString(),
        dob: reg.dob ? new Date(reg.dob).toLocaleDateString() : '',
        seminar_start_date: new Date(reg.seminar_start_date).toLocaleDateString(),
        payment_date: reg.payment_date ? new Date(reg.payment_date).toLocaleString() : '',
        additional_persons: additionalNames || 'None',
        additional_amount: additionalAmount || 0,
        final_amount: finalAmount
      });

      // Color code by status
      if (reg.status === 'completed') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF90EE90' }
        };
      } else if (reg.status === 'pending') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFA500' }
        };
      } else if (reg.status === 'failed') {
        row.getCell('status').fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFF6B6B' }
        };
      }
    });

    // Add summary row
    const summaryRow = worksheet.addRow({});
    summaryRow.getCell(1).value = 'TOTAL REGISTRATIONS:';
    summaryRow.getCell(2).value = registrations.length;
    summaryRow.font = { bold: true };

    const totalAmount = registrations.reduce((sum, reg) => sum + parseFloat(reg.total_amount), 0);
    summaryRow.getCell(26).value = 'TOTAL REVENUE:';
    summaryRow.getCell(29).value = totalAmount;
    summaryRow.getCell(29).numFmt = '₹#,##0.00';

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=BOA_Registrations_${Date.now()}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export registrations',
      error: error.message
    });
  }
};

// Get registration statistics
exports.getStatistics = async (req, res) => {
  try {
    const { seminar_id } = req.query;

    // Total registrations
    let query = 'SELECT COUNT(*) as total FROM registrations';
    const params = [];
    
    if (seminar_id) {
      query += ' WHERE seminar_id = ?';
      params.push(seminar_id);
    }

    const [totalResult] = await promisePool.query(query, params);

    // By status
    let statusQuery = 'SELECT status, COUNT(*) as count FROM registrations';
    if (seminar_id) {
      statusQuery += ' WHERE seminar_id = ?';
    }
    statusQuery += ' GROUP BY status';

    const [statusResult] = await promisePool.query(statusQuery, params);

    // Total revenue
    let revenueQuery = 'SELECT SUM(amount) as total_revenue FROM registrations WHERE status = "completed"';
    if (seminar_id) {
      revenueQuery += ' AND seminar_id = ?';
    }

    const [revenueResult] = await promisePool.query(revenueQuery, params);

    res.json({
      success: true,
      statistics: {
        total_registrations: totalResult[0].total,
        by_status: statusResult,
        total_revenue: revenueResult[0].total_revenue || 0
      }
    });

  } catch (error) {
    console.error('Statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: error.message
    });
  }
};

// ============ COMMITTEE MEMBERS CRUD ============

// Get all committee members
exports.getAllCommitteeMembers = async (req, res) => {
  try {
    const [members] = await promisePool.query(
      'SELECT * FROM committee_members WHERE is_active = TRUE ORDER BY display_order, id'
    );

    res.json({
      success: true,
      members
    });
  } catch (error) {
    console.error('Get committee members error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch committee members',
      error: error.message
    });
  }
};

// Create committee member
exports.createCommitteeMember = async (req, res) => {
  try {
    const { name, profession, image_url, display_order, page_type } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO committee_members (name, profession, image_url, display_order, page_type, is_active)
       VALUES (?, ?, ?, ?, ?, TRUE)`,
      [name, profession, image_url || '', display_order || 0, page_type || 'about']
    );

    res.status(201).json({
      success: true,
      message: 'Committee member added successfully',
      member_id: result.insertId
    });
  } catch (error) {
    console.error('Create committee member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add committee member',
      error: error.message
    });
  }
};

// Update committee member
exports.updateCommitteeMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, profession, image_url, display_order, is_active, page_type } = req.body;

    // Get old image URL before updating
    const [oldMember] = await promisePool.query(
      'SELECT image_url FROM committee_members WHERE id = ?',
      [id]
    );

    // If image_url changed and old image exists, delete from Cloudinary
    if (oldMember.length > 0 && oldMember[0].image_url && oldMember[0].image_url !== image_url) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary-helper');
      await deleteImageFromCloudinary(oldMember[0].image_url);
    }

    await promisePool.query(
      `UPDATE committee_members 
       SET name = ?, profession = ?, image_url = ?, display_order = ?, is_active = ?, page_type = ?
       WHERE id = ?`,
      [name, profession, image_url, display_order, is_active, page_type, id]
    );

    res.json({
      success: true,
      message: 'Committee member updated successfully'
    });
  } catch (error) {
    console.error('Update committee member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update committee member',
      error: error.message
    });
  }
};

// Delete committee member
exports.deleteCommitteeMember = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM committee_members WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Committee member deleted successfully'
    });
  } catch (error) {
    console.error('Delete committee member error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete committee member',
      error: error.message
    });
  }
};

// ============ DELEGATE CATEGORIES CRUD ============

// Get delegate categories for a seminar
exports.getDelegateCategories = async (req, res) => {
  try {
    const { seminar_id } = req.params;

    const [categories] = await promisePool.query(
      'SELECT * FROM delegate_categories WHERE seminar_id = ? AND is_enabled = TRUE ORDER BY display_order',
      [seminar_id]
    );

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get delegate categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delegate categories',
      error: error.message
    });
  }
};

// Create delegate category
exports.createDelegateCategory = async (req, res) => {
  try {
    const { seminar_id, name, label, description, requires_membership, display_order } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO delegate_categories (seminar_id, name, label, description, requires_membership, display_order, is_enabled)
       VALUES (?, ?, ?, ?, ?, ?, TRUE)`,
      [seminar_id, name, label, description, requires_membership || false, display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Delegate category created successfully',
      category_id: result.insertId
    });
  } catch (error) {
    console.error('Create delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delegate category',
      error: error.message
    });
  }
};

// Update delegate category
exports.updateDelegateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, description, requires_membership, display_order, is_enabled } = req.body;

    await promisePool.query(
      `UPDATE delegate_categories 
       SET name = ?, label = ?, description = ?, requires_membership = ?, display_order = ?, is_enabled = ?
       WHERE id = ?`,
      [name, label, description, requires_membership, display_order, is_enabled, id]
    );

    res.json({
      success: true,
      message: 'Delegate category updated successfully'
    });
  } catch (error) {
    console.error('Update delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delegate category',
      error: error.message
    });
  }
};

// Delete delegate category
exports.deleteDelegateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM delegate_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Delegate category deleted successfully'
    });
  } catch (error) {
    console.error('Delete delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delegate category',
      error: error.message
    });
  }
};

// ============ OFFLINE USER IMPORT ============

// Import single offline user
exports.importOfflineUser = async (req, res) => {
  try {
    const {
      membership_no, title, first_name, surname, email, mobile, password,
      gender, city, state, pin_code
    } = req.body;

    // Check if membership number already exists
    const [existing] = await promisePool.query(
      'SELECT id FROM users WHERE membership_no = ?',
      [membership_no]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Membership number already exists'
      });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate email if not provided
    const userEmail = email || `${membership_no.toLowerCase().replace(/-/g, '')}@temp.com`;

    // Insert user
    const [userResult] = await promisePool.query(
      `INSERT INTO users (
        title, first_name, surname, email, password, mobile,
        gender, membership_no, is_boa_member, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE, TRUE, NOW())`,
      [
        title || 'Dr.',
        first_name,
        surname || '',
        userEmail,
        hashedPassword,
        mobile || '',
        gender || 'male',
        membership_no
      ]
    );

    const userId = userResult.insertId;

    // Insert address if provided
    if (city || state || pin_code) {
      await promisePool.query(
        `INSERT INTO addresses (
          user_id, city, state, country, pin_code
        ) VALUES (?, ?, ?, ?, ?)`,
        [
          userId,
          city || 'Patna',
          state || 'Bihar',
          'India',
          pin_code || '800001'
        ]
      );
    }

    res.status(201).json({
      success: true,
      message: 'Offline user imported successfully',
      user: {
        id: userId,
        membership_no,
        name: `${formatTitle(title)} ${first_name} ${surname}`,
        email: userEmail
      }
    });

  } catch (error) {
    console.error('Import offline user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import offline user',
      error: error.message
    });
  }
};

// ============ FEE STRUCTURE CRUD ============

// Get fee structure for a seminar
exports.getFeeStructure = async (req, res) => {
  try {
    const { seminar_id } = req.params;

    // Get categories
    const [categories] = await promisePool.query(
      'SELECT * FROM fee_categories WHERE seminar_id = ? ORDER BY id',
      [seminar_id]
    );

    // Get slabs
    const [slabs] = await promisePool.query(
      'SELECT * FROM fee_slabs WHERE seminar_id = ? ORDER BY id',
      [seminar_id]
    );

    // Get fee structure
    const [fees] = await promisePool.query(
      `SELECT fs.* FROM fee_structure fs
       JOIN fee_categories fc ON fs.category_id = fc.id
       WHERE fc.seminar_id = ?`,
      [seminar_id]
    );

    res.json({
      success: true,
      categories,
      slabs,
      fees
    });
  } catch (error) {
    console.error('Get fee structure error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch fee structure',
      error: error.message
    });
  }
};

// Create fee category
exports.createFeeCategory = async (req, res) => {
  try {
    const { seminar_id, name, description, is_popular, is_enabled } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO fee_categories (seminar_id, name, description, is_popular, is_enabled)
       VALUES (?, ?, ?, ?, ?)`,
      [seminar_id, name, description, is_popular || false, is_enabled !== false]
    );

    res.status(201).json({
      success: true,
      message: 'Fee category created successfully',
      category_id: result.insertId
    });
  } catch (error) {
    console.error('Create fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fee category',
      error: error.message
    });
  }
};

// Update fee category
exports.updateFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, is_popular, is_enabled } = req.body;

    await promisePool.query(
      `UPDATE fee_categories 
       SET name = ?, description = ?, is_popular = ?, is_enabled = ?
       WHERE id = ?`,
      [name, description, is_popular, is_enabled, id]
    );

    res.json({
      success: true,
      message: 'Fee category updated successfully'
    });
  } catch (error) {
    console.error('Update fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fee category',
      error: error.message
    });
  }
};

// Delete fee category
exports.deleteFeeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated fee structure first
    await promisePool.query('DELETE FROM fee_structure WHERE category_id = ?', [id]);
    
    // Delete category
    await promisePool.query('DELETE FROM fee_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Fee category deleted successfully'
    });
  } catch (error) {
    console.error('Delete fee category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee category',
      error: error.message
    });
  }
};

// Create fee slab
exports.createFeeSlab = async (req, res) => {
  try {
    const { seminar_id, label, date_range, start_date, end_date } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO fee_slabs (seminar_id, label, date_range, start_date, end_date)
       VALUES (?, ?, ?, ?, ?)`,
      [seminar_id, label, date_range, start_date, end_date]
    );

    res.status(201).json({
      success: true,
      message: 'Fee slab created successfully',
      slab_id: result.insertId
    });
  } catch (error) {
    console.error('Create fee slab error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create fee slab',
      error: error.message
    });
  }
};

// Update fee slab
exports.updateFeeSlab = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, date_range, start_date, end_date } = req.body;

    await promisePool.query(
      `UPDATE fee_slabs 
       SET label = ?, date_range = ?, start_date = ?, end_date = ?
       WHERE id = ?`,
      [label, date_range, start_date, end_date, id]
    );

    res.json({
      success: true,
      message: 'Fee slab updated successfully'
    });
  } catch (error) {
    console.error('Update fee slab error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fee slab',
      error: error.message
    });
  }
};

// Delete fee slab
exports.deleteFeeSlab = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated fee structure first
    await promisePool.query('DELETE FROM fee_structure WHERE slab_id = ?', [id]);
    
    // Delete slab
    await promisePool.query('DELETE FROM fee_slabs WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Fee slab deleted successfully'
    });
  } catch (error) {
    console.error('Delete fee slab error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete fee slab',
      error: error.message
    });
  }
};

// Update fee amount
exports.updateFeeAmount = async (req, res) => {
  try {
    const { category_id, slab_id, amount } = req.body;

    // Check if fee structure exists
    const [existing] = await promisePool.query(
      'SELECT id FROM fee_structure WHERE category_id = ? AND slab_id = ?',
      [category_id, slab_id]
    );

    if (existing.length > 0) {
      // Update existing
      await promisePool.query(
        'UPDATE fee_structure SET amount = ? WHERE category_id = ? AND slab_id = ?',
        [amount, category_id, slab_id]
      );
    } else {
      // Insert new
      await promisePool.query(
        'INSERT INTO fee_structure (category_id, slab_id, amount) VALUES (?, ?, ?)',
        [category_id, slab_id, amount]
      );
    }

    res.json({
      success: true,
      message: 'Fee amount updated successfully'
    });
  } catch (error) {
    console.error('Update fee amount error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update fee amount',
      error: error.message
    });
  }
};

// ============ CERTIFICATION CRUD ============

// Get certification
exports.getCertification = async (req, res) => {
  try {
    const [certification] = await promisePool.query(
      'SELECT * FROM certification LIMIT 1'
    );

    res.json({
      success: true,
      certification: certification[0] || null
    });
  } catch (error) {
    console.error('Get certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certification',
      error: error.message
    });
  }
};

// Update certification
exports.updateCertification = async (req, res) => {
  try {
    const {
      organization_name,
      registration_number,
      certificate_number,
      registration_act,
      registration_date,
      registered_office,
      certificate_image_url
    } = req.body;

    // Check if certification exists
    const [existing] = await promisePool.query('SELECT id, certificate_image_url FROM certification LIMIT 1');

    if (existing.length > 0) {
      // If image_url changed and old image exists, delete from Cloudinary
      if (existing[0].certificate_image_url && existing[0].certificate_image_url !== certificate_image_url) {
        const { deleteImageFromCloudinary } = require('../utils/cloudinary-helper');
        await deleteImageFromCloudinary(existing[0].certificate_image_url);
      }

      // Update existing
      await promisePool.query(
        `UPDATE certification SET 
         organization_name = ?, registration_number = ?, certificate_number = ?,
         registration_act = ?, registration_date = ?, registered_office = ?,
         certificate_image_url = ?
         WHERE id = ?`,
        [
          organization_name,
          registration_number,
          certificate_number,
          registration_act,
          registration_date,
          registered_office,
          certificate_image_url,
          existing[0].id
        ]
      );
    } else {
      // Insert new
      await promisePool.query(
        `INSERT INTO certification (
          organization_name, registration_number, certificate_number,
          registration_act, registration_date, registered_office, certificate_image_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          organization_name,
          registration_number,
          certificate_number,
          registration_act,
          registration_date,
          registered_office,
          certificate_image_url
        ]
      );
    }

    res.json({
      success: true,
      message: 'Certification updated successfully'
    });
  } catch (error) {
    console.error('Update certification error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update certification',
      error: error.message
    });
  }
};

// Upload certificate image to Cloudinary
exports.uploadCertificateImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const cloudinary = require('../config/cloudinary');
    
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'boa-certificates',
          resource_type: 'image'
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      image_url: result.secure_url
    });
  } catch (error) {
    console.error('Upload certificate image error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};

// ============ UPCOMING EVENTS CRUD ============

// Get all upcoming events
exports.getAllUpcomingEvents = async (req, res) => {
  try {
    const [events] = await promisePool.query(
      'SELECT * FROM upcoming_events ORDER BY display_order, id'
    );

    res.json({
      success: true,
      events
    });
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch upcoming events',
      error: error.message
    });
  }
};

// Create upcoming event
exports.createUpcomingEvent = async (req, res) => {
  try {
    const { title, description, location, start_date, end_date, image_url, link_url, display_order } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO upcoming_events (title, description, location, start_date, end_date, image_url, link_url, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [title || '', description || '', location || '', start_date || null, end_date || null, image_url, link_url || '', display_order || 0]
    );

    res.status(201).json({
      success: true,
      message: 'Upcoming event created successfully',
      event_id: result.insertId
    });
  } catch (error) {
    console.error('Create upcoming event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create upcoming event',
      error: error.message
    });
  }
};

// Update upcoming event
exports.updateUpcomingEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, location, start_date, end_date, image_url, link_url, display_order, is_active } = req.body;

    // Get old image URL before updating
    const [oldEvent] = await promisePool.query(
      'SELECT image_url FROM upcoming_events WHERE id = ?',
      [id]
    );

    // If image_url changed and old image exists, delete from Cloudinary
    if (oldEvent.length > 0 && oldEvent[0].image_url && oldEvent[0].image_url !== image_url) {
      const { deleteImageFromCloudinary } = require('../utils/cloudinary-helper');
      await deleteImageFromCloudinary(oldEvent[0].image_url);
    }

    await promisePool.query(
      `UPDATE upcoming_events 
       SET title = ?, description = ?, location = ?, start_date = ?, end_date = ?, 
           image_url = ?, link_url = ?, display_order = ?, is_active = ?
       WHERE id = ?`,
      [title || '', description || '', location || '', start_date || null, end_date || null, 
       image_url, link_url, display_order, is_active, id]
    );

    res.json({
      success: true,
      message: 'Upcoming event updated successfully'
    });
  } catch (error) {
    console.error('Update upcoming event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update upcoming event',
      error: error.message
    });
  }
};

// Delete upcoming event
exports.deleteUpcomingEvent = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM upcoming_events WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Upcoming event deleted successfully'
    });
  } catch (error) {
    console.error('Delete upcoming event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete upcoming event',
      error: error.message
    });
  }
};

// ============ CONTACT INFO CRUD ============

// Get contact info
exports.getContactInfo = async (req, res) => {
  try {
    const [contactInfo] = await promisePool.query(
      'SELECT * FROM contact_info LIMIT 1'
    );

    res.json({
      success: true,
      contactInfo: contactInfo[0] || null
    });
  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contact info',
      error: error.message
    });
  }
};

// Update contact info
exports.updateContactInfo = async (req, res) => {
  try {
    const {
      organization_name,
      email,
      phone,
      mobile,
      address,
      city,
      state,
      pin_code,
      facebook_url,
      twitter_url,
      linkedin_url,
      instagram_url
    } = req.body;

    // Check if contact info exists
    const [existing] = await promisePool.query('SELECT id FROM contact_info LIMIT 1');

    if (existing.length > 0) {
      // Update existing
      await promisePool.query(
        `UPDATE contact_info SET 
         organization_name = ?, email = ?, phone = ?, mobile = ?,
         address = ?, city = ?, state = ?, pin_code = ?,
         facebook_url = ?, twitter_url = ?, linkedin_url = ?, instagram_url = ?
         WHERE id = ?`,
        [
          organization_name, email, phone, mobile,
          address, city, state, pin_code,
          facebook_url, twitter_url, linkedin_url, instagram_url,
          existing[0].id
        ]
      );
    } else {
      // Insert new
      await promisePool.query(
        `INSERT INTO contact_info (
          organization_name, email, phone, mobile,
          address, city, state, pin_code,
          facebook_url, twitter_url, linkedin_url, instagram_url
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          organization_name, email, phone, mobile,
          address, city, state, pin_code,
          facebook_url, twitter_url, linkedin_url, instagram_url
        ]
      );
    }

    res.json({
      success: true,
      message: 'Contact info updated successfully'
    });
  } catch (error) {
    console.error('Update contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact info',
      error: error.message
    });
  }
};


// ============ SITE CONFIGURATION ============

// Get site configuration
exports.getSiteConfig = async (req, res) => {
  try {
    const [config] = await promisePool.query('SELECT * FROM site_config LIMIT 1');
    
    res.json({
      success: true,
      config: config[0] || {
        favicon_url: '',
        logo_url: '',
        hero_circle_image_url: '',
        site_title: 'Bihar Ophthalmic Association',
        site_description: ''
      }
    });
  } catch (error) {
    console.error('Get site config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch site configuration',
      error: error.message
    });
  }
};

// Update site configuration
exports.updateSiteConfig = async (req, res) => {
  try {
    const { favicon_url, logo_url, hero_circle_image_url, site_title, site_description } = req.body;

    // Check if config exists
    const [existing] = await promisePool.query('SELECT id FROM site_config LIMIT 1');

    if (existing.length > 0) {
      // Update existing
      await promisePool.query(
        `UPDATE site_config SET 
         favicon_url = ?, 
         logo_url = ?, 
         hero_circle_image_url = ?,
         site_title = ?,
         site_description = ?
         WHERE id = ?`,
        [favicon_url, logo_url, hero_circle_image_url, site_title, site_description, existing[0].id]
      );
    } else {
      // Insert new
      await promisePool.query(
        `INSERT INTO site_config (favicon_url, logo_url, hero_circle_image_url, site_title, site_description)
         VALUES (?, ?, ?, ?, ?)`,
        [favicon_url, logo_url, hero_circle_image_url, site_title, site_description]
      );
    }

    res.json({
      success: true,
      message: 'Site configuration updated successfully'
    });
  } catch (error) {
    console.error('Update site config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update site configuration',
      error: error.message
    });
  }
};

// ============ MEMBERSHIP FORM CONFIGURATION ============

// Get membership form configuration
exports.getMembershipFormConfig = async (req, res) => {
  try {
    const [config] = await promisePool.query('SELECT * FROM membership_form_config LIMIT 1');
    
    res.json({
      success: true,
      config: config[0] || {
        form_html: '',
        offline_form_html: ''
      }
    });
  } catch (error) {
    console.error('Get membership form config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership form configuration',
      error: error.message
    });
  }
};

// Update membership form configuration
exports.updateMembershipFormConfig = async (req, res) => {
  try {
    const { form_html, offline_form_html } = req.body;

    // Check if config exists
    const [existing] = await promisePool.query('SELECT id FROM membership_form_config LIMIT 1');

    if (existing.length > 0) {
      // Update existing
      await promisePool.query(
        `UPDATE membership_form_config SET 
         form_html = ?, 
         offline_form_html = ?
         WHERE id = ?`,
        [form_html || '', offline_form_html || '', existing[0].id]
      );
    } else {
      // Insert new
      await promisePool.query(
        `INSERT INTO membership_form_config (form_html, offline_form_html)
         VALUES (?, ?)`,
        [form_html || '', offline_form_html || '']
      );
    }

    res.json({
      success: true,
      message: 'Membership form configuration updated successfully'
    });
  } catch (error) {
    console.error('Update membership form config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership form configuration',
      error: error.message
    });
  }
};

// ============ OFFLINE FORMS CONFIGURATION ============

// Get offline forms configuration
exports.getOfflineFormsConfig = async (req, res) => {
  try {
    const [config] = await promisePool.query('SELECT * FROM offline_forms_config LIMIT 1');
    
    res.json({
      success: true,
      config: config[0] || {
        membership_form_html: '',
        seminar_form_html: ''
      }
    });
  } catch (error) {
    console.error('Get offline forms config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch offline forms configuration',
      error: error.message
    });
  }
};

// Update offline forms configuration
exports.updateOfflineFormsConfig = async (req, res) => {
  try {
    const { membership_form_html, seminar_form_html } = req.body;

    // Check if config exists
    const [existing] = await promisePool.query('SELECT id FROM offline_forms_config LIMIT 1');

    if (existing.length > 0) {
      // Update existing
      await promisePool.query(
        `UPDATE offline_forms_config SET 
         membership_form_html = ?, 
         seminar_form_html = ?
         WHERE id = ?`,
        [membership_form_html || '', seminar_form_html || '', existing[0].id]
      );
    } else {
      // Insert new
      await promisePool.query(
        `INSERT INTO offline_forms_config (membership_form_html, seminar_form_html)
         VALUES (?, ?)`,
        [membership_form_html || '', seminar_form_html || '']
      );
    }

    res.json({
      success: true,
      message: 'Offline forms configuration updated successfully'
    });
  } catch (error) {
    console.error('Update offline forms config error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update offline forms configuration',
      error: error.message
    });
  }
};

// ============ GALLERY MANAGEMENT ============

// Get all gallery items
exports.getGalleryItems = async (req, res) => {
  try {
    const [items] = await promisePool.query(
      'SELECT * FROM gallery ORDER BY display_order, created_at DESC'
    );

    res.json({
      success: true,
      items
    });
  } catch (error) {
    console.error('Get gallery items error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch gallery items',
      error: error.message
    });
  }
};

// Create gallery item
exports.createGalleryItem = async (req, res) => {
  try {
    const { title, description, url, type, display_order, is_active } = req.body;

    const [result] = await promisePool.query(
      `INSERT INTO gallery (title, description, url, type, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [title, description || '', url, type || 'image', display_order || 0, is_active !== false]
    );

    res.json({
      success: true,
      message: 'Gallery item created successfully',
      itemId: result.insertId
    });
  } catch (error) {
    console.error('Create gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create gallery item',
      error: error.message
    });
  }
};

// Update gallery item
exports.updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, url, type, display_order, is_active } = req.body;

    await promisePool.query(
      `UPDATE gallery SET 
       title = ?, description = ?, url = ?, type = ?, 
       display_order = ?, is_active = ?
       WHERE id = ?`,
      [title, description || '', url, type || 'image', display_order || 0, is_active !== false, id]
    );

    res.json({
      success: true,
      message: 'Gallery item updated successfully'
    });
  } catch (error) {
    console.error('Update gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update gallery item',
      error: error.message
    });
  }
};

// Delete gallery item
exports.deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM gallery WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Gallery item deleted successfully'
    });
  } catch (error) {
    console.error('Delete gallery item error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete gallery item',
      error: error.message
    });
  }
};

// ============ MEMBERSHIP CATEGORIES MANAGEMENT ============

// Get all membership categories
exports.getMembershipCategories = async (req, res) => {
  try {
    const [categories] = await promisePool.query(
      'SELECT * FROM membership_categories ORDER BY display_order, id'
    );

    // Parse features JSON
    const parsedCategories = categories.map(cat => ({
      ...cat,
      features: JSON.parse(cat.features)
    }));

    res.json({
      success: true,
      categories: parsedCategories
    });
  } catch (error) {
    console.error('Get membership categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch membership categories',
      error: error.message
    });
  }
};

// Create membership category
exports.createMembershipCategory = async (req, res) => {
  try {
    const { title, icon, category, price, duration, features, is_recommended, display_order, is_active } = req.body;

    const featuresJson = JSON.stringify(features);

    const [result] = await promisePool.query(
      `INSERT INTO membership_categories (title, icon, category, price, duration, features, is_recommended, display_order, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, icon || 'Briefcase', category || 'passout_fee', price, duration, featuresJson, is_recommended !== false, display_order || 0, is_active !== false]
    );

    res.json({
      success: true,
      message: 'Membership category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Create membership category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create membership category',
      error: error.message
    });
  }
};

// Update membership category
exports.updateMembershipCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, icon, category, price, duration, features, is_recommended, display_order, is_active } = req.body;

    const updates = [];
    const values = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (price !== undefined) {
      updates.push('price = ?');
      values.push(price);
    }
    if (duration !== undefined) {
      updates.push('duration = ?');
      values.push(duration);
    }
    if (features !== undefined) {
      updates.push('features = ?');
      values.push(JSON.stringify(features));
    }
    if (is_recommended !== undefined) {
      updates.push('is_recommended = ?');
      values.push(is_recommended ? 1 : 0);
    }
    if (display_order !== undefined) {
      updates.push('display_order = ?');
      values.push(display_order);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    values.push(id);

    await promisePool.query(
      `UPDATE membership_categories SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Membership category updated successfully'
    });
  } catch (error) {
    console.error('Update membership category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update membership category',
      error: error.message
    });
  }
};

// Delete membership category
exports.deleteMembershipCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM membership_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Membership category deleted successfully'
    });
  } catch (error) {
    console.error('Delete membership category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete membership category',
      error: error.message
    });
  }
};

// ==================== RESOURCES MANAGEMENT ====================

// Get all resources
exports.getResources = async (req, res) => {
  try {
    const category = req.query.category;
    
    let query = 'SELECT * FROM resources';
    let params = [];
    
    if (category && category !== 'all') {
      query += ' WHERE category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY display_order, created_at DESC';
    
    const [resources] = await promisePool.query(query, params);
    
    res.json({
      success: true,
      resources
    });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resources',
      error: error.message
    });
  }
};

// Create resource
exports.createResource = async (req, res) => {
  try {
    const { title, description, category, file_url, file_type, file_size, is_active } = req.body;
    
    // Get max display_order
    const [maxOrder] = await promisePool.query(
      'SELECT MAX(display_order) as max_order FROM resources'
    );
    const display_order = (maxOrder[0].max_order || 0) + 1;
    
    const [result] = await promisePool.query(
      `INSERT INTO resources (title, description, category, file_url, file_type, file_size, is_active, display_order) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, category, file_url, file_type, file_size, is_active ? 1 : 0, display_order]
    );
    
    res.json({
      success: true,
      message: 'Resource created successfully',
      resourceId: result.insertId
    });
  } catch (error) {
    console.error('Create resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create resource',
      error: error.message
    });
  }
};

// Update resource
exports.updateResource = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, category, file_url, file_type, file_size, is_active } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (category !== undefined) {
      updates.push('category = ?');
      values.push(category);
    }
    if (file_url !== undefined) {
      updates.push('file_url = ?');
      values.push(file_url);
    }
    if (file_type !== undefined) {
      updates.push('file_type = ?');
      values.push(file_type);
    }
    if (file_size !== undefined) {
      updates.push('file_size = ?');
      values.push(file_size);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }
    
    values.push(id);
    
    await promisePool.query(
      `UPDATE resources SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({
      success: true,
      message: 'Resource updated successfully'
    });
  } catch (error) {
    console.error('Update resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update resource',
      error: error.message
    });
  }
};

// Delete resource
exports.deleteResource = async (req, res) => {
  try {
    const { id } = req.params;
    
    await promisePool.query('DELETE FROM resources WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Resource deleted successfully'
    });
  } catch (error) {
    console.error('Delete resource error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete resource',
      error: error.message
    });
  }
};


// ==================== ALL PAYMENTS ====================

// Get latest payments (last 10)
exports.getLatestPayments = async (req, res) => {
  try {
    const payments = [];
    
    // Get latest seminar payments
    const [seminarPayments] = await promisePool.query(
      `SELECT r.id, r.amount, r.status, r.payment_method, r.transaction_id, 
              r.payment_date, r.created_at,
              u.title, u.first_name, u.surname, u.email,
              s.name as seminar_name
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN seminars s ON r.seminar_id = s.id
       ORDER BY r.created_at DESC
       LIMIT 5`
    );

    seminarPayments.forEach(p => {
      payments.push({
        id: `sem_${p.id}`,
        user_name: `${formatTitle(p.title)} ${p.first_name} ${p.surname}`,
        user_email: p.email,
        payment_type: 'seminar',
        payment_for: p.seminar_name,
        amount: parseFloat(p.amount),
        status: p.status,
        created_at: p.payment_date || p.created_at
      });
    });

    // Get latest membership payments
    const [membershipPayments] = await promisePool.query(
      `SELECT mr.id, mr.name, mr.email, mr.membership_type, mr.payment_status, 
              mr.created_at, mc.price
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       ORDER BY mr.created_at DESC
       LIMIT 5`
    );

    membershipPayments.forEach(p => {
      payments.push({
        id: `mem_${p.id}`,
        user_name: p.name,
        user_email: p.email,
        payment_type: 'membership',
        payment_for: `${p.membership_type} Membership`,
        amount: parseFloat(p.price || 0),
        status: p.payment_status === 'completed' ? 'completed' : 'pending',
        created_at: p.created_at
      });
    });

    // Sort by date and take top 10
    payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const latestPayments = payments.slice(0, 10);

    res.json({
      success: true,
      payments: latestPayments
    });
  } catch (error) {
    console.error('Get latest payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest payments',
      error: error.message
    });
  }
};

// Get single payment details
exports.getPaymentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const [type, paymentId] = id.split('_');
    
    let paymentData = null;
    
    if (type === 'sem') {
      const [payments] = await promisePool.query(
        `SELECT r.*, u.title, u.first_name, u.surname, u.email, u.mobile,
                s.name as seminar_name, s.start_date, s.end_date, s.location
         FROM registrations r
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN seminars s ON r.seminar_id = s.id
         WHERE r.id = ?`,
        [paymentId]
      );
      
      if (payments.length > 0) {
        const p = payments[0];
        paymentData = {
          user_name: `${formatTitle(p.title)} ${p.first_name} ${p.surname}`,
          user_email: p.email,
          user_mobile: p.mobile,
          payment_type: 'seminar',
          payment_for: p.seminar_name,
          amount: parseFloat(p.amount),
          status: p.status,
          transaction_id: p.transaction_id,
          payment_method: p.payment_method,
          created_at: p.payment_date || p.created_at,
          details: {
            registration_no: p.registration_no,
            seminar_location: p.location,
            start_date: p.start_date,
            end_date: p.end_date,
            delegate_category: p.delegate_type
          }
        };
      }
    } else if (type === 'mem') {
      const [payments] = await promisePool.query(
        `SELECT mr.*, mc.price, mc.category
         FROM membership_registrations mr
         LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
         WHERE mr.id = ?`,
        [paymentId]
      );
      
      if (payments.length > 0) {
        const p = payments[0];
        paymentData = {
          user_name: p.name,
          user_email: p.email,
          user_mobile: p.mobile,
          payment_type: 'membership',
          payment_for: `${p.membership_type} Membership`,
          amount: parseFloat(p.price || 0),
          status: p.payment_status === 'completed' ? 'completed' : 'pending',
          transaction_id: p.transaction_id,
          payment_method: 'Online',
          created_at: p.created_at,
          details: {
            membership_type: p.membership_type,
            category: p.category,
            qualification: p.qualification,
            institution: p.institution
          }
        };
      }
    }
    
    if (!paymentData) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.json({
      success: true,
      payment: paymentData
    });
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payment details',
      error: error.message
    });
  }
};

// Get all payments (membership + seminar registrations)
exports.getAllPayments = async (req, res) => {
  try {
    const payments = [];
    
    // Get seminar registration payments
    const [seminarPayments] = await promisePool.query(
      `SELECT r.id, r.registration_no, r.user_id, r.amount, r.status, 
              r.payment_method, r.transaction_id, r.payment_date, r.created_at,
              r.delegate_type,
              u.title, u.first_name, u.surname, u.email, u.mobile,
              s.name as seminar_name, s.start_date, s.end_date
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN seminars s ON r.seminar_id = s.id
       ORDER BY r.created_at DESC`
    );

    // Add seminar payments to array
    seminarPayments.forEach(payment => {
      payments.push({
        id: `sem_${payment.id}`,
        user_id: payment.user_id,
        user_name: `${formatTitle(payment.title)} ${payment.first_name} ${payment.surname}`,
        user_email: payment.email,
        user_mobile: payment.mobile,
        payment_type: 'seminar',
        payment_for: payment.seminar_name,
        amount: parseFloat(payment.amount),
        transaction_id: payment.transaction_id,
        payment_method: payment.payment_method,
        status: payment.status,
        created_at: payment.payment_date || payment.created_at,
        details: {
          registration_no: payment.registration_no,
          seminar: {
            name: payment.seminar_name,
            start_date: payment.start_date,
            end_date: payment.end_date
          },
          delegate_category: payment.delegate_type
        }
      });
    });

    // Get membership payments
    const [membershipPayments] = await promisePool.query(
      `SELECT mr.id, mr.name, mr.email, mr.mobile, mr.membership_type,
              mr.transaction_id, mr.payment_status, mr.created_at,
              mr.qualification, mr.institution,
              mc.price, mc.category
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       ORDER BY mr.created_at DESC`
    );

    // Add membership payments to array
    membershipPayments.forEach(payment => {
      payments.push({
        id: `mem_${payment.id}`,
        user_id: null,
        user_name: payment.name,
        user_email: payment.email,
        user_mobile: payment.mobile,
        payment_type: 'membership',
        payment_for: `${payment.membership_type} Membership`,
        amount: parseFloat(payment.price || 0),
        transaction_id: payment.transaction_id,
        payment_method: 'Online',
        status: payment.payment_status === 'completed' ? 'completed' : 'pending',
        created_at: payment.created_at,
        details: {
          membership: {
            type: payment.membership_type,
            category: payment.category,
            qualification: payment.qualification,
            institution: payment.institution
          }
        }
      });
    });

    // Sort by date
    payments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    // Calculate stats
    const stats = {
      total: payments.length,
      completed: payments.filter(p => p.status === 'completed').length,
      pending: payments.filter(p => p.status === 'pending').length,
      totalAmount: payments.reduce((sum, p) => sum + p.amount, 0)
    };

    res.json({
      success: true,
      payments,
      stats
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: error.message
    });
  }
};

// Download payment receipt as PDF
exports.downloadPaymentPDF = async (req, res) => {
  try {
    const { id } = req.params;
    const PDFDocument = require('pdfkit');
    
    // Parse payment ID
    const [type, paymentId] = id.split('_');
    
    let paymentData = null;
    
    if (type === 'sem') {
      // Get seminar payment
      const [payments] = await promisePool.query(
        `SELECT r.*, u.title, u.first_name, u.surname, u.email, u.mobile, u.address,
                s.name as seminar_name, s.start_date, s.end_date, s.location
         FROM registrations r
         LEFT JOIN users u ON r.user_id = u.id
         LEFT JOIN seminars s ON r.seminar_id = s.id
         WHERE r.id = ?`,
        [paymentId]
      );
      
      if (payments.length > 0) {
        const p = payments[0];
        paymentData = {
          type: 'Seminar Registration',
          user_name: `${formatTitle(p.title)} ${p.first_name} ${p.surname}`,
          user_email: p.email,
          user_mobile: p.mobile,
          user_address: p.address,
          payment_for: p.seminar_name,
          registration_no: p.registration_no,
          amount: p.amount,
          transaction_id: p.transaction_id,
          payment_method: p.payment_method,
          status: p.status,
          date: p.payment_date || p.created_at,
          details: {
            seminar_location: p.location,
            start_date: p.start_date,
            end_date: p.end_date,
            delegate_category: p.delegate_type
          }
        };
      }
    } else if (type === 'mem') {
      // Get membership payment
      const [payments] = await promisePool.query(
        `SELECT mr.*, mc.price, mc.category
         FROM membership_registrations mr
         LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
         WHERE mr.id = ?`,
        [paymentId]
      );
      
      if (payments.length > 0) {
        const p = payments[0];
        paymentData = {
          type: 'Membership Registration',
          user_name: p.name,
          user_email: p.email,
          user_mobile: p.mobile,
          user_address: p.address,
          payment_for: `${p.membership_type} Membership`,
          registration_no: 'N/A',
          amount: p.price,
          transaction_id: p.transaction_id,
          payment_method: 'Online',
          status: p.payment_status,
          date: p.created_at,
          details: {
            membership_type: p.membership_type,
            category: p.category,
            qualification: p.qualification,
            institution: p.institution
          }
        };
      }
    }
    
    if (!paymentData) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=payment_receipt_${id}.pdf`);
    
    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Bihar Ophthalmic Association', { align: 'center' });
    doc.fontSize(16).text('Payment Receipt', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).text(`Receipt Date: ${new Date().toLocaleDateString('en-GB')}`, { align: 'right' });
    doc.moveDown(2);

    // Payment Type
    doc.fontSize(14).text(paymentData.type, { underline: true });
    doc.moveDown();

    // User Details
    doc.fontSize(12).text('User Details:', { underline: true });
    doc.fontSize(10);
    doc.text(`Name: ${paymentData.user_name}`);
    doc.text(`Email: ${paymentData.user_email}`);
    doc.text(`Mobile: ${paymentData.user_mobile}`);
    if (paymentData.user_address) {
      doc.text(`Address: ${paymentData.user_address}`);
    }
    doc.moveDown();

    // Payment Details
    doc.fontSize(12).text('Payment Details:', { underline: true });
    doc.fontSize(10);
    doc.text(`Payment For: ${paymentData.payment_for}`);
    if (paymentData.registration_no !== 'N/A') {
      doc.text(`Registration No: ${paymentData.registration_no}`);
    }
    doc.text(`Amount: ₹${paymentData.amount}`);
    doc.text(`Transaction ID: ${paymentData.transaction_id || 'N/A'}`);
    doc.text(`Payment Method: ${paymentData.payment_method || 'N/A'}`);
    doc.text(`Status: ${paymentData.status.toUpperCase()}`);
    doc.text(`Date: ${new Date(paymentData.date).toLocaleString('en-GB')}`);
    doc.moveDown();

    // Additional Details
    if (paymentData.details) {
      doc.fontSize(12).text('Additional Details:', { underline: true });
      doc.fontSize(10);
      
      if (paymentData.type === 'Seminar Registration') {
        doc.text(`Location: ${paymentData.details.seminar_location || 'N/A'}`);
        doc.text(`Start Date: ${new Date(paymentData.details.start_date).toLocaleDateString('en-GB')}`);
        doc.text(`End Date: ${new Date(paymentData.details.end_date).toLocaleDateString('en-GB')}`);
        
        // Format delegate category for display
        const delegateCategory = paymentData.details.delegate_category || 'N/A';
        const formattedCategory = delegateCategory === 'boa-member' ? 'BOA Member' :
                                   delegateCategory === 'non-boa-member' ? 'Non BOA Member' :
                                   delegateCategory === 'accompanying-person' ? 'Accompanying Person' :
                                   delegateCategory;
        doc.text(`Delegate Category: ${formattedCategory}`);
      } else if (paymentData.type === 'Membership Registration') {
        doc.text(`Membership Type: ${paymentData.details.membership_type}`);
        doc.text(`Category: ${paymentData.details.category}`);
        doc.text(`Qualification: ${paymentData.details.qualification || 'N/A'}`);
        doc.text(`Institution: ${paymentData.details.institution || 'N/A'}`);
      }
    }

    doc.moveDown(3);
    doc.fontSize(8).text('This is a computer-generated receipt and does not require a signature.', { align: 'center', italics: true });
    
    doc.end();
  } catch (error) {
    console.error('Download payment PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

// Export all payments to Excel
exports.exportAllPayments = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    
    // Get all payments
    const payments = [];
    
    // Get seminar payments
    const [seminarPayments] = await promisePool.query(
      `SELECT r.registration_no, r.amount, r.status, r.payment_method, 
              r.transaction_id, r.payment_date, r.created_at, r.delegate_type,
              u.title, u.first_name, u.surname, u.email, u.mobile,
              s.name as seminar_name
       FROM registrations r
       LEFT JOIN users u ON r.user_id = u.id
       LEFT JOIN seminars s ON r.seminar_id = s.id
       ORDER BY r.created_at DESC`
    );

    // Get membership payments
    const [membershipPayments] = await promisePool.query(
      `SELECT mr.name, mr.email, mr.mobile, mr.membership_type,
              mr.transaction_id, mr.payment_status, mr.created_at,
              mc.price
       FROM membership_registrations mr
       LEFT JOIN membership_categories mc ON mr.membership_type = mc.title
       ORDER BY mr.created_at DESC`
    );

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    
    // Seminar Payments Sheet
    if (seminarPayments.length > 0) {
      const seminarSheet = workbook.addWorksheet('Seminar Payments');
      seminarSheet.columns = [
        { header: 'Registration No', key: 'reg_no', width: 20 },
        { header: 'User Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Seminar', key: 'seminar', width: 30 },
        { header: 'Category', key: 'category', width: 20 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Transaction ID', key: 'transaction_id', width: 25 },
        { header: 'Payment Method', key: 'method', width: 15 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 20 }
      ];
      
      seminarSheet.addRows(seminarPayments.map(p => {
        // Format delegate category for display
        const delegateCategory = p.delegate_type || 'N/A';
        const formattedCategory = delegateCategory === 'boa-member' ? 'BOA Member' :
                                   delegateCategory === 'non-boa-member' ? 'Non BOA Member' :
                                   delegateCategory === 'accompanying-person' ? 'Accompanying Person' :
                                   delegateCategory;
        
        return {
          reg_no: p.registration_no,
          name: `${formatTitle(p.title)} ${p.first_name} ${p.surname}`,
          email: p.email,
          mobile: p.mobile,
          seminar: p.seminar_name,
          category: formattedCategory,
          amount: p.amount,
          transaction_id: p.transaction_id || 'N/A',
          method: p.payment_method || 'N/A',
          status: p.status,
          date: p.payment_date || p.created_at
        };
      }));
    }

    // Membership Payments Sheet
    if (membershipPayments.length > 0) {
      const membershipSheet = workbook.addWorksheet('Membership Payments');
      membershipSheet.columns = [
        { header: 'Name', key: 'name', width: 30 },
        { header: 'Email', key: 'email', width: 30 },
        { header: 'Mobile', key: 'mobile', width: 15 },
        { header: 'Membership Type', key: 'type', width: 25 },
        { header: 'Amount', key: 'amount', width: 15 },
        { header: 'Transaction ID', key: 'transaction_id', width: 25 },
        { header: 'Status', key: 'status', width: 15 },
        { header: 'Date', key: 'date', width: 20 }
      ];
      
      membershipSheet.addRows(membershipPayments.map(p => ({
        name: p.name,
        email: p.email,
        mobile: p.mobile,
        type: p.membership_type,
        amount: p.price,
        transaction_id: p.transaction_id || 'N/A',
        status: p.payment_status,
        date: p.created_at
      })));
    }

    // Send file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=all_payments_${Date.now()}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Export all payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export payments',
      error: error.message
    });
  }
};

// ============ DELEGATE CATEGORIES CRUD ============

// Get delegate categories for a seminar
exports.getDelegateCategories = async (req, res) => {
  try {
    const { seminar_id } = req.params;

    const [categories] = await promisePool.query(
      `SELECT * FROM delegate_categories 
       WHERE seminar_id = ? 
       ORDER BY display_order ASC, id ASC`,
      [seminar_id]
    );

    res.json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Get delegate categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch delegate categories',
      error: error.message
    });
  }
};

// Create delegate category
exports.createDelegateCategory = async (req, res) => {
  try {
    const { seminar_id, name, label, description, requires_membership, display_order } = req.body;

    if (!seminar_id || !name || !label) {
      return res.status(400).json({
        success: false,
        message: 'Seminar ID, name, and label are required'
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO delegate_categories 
       (seminar_id, name, label, description, requires_membership, display_order)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [seminar_id, name, label, description || '', requires_membership || false, display_order || 0]
    );

    res.json({
      success: true,
      message: 'Delegate category created successfully',
      categoryId: result.insertId
    });
  } catch (error) {
    console.error('Create delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create delegate category',
      error: error.message
    });
  }
};

// Update delegate category
exports.updateDelegateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, label, description, requires_membership, display_order } = req.body;

    if (!name || !label) {
      return res.status(400).json({
        success: false,
        message: 'Name and label are required'
      });
    }

    await promisePool.query(
      `UPDATE delegate_categories 
       SET name = ?, label = ?, description = ?, 
           requires_membership = ?, display_order = ?
       WHERE id = ?`,
      [name, label, description || '', requires_membership || false, display_order || 0, id]
    );

    res.json({
      success: true,
      message: 'Delegate category updated successfully'
    });
  } catch (error) {
    console.error('Update delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update delegate category',
      error: error.message
    });
  }
};

// Delete delegate category
exports.deleteDelegateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is being used in registrations
    const [registrations] = await promisePool.query(
      'SELECT COUNT(*) as count FROM registrations WHERE category_id = ?',
      [id]
    );

    if (registrations[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used in registrations'
      });
    }

    await promisePool.query('DELETE FROM delegate_categories WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Delegate category deleted successfully'
    });
  } catch (error) {
    console.error('Delete delegate category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete delegate category',
      error: error.message
    });
  }
};


// ==================== TESTIMONIALS MANAGEMENT ====================

// Get all testimonials
exports.getAllTestimonials = async (req, res) => {
  try {
    const [testimonials] = await promisePool.query(
      `SELECT * FROM testimonials ORDER BY display_order ASC, created_at DESC`
    );

    res.json({
      success: true,
      testimonials
    });
  } catch (error) {
    console.error('Get testimonials error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials',
      error: error.message
    });
  }
};

// Create testimonial
exports.createTestimonial = async (req, res) => {
  try {
    const { name, designation, organization, image_url, testimonial, rating, display_order } = req.body;

    if (!name || !designation || !testimonial) {
      return res.status(400).json({
        success: false,
        message: 'Name, designation, and testimonial are required'
      });
    }

    const [result] = await promisePool.query(
      `INSERT INTO testimonials (name, designation, organization, image_url, testimonial, rating, display_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, designation, organization || null, image_url || null, testimonial, rating || 5, display_order || 0]
    );

    res.json({
      success: true,
      message: 'Testimonial created successfully',
      testimonial: {
        id: result.insertId,
        name,
        designation,
        organization,
        image_url,
        testimonial,
        rating,
        display_order
      }
    });
  } catch (error) {
    console.error('Create testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create testimonial',
      error: error.message
    });
  }
};

// Update testimonial
exports.updateTestimonial = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, designation, organization, image_url, testimonial, rating, display_order } = req.body;

    if (!name || !designation || !testimonial) {
      return res.status(400).json({
        success: false,
        message: 'Name, designation, and testimonial are required'
      });
    }

    await promisePool.query(
      `UPDATE testimonials 
       SET name = ?, designation = ?, organization = ?, image_url = ?, 
           testimonial = ?, rating = ?, display_order = ?
       WHERE id = ?`,
      [name, designation, organization || null, image_url || null, testimonial, rating || 5, display_order || 0, id]
    );

    res.json({
      success: true,
      message: 'Testimonial updated successfully'
    });
  } catch (error) {
    console.error('Update testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update testimonial',
      error: error.message
    });
  }
};

// Delete testimonial
exports.deleteTestimonial = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query('DELETE FROM testimonials WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Testimonial deleted successfully'
    });
  } catch (error) {
    console.error('Delete testimonial error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete testimonial',
      error: error.message
    });
  }
};

// Toggle testimonial active status
exports.toggleTestimonialActive = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query(
      'UPDATE testimonials SET is_active = NOT is_active WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Testimonial status updated successfully'
    });
  } catch (error) {
    console.error('Toggle testimonial active error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update testimonial status',
      error: error.message
    });
  }
};
