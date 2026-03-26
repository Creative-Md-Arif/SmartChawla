const express = require("express");
const router = express.Router();
const couponController = require("../controllers/couponController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/adminMiddleware");

router.get("/", couponController.getAllCoupons);

router.post("/apply", authenticate, couponController.applyCoupon);
router.get("/my-coupons", authenticate, couponController.getUserCoupons);

router.get(
  "/:id/stats",
  authenticate,
  authorize("admin"),
  couponController.getCouponStats,
);

// Get coupon by code (admin)
router.get(
  "/code/:code",
  authenticate,
  authorize("admin"),
  couponController.getCouponByCode,
);

// Get all coupons (with pagination, filter, search)
router.get(
  "/",
  authenticate,
  authorize("admin"),
  couponController.getAllCoupons,
);

// Create new coupon
router.post(
  "/",
  authenticate,
  authorize("admin"),
  couponController.createCoupon,
);

// Update coupon by ID
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  couponController.updateCoupon,
);

// Delete coupon by ID
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  couponController.deleteCoupon,
);

module.exports = router;
