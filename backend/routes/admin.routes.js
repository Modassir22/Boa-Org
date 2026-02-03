const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const certificateController = require('../controllers/certificate.controller');
const adminAuth = require('../middleware/admin-auth.middleware');
const upload = require('../middleware/upload.middleware');

// Seminars CRUD
router.get('/seminars', adminAuth, adminController.getAllSeminarsAdmin);
router.post('/seminars', adminAuth, adminController.createSeminar);
router.put('/seminars/:id', adminAuth, adminController.updateSeminar);
router.delete('/seminars/:id', adminAuth, adminController.deleteSeminar);

// Users CRUD
router.get('/users', adminAuth, adminController.getAllUsers);
router.get('/users/:id/details', adminAuth, adminController.getUserDetails);
router.get('/users/:id/export', adminAuth, adminController.exportUserDetails);
router.get('/users/export-all', adminAuth, adminController.exportAllUsers);
router.delete('/users/:id', adminAuth, adminController.deleteUser);

// Registrations CRUD
router.get('/registrations', adminAuth, adminController.getAllRegistrations);
router.put('/registrations/:id/status', adminAuth, adminController.updateRegistrationStatus);
router.delete('/registrations/:id', adminAuth, adminController.deleteRegistration);

// Notifications CRUD
router.post('/notifications', adminAuth, adminController.createNotification);
router.put('/notifications/:id', adminAuth, adminController.updateNotification);
router.delete('/notifications/:id', adminAuth, adminController.deleteNotification);

// Fee Structure CRUD
router.get('/fee-structure/:seminar_id', adminAuth, adminController.getFeeStructure);
router.post('/fee-categories', adminAuth, adminController.createFeeCategory);
router.put('/fee-categories/:id', adminAuth, adminController.updateFeeCategory);
router.delete('/fee-categories/:id', adminAuth, adminController.deleteFeeCategory);
router.post('/fee-slabs', adminAuth, adminController.createFeeSlab);
router.put('/fee-slabs/:id', adminAuth, adminController.updateFeeSlab);
router.delete('/fee-slabs/:id', adminAuth, adminController.deleteFeeSlab);
router.post('/fee-amount', adminAuth, adminController.updateFeeAmount);

// Export registrations to Excel
router.get('/export-registrations', adminAuth, adminController.exportRegistrations);

// Get statistics
router.get('/statistics', adminAuth, adminController.getStatistics);

// Import offline user
router.post('/import-offline-user', adminAuth, adminController.importOfflineUser);

// Committee Members CRUD
router.get('/committee-members', adminAuth, adminController.getAllCommitteeMembers);
router.post('/committee-members', adminAuth, adminController.createCommitteeMember);
router.put('/committee-members/:id', adminAuth, adminController.updateCommitteeMember);
router.delete('/committee-members/:id', adminAuth, adminController.deleteCommitteeMember);

// Delegate Categories CRUD
router.get('/delegate-categories/:seminar_id', adminAuth, adminController.getDelegateCategories);
router.post('/delegate-categories', adminAuth, adminController.createDelegateCategory);
router.put('/delegate-categories/:id', adminAuth, adminController.updateDelegateCategory);
router.delete('/delegate-categories/:id', adminAuth, adminController.deleteDelegateCategory);

// Certification CRUD
router.get('/certification', adminAuth, adminController.getCertification);
router.put('/certification', adminAuth, adminController.updateCertification);
router.post('/certification/upload-image', adminAuth, upload.single('image'), adminController.uploadCertificateImage);

// Certificate Management
router.post('/certificates/upload', adminAuth, upload.single('certificate'), certificateController.uploadMemberCertificate);

// Upcoming Events CRUD
router.get('/upcoming-events', adminAuth, adminController.getAllUpcomingEvents);
router.post('/upcoming-events', adminAuth, adminController.createUpcomingEvent);
router.put('/upcoming-events/:id', adminAuth, adminController.updateUpcomingEvent);
router.delete('/upcoming-events/:id', adminAuth, adminController.deleteUpcomingEvent);

// Contact Info CRUD
router.get('/contact-info', adminAuth, adminController.getContactInfo);
router.put('/contact-info', adminAuth, adminController.updateContactInfo);

// Site Configuration
router.get('/site-config', adminAuth, adminController.getSiteConfig);
router.put('/site-config', adminAuth, adminController.updateSiteConfig);

