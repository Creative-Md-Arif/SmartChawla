const { cloudinary, generateSignedUrl, getOptimizedUrl } = require('../config/cloudinary');

// Upload image to Cloudinary
const uploadImage = async (fileBuffer, options = {}) => {
  const {
    folder = 'smart-chawla/images',
    transformation = [],
    public_id,
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation,
        public_id,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Upload video to Cloudinary
const uploadVideo = async (fileBuffer, options = {}) => {
  const {
    folder = 'smart-chawla/videos',
    public_id,
    eager = [],
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id,
        resource_type: 'video',
        eager,
        eager_async: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};

// Delete file from Cloudinary
const deleteFile = async (publicId, options = {}) => {
  const { resource_type = 'image' } = options;

  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type,
    });
    return result;
  } catch (error) {
    console.error('Error deleting file from Cloudinary:', error);
    throw error;
  }
};

// Delete multiple files
const deleteMultipleFiles = async (publicIds, options = {}) => {
  const { resource_type = 'image' } = options;

  try {
    const result = await cloudinary.api.delete_resources(publicIds, {
      resource_type,
    });
    return result;
  } catch (error) {
    console.error('Error deleting files from Cloudinary:', error);
    throw error;
  }
};

// Generate thumbnail from video
const generateThumbnail = async (publicId, options = {}) => {
  const { width = 300, height = 200, time = '00:00:01' } = options;

  return cloudinary.url(publicId, {
    resource_type: 'video',
    transformation: [
      { width, height, crop: 'fill' },
      { start_offset: time },
    ],
  });
};

// Get video duration
const getVideoDuration = async (publicId) => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: 'video',
    });
    return result.duration;
  } catch (error) {
    console.error('Error getting video duration:', error);
    return 0;
  }
};

// Upload with progress tracking
const uploadWithProgress = async (fileBuffer, options = {}, onProgress) => {
  const { folder = 'smart-chawla/uploads', resource_type = 'auto' } = options;

  return new Promise((resolve, reject) => {
    let uploadedBytes = 0;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    // Simulate progress (Cloudinary doesn't provide real-time progress)
    const totalBytes = fileBuffer.length;
    const chunkSize = 64 * 1024; // 64KB chunks
    let offset = 0;

    const writeChunk = () => {
      const chunk = fileBuffer.slice(offset, offset + chunkSize);
      if (chunk.length > 0) {
        uploadStream.write(chunk);
        uploadedBytes += chunk.length;
        offset += chunkSize;

        if (onProgress) {
          onProgress({
            loaded: uploadedBytes,
            total: totalBytes,
            percentage: Math.round((uploadedBytes / totalBytes) * 100),
          });
        }

        setImmediate(writeChunk);
      } else {
        uploadStream.end();
      }
    };

    writeChunk();
  });
};

module.exports = {
  uploadImage,
  uploadVideo,
  deleteFile,
  deleteMultipleFiles,
  generateSignedUrl,
  getOptimizedUrl,
  generateThumbnail,
  getVideoDuration,
  uploadWithProgress,
};
