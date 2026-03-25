// middlewares/upload.js
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Temp directory
const tempDir = path.join(os.tmpdir(), "smart-chawla-uploads");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Disk storage for all files (safer for large files)
const storage = multer.diskStorage({
  destination: (req, file, cb) => { 
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(
      null,
      `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`,
    );
  },
});

// File filter
const fileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(`File type not allowed. Allowed: ${allowedTypes.join(", ")}`),
        false,
      );
    }
  };
};

// Upload configurations
const uploadConfigs = {
  image: {
    types: [".jpg", ".jpeg", ".png", ".webp", ".gif"],
    maxSize: 10 * 1024 * 1024, // 10MB
  },
  video: {
    types: [".mp4", ".mov", ".avi", ".mkv", ".webm", ".flv"],
    maxSize: 2000 * 1024 * 1024, // 2GB
  },
};

// Single file upload
exports.uploadSingle = (fieldName, type = "image") => {
  const config = uploadConfigs[type];
  return multer({
    storage,
    limits: { fileSize: config.maxSize },
    fileFilter: fileFilter(config.types),
  }).single(fieldName);
};

// Multiple files upload
exports.uploadMultiple = (fieldName, maxCount = 5, type = "image") => {
  const config = uploadConfigs[type];
  return multer({
    storage,
    limits: { fileSize: config.maxSize },
    fileFilter: fileFilter(config.types),
  }).array(fieldName, maxCount);
};


// Multiple fields upload (for course create/update)
exports.uploadFields = (fieldsConfig) => {
  const multerFields = fieldsConfig.map((field) => ({
    name: field.name,
    maxCount: field.maxCount || 1,
  }));

  const upload = multer({
    storage,
    limits: {
      fileSize: 2000 * 1024 * 1024, // 2GB max per file
      files: 60,
      fields: 100,
    },
    fileFilter: (req, file, cb) => {
      const fieldConfig = fieldsConfig.find((f) => f.name === file.fieldname);
      if (!fieldConfig) {
        return cb(new Error(`Unknown field: ${file.fieldname}`), false);
      }
      const config = uploadConfigs[fieldConfig.type];
      const ext = path.extname(file.originalname).toLowerCase();
      if (config.types.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error(`${file.fieldname}: Invalid file type ${ext}. Allowed: ${config.types.join(", ")}`), false);
      }
    },
  }).fields(multerFields);

  // ✅ FIXED: Error handling wrapper
  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        // Multer-specific error
        console.error("Multer error:", err.message, err.code);
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({ success: false, message: "File too large" });
        }
        return res.status(400).json({ success: false, message: err.message });
      } else if (err) {
        // Custom error
        console.error("Upload error:", err.message);
        return res.status(400).json({ success: false, message: err.message });
      }
      
      // ✅ Success - log for debug
      console.log("Multer success. Files:", req.files ? Object.keys(req.files) : "NONE");
      if (req.files?.lessonVideos) {
        const lv = Array.isArray(req.files.lessonVideos) ? req.files.lessonVideos : [req.files.lessonVideos];
        console.log("lessonVideos count:", lv.length);
      }
      
      next();
    });
  };
};




// Cleanup helper
exports.cleanupFiles = (files) => {
  if (!files) return;
  const filesArray = Array.isArray(files) ? files : [files];
  filesArray.forEach((file) => {
    if (file?.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (err) {
        console.error("Cleanup error:", err);
      }
    }
  });
};
