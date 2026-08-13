const express = require("express");
const router = express.Router();

const {
    getProducts,
    getPublicProducts,
     getPublicProductById,
    createProduct,
        updateProduct,
        deleteProduct
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
router.get(
    "/public/:id",
    getPublicProductById
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

// Update product
router.put(
    "/:id",
    verifyFirebaseToken,
    verifyAdmin,
    updateProduct
    
);
// Delete product

router.delete(
    "/:id",
    verifyFirebaseToken,
    verifyAdmin,
    deleteProduct
);

module.exports = router;
