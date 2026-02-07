const { promisePool } = require('../config/database');

// Get all active notifications (only admin-created announcements and elections)
exports.getAllNotifications = async (req, res) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT n.*, 
              s.name as seminar_name, s.location, s.start_date, s.end_date, 
              s.color, s.online_registration_enabled,
              e.title as election_title, e.deadline as election_deadline, 
              e.voting_date as election_voting_date
       FROM notifications n
       LEFT JOIN seminars s ON n.seminar_id = s.id
       LEFT JOIN elections e ON n.election_id = e.id
       WHERE n.is_active = TRUE AND n.type IN ('announcement', 'election')
       ORDER BY n.created_at DESC`
    );

    


    res.json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get admin activity notifications (last 50)
exports.getAdminActivityNotifications = async (req, res) => {
  try {
    const [notifications] = await promisePool.query(
      `SELECT n.*, s.name as seminar_name
       FROM notifications n
       LEFT JOIN seminars s ON n.seminar_id = s.id
       WHERE n.type = 'activity' AND n.is_active = TRUE
       ORDER BY n.created_at DESC
       LIMIT 50`
    );

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error('Get admin notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Notification marked as read'
    });

  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    await promisePool.query(
      'DELETE FROM notifications WHERE id = ?',
      [id]
    );

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
