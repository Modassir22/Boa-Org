const { promisePool } = require('../config/database');
const cloudinary = require('../config/cloudinary');

// Get user certificates (for user dashboard)
exports.getUserCertificates = async (req, res) => {
  try {
    const userId = req.user.id;

    const [certificates] = await promisePool.query(
      `SELECT c.*, s.name as seminar_name 
       FROM user_certificates c
       LEFT JOIN seminars s ON c.seminar_id = s.id
       WHERE c.user_id = ?
       ORDER BY c.issued_date DESC, c.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Get user certificates error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
};

// Add certificate to user (admin only)
exports.addCertificate = async (req, res) => {
  try {
    const { user_id, seminar_id, certificate_name, issued_date, description } = req.body;
    const adminId = req.admin?.id || null;

    if (!user_id || !certificate_name) {
      return res.status(400).json({
        success: false,
        message: 'User ID and certificate name are required'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Certificate file is required'
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'certificates',
      resource_type: 'auto'
    });
    // Insert certificate record
    const [insertResult] = await promisePool.query(
      `INSERT INTO user_certificates 
       (user_id, seminar_id, certificate_name, certificate_url, issued_date, description, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [user_id, seminar_id || null, certificate_name, result.secure_url, issued_date || null, description || null, adminId]
    );

    res.json({
      success: true,
      message: 'Certificate added successfully',
      certificate: {
        id: insertResult.insertId,
        certificate_url: result.secure_url
      }
    });
  } catch (error) {
    console.error('Add certificate error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to add certificate',
      error: error.message
    });
  }
};

// Get certificates for a specific user (admin only)
exports.getUserCertificatesAdmin = async (req, res) => {
  try {
    const { userId } = req.params;

    const [certificates] = await promisePool.query(
      `SELECT c.*, s.name as seminar_name, u.first_name, u.surname
       FROM user_certificates c
       LEFT JOIN seminars s ON c.seminar_id = s.id
       LEFT JOIN users u ON c.user_id = u.id
       WHERE c.user_id = ?
       ORDER BY c.issued_date DESC, c.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      certificates
    });
  } catch (error) {
    console.error('Get user certificates admin error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch certificates',
      error: error.message
    });
  }
};

// Delete certificate (admin only)
exports.deleteCertificate = async (req, res) => {
  try {
    const { id } = req.params;

    // Get certificate details before deleting
    const [certificates] = await promisePool.query(
      'SELECT certificate_url FROM user_certificates WHERE id = ?',
      [id]
    );

    if (certificates.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Certificate not found'
      });
    }

    // Delete from database
    await promisePool.query('DELETE FROM user_certificates WHERE id = ?', [id]);

    // Optionally delete from Cloudinary
    // Extract public_id from URL and delete
    // const publicId = certificates[0].certificate_url.split('/').slice(-2).join('/').split('.')[0];
    // await cloudinary.uploader.destroy(publicId);

    res.json({
      success: true,
      message: 'Certificate deleted successfully'
    });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete certificate',
      error: error.message
    });
  }
};

// Upload certificate for member (admin only)
exports.uploadMemberCertificate = async (req, res) => {
  try {

    const { user_id, title, description, issue_date, expiry_date, certificate_type } = req.body;
    const adminId = req.admin?.id || null;

   

    if (!user_id || !title) {
      return res.status(400).json({
        success: false,
        message: 'User ID and certificate title are required'
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({
        success: false,
        message: 'Certificate file is required'
      });
    }

    console.log('Uploading to Cloudinary...');
    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'certificates',
      resource_type: 'auto'
    });
   

    console.log('Inserting into database...');
    // Insert certificate record
    const [insertResult] = await promisePool.query(
      `INSERT INTO user_certificates 
       (user_id, certificate_name, certificate_url, issued_date, expiry_date, description, certificate_type, uploaded_by, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        user_id, 
        title, 
        result.secure_url, 
        issue_date || null, 
        expiry_date || null, 
        description || null, 
        certificate_type || 'membership',
        adminId
      ]
    );
   

    console.log('Creating notification...');
    // Create global notification about certificate upload
    await promisePool.query(
      `INSERT INTO notifications (title, message, type, is_active, created_at)
       VALUES (?, ?, ?, TRUE, NOW())`,
      [
        'Certificate Uploaded',
        `A ${certificate_type || 'membership'} certificate "${title}" has been uploaded for a member.`,
        'certificate'
      ]
    );
    console.log('Notification created');

    res.json({
      success: true,
      message: 'Certificate uploaded successfully',
      certificate: {
        id: insertResult.insertId,
        certificate_url: result.secure_url,
        title: title
      }
    });
  } catch (error) {
    console.error('Upload member certificate error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Failed to upload certificate',
      error: error.message
    });
  }
};