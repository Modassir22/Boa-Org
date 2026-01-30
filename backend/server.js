const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
// Updated: Added membership verification API and certificate management
const { testConnection } = require('./config/database');
const boaSyncService = require('./services/boa-member-sync.service');

const app = express();

// Helper function to log to file
function logToFile(message) {
  const logPath = path.join(__dirname, 'server-debug.log');
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        process.env.FRONTEND_URL,
        'https://boa-connect.vercel.app',
        'https://boabihar.org',
        'https://www.boabihar.org'
      ].filter(Boolean)
    : ['http://localhost:8080', 'http://localhost:5173'],
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

  const forgotPasswordRoutes = require('./routes/forgot-password.routes');
  app.use('/api/auth/forgot-password', forgotPasswordRoutes);
  console.log('✓ Forgot password routes loaded');

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

  // Certificate routes
  const certificateRoutes = require('./routes/certificate.routes');
  app.use('/api/certificates', certificateRoutes);
  console.log('✓ Certificate routes loaded');

  // Contact routes
  const contactRoutes = require('./routes/contact.routes');
  app.use('/api/contact', contactRoutes);
  console.log('✓ Contact routes loaded');

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

  // Public testimonials route
  app.get('/api/testimonials', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const [testimonials] = await promisePool.query(
        'SELECT * FROM testimonials WHERE is_active = TRUE ORDER BY display_order ASC, created_at DESC'
      );
      res.json({ success: true, testimonials });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch testimonials' });
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

  // Generate PDF from HTML template routes
  app.get('/api/generate-membership-pdf', async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const { promisePool } = require('./config/database');
      const htmlToPdfService = require('./services/htmlToPdf.service');
      
      console.log('=== MEMBERSHIP PDF GENERATION DEBUG ===');
      
      // Get HTML template from database
      const [config] = await promisePool.query('SELECT membership_form_html FROM offline_forms_config ORDER BY id DESC LIMIT 1');
      
      if (!config[0] || !config[0].membership_form_html) {
        console.log('No membership form template found in database');
        return res.status(404).json({
          success: false,
          message: 'Membership form template not found'
        });
      }

      const htmlTemplate = config[0].membership_form_html;
      console.log('Membership form HTML length:', htmlTemplate?.length || 0);
      console.log('First 300 chars:', htmlTemplate?.substring(0, 300));

      // Generate PDF from HTML template
      const pdfBuffer = await htmlToPdfService.generateMembershipFormPdf(htmlTemplate);
      
      console.log('Membership PDF generated successfully, size:', pdfBuffer.length);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="BOA_Membership_Application_Form.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
      console.error('Failed to generate membership PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF'
      });
    }
  });

  app.get('/api/generate-seminar-pdf/:seminarId', async (req, res) => {
    try {
      // Set cache control headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });

      const { promisePool } = require('./config/database');
      const { seminarId } = req.params;
      
      console.log('=== PDF GENERATION DEBUG ===');
      console.log('Seminar ID:', seminarId);
      
      // Get seminar details and HTML template
      const [seminars] = await promisePool.query('SELECT * FROM seminars WHERE id = ?', [seminarId]);
      
      if (!seminars[0]) {
        return res.status(404).json({
          success: false,
          message: 'Seminar not found'
        });
      }

      const seminar = seminars[0];
      let htmlTemplate = seminar.offline_form_html;
      
      console.log('Seminar offline_form_html length:', htmlTemplate?.length || 0);

      // If seminar doesn't have custom template, use global template
      if (!htmlTemplate) {
        const [config] = await promisePool.query('SELECT seminar_form_html FROM offline_forms_config ORDER BY id DESC LIMIT 1');
        htmlTemplate = config[0]?.seminar_form_html || '';
        console.log('Using global template, length:', htmlTemplate?.length || 0);
      }

      // If still no template, create a basic one
      if (!htmlTemplate) {
        console.log('No template found, creating basic template');
        htmlTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${seminar.name} - Registration Form</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .form-field { margin-bottom: 15px; }
              .field-label { font-weight: bold; }
              .field-line { border-bottom: 1px solid #333; min-height: 20px; display: inline-block; min-width: 200px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Bihar Ophthalmic Association</h1>
              <h2>${seminar.name}</h2>
              <p><strong>Venue:</strong> ${seminar.venue || 'TBA'}</p>
              <p><strong>Date:</strong> ${seminar.start_date ? new Date(seminar.start_date).toLocaleDateString('en-IN') : 'TBA'}</p>
            </div>
            
            <h3>Registration Form</h3>
            
            <div class="form-field">
              <div class="field-label">Name:</div>
              <div class="field-line"></div>
            </div>
            
            <div class="form-field">
              <div class="field-label">Email:</div>
              <div class="field-line"></div>
            </div>
            
            <div class="form-field">
              <div class="field-label">Phone:</div>
              <div class="field-line"></div>
            </div>
            
            <div class="form-field">
              <div class="field-label">Institution:</div>
              <div class="field-line"></div>
            </div>
            
            <div class="form-field">
              <div class="field-label">Designation:</div>
              <div class="field-line"></div>
            </div>
            
            <div style="margin-top: 50px;">
              <p><strong>Declaration:</strong> I hereby register for the above seminar and agree to abide by the terms and conditions.</p>
              <br><br>
              <div style="display: flex; justify-content: space-between;">
                <div>Date: _______________</div>
                <div>Signature: _______________</div>
              </div>
            </div>
          </body>
          </html>
        `;
      }

      console.log('Generating PDF from HTML template...');
      
      try {
        // Try to use the HTML to PDF service
        const htmlToPdfService = require('./services/htmlToPdf.service');
        const pdfBuffer = await htmlToPdfService.generateSeminarFormPdf(htmlTemplate, seminar);
        
        console.log('PDF generated successfully, size:', pdfBuffer.length);
        
        // Set response headers for PDF download
        const fileName = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.pdf`;
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        
        res.send(pdfBuffer);
      } catch (pdfError) {
        console.error('PDF generation failed, trying fallback:', pdfError);
        
        // Fallback: Return the HTML content as a downloadable file
        const fileName = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.html`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        res.send(htmlTemplate);
      }
    } catch (error) {
      console.error('Failed to generate seminar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message
      });
    }
  });

  // Public stats route
  app.get('/api/stats', async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      
      // Get total members count (all users except admin)
      const [memberCount] = await promisePool.query('SELECT COUNT(*) as count FROM users WHERE role = "user"');
      
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
      // Set cache control headers to prevent caching
      res.set({
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      
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

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logToFile(`JSON parsing error: ${err.message}`);
    console.error('JSON parsing error:', err.message);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format in request body',
      error: 'Please check your request data format'
    });
  }
  next(err);
});

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
      console.log('=== SERVER STARTED - CONSOLE LOG TEST ===');
      
      // Start BOA Member Sync Service
      boaSyncService.start();
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
