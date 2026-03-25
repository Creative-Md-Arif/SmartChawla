const {
  sendEmail,
  getEmailTemplate,
  sender,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentVerifiedEmail,
  sendCourseAccessEmail,
} = require('./sendEmail');

const {
  uploadImage,
  uploadVideo,
  deleteFile,
  deleteMultipleFiles,
  generateSignedUrl,
  getOptimizedUrl,
  generateThumbnail,
  getVideoDuration,
  uploadWithProgress,
} = require('./cloudinaryHelper');

const { AppError, asyncHandler, globalErrorHandler, notFound } = require('./errorHandler');

module.exports = {
  // Email
  sendEmail,
  getEmailTemplate,
  sender,
  sendWelcomeEmail,
  sendOrderConfirmationEmail,
  sendPaymentVerifiedEmail,
  sendCourseAccessEmail,

  // Cloudinary
  uploadImage,
  uploadVideo,
  deleteFile,
  deleteMultipleFiles,
  generateSignedUrl,
  getOptimizedUrl,
  generateThumbnail,
  getVideoDuration,
  uploadWithProgress,

  // Error Handler
  AppError,
  asyncHandler,
  globalErrorHandler,
  notFound,
};
