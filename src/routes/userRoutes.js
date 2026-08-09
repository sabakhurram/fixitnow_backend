const express = require('express');
const router = express.Router();

const { verifyFirebaseToken,  verifyAdmin } = require('../middleware/auth');

const { 
  syncUser, 
  getUserProfile,
  checkAdminStatus,
getAllCustomers
} = require('../controllers/userController');


// All user routes require a verified Firebase Auth token
router.use(verifyFirebaseToken);


// POST /api/users/sync
router.post('/sync', syncUser);


// GET /api/users/profile
router.get('/profile', getUserProfile);


// GET /api/users/admin-check
router.get('/admin-check', checkAdminStatus);

router.get('/customers', verifyAdmin, getAllCustomers);


module.exports = router;