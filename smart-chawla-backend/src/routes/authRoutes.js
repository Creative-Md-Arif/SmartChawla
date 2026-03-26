const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');
const { uploadSingle } = require('../middlewares/upload');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password/:token', authController.resetPassword);

router.post("/verify-otp", authController.verifyEmailWithOTP);
router.post("/resend-otp", authController.resendOTP);


router.post('/refresh-token', authController.refreshToken);

// Protected routes
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);
router.patch(
  "/update-profile",
  authenticate,
  uploadSingle("avatar", "image", { maxSize: 2 * 1024 * 1024 }),
  authController.updateProfile,
);


router.post("/addresses", authenticate, authController.addAddress);
router.put("/addresses/:id", authenticate, authController.updateAddress);
router.delete("/addresses/:id", authenticate, authController.deleteAddress);

router.patch('/change-password', authenticate, authController.changePassword);

router.post("/resend-verification", authenticate, authController.resendOTP);

module.exports = router;
