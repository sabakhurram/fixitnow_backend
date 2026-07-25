const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { createInspection } = require('../controllers/inspectionController');

// All inspection routes require a verified Firebase Auth token
router.use(verifyFirebaseToken);

// POST /api/inspections - Creates a new inspection request
router.post('/', createInspection);

module.exports = router;