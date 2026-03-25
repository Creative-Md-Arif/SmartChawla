const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/adminMiddleware');
const { uploadMultiple } = require('../middlewares/upload');

// Public routes


router.get('/', productController.getAllProducts);
router.get("/featured", productController.getFeaturedProducts);
router.get('/search-suggestions', productController.searchProducts);
router.get('/:slug', productController.getProductBySlug);
router.post(
  "/:id/reviews",
  authenticate,
  uploadMultiple("images", 5),
  productController.addProductReview,
);

// Admin routes
router.post('/', authenticate, authorize('admin'), uploadMultiple('images', 5), productController.createProduct);
router.patch('/:id', authenticate, authorize('admin'), uploadMultiple('images', 5), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);
router.patch('/:id/stock', authenticate, authorize('admin'), productController.updateStock);

module.exports = router;
