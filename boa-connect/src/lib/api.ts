import axios from 'axios';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

// Create axios instance for users
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create axios instance for admin
const adminApi = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add user token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add admin token to requests
adminApi.interceptors.request.use((config) => {
  const adminToken = localStorage.getItem('adminToken');
  if (adminToken) {
    config.headers.Authorization = `Bearer ${adminToken}`;
  } else {
    console.warn('⚠️ No admin token found in localStorage');
  }
  return config;
});

// Add response interceptor to handle 401 errors for user API
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized: User token invalid or expired');
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401 errors for admin API
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('🔒 Unauthorized: Admin token invalid or expired');
      // Clear invalid token
      localStorage.removeItem('adminToken');
      localStorage.removeItem('admin');
      // Redirect to login
      if (window.location.pathname !== '/admin-login') {
        window.location.href = '/admin-login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: async (data: any) => {
    const response = await api.post('/auth/register', data);
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  loginWithMembership: async (membership_no: string, password: string) => {
    const response = await api.post('/auth/login-membership', { membership_no, password });
    return response.data;
  },
};

// Admin Auth APIs
export const adminAuthAPI = {
  login: async (username: string, password: string) => {
    const response = await adminApi.post('/admin-auth/login', { username, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await adminApi.get('/admin-auth/profile');
    return response.data;
  },
  
  logout: async () => {
    const response = await adminApi.post('/admin-auth/logout');
    return response.data;
  },

  // Generic methods for admin routes
  get: async (url: string) => {
    const response = await adminApi.get(url);
    return response.data;
  },

  post: async (url: string, data: any) => {
    const response = await adminApi.post(url, data);
    return response.data;
  },

  put: async (url: string, data: any) => {
    const response = await adminApi.put(url, data);
    return response.data;
  },

  delete: async (url: string) => {
    const response = await adminApi.delete(url);
    return response.data;
  },

  uploadCertificateImage: async (formData: FormData) => {
    const response = await adminApi.post('/admin-auth/certification/upload-image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  
  updateProfile: async (data: any) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },
  
  changePassword: async (data: { current_password: string; new_password: string }) => {
    const response = await api.put('/users/change-password', data);
    return response.data;
  },

  getMembershipDetails: async () => {
    const response = await api.get('/users/membership');
    return response.data;
  },
};

// Seminar APIs
export const seminarAPI = {
  getAll: async () => {
    const response = await api.get('/seminars');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/seminars/${id}`);
    return response.data;
  },
  
  getActive: async () => {
    const response = await api.get('/seminars/active/current');
    return response.data;
  },
};

// Registration APIs
export const registrationAPI = {
  create: async (data: any) => {
    const response = await api.post('/registrations', data);
    return response.data;
  },
  
  getMyRegistrations: async () => {
    const response = await api.get('/registrations/my-registrations');
    return response.data;
  },
  
  updatePayment: async (id: string, data: any) => {
    const response = await api.put(`/registrations/${id}/payment`, data);
    return response.data;
  },
};

// Notification APIs
export const notificationAPI = {
  getAll: async () => {
    const response = await api.get('/notifications');
    return response.data;
  },
};

// Admin APIs
export const adminAPI = {
  // Generic methods for admin routes
  get: async (url: string) => {
    const response = await adminApi.get(url);
    return response.data;
  },

  post: async (url: string, data: any) => {
    const response = await adminApi.post(url, data);
    return response.data;
  },

  put: async (url: string, data: any) => {
    const response = await adminApi.put(url, data);
    return response.data;
  },

  delete: async (url: string) => {
    const response = await adminApi.delete(url);
    return response.data;
  },

  // Seminars
  getAllSeminars: async () => {
    const response = await adminApi.get('/admin/seminars');
    return response.data;
  },
  createSeminar: async (data: any) => {
    const response = await adminApi.post('/admin/seminars', data);
    return response.data;
  },
  updateSeminar: async (id: string, data: any) => {
    const response = await adminApi.put(`/admin/seminars/${id}`, data);
    return response.data;
  },
  deleteSeminar: async (id: string) => {
    const response = await adminApi.delete(`/admin/seminars/${id}`);
    return response.data;
  },
  
  // Users
  getAllUsers: async () => {
    const response = await adminApi.get('/admin/users');
    return response.data;
  },
  deleteUser: async (id: string) => {
    const response = await adminApi.delete(`/admin/users/${id}`);
    return response.data;
  },
  
  // Registrations
  getAllRegistrations: async (params?: any) => {
    const response = await adminApi.get('/admin/registrations', { params });
    return response.data;
  },
  updateRegistrationStatus: async (id: string, status: string) => {
    const response = await adminApi.put(`/admin/registrations/${id}/status`, { status });
    return response.data;
  },
  deleteRegistration: async (id: string) => {
    const response = await adminApi.delete(`/admin/registrations/${id}`);
    return response.data;
  },
  
  // Notifications
  createNotification: async (data: any) => {
    const response = await adminApi.post('/admin/notifications', data);
    return response.data;
  },
  updateNotification: async (id: string, data: any) => {
    const response = await adminApi.put(`/admin/notifications/${id}`, data);
    return response.data;
  },
  deleteNotification: async (id: string) => {
    const response = await adminApi.delete(`/admin/notifications/${id}`);
    return response.data;
  },
  
  // Statistics & Export
  getStatistics: async (seminar_id?: string) => {
    const response = await adminApi.get('/admin/statistics', { 
      params: seminar_id ? { seminar_id } : {} 
    });
    return response.data;
  },
  exportRegistrations: async (seminar_id?: string) => {
    const response = await adminApi.get('/admin/export-registrations', {
      params: seminar_id ? { seminar_id } : {},
      responseType: 'blob'
    });
    return response.data;
  },

  // Contact Info
  getContactInfo: async () => {
    const response = await adminApi.get('/admin/contact-info');
    return response.data;
  },
  updateContactInfo: async (data: any) => {
    const response = await adminApi.put('/admin/contact-info', data);
    return response.data;
  },

  // Membership Form Config
  getMembershipFormConfig: async () => {
    const response = await adminApi.get('/admin/membership-form-config');
    return response.data;
  },
  updateMembershipFormConfig: async (data: any) => {
    const response = await adminApi.put('/admin/membership-form-config', data);
    return response.data;
  },

  // Offline Forms Config
  getOfflineFormsConfig: async () => {
    const response = await adminApi.get('/admin/offline-forms-config');
    return response.data;
  },
  updateOfflineFormsConfig: async (data: any) => {
    const response = await adminApi.put('/admin/offline-forms-config', data);
    return response.data;
  },

  // Gallery Management
  getGalleryItems: async () => {
    const response = await adminApi.get('/admin/gallery');
    return response.data;
  },
  createGalleryItem: async (data: any) => {
    const response = await adminApi.post('/admin/gallery', data);
    return response.data;
  },
  updateGalleryItem: async (id: number, data: any) => {
    const response = await adminApi.put(`/admin/gallery/${id}`, data);
    return response.data;
  },
  deleteGalleryItem: async (id: number) => {
    const response = await adminApi.delete(`/admin/gallery/${id}`);
    return response.data;
  },

  // Membership Management
  getAllMembers: async () => {
    const response = await adminApi.get('/admin/members');
    return response.data;
  },
  updateMembershipDetails: async (id: string, data: any) => {
    const response = await adminApi.put(`/admin/members/${id}`, data);
    return response.data;
  },

  // Certificate Management
  uploadCertificate: async (formData: FormData) => {
    const response = await adminApi.post('/admin/certificates/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default api;
