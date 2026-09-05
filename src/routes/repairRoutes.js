const express = require('express');
const router = express.Router();
const {
    verifyFirebaseToken,
    verifyAdmin
} = require('../middleware/auth');
const {
    createRepair,
    getRepairs,
    getAllRepairs,
    updateRepairStatus
} = require('../controllers/repairController');

router.use(verifyFirebaseToken);
const upload = require("../middleware/cloudinaryUpload");
router.post(
    "/",
    upload.fields([
        {
            name:"images",
            maxCount:5
        },
        {
            name:"video",
            maxCount:1
        }
    ]),
    createRepair
);
router.get(
 "/",
 verifyFirebaseToken,
 getRepairs
);
router.get(
    "/admin",
    verifyAdmin,
    getAllRepairs
);
router.put(
    "/admin/:id/status",
    verifyAdmin,
    updateRepairStatus
);
module.exports = router;