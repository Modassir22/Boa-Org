#!/usr/bin/env node

/**
 * Pre-Deployment Checker
 * Run this before deploying to check if everything is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 BOA Connect - Pre-Deployment Checker\n');

let errors = 0;
let warnings = 0;

// Check 1: Backend files
console.log('📦 Checking Backend Files...');
const backendFiles = [
  'backend/package.json',
  'backend/server.js',
  'backend/.env.example',
  'backend/config/database.js'
];

backendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
});

// Check 2: Frontend files
console.log('\n📦 Checking Frontend Files...');
const frontendFiles = [
  'boa-connect/package.json',
  'boa-connect/vite.config.ts',
  'boa-connect/.env.example',
  'boa-connect/src/lib/api.ts'
];

frontendFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ❌ ${file} - MISSING`);
    errors++;
  }
});

// Check 3: Environment files
console.log('\n🔐 Checking Environment Configuration...');
if (fs.existsSync('backend/.env')) {
  console.log('  ✅ backend/.env exists');
  const envContent = fs.readFileSync('backend/.env', 'utf8');
  
  const requiredVars = [
    'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      console.log(`  ✅ ${varName} configured`);
    } else {
      console.log(`  ⚠️  ${varName} - NOT FOUND`);
      warnings++;
    }
  });
} else {
  console.log('  ⚠️  backend/.env not found (will use environment variables)');
  warnings++;
}

// Check 4: Package.json scripts
console.log('\n📜 Checking Package Scripts...');
const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
if (backendPkg.scripts && backendPkg.scripts.start) {
  console.log('  ✅ Backend start script exists');
} else {
  console.log('  ❌ Backend start script missing');
  errors++;
}

const frontendPkg = JSON.parse(fs.readFileSync('boa-connect/package.json', 'utf8'));
if (frontendPkg.scripts && frontendPkg.scripts.build) {
  console.log('  ✅ Frontend build script exists');
} else {
  console.log('  ❌ Frontend build script missing');
  errors++;
}

// Check 5: Git status
console.log('\n📝 Checking Git Status...');
try {
  const { execSync } = require('child_process');
  const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });
  
  if (gitStatus.trim() === '') {
    console.log('  ✅ No uncommitted changes');
  } else {
    console.log('  ⚠️  You have uncommitted changes:');
    console.log(gitStatus);
    warnings++;
  }
} catch (error) {
  console.log('  ⚠️  Could not check git status');
  warnings++;
}

// Check 6: Node modules
console.log('\n📚 Checking Dependencies...');
if (fs.existsSync('backend/node_modules')) {
  console.log('  ✅ Backend dependencies installed');
} else {
  console.log('  ⚠️  Backend dependencies not installed (run: cd backend && npm install)');
  warnings++;
}

if (fs.existsSync('boa-connect/node_modules')) {
  console.log('  ✅ Frontend dependencies installed');
} else {
  console.log('  ⚠️  Frontend dependencies not installed (run: cd boa-connect && npm install)');
  warnings++;
}

// Check 7: Deployment files
console.log('\n🚀 Checking Deployment Files...');
const deployFiles = [
  'DEPLOYMENT_GUIDE.md',
  'QUICK_DEPLOY.md',
  'DEPLOYMENT_CHECKLIST.md',
  'README.md'
];

deployFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`  ✅ ${file}`);
  } else {
    console.log(`  ⚠️  ${file} - MISSING`);
    warnings++;
  }
});

// Summary
console.log('\n' + '='.repeat(50));
console.log('📊 Summary:');
console.log(`  Errors: ${errors}`);
console.log(`  Warnings: ${warnings}`);

if (errors === 0 && warnings === 0) {
  console.log('\n✅ All checks passed! Ready to deploy! 🚀');
  process.exit(0);
} else if (errors === 0) {
  console.log('\n⚠️  Some warnings found. Review them before deploying.');
  process.exit(0);
} else {
  console.log('\n❌ Errors found! Fix them before deploying.');
  process.exit(1);
}
