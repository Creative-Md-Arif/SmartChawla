const express = require('express');
const router = express.Router();
const bannerController = require('../controllers/bannerController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/adminMiddleware');
const { uploadSingle } = require('../middlewares/upload');

// Public routes
router.get('/active', bannerController.getActiveBanners);
router.get('/position/:position', bannerController.getBannersByPosition);
router.post(
  "/schedule-check",
  authenticate,
  authorize("admin"),
  bannerController.scheduleCheck,
);
router.get(
  "/:id/analytics",
  authenticate,
  authorize("admin"),
  bannerController.getBannerAnalytics,
);


router.post('/:id/click', bannerController.incrementClickCount);

// Admin routes
router.get('/', authenticate, authorize('admin'), bannerController.getAllBanners);
router.post('/', authenticate, authorize('admin'), uploadSingle('image'), bannerController.createBanner);
router.post(
  "/:id/impression",
  authenticate,
  authorize("admin"),
  bannerController.incrementImpressionCount,
);
router.get('/:id', authenticate, authorize('admin'), bannerController.getBannerById);
router.patch('/:id', authenticate, authorize('admin'), uploadSingle('image'), bannerController.updateBanner);
router.delete('/:id', authenticate, authorize('admin'), bannerController.deleteBanner);



module.exports = router;
