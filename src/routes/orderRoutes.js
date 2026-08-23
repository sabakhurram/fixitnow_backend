const express = require("express");
const router = express.Router();

const {
    createOrder,
    getUserOrders,
    getAdminOrders,
    updateOrderStatus
} = require("../controllers/orderController");

const {
    verifyFirebaseToken,
    verifyAdmin
} = require("../middleware/auth");

// Customer routes (authenticated)
router.post("/", verifyFirebaseToken, createOrder);
router.get("/", verifyFirebaseToken, getUserOrders);

// Admin routes (admin verified)
router.get("/admin", verifyFirebaseToken, verifyAdmin, getAdminOrders);
router.put("/admin/:id/status", verifyFirebaseToken, verifyAdmin, updateOrderStatus);

module.exports = router;
