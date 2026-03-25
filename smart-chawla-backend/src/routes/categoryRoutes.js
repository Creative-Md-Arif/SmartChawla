const express = require("express");
const router = express.Router();
const categoryController = require("../controllers/categoryController");
const { authenticate } = require("../middlewares/authMiddleware");
const { authorize } = require("../middlewares/adminMiddleware");
const { uploadSingle } = require("../middlewares/upload");

// ==========================================
// Admin routes (Specific routes first)
// ==========================================
router.post(
  "/reorder",
  authenticate,
  authorize("admin"),
  categoryController.reorderCategories,
);

// ==========================================
// Public routes - Order matters!
// ==========================================

// 1. Static/specific routes first
router.get("/tree", categoryController.getCategoryTree);

// 2. Dynamic routes with specific patterns
router.get("/:slug/products", categoryController.getProductsByCategory);
router.get("/:slug/courses", categoryController.getCoursesByCategory);

// 3. Generic dynamic routes last
router.get("/:slug", categoryController.getCategoryBySlug);
router.get("/", categoryController.getAllCategories);

// ==========================================
// Admin routes for CRUD (Protected)
// ==========================================
router.post(
  "/",
  authenticate,
  authorize("admin"),
  uploadSingle("image"),
  categoryController.createCategory,
);
router.patch(
  "/:id",
  authenticate,
  authorize("admin"),
  uploadSingle("image"),
  categoryController.updateCategory,
);
router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  categoryController.deleteCategory,
);

module.exports = router;
