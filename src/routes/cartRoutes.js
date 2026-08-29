const express = require("express");

const {
    getCart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart
} = require("../controllers/CartController");

const {
    verifyFirebaseToken
} = require("../middleware/auth");

const router = express.Router();

router.get(
    "/",
    verifyFirebaseToken,
    getCart
);

router.post(
    "/",
    verifyFirebaseToken,
    addToCart
);

router.put(
    "/:productId",
    verifyFirebaseToken,
    updateCartQuantity
);

router.delete(
    "/:productId",
    verifyFirebaseToken,
    removeFromCart
);

router.delete(
    "/",
    verifyFirebaseToken,
    clearCart
);

module.exports = router;