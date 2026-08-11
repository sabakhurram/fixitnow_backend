const express = require('express');
const router = express.Router();
const {
    verifyFirebaseToken,
    verifyAdmin
} = require('../middleware/auth');
const {
    createInspection,
    getInspections,
    getAllInspections
} = require('../controllers/inspectionController');

// All inspection routes require a verified Firebase Auth token
router.use(verifyFirebaseToken);

// POST /api/inspections - Creates a new inspection request
const upload = require("../middleware/cloudinaryUpload");


router.post(
    "/",
    upload.single("media"),
    (req, res, next) => {

        console.log("FILE FROM CLOUDINARY:", req.file);
        console.log("BODY:", req.body);

        next();
    },
    createInspection
);
router.get(
 "/",
 verifyFirebaseToken,
 getInspections
);
router.get(
    "/admin",
    verifyAdmin,
    getAllInspections
);
module.exports = router;