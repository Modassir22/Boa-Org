const { promisePool } = require('../config/database');

// Get all elections
exports.getAllElections = async (req, res) => {
  try {
    const { status } = req.query;
    
    let query = 'SELECT * FROM elections';
    const params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const [elections] = await promisePool.query(query, params);
    
    // Parse positions JSON
    elections.forEach(election => {
      if (election.positions) {
        try {
          election.positions = JSON.parse(election.positions);
        } catch (e) {
          election.positions = [];
        }
      }
    });
    
    res.json({
      success: true,
      elections
    });
  } catch (error) {
    console.error('Get elections error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch elections',
      error: error.message
    });
  }
};

// Get single election
exports.getElectionById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [elections] = await promisePool.query(
      'SELECT * FROM elections WHERE id = ?',
      [id]
    );
    
    if (elections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }
    
    const election = elections[0];
    
    // Parse positions JSON - handle both TEXT and JSON column types
    if (election.positions) {
      try {
        // If it's already an object/array (JSON column type), use it
        if (typeof election.positions === 'object') {
          election.positions = Array.isArray(election.positions) 
            ? election.positions 
            : [];
        } 
        // If it's a string (TEXT column type), parse it
        else if (typeof election.positions === 'string') {
          election.positions = JSON.parse(election.positions);
        } 
        else {
          election.positions = [];
        }
      } catch (e) {
        console.error('Failed to parse positions:', e);
        election.positions = [];
      }
    } else {
      election.positions = [];
    }
    
   
    
    res.json({
      success: true,
      election
    });
  } catch (error) {
    console.error('Get election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch election',
      error: error.message
    });
  }
};

