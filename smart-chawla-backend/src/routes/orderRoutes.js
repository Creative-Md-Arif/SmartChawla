const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/adminMiddleware");
const { uploadSingle } = require("../middlewares/upload");

// ==========================================
// ✅ 1. ALL STATIC ROUTES FIRST (NO :id)
// ==========================================

// User routes
router.get("/my-orders", authenticate, orderController.getMyOrders);
router.post("/", authenticate, orderController.createOrder);

// 🔴 [MOVED UP] Admin static routes - MUST be before /:id
router.get(
  "/admin/pending",
  authenticate,
  authorize("admin"),
  orderController.getPendingOrders,
);

// 🔴 [ADDED] Get all orders for admin (for "All Orders" tab)
router.get(
  "/admin/all",
  authenticate,
  authorize("admin"),
  orderController.getAllOrders, // You need to create this controller
);

// ==========================================
// ✅ 2. DYNAMIC ROUTES WITH :id (LAST)
// ==========================================

// Get single order
router.get("/:id", authenticate, orderController.getOrderById);

// Cancel order
router.patch("/:id/cancel", authenticate, orderController.cancelOrder);

// Submit payment proof
router.patch(
  "/:id/payment-proof",
  authenticate,
  uploadSingle("screenshot"),
  orderController.submitPaymentProof,
);

// Verify payment
router.patch(
  "/:id/verify",
  authenticate,
  authorize("admin"),
  orderController.verifyPayment,
);

// Reject payment
router.patch(
  "/:id/reject",
  authenticate,
  authorize("admin"),
  orderController.rejectPayment,
);

// Generic status update (Processing)
router.patch(
  "/:id/status",
  authenticate,
  authorize("admin"),
  orderController.updateStatus,
);

// Ship order
router.patch(
  "/:id/ship",
  authenticate,
  authorize("admin"),
  orderController.shipOrder,
);

// Deliver order
router.patch(
  "/:id/deliver",
  authenticate,
  authorize("admin"),
  orderController.deliverOrder,
);

// Complete order
router.patch(
  "/:id/complete",
  authenticate,
  authorize("admin"),
  orderController.completeOrder,
);

module.exports = router;
