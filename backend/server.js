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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://boabihar.org',
  'https://www.boabihar.org',
  'http://localhost:8080'
].filter(Boolean); // Remove any undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization', 
    'Cache-Control',
    'Pragma',
    'Expires',
    'X-Requested-With',
    'Accept',
    'Origin',
    'User-Agent',
    'DNT',
    'Keep-Alive',
    'X-Requested-With',
    'If-Modified-Since',
    'X-CSRF-Token'
  ],
  credentials: true,
  optionsSuccessStatus: 200 // Some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// Handle preflight requests
// Increase body size limits for file uploads (10MB max, 5MB recommended)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/', (req, res) => {
  res.json({ 
    message: 'BOA Connect API Server',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    server: 'Hostinger VPS Backend'
  });
});

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    server: 'Backend API Server'
  });
});

// API identification route
app.get('/api/server-info', (req, res) => {
  res.json({
    server: 'BOA Backend API',
    type: 'Node.js Express Server',
    location: 'Hostinger VPS',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});


try {
  const authRoutes = require('./routes/auth.routes');
  app.use('/api/auth', authRoutes);

  const forgotPasswordRoutes = require('./routes/forgot-password.routes');
  app.use('/api/auth/forgot-password', forgotPasswordRoutes);

  const adminAuthRoutes = require('./routes/admin-auth.routes');
  app.use('/api/admin-auth', adminAuthRoutes);

  const userRoutes = require('./routes/user.routes');
  app.use('/api/users', userRoutes);

  const seminarRoutes = require('./routes/seminar.routes');
  app.use('/api/seminars', seminarRoutes);

  const registrationRoutes = require('./routes/registration.routes');
  app.use('/api/registrations', registrationRoutes);

  const notificationRoutes = require('./routes/notification.routes');
  app.use('/api/notifications', notificationRoutes);

  const adminRoutes = require('./routes/admin.routes');
  app.use('/api/admin', adminRoutes);

  // Payment routes
  const paymentRoutes = require('./routes/payment.routes');
  app.use('/api/payment', paymentRoutes);

  // Certificate routes
  const certificateRoutes = require('./routes/certificate.routes');
  app.use('/api/certificates', certificateRoutes);

  // Contact routes
  const contactRoutes = require('./routes/contact.routes');
  app.use('/api/contact', contactRoutes);

  // News routes
  const newsRoutes = require('./routes/news.routes');
  app.use('/api/news', newsRoutes);

  // Gallery routes
  const galleryRoutes = require('./routes/gallery.routes');
  app.use('/api/gallery-images', galleryRoutes);

  // Stats routes
  const statsRoutes = require('./routes/stats.routes');
  app.use('/api/stats', statsRoutes);

  // Election routes
  const electionRoutes = require('./routes/election.routes');
  app.use('/api/elections', electionRoutes);

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
      
      // Get upcoming seminars (future seminars only)
      const [seminars] = await promisePool.query(
        `SELECT id, name as title, description, location, start_date, end_date, 
                registration_start, registration_end,
                image_url, "seminar" as event_type, id as seminar_id
         FROM seminars 
         WHERE start_date >= CURDATE() 
         ORDER BY start_date ASC 
         LIMIT 5`
      );
      
      // Get active elections (where deadline hasn't passed)
      const [elections] = await promisePool.query(
        `SELECT id, title, description, deadline, voting_date, 
                voting_date as start_date, deadline as end_date,
                image_url, "election" as event_type, id as election_id
         FROM elections 
         WHERE deadline >= CURDATE() 
         ORDER BY deadline ASC 
         LIMIT 5`
      );
      
      // Combine seminars and elections only (no upcoming_events table)
      const allEvents = [...seminars, ...elections];
      
      // Sort by start_date
      allEvents.sort((a, b) => {
        const dateA = new Date(a.start_date || '9999-12-31');
        const dateB = new Date(b.start_date || '9999-12-31');
        return dateA - dateB;
      });
      
      res.json({ success: true, events: allEvents });
    } catch (error) {
      console.error('Upcoming events error:', error);
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
          site_title: 'Ophthalmic Association Of Bihar',
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

  // Generate PDF from HTML template routes (PUBLIC - no auth required for blank forms)
  const authMiddleware = require('./middleware/auth.middleware');
  
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
      
      // Get HTML template from database
      const [config] = await promisePool.query('SELECT membership_form_html FROM offline_forms_config ORDER BY id DESC LIMIT 1');
      
      if (!config[0] || !config[0].membership_form_html) {
        return res.status(404).json({
          success: false,
          message: 'Membership form template not found'
        });
      }

      const htmlTemplate = config[0].membership_form_html;

      // Generate PDF from HTML template
      const pdfBuffer = await htmlToPdfService.generateMembershipFormPdf(htmlTemplate);
      
      // Set response headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="BOA_Membership_Application_Form.pdf"');
      res.setHeader('Content-Length', pdfBuffer.length);
      
      res.send(pdfBuffer);
    } catch (error) {
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
      
      // If seminar doesn't have custom template, use global template
      if (!htmlTemplate) {
        const [config] = await promisePool.query('SELECT seminar_form_html FROM offline_forms_config ORDER BY id DESC LIMIT 1');
        htmlTemplate = config[0]?.seminar_form_html || '';
      }

      // If still no template, create a basic one
      if (!htmlTemplate) {
        htmlTemplate = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${seminar.name} - Registration Form</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0B3C5D; padding-bottom: 20px; }
              .header h1 { color: #0B3C5D; margin-bottom: 10px; }
              .header h2 { color: #C9A227; margin-bottom: 5px; }
              .form-section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; }
              .section-title { font-weight: bold; color: #0B3C5D; margin-bottom: 15px; font-size: 16px; }
              .form-field { margin-bottom: 15px; display: flex; align-items: center; }
              .field-label { font-weight: bold; width: 150px; }
              .field-line { border-bottom: 1px solid #333; flex: 1; min-height: 20px; margin-left: 10px; }
              .declaration { background: #f9f9f9; padding: 15px; border-left: 4px solid #C9A227; margin: 20px 0; }
              .signature-section { display: flex; justify-content: space-between; margin-top: 40px; }
              .signature-box { text-align: center; width: 200px; }
              .signature-line { border-bottom: 1px solid #333; margin-bottom: 5px; height: 40px; }
              @media print { body { margin: 0; padding: 10px; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Ophthalmic Association Of Bihar</h1>
              <h2>${seminar.name}</h2>
              <p><strong>Venue:</strong> ${seminar.venue || 'TBA'}</p>
              <p><strong>Date:</strong> ${seminar.start_date ? new Date(seminar.start_date).toLocaleDateString('en-IN') : 'TBA'}</p>
            </div>
            
            <div class="form-section">
              <div class="section-title">Personal Information</div>
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
                <div class="field-label">Date of Birth:</div>
                <div class="field-line"></div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="section-title">Professional Information</div>
              <div class="form-field">
                <div class="field-label">Institution:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">Designation:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">Qualification:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">Experience:</div>
                <div class="field-line"></div>
              </div>
            </div>
            
            <div class="form-section">
              <div class="section-title">Address Information</div>
              <div class="form-field">
                <div class="field-label">Address:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">City:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">State:</div>
                <div class="field-line"></div>
              </div>
              <div class="form-field">
                <div class="field-label">PIN Code:</div>
                <div class="field-line"></div>
              </div>
            </div>
            
            <div class="declaration">
              <p><strong>Declaration:</strong> I hereby register for the ${seminar.name} and agree to abide by the terms and conditions set by the Ophthalmic Association Of Bihar. I understand that this registration is subject to approval and payment of applicable fees.</p>
            </div>
            
            <div class="signature-section">
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>Date</div>
              </div>
              <div class="signature-box">
                <div class="signature-line"></div>
                <div>Signature</div>
              </div>
            </div>
            
            <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
              <p>Ophthalmic Association Of Bihar | www.boabihar.org | info@boabihar.org</p>
            </div>
          </body>
          </html>
        `;
      }

      // Use the improved PDF service with automatic fallback
      const htmlToPdfService = require('./services/htmlToPdf.service');
      const pdfBuffer = await htmlToPdfService.generateSeminarFormPdf(htmlTemplate, seminar);
      
      // Set response headers for PDF download
      const fileName = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      return res.send(pdfBuffer);
      
    } catch (error) {
      
      // Final fallback: Return HTML for manual printing
      try {
        const { promisePool } = require('./config/database');
        const { seminarId } = req.params;
        const [seminars] = await promisePool.query('SELECT * FROM seminars WHERE id = ?', [seminarId]);
        
        if (seminars[0]) {
          const seminar = seminars[0];
          const fileName = `${seminar.name.replace(/[^a-zA-Z0-9]/g, '_')}_Registration_Form.html`;
          
          const basicHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <title>${seminar.name} - Registration Form</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0B3C5D; padding-bottom: 20px; }
                .header h1 { color: #0B3C5D; }
                .header h2 { color: #C9A227; }
                .form-section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; }
                .section-title { font-weight: bold; color: #0B3C5D; margin-bottom: 15px; }
                .form-field { margin-bottom: 15px; }
                .field-label { font-weight: bold; }
                .field-line { border-bottom: 1px solid #333; min-height: 20px; display: inline-block; min-width: 200px; }
                @media print { body { margin: 0; padding: 10px; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Ophthalmic Association Of Bihar</h1>
                <h2>${seminar.name}</h2>
                <p><strong>Venue:</strong> ${seminar.venue || 'TBA'}</p>
                <p><strong>Date:</strong> ${seminar.start_date ? new Date(seminar.start_date).toLocaleDateString('en-IN') : 'TBA'}</p>
              </div>
              
              <div class="form-section">
                <div class="section-title">Personal Information</div>
                <div class="form-field">Name: <span class="field-line"></span></div>
                <div class="form-field">Email: <span class="field-line"></span></div>
                <div class="form-field">Phone: <span class="field-line"></span></div>
              </div>
              
              <div class="form-section">
                <div class="section-title">Professional Information</div>
                <div class="form-field">Institution: <span class="field-line"></span></div>
                <div class="form-field">Designation: <span class="field-line"></span></div>
              </div>
              
              <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
                Ophthalmic Association Of Bihar | www.boabihar.org | info@boabihar.org
              </p>
            </body>
            </html>
          `;
          
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
          res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
          return res.send(basicHtml);
        }
      } catch (fallbackError) {
        // Fallback HTML generation also failed
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: error.message,
        details: 'PDF generation service is temporarily unavailable. Please try again later or contact support.'
      });
    }
  });

  // Admin membership categories management routes
  const adminAuthMiddleware = require('./middleware/admin-auth.middleware');
  
  // Get all membership categories (admin)
  app.get('/api/admin/membership-categories', adminAuthMiddleware, async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      
      const [categories] = await promisePool.query(
        'SELECT * FROM membership_categories ORDER BY display_order, id'
      );
      
      const parsedCategories = categories.map(cat => ({
        ...cat,
        features: JSON.parse(cat.features || '[]')
      }));
      
      res.json({ success: true, categories: parsedCategories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch membership categories' });
    }
  });

  // Create membership category (admin)
  app.post('/api/admin/membership-categories', adminAuthMiddleware, async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const { title, price, student_price } = req.body;
      
      if (!title || !price) {
        return res.status(400).json({ success: false, message: 'Title and price are required' });
      }

      // Get next display order
      const [maxOrder] = await promisePool.query('SELECT MAX(display_order) as max_order FROM membership_categories');
      const displayOrder = (maxOrder[0].max_order || 0) + 1;

      const [result] = await promisePool.query(
        `INSERT INTO membership_categories 
         (title, icon, category, price, student_price, duration, features, is_recommended, display_order, is_active) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          'Award', // Default icon
          'membership_fee', // Default category
          price,
          student_price || null,
          'Yearly', // Default duration
          JSON.stringify(['Access to all BOA events', 'Networking opportunities', 'Professional development']),
          false, // Default not recommended
          displayOrder,
          true // Default active
        ]
      );

      res.json({ success: true, id: result.insertId, message: 'Category created successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  });

  // Update membership category (admin)
  app.put('/api/admin/membership-categories/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const { id } = req.params;
      const { title, price, student_price, is_active } = req.body;

      // Build dynamic update query
      const updates = [];
      const values = [];

      if (title !== undefined) {
        updates.push('title = ?');
        values.push(title);
      }
      if (price !== undefined) {
        updates.push('price = ?');
        values.push(price);
      }
      if (student_price !== undefined) {
        updates.push('student_price = ?');
        values.push(student_price);
      }
      if (is_active !== undefined) {
        updates.push('is_active = ?');
        values.push(is_active);
      }

      if (updates.length === 0) {
        return res.status(400).json({ success: false, message: 'No fields to update' });
      }

      values.push(id);
      
      await promisePool.query(
        `UPDATE membership_categories SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      res.json({ success: true, message: 'Category updated successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update category' });
    }
  });

  // Delete membership category (admin)
  app.delete('/api/admin/membership-categories/:id', adminAuthMiddleware, async (req, res) => {
    try {
      const { promisePool } = require('./config/database');
      const { id } = req.params;

      await promisePool.query('DELETE FROM membership_categories WHERE id = ?', [id]);

      res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete category' });
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
        features: JSON.parse(cat.features || '[]')
      }));
      
      res.json({ success: true, categories: parsedCategories });
    } catch (error) {
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
      res.status(500).json({ success: false, message: 'Failed to update download count' });
    }
  });
  
  
} catch (error) {
  // Error loading routes - server will continue with basic functionality
}

// Global error handler for JSON parsing errors
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logToFile(`JSON parsing error: ${err.message}`);
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
    const server = app.listen(PORT, () => {
      // Start BOA Member Sync Service
      boaSyncService.start();
    });
    
    // Set server timeout for file uploads (2 minutes)
    server.timeout = 120000; // 2 minutes
    server.keepAliveTimeout = 65000; // 65 seconds
    server.headersTimeout = 66000; // 66 seconds (slightly more than keepAliveTimeout)
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
