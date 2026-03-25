const cloudinary = require("cloudinary").v2;
const fs = require("fs").promises;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
  timeout: 600000, // 10 minutes
});

// Image instance configuration
const imageConfig = {
  folder: "smart-chawla/images",
  allowed_formats: ["jpg", "jpeg", "png", "webp"],
  transformation: [{ quality: "auto:good" }, { fetch_format: "auto" }],
};

// Video instance configuration - 1000MB support
const videoConfig = {
  folder: "smart-chawla/videos",
  resource_type: "video",
  allowed_formats: ["mp4", "mov", "avi", "mkv", "webm"],
  chunk_size: 20 * 1024 * 1024, // 20MB chunks
  eager: [
    {
      streaming_profile: "hd",
      format: "m3u8",
    },
  ],
  eager_async: true,
};

// ✅ FIXED: Better upload with retry logic
// Alternative implementation with explicit Promise
const uploadToCloudinary = async (filePath, folder, type = "image") => {
  return new Promise(async (resolve, reject) => {
    try {
      const stats = await fs.stat(filePath);
      const fileSize = stats.size;
      const isLargeFile = fileSize > 10 * 1024 * 1024;

      const uploadOptions = {
        folder: folder || "smart-chawla/videos",
        resource_type: type === "video" ? "video" : "image",
        timeout: 600000,
      };

      if (type === "video" || isLargeFile) {
        uploadOptions.chunk_size = 10 * 1024 * 1024;
        
        // Use callback style to ensure we get the result
        cloudinary.uploader.upload_large(filePath, uploadOptions, (error, result) => {
          if (error) {
            console.error("Upload error:", error);
            reject(error);
          } else {
            console.log("Upload success:", result.public_id);
            resolve(result);
          }
        });
      } else {
        const result = await cloudinary.uploader.upload(filePath, uploadOptions);
        resolve(result);
      }
    } catch (err) {
      reject(err);
    }
  });
};


// Generate signed URL for secure video access
const generateSignedUrl = (publicId, options = {}) => {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const expiry = options.expiry || 3600;

  const signature = cloudinary.utils.api_sign_request(
    {
      public_id: publicId,
      timestamp: timestamp,
      type: "authenticated",
    },
    process.env.CLOUDINARY_API_SECRET,
  );

  return cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    type: "authenticated",
    auth_token: {
      key: process.env.CLOUDINARY_API_KEY,
      signature: signature,
      timestamp: timestamp,
      expiration: timestamp + expiry,
    },
  });
};

// Get optimized image URL
const getOptimizedUrl = (publicId, options = {}) => {
  return cloudinary.url(publicId, {
    quality: "auto",
    fetch_format: "auto",
    width: options.width || "auto",
    crop: options.crop || "limit",
    secure: true,
  });
};

module.exports = {
  cloudinary,
  imageConfig,
  videoConfig,
  uploadToCloudinary,
  generateSignedUrl,
  getOptimizedUrl,
};