// Create election (Admin only)
exports.createElection = async (req, res) => {
  try {
    const {
      title,
      description,
      html_content,
      image_url,
      eligible_members,
      deadline,
      voting_date,
      voting_time,
      voting_venue,
      contact_mobile,
      positions,
      form_type,
      status,
      generate_pdf
    } = req.body;
    
    // Validate required fields
    if (!title || !deadline || !voting_date) {
      return res.status(400).json({
        success: false,
        message: 'Title, deadline, and voting date are required'
      });
    }
    
    // Convert positions array to JSON string
    const positionsJson = JSON.stringify(positions || ['President', 'Vice President', 'Secretary', 'Treasurer']);
    
    
    // Generate PDF if html_content is provided
    let pdf_url = null;
    if (html_content && generate_pdf) {
      try {
        const htmlToPdfService = require('../services/htmlToPdf.service');
        const pdfBuffer = await htmlToPdfService.convertHtmlToPdf(html_content, {
          format: 'A4',
          printBackground: true
        });
        
        if (pdfBuffer) {
          // Save PDF to uploads folder
          const fs = require('fs');
          const path = require('path');
          const uploadsDir = path.join(__dirname, '../uploads');
          const filename = `election_${Date.now()}.pdf`;
          const filepath = path.join(uploadsDir, filename);
          
          fs.writeFileSync(filepath, pdfBuffer);
          pdf_url = `/uploads/${filename}`;
        }
      } catch (pdfError) {
        console.error('PDF generation error:', pdfError);
        // Continue without PDF
      }
    }
    
    const [result] = await promisePool.query(
      `INSERT INTO elections 
       (title, description, html_content, pdf_url, image_url, eligible_members, deadline, voting_date, voting_time, 
        voting_venue, contact_mobile, positions, form_type, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description,
        html_content || null,
        pdf_url,
        image_url || null,
        eligible_members || 'Life Member',
        deadline,
        voting_date,
        voting_time,
        voting_venue,
        contact_mobile,
        positionsJson,
        form_type || 'Nomination Form',
        status || 'active'
      ]
    );
    
    
    // Create notification for users
    try {
      const notificationMessage = pdf_url 
        ? `New Election: ${title}. Download form and submit your nomination before ${new Date(deadline).toLocaleDateString()}.`
        : `New Election: ${title}. Submit your nomination before ${new Date(deadline).toLocaleDateString()}.`;
      
      await promisePool.query(
        `INSERT INTO notifications (type, title, message, link, election_id, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`,
        [
          'election',
          title,
          notificationMessage,
          pdf_url || '',
          result.insertId
        ]
      );
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail the election creation if notification fails
    }
    
    res.status(201).json({
      success: true,
      message: 'Election created successfully',
      election_id: result.insertId,
      pdf_url: pdf_url
    });
  } catch (error) {
    console.error('Create election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create election',
      error: error.message
    });
  }
};

// Update election (Admin only)
exports.updateElection = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      image_url,
      eligible_members,
      deadline,
      voting_date,
      voting_time,
      voting_venue,
      contact_mobile,
      positions,
      form_type,
      status
    } = req.body;
    
    // Convert positions array to JSON string if provided
    const positionsJson = positions ? JSON.stringify(positions) : undefined;
    
    const updates = [];
    const values = [];
    
    if (title !== undefined) { updates.push('title = ?'); values.push(title); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
    if (eligible_members !== undefined) { updates.push('eligible_members = ?'); values.push(eligible_members); }
    if (deadline !== undefined) { updates.push('deadline = ?'); values.push(deadline); }
    if (voting_date !== undefined) { updates.push('voting_date = ?'); values.push(voting_date); }
    if (voting_time !== undefined) { updates.push('voting_time = ?'); values.push(voting_time); }
    if (voting_venue !== undefined) { updates.push('voting_venue = ?'); values.push(voting_venue); }
    if (contact_mobile !== undefined) { updates.push('contact_mobile = ?'); values.push(contact_mobile); }
    if (positionsJson !== undefined) { updates.push('positions = ?'); values.push(positionsJson); }
    if (form_type !== undefined) { updates.push('form_type = ?'); values.push(form_type); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    
    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }
    
    values.push(id);
    
    await promisePool.query(
      `UPDATE elections SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    // Update notification title if election title was updated
    if (title !== undefined) {
      const [updateResult] = await promisePool.query(
        `UPDATE notifications SET title = ? WHERE election_id = ? AND type = 'election'`,
        [title, id]
      );
    }
    
    res.json({
      success: true,
      message: 'Election updated successfully'
    });
  } catch (error) {
    console.error('Update election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update election',
      error: error.message
    });
  }
};

// Delete election (Admin only)
exports.deleteElection = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Delete associated notifications first
    await promisePool.query('DELETE FROM notifications WHERE election_id = ?', [id]);
    
    // Delete election
    await promisePool.query('DELETE FROM elections WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: 'Election deleted successfully'
    });
  } catch (error) {
    console.error('Delete election error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete election',
      error: error.message
    });
  }
};

