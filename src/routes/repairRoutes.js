const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { createRepair } = require('../controllers/repairController');

router.use(verifyFirebaseToken);

router.post('/', createRepair);

module.exports = router;