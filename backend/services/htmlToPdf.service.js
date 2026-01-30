const puppeteer = require('puppeteer');

class HtmlToPdfService {
  constructor() {
    this.browser = null;
    this.puppeteerAvailable = null;
  }

  async checkPuppeteerAvailability() {
    if (this.puppeteerAvailable !== null) {
      return this.puppeteerAvailable;
    }

    try {
      console.log('Testing Puppeteer availability...');
      const browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--single-process'
        ],
        timeout: 10000
      });
      
      await browser.close();
      console.log('✓ Puppeteer is available');
      this.puppeteerAvailable = true;
      return true;
    } catch (error) {
      console.error('✗ Puppeteer not available:', error.message);
      this.puppeteerAvailable = false;
      return false;
    }
  }

  async convertHtmlToPdf(html, options = {}) {
    // Strategy 1: Try Puppeteer if available
    const puppeteerAvailable = await this.checkPuppeteerAvailability();
    
    if (puppeteerAvailable) {
      try {
        return await this.convertWithPuppeteer(html, options);
      } catch (error) {
        console.error('Puppeteer PDF generation failed:', error.message);
        console.log('Falling back to PDFKit...');
      }
    }

    // Strategy 2: Fallback to PDFKit
    try {
      return await this.convertWithPDFKit(html, options);
    } catch (error) {
      console.error('PDFKit PDF generation failed:', error.message);
      throw new Error('All PDF generation methods failed');
    }
  }

  async convertWithPuppeteer(html, options = {}) {
    let browser = null;
    let page = null;
    
    try {
      console.log('Generating PDF with Puppeteer...');
      
      browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-cache',
          '--disk-cache-size=0',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor',
          '--disable-background-networking',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-ipc-flooding-protection',
          '--single-process'
        ],
        executablePath: process.env.CHROME_BIN || undefined,
        timeout: 60000
      });
      
      page = await browser.newPage();
      await page.setCacheEnabled(false);
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      console.log('✓ PDF generated with Puppeteer, size:', pdfBuffer.length);
      return pdfBuffer;
      
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }

  async convertWithPDFKit(html, options = {}) {
    return new Promise((resolve, reject) => {
      try {
        console.log('Generating PDF with PDFKit fallback...');
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });
        
        let buffers = [];
        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(buffers);
          console.log('✓ PDF generated with PDFKit, size:', pdfBuffer.length);
          resolve(pdfBuffer);
        });
        doc.on('error', reject);

        // Extract text content from HTML (basic parsing)
        const textContent = this.extractTextFromHtml(html);
        
        // Add content to PDF
        doc.fontSize(16).text('Bihar Ophthalmic Association', { align: 'center' });
        doc.moveDown();
        
        // Split content into lines and add to PDF
        const lines = textContent.split('\n').filter(line => line.trim());
        lines.forEach(line => {
          if (line.trim()) {
            doc.fontSize(10).text(line.trim(), { width: 500 });
            doc.moveDown(0.5);
          }
        });
        
        doc.end();
        
      } catch (error) {
        reject(error);
      }
    });
  }

  extractTextFromHtml(html) {
    // Basic HTML to text conversion
    return html
      .replace(/<style[^>]*>.*?<\/style>/gis, '') // Remove style tags
      .replace(/<script[^>]*>.*?<\/script>/gis, '') // Remove script tags
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp;
      .replace(/&amp;/g, '&') // Replace &amp;
      .replace(/&lt;/g, '<') // Replace &lt;
      .replace(/&gt;/g, '>') // Replace &gt;
      .replace(/&quot;/g, '"') // Replace &quot;
      .replace(/&#39;/g, "'") // Replace &#39;
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  async generateMembershipFormPdf(htmlTemplate, membershipData = {}) {
    try {
      // Replace placeholders in HTML template with actual data
      let processedHtml = htmlTemplate;

      // Replace common placeholders
      const placeholders = {
        '{{CURRENT_DATE}}': new Date().toLocaleDateString('en-IN'),
        '{{CURRENT_YEAR}}': new Date().getFullYear(),
        '{{BOA_NAME}}': 'Bihar Ophthalmic Association',
        '{{BOA_ADDRESS}}': 'Bihar Ophthalmic Association Address',
        '{{BOA_PHONE}}': '+91-XXXXXXXXXX',
        '{{BOA_EMAIL}}': 'info@boabihar.org',
        '{{BOA_WEBSITE}}': 'www.boabihar.org'
      };

      // Replace placeholders
      Object.keys(placeholders).forEach(placeholder => {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        processedHtml = processedHtml.replace(regex, placeholders[placeholder]);
      });

      // Add BOA styling if not present
      if (!processedHtml.includes('<style>') && !processedHtml.includes('stylesheet')) {
        const boaStyles = `
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .boa-header { 
              background: #0B3C5D; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .boa-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 10px; 
            }
            .form-section { 
              margin-bottom: 25px; 
              padding: 15px; 
              border: 1px solid #ddd; 
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #0B3C5D; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #C9A227; 
              padding-bottom: 5px; 
            }
            .form-field { 
              margin-bottom: 15px; 
            }
            .field-label { 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .field-line { 
              border-bottom: 1px solid #333; 
              min-height: 20px; 
              display: inline-block; 
              min-width: 200px; 
            }
            .checkbox-group { 
              margin: 10px 0; 
            }
            .declaration { 
              background: #f9f9f9; 
              padding: 15px; 
              border-left: 4px solid #C9A227; 
              margin: 20px 0; 
            }
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 40px; 
            }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .boa-header { margin-bottom: 20px; } 
            }
          </style>
        `;

        if (processedHtml.includes('<head>')) {
          processedHtml = processedHtml.replace('</head>', `${boaStyles}</head>`);
        } else {
          processedHtml = `<head>${boaStyles}</head>${processedHtml}`;
        }
      }

      // Ensure proper HTML structure
      if (!processedHtml.includes('<!DOCTYPE')) {
        processedHtml = `<!DOCTYPE html><html lang="en">${processedHtml}</html>`;
      }

      return await this.convertHtmlToPdf(processedHtml, {
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
    } catch (error) {
      console.error('Membership form PDF generation error:', error);
      throw error;
    }
  }

  async generateSeminarFormPdf(htmlTemplate, seminarData = {}) {
    try {
      console.log('=== GENERATING SEMINAR PDF ===');
      console.log('HTML Template length:', htmlTemplate?.length);
      console.log('Seminar:', seminarData.name);
      console.log('First 300 chars of HTML:', htmlTemplate?.substring(0, 300));
      
      let processedHtml = htmlTemplate;

      // Replace seminar-specific placeholders
      const placeholders = {
        '{{SEMINAR_NAME}}': seminarData.name || 'BOA Seminar',
        '{{SEMINAR_TITLE}}': seminarData.title || '',
        '{{SEMINAR_VENUE}}': seminarData.venue || '',
        '{{SEMINAR_LOCATION}}': seminarData.location || '',
        '{{SEMINAR_START_DATE}}': seminarData.start_date ? new Date(seminarData.start_date).toLocaleDateString('en-IN') : '',
        '{{SEMINAR_END_DATE}}': seminarData.end_date ? new Date(seminarData.end_date).toLocaleDateString('en-IN') : '',
        '{{REGISTRATION_START}}': seminarData.registration_start ? new Date(seminarData.registration_start).toLocaleDateString('en-IN') : '',
        '{{REGISTRATION_END}}': seminarData.registration_end ? new Date(seminarData.registration_end).toLocaleDateString('en-IN') : '',
        '{{CURRENT_DATE}}': new Date().toLocaleDateString('en-IN'),
        '{{CURRENT_YEAR}}': new Date().getFullYear(),
        '{{BOA_NAME}}': 'Bihar Ophthalmic Association',
        '{{BOA_EMAIL}}': 'info@boabihar.org',
        '{{BOA_WEBSITE}}': 'www.boabihar.org'
      };

      // Replace placeholders
      Object.keys(placeholders).forEach(placeholder => {
        const regex = new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g');
        processedHtml = processedHtml.replace(regex, placeholders[placeholder]);
      });
      
      console.log('After placeholder replacement, length:', processedHtml?.length);

      // Add BOA styling if not present
      if (!processedHtml.includes('<style>') && !processedHtml.includes('stylesheet')) {
        const boaStyles = `
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              max-width: 800px; 
              margin: 0 auto; 
              padding: 20px; 
            }
            .boa-header { 
              background: #0B3C5D; 
              color: white; 
              padding: 20px; 
              text-align: center; 
              margin-bottom: 30px; 
            }
            .seminar-title { 
              font-size: 24px; 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .seminar-details { 
              font-size: 14px; 
              opacity: 0.9; 
            }
            .form-section { 
              margin-bottom: 25px; 
              padding: 15px; 
              border: 1px solid #ddd; 
            }
            .section-title { 
              font-size: 16px; 
              font-weight: bold; 
              color: #0B3C5D; 
              margin-bottom: 15px; 
              border-bottom: 2px solid #C9A227; 
              padding-bottom: 5px; 
            }
            .form-field { 
              margin-bottom: 15px; 
            }
            .field-label { 
              font-weight: bold; 
              margin-bottom: 5px; 
            }
            .field-line { 
              border-bottom: 1px solid #333; 
              min-height: 20px; 
              display: inline-block; 
              min-width: 200px; 
            }
            .fee-structure { 
              background: #f8f9fa; 
              padding: 15px; 
              border: 1px solid #dee2e6; 
              margin: 15px 0; 
            }
            .declaration { 
              background: #f9f9f9; 
              padding: 15px; 
              border-left: 4px solid #C9A227; 
              margin: 20px 0; 
            }
            .signature-section { 
              display: flex; 
              justify-content: space-between; 
              margin-top: 40px; 
            }
            @media print { 
              body { margin: 0; padding: 10px; } 
              .boa-header { margin-bottom: 20px; } 
            }
          </style>
        `;

        if (processedHtml.includes('<head>')) {
          processedHtml = processedHtml.replace('</head>', `${boaStyles}</head>`);
        } else {
          processedHtml = `<head>${boaStyles}</head>${processedHtml}`;
        }
      }

      // Ensure proper HTML structure
      if (!processedHtml.includes('<!DOCTYPE')) {
        processedHtml = `<!DOCTYPE html><html lang="en">${processedHtml}</html>`;
      }

      return await this.convertHtmlToPdf(processedHtml, {
        format: 'A4',
        printBackground: true,
        margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
        preferCSSPageSize: true,
        displayHeaderFooter: false
      });
    } catch (error) {
      console.error('Seminar form PDF generation error:', error);
      throw error;
    }
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

module.exports = new HtmlToPdfService();