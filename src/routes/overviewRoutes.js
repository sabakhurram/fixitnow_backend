const express = require("express");
const router = express.Router();

const {
    verifyFirebaseToken,
    verifyAdmin
} = require("../middleware/auth");

const {
    getOverview
} = require("../controllers/overviewController");


// All overview routes require Firebase authentication
router.use(verifyFirebaseToken);


// Admin-only overview
router.get(
    "/",
    verifyAdmin,
    getOverview
);


module.exports = router;