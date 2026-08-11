const express = require('express');
const router = express.Router();
const {
    verifyFirebaseToken,
    verifyAdmin
} = require('../middleware/auth');
const { createAmcContract, getAMCs,    getAllAMCContracts } = require('../controllers/amcController');
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
module.exports = router;