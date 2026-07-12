const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { syncUser, getUserProfile } = require('../controllers/userController');

// All user routes require a verified Firebase Auth token
router.use(verifyFirebaseToken);

// POST /api/users/sync - Syncs authenticated user data with Supabase
router.post('/sync', syncUser);

// GET /api/users/profile - Retrieves user details by token UID
router.get('/profile', getUserProfile);

module.exports = router;
