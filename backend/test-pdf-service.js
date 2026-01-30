#!/usr/bin/env node

/**
 * Test script for PDF generation service
 * Run this to verify the PDF service works with fallbacks
 */

const htmlToPdfService = require('./services/htmlToPdf.service');
const fs = require('fs');
const path = require('path');

async function testPdfService() {
  console.log('🧪 Testing PDF Generation Service...\n');

  const testHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Test PDF</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0B3C5D; padding-bottom: 20px; }
        .header h1 { color: #0B3C5D; }
        .header h2 { color: #C9A227; }
        .form-section { margin-bottom: 25px; padding: 15px; border: 1px solid #ddd; }
        .section-title { font-weight: bold; color: #0B3C5D; margin-bottom: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Bihar Ophthalmic Association</h1>
        <h2>Test Seminar Registration Form</h2>
        <p><strong>Date:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
      </div>
      
      <div class="form-section">
        <div class="section-title">Personal Information</div>
        <p>Name: _________________________</p>
        <p>Email: _________________________</p>
        <p>Phone: _________________________</p>
      </div>
      
      <div class="form-section">
        <div class="section-title">Professional Information</div>
        <p>Institution: _________________________</p>
        <p>Designation: _________________________</p>
      </div>
      
      <p style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
        Bihar Ophthalmic Association | www.boabihar.org | info@boabihar.org
      </p>
    </body>
    </html>
  `;

  const testSeminar = {
    id: 999,
    name: 'Test Seminar',
    venue: 'Test Venue',
    start_date: new Date().toISOString()
  };

  try {
    console.log('1️⃣ Testing Puppeteer availability...');
    const puppeteerAvailable = await htmlToPdfService.checkPuppeteerAvailability();
    console.log(`   Puppeteer available: ${puppeteerAvailable ? '✅ Yes' : '❌ No'}\n`);

    console.log('2️⃣ Testing PDF generation...');
    const startTime = Date.now();
    
    const pdfBuffer = await htmlToPdfService.generateSeminarFormPdf(testHtml, testSeminar);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`   ✅ PDF generated successfully!`);
    console.log(`   📊 Size: ${pdfBuffer.length} bytes`);
    console.log(`   ⏱️  Duration: ${duration}ms\n`);

    // Save test PDF
    const testPdfPath = path.join(__dirname, 'test-output.pdf');
    fs.writeFileSync(testPdfPath, pdfBuffer);
    console.log(`3️⃣ Test PDF saved to: ${testPdfPath}`);
    
    console.log('\n🎉 All tests passed! PDF generation service is working correctly.');
    
    return true;
  } catch (error) {
    console.error('\n❌ PDF generation test failed:');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('1. Run: sudo ./install-puppeteer-deps.sh');
    console.log('2. Restart your Node.js application');
    console.log('3. Check system dependencies with: ldd /usr/bin/google-chrome-stable');
    
    return false;
  }
}

// Test individual methods
async function testFallbackMethods() {
  console.log('\n🔄 Testing individual fallback methods...\n');

  const testHtml = '<h1>Test</h1><p>Simple test content</p>';

  try {
    // Test Puppeteer directly
    console.log('Testing Puppeteer method...');
    try {
      const puppeteerPdf = await htmlToPdfService.convertWithPuppeteer(testHtml);
      console.log(`✅ Puppeteer: ${puppeteerPdf.length} bytes`);
    } catch (error) {
      console.log(`❌ Puppeteer failed: ${error.message}`);
    }

    // Test PDFKit fallback
    console.log('Testing PDFKit fallback...');
    try {
      const pdfkitPdf = await htmlToPdfService.convertWithPDFKit(testHtml);
      console.log(`✅ PDFKit: ${pdfkitPdf.length} bytes`);
    } catch (error) {
      console.log(`❌ PDFKit failed: ${error.message}`);
    }

  } catch (error) {
    console.error('Fallback test error:', error.message);
  }
}

// Run tests
async function runAllTests() {
  console.log('🚀 BOA PDF Service Test Suite\n');
  console.log('=' .repeat(50));
  
  const success = await testPdfService();
  
  if (success) {
    await testFallbackMethods();
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(success ? '✅ Test Suite Completed Successfully' : '❌ Test Suite Failed');
  
  process.exit(success ? 0 : 1);
}

// Handle command line execution
if (require.main === module) {
  runAllTests().catch(error => {
    console.error('Test suite error:', error);
    process.exit(1);
  });
}

module.exports = { testPdfService, testFallbackMethods };