const XLSX = require('xlsx');
const { promisePool } = require('../config/database');

/**
 * Parse Excel file and extract membership data
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Array} Array of membership objects
 */
const parseExcelFile = (fileBuffer) => {
  try {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    return data;
  } catch (error) {
    throw new Error(`Failed to parse Excel file: ${error.message}`);
  }
};

/**
 * Validate membership data
 * @param {Object} row - Single membership row
 * @param {Number} rowIndex - Row number for error reporting
 * @returns {Object} Validation result
 */
const validateMembershipRow = (row, rowIndex) => {
  const errors = [];
  
  // Required fields
  if (!row.email || !row.email.trim()) {
    errors.push(`Row ${rowIndex}: Email is required`);
  }
  
  if (!row.name || !row.name.trim()) {
    errors.push(`Row ${rowIndex}: Name is required`);
  }
  
  if (!row.membership_type || !row.membership_type.trim()) {
    errors.push(`Row ${rowIndex}: Membership type is required`);
  }
  
  // Email format validation
  if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
    errors.push(`Row ${rowIndex}: Invalid email format`);
  }
  
  // Mobile validation (if provided)
  if (row.mobile && !/^\d{10}$/.test(row.mobile.toString().replace(/\s/g, ''))) {
    errors.push(`Row ${rowIndex}: Mobile must be 10 digits`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

/**
 * Bulk import memberships from Excel
 * @param {Buffer} fileBuffer - Excel file buffer
 * @returns {Object} Import result with success/failure counts
 */
const bulkImportMemberships = async (fileBuffer) => {
  const result = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    successDetails: [],
    failedDetails: []
  };
  
  try {
    // Parse Excel file
    const rows = parseExcelFile(fileBuffer);
    result.total = rows.length;
    
    if (rows.length === 0) {
      throw new Error('Excel file is empty or has no data');
    }
    
    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +2 because Excel starts at 1 and has header row
      
      try {
        // Validate row
        const validation = validateMembershipRow(row, rowNumber);
        if (!validation.valid) {
          result.failed++;
          result.failedDetails.push({
            row: rowNumber,
            email: row.email,
            errors: validation.errors
          });
          result.errors.push(...validation.errors);
          continue;
        }
        
        // Check if user exists
        const [user] = await promisePool.query(
          'SELECT id FROM users WHERE email = ?',
          [row.email.trim()]
        );
        
        if (user.length === 0) {
          result.failed++;
          result.failedDetails.push({
            row: rowNumber,
            email: row.email,
            errors: [`User not found. Please register user first.`]
          });
          result.errors.push(`Row ${rowNumber}: User ${row.email} not found`);
          continue;
        }
        
        // Check if membership already exists
        const [existing] = await promisePool.query(
          'SELECT id FROM membership_registrations WHERE email = ?',
          [row.email.trim()]
        );
        
        if (existing.length > 0) {
          result.failed++;
          result.failedDetails.push({
            row: rowNumber,
            email: row.email,
            errors: [`Membership already exists`]
          });
          result.errors.push(`Row ${rowNumber}: ${row.email} already has membership`);
          continue;
        }
        
        // Insert membership
        await promisePool.query(`
          INSERT INTO membership_registrations 
          (email, name, father_name, qualification, year_passing, dob, institution, 
           working_place, sex, age, address, mobile, membership_type, payment_type, 
           transaction_id, payment_status, payment_method, amount, valid_from, 
           valid_until, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'offline', ?, ?, ?, ?, NOW())
        `, [
          row.email.trim(),
          row.name?.trim() || null,
          row.father_name?.trim() || null,
          row.qualification?.trim() || null,
          row.year_passing || null,
          row.dob || null,
          row.institution?.trim() || null,
          row.working_place?.trim() || null,
          row.sex?.trim() || null,
          row.age || null,
          row.address?.trim() || null,
          row.mobile?.toString().trim() || null,
          row.membership_type?.trim(),
          row.payment_type?.trim() || 'offline',
          row.transaction_id?.trim() || null,
          row.amount || 0,
          row.valid_from || null,
          row.valid_until || null,
          row.notes?.trim() || ''
        ]);
        
        result.success++;
        result.successDetails.push({
          row: rowNumber,
          email: row.email,
          name: row.name
        });
        
      } catch (error) {
        result.failed++;
        result.failedDetails.push({
          row: rowNumber,
          email: row.email,
          errors: [error.message]
        });
        result.errors.push(`Row ${rowNumber}: ${error.message}`);
      }
    }
    
    return result;
    
  } catch (error) {
    throw new Error(`Bulk import failed: ${error.message}`);
  }
};

/**
 * Generate sample Excel template
 * @returns {Buffer} Excel file buffer
 */
const generateSampleTemplate = () => {
  const sampleData = [
    {
      email: 'doctor@example.com',
      name: 'Dr. John Doe',
      father_name: 'Mr. Father Name',
      qualification: 'MBBS, MD',
      year_passing: '2020',
      dob: '1990-01-15',
      institution: 'Medical College',
      working_place: 'City Hospital',
      sex: 'Male',
      age: '34',
      address: 'Complete Address',
      mobile: '9876543210',
      membership_type: 'Yearly',
      payment_type: 'cash',
      transaction_id: 'OFFLINE001',
      amount: '8000',
      valid_from: '2026-01-01',
      valid_until: '2027-01-01',
      notes: 'Any additional notes'
    }
  ];
  
  const worksheet = XLSX.utils.json_to_sheet(sampleData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Memberships');
  
  // Generate buffer
  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return buffer;
};

module.exports = {
  bulkImportMemberships,
  generateSampleTemplate
};
