
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
const upload = require("../middleware/cloudinaryUpload");

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
    upload.single("image"),
    createProduct
);

// Update product
router.put(
    "/:id",
    verifyFirebaseToken,
    verifyAdmin,
       upload.single("image"),
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
