const express = require('express');
const router = express.Router();
const { verifyFirebaseToken } = require('../middleware/auth');
const {
 createRepair,
 getRepairs
}=require("../controllers/repairController");

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
module.exports = router;