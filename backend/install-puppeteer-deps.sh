#!/bin/bash

# Script to install Puppeteer dependencies on Linux VPS
# Run this script on your Hostinger VPS to fix Puppeteer PDF generation

echo "🔧 Installing Puppeteer dependencies for Linux VPS..."

# Update package list
echo "📦 Updating package list..."
sudo apt-get update

# Install required dependencies for Puppeteer/Chrome
echo "🚀 Installing Chrome/Puppeteer dependencies..."
sudo apt-get install -y \
    libnss3-dev \
    libatk-bridge2.0-dev \
    libdrm-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libxss-dev \
    libasound2-dev \
    libatspi2.0-dev \
    libgtk-3-dev \
    libgconf-2-4 \
    libxfixes3 \
    libxinerama1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0 \
    libxcomposite1 \
    libxcursor1 \
    libxdamage1 \
    libxi6 \
    libxtst6 \
    libnss3 \
    libcups2 \
    libxss1 \
    libxrandr2 \
    libasound2 \
    libpangocairo-1.0-0 \
    libatk1.0-0 \
    libcairo-gobject2 \
    libgtk-3-0 \
    libgdk-pixbuf2.0-0

# Install additional fonts for better PDF rendering
echo "🎨 Installing fonts for better PDF rendering..."
sudo apt-get install -y \
    fonts-liberation \
    fonts-dejavu-core \
    fontconfig

# Install Chrome browser (alternative to Chromium)
echo "🌐 Installing Google Chrome..."
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo apt-key add -
echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update
sudo apt-get install -y google-chrome-stable

# Set Chrome path environment variable
echo "🔧 Setting Chrome path..."
export CHROME_BIN=/usr/bin/google-chrome-stable
echo 'export CHROME_BIN=/usr/bin/google-chrome-stable' >> ~/.bashrc

# Test Chrome installation
echo "🧪 Testing Chrome installation..."
google-chrome-stable --version

# Create a test script to verify Puppeteer works
echo "📝 Creating Puppeteer test script..."
cat > /tmp/test-puppeteer.js << 'EOF'
const puppeteer = require('puppeteer');

async function testPuppeteer() {
  try {
    console.log('Testing Puppeteer...');
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
        '--single-process'
      ],
      executablePath: '/usr/bin/google-chrome-stable'
    });
    
    const page = await browser.newPage();
    await page.setContent('<h1>Test PDF</h1><p>This is a test PDF generation.</p>');
    const pdf = await page.pdf({ format: 'A4' });
    await browser.close();
    
    console.log('✅ Puppeteer test successful! PDF size:', pdf.length, 'bytes');
    return true;
  } catch (error) {
    console.error('❌ Puppeteer test failed:', error.message);
    return false;
  }
}

testPuppeteer();
EOF

echo "✅ Dependencies installed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your Node.js application"
echo "2. Test Puppeteer by running: node /tmp/test-puppeteer.js"
echo "3. If the test passes, PDF generation should work"
echo ""
echo "🔧 Environment variables set:"
echo "   CHROME_BIN=/usr/bin/google-chrome-stable"
echo ""
echo "💡 If you still have issues, try restarting your server and check the logs."