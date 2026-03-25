const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/adminMiddleware');

// All routes require admin authentication
router.use(authenticate, authorize('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboardStats);

// User management
router.get('/users', adminController.getAllUsers);
router.get("/users/:id", adminController.getUserById);
router.patch("/users/:id", adminController.updateUser);
router.patch('/users/:id/role', adminController.updateUserRole);
router.patch("/users/:id/toggle-status", adminController.toggleUserStatus);
router.delete("/users/:id", adminController.deleteUser);

// Reports
router.get('/sales-report', adminController.getSalesReport);
router.get('/inventory-alerts', adminController.getInventoryAlerts);
router.get('/activities', adminController.getRecentActivities);

// Notifications
router.post('/notifications/send', adminController.sendNotification);

module.exports = router;
