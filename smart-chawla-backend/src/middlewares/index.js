const { authenticate, optionalAuth } = require('./authMiddleware');
const { authorize, protect } = require("./adminMiddleware");
const { uploadSingle, uploadMultiple, uploadFields, handleUploadError } = require('./upload');
const { setupSecurity, corsOptions } = require("./security");

module.exports = {
  authenticate,
  optionalAuth,
  authorize,
  protect,
  uploadSingle,
  uploadMultiple,
  uploadFields,
  handleUploadError,
  setupSecurity,
  corsOptions,
};
