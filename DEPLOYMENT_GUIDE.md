# BOA Connect - Deployment Guide

## Overview
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Node.js + Express)
- **Database**: MySQL (existing or Render managed)

---

## 🚀 Part 1: Backend Deployment on Render

### Step 1: Prepare Backend
1. Make sure `backend/package.json` has correct start script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

2. Update `backend/server.js` to use PORT from environment:
   ```javascript
   const PORT = process.env.PORT || 5000;
   ```

### Step 2: Deploy to Render

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the repository

3. **Configure Service**
   - **Name**: `boa-backend`
   - **Region**: Singapore (or closest to your users)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free

4. **Add Environment Variables**
   Click "Environment" tab and add:
   ```
   NODE_ENV=production
   PORT=5000
   
   # Database
   DB_HOST=your_mysql_host
   DB_USER=your_mysql_user
   DB_PASSWORD=your_mysql_password
   DB_NAME=your_database_name
   
   # JWT
   JWT_SECRET=your_super_secret_jwt_key_here
   
   # Razorpay
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_key_secret
   
   # Cloudinary
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   
   # Email
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=your_email@gmail.com
   ```

5. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (5-10 minutes)
   - Note your backend URL: `https://boa-backend.onrender.com`

### Step 3: Database Setup

**Option A: Use Existing MySQL Database**
- Use your current database credentials
- Make sure database is accessible from internet
- Update DB_HOST with public IP/domain

**Option B: Create MySQL on Render**
- Go to Dashboard → "New +" → "PostgreSQL" (or use external MySQL)
- For MySQL, consider: Railway, PlanetScale, or AWS RDS Free Tier

---

## 🌐 Part 2: Frontend Deployment on Vercel

### Step 1: Update API Configuration

1. Create environment file for production:
   ```bash
   # boa-connect/.env.production
   VITE_API_URL=https://boa-backend.onrender.com
   ```

2. Update `boa-connect/src/lib/api.ts`:
   ```typescript
   const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
   ```

### Step 2: Deploy to Vercel

1. **Create Vercel Account**
   - Go to https://vercel.com
   - Sign up with GitHub

2. **Import Project**
   - Click "Add New..." → "Project"
   - Import your GitHub repository
   - Vercel will auto-detect Vite

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Root Directory**: `boa-connect`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables**
   ```
   VITE_API_URL=https://boa-backend.onrender.com
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build (2-5 minutes)
   - Your site will be live at: `https://your-project.vercel.app`

### Step 3: Custom Domain (Optional)
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., boabihar.org)
3. Update DNS records as instructed

---

## 🔧 Post-Deployment Configuration

### 1. Update CORS on Backend
Make sure backend allows your Vercel domain:
```javascript
// backend/server.js
const cors = require('cors');
app.use(cors({
  origin: [
    'http://localhost:8080',
    'https://your-project.vercel.app',
    'https://boabihar.org'
  ],
  credentials: true
}));
```

### 2. Update Razorpay Webhook
- Go to Razorpay Dashboard
- Settings → Webhooks
- Add webhook URL: `https://boa-backend.onrender.com/api/razorpay/webhook`

### 3. Test Everything
- [ ] User registration
- [ ] User login
- [ ] Seminar registration
- [ ] Payment flow
- [ ] File uploads
- [ ] Email notifications

---

## 📝 Important Notes

### Render Free Tier Limitations
- Service sleeps after 15 minutes of inactivity
- First request after sleep takes 30-60 seconds
- 750 hours/month free (enough for 1 service)

### Vercel Free Tier
- 100 GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Global CDN

### Database Considerations
- Make sure MySQL is accessible from Render's IP
- Consider connection pooling for better performance
- Backup database regularly

---

## 🐛 Troubleshooting

### Backend Issues
1. **Service won't start**
   - Check logs in Render dashboard
   - Verify all environment variables are set
   - Check database connection

2. **Database connection fails**
   - Verify DB credentials
   - Check if DB allows external connections
   - Test connection from local machine

### Frontend Issues
1. **API calls fail**
   - Check VITE_API_URL is correct
   - Verify CORS settings on backend
   - Check browser console for errors

2. **Build fails**
   - Check for TypeScript errors
   - Verify all dependencies are in package.json
   - Check build logs in Vercel

---

## 🔄 Continuous Deployment

Both platforms support automatic deployment:
- **Push to GitHub** → Automatic deployment
- **Render**: Deploys backend on push
- **Vercel**: Deploys frontend on push

---

## 💰 Cost Estimate

### Free Tier (Current Setup)
- Render: Free
- Vercel: Free
- **Total: ₹0/month**

### Paid Tier (Recommended for Production)
- Render: $7/month (no sleep, better performance)
- Vercel: Free (sufficient for most cases)
- MySQL Database: $5-10/month
- **Total: ~₹1000-1500/month**

---

## 📞 Support

If you face any issues:
1. Check deployment logs
2. Verify environment variables
3. Test API endpoints directly
4. Check database connectivity

---

## ✅ Deployment Checklist

### Before Deployment
- [ ] All environment variables documented
- [ ] Database backup created
- [ ] Test payment flow locally
- [ ] Update API URLs in code

### Backend Deployment
- [ ] Render account created
- [ ] Repository connected
- [ ] Environment variables added
- [ ] Service deployed successfully
- [ ] Backend URL noted

### Frontend Deployment
- [ ] Vercel account created
- [ ] Repository connected
- [ ] Environment variables added
- [ ] Build successful
- [ ] Site accessible

### Post Deployment
- [ ] CORS configured
- [ ] Razorpay webhook updated
- [ ] All features tested
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active

---

**Ready to deploy? Follow the steps above and your BOA Connect application will be live! 🚀**
