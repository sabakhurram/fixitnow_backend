const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, verifyAdmin } = require('../middleware/auth');
const {
  getNotifications,
  markNotificationAsRead,
  markAllAsRead,
  broadcastNotification
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(verifyFirebaseToken);

// Customer & Technician & Admin notification endpoints
router.get('/', getNotifications);
router.patch('/mark-all-read', markAllAsRead);
router.patch('/:id/read', markNotificationAsRead);

// Admin-only broadcasting
router.post('/broadcast', verifyAdmin, broadcastNotification);

module.exports = router;
