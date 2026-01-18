const puppeteer = require('puppeteer');
const path = require('path');

class HtmlToPdfService {
  constructor() {
    this.browser = null;
  }

  async initBrowser() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  async convertHtmlToPdf(html, options = {}) {
    try {
      const browser = await this.initBrowser();
      const page = await browser.newPage();

      // Set content with proper encoding
      await page.setContent(html, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      // Default PDF options
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

      // Generate PDF buffer
      const pdfBuffer = await page.pdf(pdfOptions);

      await page.close();

      return pdfBuffer;
    } catch (error) {
      console.error('HTML to PDF conversion error:', error);
      throw new Error('Failed to convert HTML to PDF');
    }
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
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
      });
    } catch (error) {
      console.error('Membership form PDF generation error:', error);
      throw error;
    }
  }

  async generateSeminarFormPdf(htmlTemplate, seminarData = {}) {
    try {
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
        margin: { top: '15mm', right: '15mm', bottom: '15mm', left: '15mm' }
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