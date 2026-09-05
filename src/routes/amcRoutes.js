const express = require('express');
const router = express.Router();
const {
    verifyFirebaseToken,
    verifyAdmin
} = require('../middleware/auth');
const { createAmcContract, getAMCs, getAllAMCContracts, updateAMCStatus } = require('../controllers/amcController');
router.use(verifyFirebaseToken);

router.post('/', createAmcContract);
router.get(
 "/",
 verifyFirebaseToken,
 getAMCs
);
router.get(
    "/admin",
    verifyAdmin,
    getAllAMCContracts
);
router.put(
    "/admin/:id/status",
    verifyAdmin,
    updateAMCStatus
);
module.exports = router;