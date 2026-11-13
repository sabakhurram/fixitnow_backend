const express = require('express');
const router = express.Router();
const { verifyFirebaseToken, verifyAdmin } = require('../middleware/auth');
const { assignTechnicianToService } = require('../controllers/technicianController');

// Admin-only assignment route
router.put('/:type/:id/assign', verifyFirebaseToken, verifyAdmin, assignTechnicianToService);

module.exports = router;