// Submit election nomination
exports.submitNomination = async (req, res) => {
  try {
    const {
      election_id,
      position,
      name,
      life_membership_no,
      designation,
      qualification,
      working_place,
      age,
      sex,
      mobile,
      address,
      email
    } = req.body;
    
    // Validate required fields
    if (!election_id || !position || !name || !mobile) {
      return res.status(400).json({
        success: false,
        message: 'Election ID, position, name, and mobile are required'
      });
    }
    
    // Check if election exists and is active
    const [elections] = await promisePool.query(
      'SELECT * FROM elections WHERE id = ? AND status = ?',
      [election_id, 'active']
    );
    
    if (elections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Election not found or not active'
      });
    }
    
    const election = elections[0];
    
    // Check if deadline has passed
    if (new Date(election.deadline) < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'Nomination deadline has passed'
      });
    }
    
    // Check if user has already submitted nomination for this election
    // Check by mobile number or email
    const [existingSubmissions] = await promisePool.query(
      `SELECT * FROM election_submissions 
       WHERE election_id = ? AND (mobile = ? OR email = ?)`,
      [election_id, mobile, email]
    );
    
    if (existingSubmissions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a nomination for this election'
      });
    }
    
    // Insert nomination
    const [result] = await promisePool.query(
      `INSERT INTO election_submissions 
       (election_id, position, name, life_membership_no, designation, qualification, 
        working_place, age, sex, mobile, address, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        election_id,
        position,
        name,
        life_membership_no,
        designation,
        qualification,
        working_place,
        age,
        sex,
        mobile,
        address,
        email
      ]
    );
    
    res.status(201).json({
      success: true,
      message: 'Nomination submitted successfully',
      submission_id: result.insertId
    });
  } catch (error) {
    console.error('Submit nomination error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit nomination',
      error: error.message
    });
  }
};

// Get all submissions for an election (Admin only)
exports.getElectionSubmissions = async (req, res) => {
  try {
    const { election_id } = req.params;
    const { status } = req.query;
    
    let query = 'SELECT * FROM election_submissions WHERE election_id = ?';
    const params = [election_id];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY submitted_at DESC';
    
    const [submissions] = await promisePool.query(query, params);
    
    res.json({
      success: true,
      submissions
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch submissions',
      error: error.message
    });
  }
};

// Update submission status (Admin only)
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }
    
    await promisePool.query(
      'UPDATE election_submissions SET status = ? WHERE id = ?',
      [status, id]
    );
    
    res.json({
      success: true,
      message: 'Submission status updated successfully'
    });
  } catch (error) {
    console.error('Update submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update submission status',
      error: error.message
    });
  }
};


// Generate PDF for existing election (Admin only)
exports.generateElectionPdf = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get election details
    const [elections] = await promisePool.query(
      'SELECT * FROM elections WHERE id = ?',
      [id]
    );
    
    if (elections.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }
    
    const election = elections[0];
    
    if (!election.html_content) {
      return res.status(400).json({
        success: false,
        message: 'No HTML content available for PDF generation'
      });
    }
    
    // Generate PDF
    try {
      const htmlToPdfService = require('../services/htmlToPdf.service');
      const pdfBuffer = await htmlToPdfService.convertHtmlToPdf(election.html_content, {
        format: 'A4',
        printBackground: true
      });
      
      if (pdfBuffer) {
        // Save PDF to uploads folder
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '../uploads');
        const filename = `election_${Date.now()}.pdf`;
        const filepath = path.join(uploadsDir, filename);
        
        fs.writeFileSync(filepath, pdfBuffer);
        const pdf_url = `/uploads/${filename}`;
        
        // Update election with PDF URL
        await promisePool.query(
          'UPDATE elections SET pdf_url = ? WHERE id = ?',
          [pdf_url, id]
        );
        
        // Update notification if exists
        await promisePool.query(
          'UPDATE notifications SET link = ? WHERE election_id = ?',
          [pdf_url, id]
        );
        
        
        res.json({
          success: true,
          message: 'PDF generated successfully',
          pdf_url: pdf_url
        });
      } else {
        throw new Error('PDF generation returned empty buffer');
      }
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      res.status(500).json({
        success: false,
        message: 'Failed to generate PDF',
        error: pdfError.message
      });
    }
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
};

// Generate PDF on-demand for public download (no auth required)
exports.generateElectionPdfPublic = async (req, res) => {
  try {
    // Set cache control headers to prevent caching
    res.set({
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });

    const { id } = req.params;
    
    // Get election details
    const [elections] = await promisePool.query('SELECT * FROM elections WHERE id = ?', [id]);
    
    if (!elections[0]) {
      return res.status(404).json({
        success: false,
        message: 'Election not found'
      });
    }

    const election = elections[0];
    let htmlTemplate = election.html_content;
    
    // If no HTML content, create a default template (same as seminar)
    if (!htmlTemplate) {
      // Parse positions
      let positions = [];
      try {
        positions = typeof election.positions === 'string' 
          ? JSON.parse(election.positions) 
          : (election.positions || []);
      } catch (e) {
        positions = ['President', 'Vice President', 'Secretary', 'Treasurer'];
      }

      htmlTemplate = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${election.title} - Nomination Form</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0B3C5D; padding-bottom: 20px; }
            .header h1 { color: #0B3C5D; margin-bottom: 10px; }
            .header h2 { color: #C9A227; margin-bottom: 5px; }
            .form-section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; }
            .section-title { font-weight: bold; color: #0B3C5D; margin-bottom: 15px; font-size: 16px; }
            .form-field { margin-bottom: 15px; display: flex; align-items: center; }
            .field-label { font-weight: bold; width: 200px; }
            .field-line { border-bottom: 1px solid #333; flex: 1; min-height: 20px; margin-left: 10px; }
            .positions-box { background: #f8f9fa; padding: 15px; border: 1px solid #dee2e6; margin: 15px 0; }
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
            <h2>${election.title}</h2>
            <p><strong>Eligible Members:</strong> ${election.eligible_members || 'Life Member'}</p>
            <p><strong>Nomination Deadline:</strong> ${election.deadline ? new Date(election.deadline).toLocaleDateString('en-IN') : 'TBA'}</p>
            <p><strong>Voting Date:</strong> ${election.voting_date ? new Date(election.voting_date).toLocaleDateString('en-IN') : 'TBA'}</p>
            ${election.voting_time ? `<p><strong>Voting Time:</strong> ${election.voting_time}</p>` : ''}
            ${election.voting_venue ? `<p><strong>Venue:</strong> ${election.voting_venue}</p>` : ''}
          </div>
          
          <div class="positions-box">
            <div class="section-title">Positions Available for Election:</div>
            <p>${positions.join(', ')}</p>
          </div>
          
          <div class="form-section">
            <div class="section-title">Candidate Information</div>
            <div class="form-field">
              <div class="field-label">Position Applied For:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Full Name:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Life Membership No:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Mobile Number:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Email:</div>
              <div class="field-line"></div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Professional Details</div>
            <div class="form-field">
              <div class="field-label">Designation:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Qualification:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Working Place:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Age:</div>
              <div class="field-line"></div>
            </div>
            <div class="form-field">
              <div class="field-label">Gender:</div>
              <div class="field-line"></div>
            </div>
          </div>
          
          <div class="form-section">
            <div class="section-title">Address Information</div>
            <div class="form-field">
              <div class="field-label">Complete Address:</div>
              <div class="field-line"></div>
            </div>
          </div>
          
          <div class="declaration">
            <p><strong>Declaration:</strong> I hereby submit my nomination for the position mentioned above in the ${election.title}. I confirm that I am a ${election.eligible_members} of the Ophthalmic Association Of Bihar and meet all eligibility criteria. I agree to abide by the election rules and regulations set by the association.</p>
          </div>
          
          <div class="signature-section">
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Date</div>
            </div>
            <div class="signature-box">
              <div class="signature-line"></div>
              <div>Candidate Signature</div>
            </div>
          </div>
          
          <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
            <p>Ophthalmic Association Of Bihar | www.boabihar.org | ${election.contact_mobile ? `Contact: ${election.contact_mobile}` : 'info@boabihar.org'}</p>
          </div>
        </body>
        </html>
      `;
    }

    // Use the improved PDF service (same as seminar)
    const htmlToPdfService = require('../services/htmlToPdf.service');
    const pdfBuffer = await htmlToPdfService.generateElectionFormPdf(htmlTemplate, election);
    
    // Set response headers for PDF download
    const fileName = `${election.title.replace(/[^a-zA-Z0-9]/g, '_')}_Nomination_Form.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    
    return res.send(pdfBuffer);
    
  } catch (error) {
    console.error('Election PDF generation error:', error);
    
    // Final fallback: Return HTML for manual printing (same as seminar)
    try {
      const [elections] = await promisePool.query('SELECT * FROM elections WHERE id = ?', [req.params.id]);
      
      if (elections[0]) {
        const election = elections[0];
        const fileName = `${election.title.replace(/[^a-zA-Z0-9]/g, '_')}_Nomination_Form.html`;
        
        const basicHtml = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <title>${election.title} - Nomination Form</title>
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
              <h2>${election.title}</h2>
              <p><strong>Deadline:</strong> ${election.deadline ? new Date(election.deadline).toLocaleDateString('en-IN') : 'TBA'}</p>
            </div>
            
            <div class="form-section">
              <div class="section-title">Candidate Information</div>
              <div class="form-field">Name: <span class="field-line"></span></div>
              <div class="form-field">Mobile: <span class="field-line"></span></div>
              <div class="form-field">Email: <span class="field-line"></span></div>
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
      console.error('Fallback HTML generation also failed:', fallbackError);
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to generate PDF',
      error: error.message,
      details: 'PDF generation service is temporarily unavailable. Please try again later or contact support.'
    });
  }
};
