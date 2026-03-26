const Banner = require("../models/bannerModel");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary");
const { AppError } = require("../utils/errorHandler");
const { cleanupFiles } = require("../middlewares/upload");

// Create banner
exports.createBanner = async (req, res, next) => {
  try {
    const bannerData = { ...req.body };

    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "smart-chawla/images/banners",
          "image",
        );

        bannerData.image = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } finally {
        // Cleanup temp file
        cleanupFiles([req.file]);
      }
    } else {
      return next(new AppError("Banner image is required", 400));
    }

    const banner = await Banner.create(bannerData);

    res.status(201).json({
      success: true,
      banner,
    });
  } catch (error) {
    if (req.file?.path) cleanupTempFiles(req.file);
    next(error);
  }
};

exports.updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    const existingBanner = await Banner.findById(id);
    if (!existingBanner) {
      return next(new AppError("Banner not found", 404));
    }

    if (req.file) {
      if (existingBanner.image?.public_id) {
        await cloudinary.uploader.destroy(existingBanner.image.public_id);
      }

      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "smart-chawla/images/banners",
          "image",
        );

        updateData.image = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } finally {
        cleanupFiles([req.file]);
      }
    }

    const banner = await Banner.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    if (req.file?.path) cleanupTempFiles(req.file);
    next(error);
  }
};

// Get all banners (admin)
exports.getAllBanners = async (req, res, next) => {
  try {
    const { position, status } = req.query;

    const query = {};
    if (position) query.position = position;
    if (status) query.status = status;

    const banners = await Banner.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      banners,
    });
  } catch (error) {
    next(error);
  }
};

exports.getActiveBanners = async (req, res, next) => {
  try {
    const { position } = req.query;

    let banners;
    if (position) {
      banners = await Banner.getActiveByPosition(position);
    } else {
      banners = await Banner.getAllActive();
    }

    res.status(200).json({
      success: true,
      banners,
    });
  } catch (error) {
    next(error);
  }
};

exports.getBannerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return next(new AppError("Banner not found", 404));
    }

    res.status(200).json({
      success: true,
      banner,
    });
  } catch (error) {
    next(error);
  }
};

// Delete banner
exports.deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return next(new AppError("Banner not found", 404));
    }

    // Delete image from Cloudinary
    if (banner.image?.public_id) {
      await cloudinary.uploader.destroy(banner.image.public_id);
    }

    await banner.deleteOne();

    res.status(200).json({
      success: true,
      message: "Banner deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.incrementClickCount = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return next(new AppError("Banner not found", 404));
    }

    await banner.incrementClick();

    res.status(200).json({
      success: true,
      message: "Click counted",
    });
  } catch (error) {
    next(error);
  }
};

exports.incrementImpressionCount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const banner = await Banner.findById(id);
    if (!banner) return next(new AppError("Banner not found", 404));
    await banner.incrementImpression();
    res.status(200).json({ success: true, message: "Impression counted" });
  } catch (error) {
    next(error);
  }
};


exports.scheduleCheck = async (req, res, next) => {
  try {
    const now = new Date();

    // Activate banners that should be active now
    const activateResult = await Banner.updateMany(
      {
        status: "inactive",
        startDate: { $lte: now },
        endDate: { $gte: now },
      },
      { status: "active" },
    );

    // Deactivate expired banners
    const deactivateResult = await Banner.updateMany(
      {
        status: "active",
        $or: [{ startDate: { $gt: now } }, { endDate: { $lt: now } }],
      },
      { status: "inactive" },
    );

    res.status(200).json({
      success: true,
      activated: activateResult.modifiedCount,
      deactivated: deactivateResult.modifiedCount,
    });
  } catch (error) {
    next(error);
  }
};


// Get banners by position
exports.getBannersByPosition = async (req, res, next) => {
  try {
    const { position } = req.params;

    const banners = await Banner.getActiveByPosition(position);

    res.status(200).json({
      success: true,
      banners,
    });
  } catch (error) {
    next(error);
  }
};


// Get banner analytics
exports.getBannerAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;

    const banner = await Banner.findById(id);

    if (!banner) {
      return next(new AppError("Banner not found", 404));
    }

    res.status(200).json({
      success: true,
      analytics: {
        clickCount: banner.clickCount,
        impressionCount: banner.impressionCount,
        ctr: banner.ctr,
        daysRemaining: banner.daysRemaining,
      },
    });
  } catch (error) {
    next(error);
  }
};
