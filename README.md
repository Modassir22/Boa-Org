# BOA Connect - Bihar Ophthalmic Association

Complete web application for managing seminars, memberships, and user registrations for Bihar Ophthalmic Association.

## 🌟 Features

### User Features
- User registration and authentication
- Seminar browsing and registration
- Online payment integration (Razorpay)
- Certificate management
- Profile management
- Membership management
- Email notifications

### Admin Features
- Dashboard with analytics
- User management
- Seminar management
- Payment tracking
- Certificate uploads
- Gallery management
- Committee member management
- Site configuration
- Offline form generation

## 🏗️ Tech Stack

### Frontend
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite
- **UI Library:** Shadcn/ui + Radix UI
- **Styling:** Tailwind CSS
- **Routing:** React Router v6
- **State Management:** React Query
- **Forms:** React Hook Form + Zod
- **Payment:** Razorpay
- **PDF Generation:** jsPDF

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT
- **File Upload:** Multer + Cloudinary
- **Email:** Nodemailer
- **Payment:** Razorpay
- **PDF Generation:** Puppeteer

## 📁 Project Structure

```
BOA-Connect/
├── backend/                 # Backend API
│   ├── config/             # Database & service configs
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Auth & upload middleware
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Helper functions
│   └── server.js          # Entry point
│
├── boa-connect/           # Frontend application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities & API
│   │   ├── hooks/         # Custom hooks
│   │   └── styles/        # CSS files
│   └── public/            # Static assets
│
└── docs/                  # Documentation
    ├── DEPLOYMENT_GUIDE.md
    ├── QUICK_DEPLOY.md
    └── DEPLOYMENT_CHECKLIST.md
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- MySQL database
- Razorpay account
- Cloudinary account
- Gmail account (for emails)

### Local Development

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd BOA-Connect
```

2. **Setup Backend**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

3. **Setup Frontend**
```bash
cd boa-connect
npm install
cp .env.example .env
# Edit .env if needed
npm run dev
```

4. **Access Application**
- Frontend: http://localhost:8080
- Backend: http://localhost:5000

## 🌐 Deployment

### Quick Deploy

**Backend → Render**
1. Create account on [Render](https://render.com)
2. Connect GitHub repository
3. Create Web Service with root directory: `backend`
4. Add environment variables
5. Deploy!

**Frontend → Vercel**
1. Create account on [Vercel](https://vercel.com)
2. Import GitHub repository
3. Set root directory: `boa-connect`
4. Add environment variable: `VITE_API_URL`
5. Deploy!

### Detailed Guides
- [Complete Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Quick Deploy Guide](./QUICK_DEPLOY.md)
- [Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)

## 🔧 Configuration

### Backend Environment Variables
```env
NODE_ENV=production
PORT=5000
DB_HOST=your_mysql_host
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=boa_connect
JWT_SECRET=your_jwt_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com
FRONTEND_URL=https://your-frontend-url.com
```

### Frontend Environment Variables
```env
VITE_API_URL=https://your-backend-url.com
```

## 📚 API Documentation

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

### Seminars
- `GET /api/seminars` - Get all seminars
- `GET /api/seminars/:id` - Get seminar details
- `GET /api/seminars/active/current` - Get active seminar
- `POST /api/registrations` - Register for seminar

### Admin
- `POST /api/admin-auth/login` - Admin login
- `GET /api/admin/statistics` - Dashboard stats
- `GET /api/admin/users` - Get all users
- `POST /api/admin/seminars` - Create seminar

## 🧪 Testing

### Test Payment (Razorpay Test Mode)
Use these test cards:
- Card: 4111 1111 1111 1111
- CVV: Any 3 digits
- Expiry: Any future date

### Test Users
Check `backend/USER_LOGIN_CREDENTIALS.txt` for test credentials

## 🐛 Troubleshooting

### Common Issues

**Backend won't start**
- Check database connection
- Verify environment variables
- Check port availability

**Frontend API calls fail**
- Verify VITE_API_URL is correct
- Check CORS settings
- Check backend is running

**Payment fails**
- Verify Razorpay keys
- Check webhook configuration
- Test with test cards first

## 📝 License

Private - Bihar Ophthalmic Association

## 👥 Support

For issues and questions:
- Check documentation files
- Review deployment logs
- Contact development team

## 🎯 Roadmap

- [ ] Mobile app
- [ ] SMS notifications
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Offline mode

---

**Developed for Bihar Ophthalmic Association**

Last Updated: January 2025
