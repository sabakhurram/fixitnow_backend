const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { createAmcContract } = require('../controllers/amcController');

router.use(verifyFirebaseToken);

router.post('/', createAmcContract);

module.exports = router;