const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const { createAmcContract, getAMCs } = require('../controllers/amcController');
router.use(verifyFirebaseToken);

router.post('/', createAmcContract);
router.get(
 "/",
 verifyFirebaseToken,
 getAMCs
);

module.exports = router;