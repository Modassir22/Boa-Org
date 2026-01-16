const express = require('express');
const cors = require('cors');
require('dotenv').config();
const { testConnection } = require('./config/database');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BOA Connect API Server',
    version: '1.0.0',
    status: 'running'
  });
});

// API Routes
try {
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes);
  console.log('✓ Auth routes loaded');

  const adminAuthRoutes = require('./routes/admin-auth.routes');
  app.use('/api/admin-auth', adminAuthRoutes);
  console.log('✓ Admin auth routes loaded at /api/admin-auth');

  const userRoutes = require('./routes/user.routes');
  app.use('/api/users', userRoutes);
  console.log('✓ User routes loaded');

  const seminarRoutes = require('./routes/seminar.routes');
  app.use('/api/seminars', seminarRoutes);
  console.log('✓ Seminar routes loaded');

  const registrationRoutes = require('./routes/registration.routes');
  app.use('/api/registrations', registrationRoutes);
  console.log('✓ Registration routes loaded');

  const notificationRoutes = require('./routes/notification.routes');
  app.use('/api/notifications', notificationRoutes);
  console.log('✓ Notification routes loaded');

  const adminRoutes = require('./routes/admin.routes');
  app.use('/api/admin', adminRoutes);
  console.log('✓ Admin routes loaded');

  // Payment routes
  const paymentRoutes = require('./routes/payment.routes');
  app.use('/api/payment', paymentRoutes);
  console.log('✓ Payment routes loaded');

  // Public committee members route
  app.get('/api/committee-members', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const { page_type } = req.query;
      
      let query = 'SELECT * FROM committee_members WHERE is_active = TRUE';
      const params = [];
      
      if (page_type) {
        query += ' AND page_type = ?';
        params.push(page_type);
      }
      
      query += ' ORDER BY display_order, id';
      
      const [members] = await promisePool.query(query, params);
      res.json({ success: true, members });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch committee members' });
    }
  });

  // Public certification route
  app.get('/api/certification', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [certification] = await promisePool.query('SELECT * FROM certification LIMIT 1');
      res.json({ success: true, certification: certification[0] || null });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch certification' });
    }
  });

  // Public upcoming events route
  app.get('/api/upcoming-events', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [events] = await promisePool.query(
        'SELECT * FROM upcoming_events WHERE is_active = TRUE ORDER BY display_order, id'
      );
      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch upcoming events' });
    }
  });

  // Public contact info route
  app.get('/api/contact-info', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [contactInfo] = await promisePool.query('SELECT * FROM contact_info LIMIT 1');
      res.json({ success: true, contactInfo: contactInfo[0] || null });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch contact info' });
    }
  });

  // Public site config route
  app.get('/api/site-config', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
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
      res.status(500).json({ success: false, message: 'Failed to fetch site config' });
    }
  });

  // Public membership form config route
  app.get('/api/membership-form-config', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [config] = await promisePool.query('SELECT * FROM membership_form_config LIMIT 1');
      res.json({ 
        success: true, 
        config: config[0] || {
          form_html: '',
          offline_form_html: ''
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch membership form config' });
    }
  });

  // Public offline forms config route
  app.get('/api/offline-forms-config', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [config] = await promisePool.query('SELECT * FROM offline_forms_config LIMIT 1');
      res.json({ 
        success: true, 
        config: config[0] || {
          membership_form_html: '',
          seminar_form_html: ''
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch offline forms config' });
    }
  });

  // Public stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      
      // Get total members count
      const [memberCount] = await promisePool.query('SELECT COUNT(*) as count FROM users WHERE role = "member"');
      
      // Get seminars count
      const [seminarCount] = await promisePool.query('SELECT COUNT(*) as count FROM seminars');
      
      // Calculate years of service (assuming founded in 1975)
      const foundedYear = 1975;
      const currentYear = new Date().getFullYear();
      const yearsOfService = currentYear - foundedYear;
      
      // Bihar has 38 districts
      const districtsCovered = 38;
      
      res.json({ 
        success: true, 
        stats: {
          total_members: memberCount[0].count,
          years_of_service: yearsOfService,
          seminars_conducted: seminarCount[0].count,
          districts_covered: districtsCovered
        }
      });
    } catch (error) {
      console.error('Stats error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
  });

  // Public membership categories route
  app.get('/api/membership-categories', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      
      const [categories] = await promisePool.query(
        'SELECT * FROM membership_categories WHERE is_active = TRUE ORDER BY display_order, id'
      );
      
      // Parse features JSON string to array
      const parsedCategories = categories.map(cat => ({
        ...cat,
        features: JSON.parse(cat.features)
      }));
      
      res.json({ success: true, categories: parsedCategories });
    } catch (error) {
      console.error('Membership categories error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch membership categories' });
    }
  });

  // Public gallery route
  app.get('/api/gallery', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const limit = req.query.limit ? parseInt(req.query.limit) : 100;
      
      const [items] = await promisePool.query(
        'SELECT * FROM gallery WHERE is_active = TRUE ORDER BY display_order, created_at DESC LIMIT ?',
        [limit]
      );
      
      res.json({ success: true, items });
    } catch (error) {
      console.error('Gallery error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch gallery items' });
    }
  });

  // Public resources route
  app.get('/api/resources', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const category = req.query.category;
      
      let query = 'SELECT * FROM resources WHERE is_active = TRUE';
      let params = [];
      
      if (category && category !== 'all') {
        query += ' AND category = ?';
        params.push(category);
      }
      
      query += ' ORDER BY display_order, created_at DESC';
      
      const [resources] = await promisePool.query(query, params);
      
      res.json({ success: true, resources });
    } catch (error) {
      console.error('Resources error:', error);
      res.status(500).json({ success: false, message: 'Failed to fetch resources' });
    }
  });

  // Increment resource download count
  app.post('/api/resources/:id/download', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const { id } = req.params;
      
      await promisePool.query(
        'UPDATE resources SET downloads_count = downloads_count + 1 WHERE id = ?',
        [id]
      );
      
      res.json({ success: true });
    } catch (error) {
      console.error('Download count error:', error);
      res.status(500).json({ success: false, message: 'Failed to update download count' });
    }
  });
  
} catch (error) {
  console.error('Error loading routes:', error);
  console.error(error.stack);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

const PORT = process.env.PORT || 5000;

// Start server
const startServer = async () => {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
