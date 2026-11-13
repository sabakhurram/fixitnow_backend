const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, verifyTechnician } = require('../middleware/auth');
const {
  getAssignedServices,
  updateAssignedServiceStatus,
  getTechnicianCustomers,
  sendServiceReminder,
  getTechnicianDashboardStats,
  getTechnicianReviews
} = require('../controllers/technicianController');

// All technician routes require Firebase Auth token + Technician/Admin role
router.use(verifyFirebaseToken);
router.use(verifyTechnician);

// Feature 1, 3, 6: Assigned services with sorting, filtering, searching
router.get('/assigned-services', getAssignedServices);

// Feature 3: Status tracking (In Progress, Completed with resolution notes and parts)
router.patch('/services/:type/:id/status', updateAssignedServiceStatus);

// Feature 2: Own customers list with details
router.get('/customers', getTechnicianCustomers);

// Feature 4: Reminder emails to existing customers
router.post('/reminders/send', sendServiceReminder);

// Feature 5: Dashboard stats & completed service history
router.get('/dashboard-stats', getTechnicianDashboardStats);

// Feature 7: Customer reviews for technician
router.get('/my-reviews', getTechnicianReviews);

module.exports = router;