// Membership Form Configuration
router.get('/membership-form-config', adminAuth, adminController.getMembershipFormConfig);
router.put('/membership-form-config', adminAuth, adminController.updateMembershipFormConfig);

// Offline Forms Configuration
router.get('/offline-forms-config', adminAuth, adminController.getOfflineFormsConfig);
router.put('/offline-forms-config', adminAuth, adminController.updateOfflineFormsConfig);

// Gallery Management
router.get('/gallery', adminAuth, adminController.getGalleryItems);
router.post('/gallery', adminAuth, adminController.createGalleryItem);
router.put('/gallery/:id', adminAuth, adminController.updateGalleryItem);
router.delete('/gallery/:id', adminAuth, adminController.deleteGalleryItem);

// Membership Categories Management
router.get('/membership-categories', adminAuth, adminController.getMembershipCategories);
router.post('/membership-categories', adminAuth, adminController.createMembershipCategory);
router.put('/membership-categories/:id', adminAuth, adminController.updateMembershipCategory);
router.delete('/membership-categories/:id', adminAuth, adminController.deleteMembershipCategory);

// Membership Management
router.get('/members', adminAuth, adminController.getAllMembers);
router.post('/members/offline', adminAuth, adminController.addOfflineMembership);
router.put('/members/:id', adminAuth, adminController.updateMembershipDetails);
router.get('/check-membership-availability', adminAuth, adminController.checkMembershipAvailability);
router.get('/export-members', adminAuth, adminController.exportMembers);

// Membership-specific operations
router.delete('/members/:id/membership', adminAuth, adminController.deleteMembership);
router.put('/members/:id/toggle-status', adminAuth, adminController.toggleMembershipStatus);
router.put('/members/:id/status', adminAuth, adminController.updateMembershipStatus);

// Resources Management
router.get('/resources', adminAuth, adminController.getResources);
router.post('/resources', adminAuth, adminController.createResource);
router.put('/resources/:id', adminAuth, adminController.updateResource);
router.delete('/resources/:id', adminAuth, adminController.deleteResource);

// All Payments
router.get('/payments/all', adminAuth, adminController.getAllPayments);
router.get('/payments/latest', adminAuth, adminController.getLatestPayments);
router.get('/payments/export-all', adminAuth, adminController.exportAllPayments);
router.get('/payments/:id/details', adminAuth, adminController.getPaymentDetails);
router.get('/payments/:id/pdf', adminAuth, adminController.downloadPaymentPDF);
router.delete('/payments/:id', adminAuth, adminController.deletePayment);

// Testimonials Management
router.get('/testimonials', adminAuth, adminController.getAllTestimonials);
router.post('/testimonials', adminAuth, adminController.createTestimonial);
router.put('/testimonials/:id', adminAuth, adminController.updateTestimonial);
router.delete('/testimonials/:id', adminAuth, adminController.deleteTestimonial);
router.put('/testimonials/:id/toggle-active', adminAuth, adminController.toggleTestimonialActive);

// News Management
router.get('/news', adminAuth, adminController.getAllNews);
router.post('/news', adminAuth, upload.single('image'), adminController.createNews);
router.put('/news/:id', adminAuth, upload.single('image'), adminController.updateNews);
router.delete('/news/:id', adminAuth, adminController.deleteNews);
router.put('/news/:id/toggle-status', adminAuth, adminController.toggleNewsStatus);

// Gallery Images Management
router.get('/gallery-images', adminAuth, adminController.getAllGalleryImages);
router.post('/gallery-images', adminAuth, upload.single('image'), adminController.createGalleryImage);
router.put('/gallery-images/:id', adminAuth, upload.single('image'), adminController.updateGalleryImage);
router.delete('/gallery-images/:id', adminAuth, adminController.deleteGalleryImage);
router.put('/gallery-images/:id/toggle-status', adminAuth, adminController.toggleGalleryImageStatus);

// Stats Management
const statsController = require('../controllers/stats.controller');
router.get('/stats', adminAuth, statsController.getAdminStats);
router.post('/stats', adminAuth, statsController.createStat);
router.put('/stats/:id', adminAuth, statsController.updateStat);
router.delete('/stats/:id', adminAuth, statsController.deleteStat);
router.put('/stats/:id/toggle-status', adminAuth, statsController.toggleStatStatus);

module.exports = router;
