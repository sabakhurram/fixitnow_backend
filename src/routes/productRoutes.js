const express = require("express");
const router = express.Router();

const {
    getProducts,
    getPublicProducts,
    createProduct
} = require("../controllers/productController");

const {
    verifyFirebaseToken,
    verifyAdmin
} = require("../middleware/auth");


// Public products
router.get(
    "/public",
    getPublicProducts
);


// Admin products
router.get(
    "/",
    verifyFirebaseToken,
    verifyAdmin,
    getProducts
);
// Create product
router.post(
    "/",
    verifyFirebaseToken,
    verifyAdmin,
    createProduct
);


module.exports = router;
