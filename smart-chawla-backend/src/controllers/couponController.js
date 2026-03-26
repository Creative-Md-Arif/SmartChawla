const Coupon = require('../models/couponModel');
const Order = require('../models/orderModel');
const { AppError } = require("../utils/errorHandler");

// Create coupon
exports.createCoupon = async (req, res, next) => {
  try {
    const couponData = { ...req.body };

    // Auto-generate code if not provided
    if (!couponData.code) {
      const prefix = 'SC';
      const random = Math.random().toString(36).substring(2, 8).toUpperCase();
      couponData.code = `${prefix}${random}`;
    }

    // Convert code to uppercase
    couponData.code = couponData.code.toUpperCase();

    const coupon = await Coupon.create(couponData);

    res.status(201).json({
      success: true,
      coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Coupon code already exists', 400));
    }
    next(error);
  }
};

// Get all coupons (admin)
exports.getAllCoupons = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;

    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const coupons = await Coupon.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Coupon.countDocuments(query);

    res.status(200).json({
      success: true,
      coupons,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get coupon by code
exports.getCouponByCode = async (req, res, next) => {
  try {
    const { code } = req.params;

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Update coupon
exports.updateCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = updateData.code.toUpperCase();
    }

    const coupon = await Coupon.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError('Coupon code already exists', 400));
    }
    next(error);
  }
};

// Delete coupon
exports.deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    await coupon.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Coupon deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Validate coupon (public)
exports.validateCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, items } = req.query;
    const userId = req.user?.id;

    if (!code) {
      return next(new AppError('Coupon code is required', 400));
    }

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
     return next(new AppError("Invalid coupon code", 404));
    }

    if (!coupon.isValid()) {
      return next(
        new AppError("Coupon has expired or is no longer active", 400),
      );
    }

    if (userId) {
      const orderCount = await Order.countDocuments({
        user: userId,
        status: { $in: ['Verified', 'Completed'] },
      });

      const userCheck = coupon.canUserUse(userId, orderCount);
      if (!userCheck.valid) {
        return next(new AppError(userCheck.reason, 400));
      }
    }

    // Calculate discount if subtotal provided
    let discountResult = null;
    if (subtotal) {
      discountResult = coupon.calculateDiscount(Number(subtotal), items ? JSON.parse(items) : []);
    }

    res.status(200).json({
      success: true,
      valid: true,
      coupon: {
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        description: coupon.description,
      },
      discount: discountResult,
    });
  } catch (error) {
    next(error);
  }
};

// Apply coupon
exports.applyCoupon = async (req, res, next) => {
  try {
    const { code, subtotal, items } = req.body;
    const userId = req.user.id;

    const orderCount = await Order.countDocuments({
      user: userId,
      status: { $in: ["Verified", "Completed"] },
    });

    const result = await Coupon.validateAndApply(
      code,
      userId,
      subtotal,
      items,
      orderCount,
    );

    if (!result.valid) {
      return next(new AppError(result.reason, 400));
    }


    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    await coupon.applyUsage(userId);
    res.status(200).json({
      success: true,
      valid: true,
      discount: result.discount,
      discountType: result.discountType,
      discountValue: result.discountValue,
      couponCode: result.couponCode,
      finalAmount: subtotal - result.discount,
    });
  } catch (error) {
    next(error);
  }
};

// Get user's coupons
exports.getUserCoupons = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Get coupons that user has used
    const usedCoupons = await Coupon.find({
      'usedBy.user': userId,
    }).select('code discountType discountValue description validUntil');

    // Get available coupons for user
    const now = new Date();
    const availableCoupons = await Coupon.find({
      status: 'active',
      validFrom: { $lte: now },
      validUntil: { $gte: now },
      $or: [
        { usageLimit: null },
        { $expr: { $lt: ['$usedCount', '$usageLimit'] } },
      ],
      'usedBy.user': { $ne: userId },
    }).select('code discountType discountValue description validUntil minPurchase');

    res.status(200).json({
      success: true,
      usedCoupons,
      availableCoupons,
    });
  } catch (error) {
    next(error);
  }
};

// Get coupon usage stats
exports.getCouponStats = async (req, res, next) => {
  try {
    const { id } = req.params;

    const coupon = await Coupon.findById(id);

    if (!coupon) {
      return next(new AppError('Coupon not found', 404));
    }

    // Get orders that used this coupon
    const orders = await Order.find({ couponCode: coupon.code })
      .populate('user', 'fullName email')
      .sort('-createdAt')
      .limit(50);

    res.status(200).json({
      success: true,
      stats: {
        totalUses: coupon.usedCount,
        usageLimit: coupon.usageLimit,
        remainingUses: coupon.remainingUses,
        totalDiscountGiven: orders.reduce((sum, o) => sum + o.discountAmount, 0),
      },
      recentOrders: orders,
    });
  } catch (error) {
    next(error);
  }
};
