# 🚀 Quick Deployment Guide (Hindi + English)

## तुरंत Deploy करने के लिए (Quick Deploy)

### 1️⃣ Backend - Render पर Deploy करें

**Step 1: Render Account बनाएं**
```
1. https://render.com पर जाएं
2. GitHub से Sign up करें
3. Repository को connect करें
```

**Step 2: Web Service बनाएं**
```
1. Dashboard में "New +" → "Web Service" click करें
2. अपनी repository select करें
3. निम्नलिखित settings भरें:
```

**Settings:**
```
Name: boa-backend
Region: Singapore
Branch: main
Root Directory: backend
Environment: Node
Build Command: npm install
Start Command: npm start
Plan: Free
```

**Step 3: Environment Variables Add करें**

Render dashboard में "Environment" tab में जाकर ये variables add करें:

```bash
# Required Variables (जरूरी)
NODE_ENV=production
PORT=5000

# Database (अपनी database details डालें)
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=boa_connect

# JWT Secret (कोई भी random string)
JWT_SECRET=boa_super_secret_key_2024_production

# Razorpay (अपनी keys डालें)
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=your_secret_key

# Cloudinary (अपनी details डालें)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (Gmail app password use करें)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_digit_app_password
EMAIL_FROM=your_email@gmail.com

# Frontend URL (बाद में update करेंगे)
FRONTEND_URL=https://your-app.vercel.app
```

**Step 4: Deploy करें**
```
1. "Create Web Service" button click करें
2. 5-10 minutes wait करें
3. Backend URL note करें: https://boa-backend.onrender.com
```

---

### 2️⃣ Frontend - Vercel पर Deploy करें

**Step 1: Vercel Account बनाएं**
```
1. https://vercel.com पर जाएं
2. GitHub से Sign up करें
```

**Step 2: Project Import करें**
```
1. "Add New..." → "Project" click करें
2. अपनी repository select करें
3. Vercel automatically detect कर लेगा
```

**Step 3: Settings Configure करें**

```
Framework Preset: Vite
Root Directory: boa-connect
Build Command: npm run build
Output Directory: dist
Install Command: npm install
```

**Step 4: Environment Variable Add करें**

```bash
# Backend URL (Render से मिला URL डालें)
VITE_API_URL=https://boa-backend.onrender.com
```

**Step 5: Deploy करें**
```
1. "Deploy" button click करें
2. 2-5 minutes wait करें
3. आपकी site live हो जाएगी!
```

---

## ✅ Deployment के बाद (Post-Deployment)

### 1. Frontend URL को Backend में Update करें

Render dashboard में जाकर `FRONTEND_URL` variable update करें:
```
FRONTEND_URL=https://your-app.vercel.app
```

### 2. Test करें

- [ ] Website खुल रही है?
- [ ] Login/Register काम कर रहा है?
- [ ] Seminar registration हो रही है?
- [ ] Payment test करें
- [ ] File upload test करें

---

## 🔧 Common Issues & Solutions

### Issue 1: Backend 502 Error
**Solution:** 
- Render logs check करें
- Database connection verify करें
- Environment variables check करें

### Issue 2: API Calls Fail
**Solution:**
- VITE_API_URL correct है check करें
- CORS settings verify करें
- Browser console में errors देखें

### Issue 3: Database Connection Failed
**Solution:**
- Database publicly accessible है check करें
- Credentials correct हैं verify करें
- Firewall rules check करें

---

## 💡 Pro Tips

1. **Free Tier Limitations:**
   - Render: 15 minutes inactivity के बाद sleep होता है
   - First request slow हो सकता है (30-60 seconds)
   - Production के लिए paid plan recommend है

2. **Custom Domain:**
   - Vercel में Settings → Domains से add करें
   - DNS records update करें
   - SSL automatic है

3. **Monitoring:**
   - Render logs regularly check करें
   - Vercel analytics enable करें
   - Database backup regularly लें

---

## 📞 Need Help?

अगर कोई problem आए तो:
1. Deployment logs check करें
2. Environment variables verify करें
3. Database connection test करें
4. CORS settings check करें

---

## 🎉 Congratulations!

आपका BOA Connect application अब live है! 🚀

**Next Steps:**
- Custom domain add करें
- SSL certificate verify करें
- Payment gateway test करें
- Users को invite करें

---

**Important URLs to Save:**
- Backend: https://boa-backend.onrender.com
- Frontend: https://your-app.vercel.app
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
