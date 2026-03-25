const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon code'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    minPurchase: {
      type: Number,
      default: 0,
    },
    maxDiscount: {
      type: Number,
      default: null,
    },
    usageLimit: {
      type: Number,
      default: null,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    userUsageLimit: {
      type: Number,
      default: 1,
    },
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        count: {
          type: Number,
          default: 1,
        },
        lastUsed: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    applicableTo: {
      type: String,
      enum: ['all', 'product', 'course', 'specific'],
      default: 'all',
    },
    specificItems: {
      products: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
        },
      ],
      courses: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Course',
        },
      ],
      categories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
    },
    excludeSaleItems: {
      type: Boolean,
      default: false,
    },
    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'expired'],
      default: 'active',
    },
    autoApply: {
      type: Boolean,
      default: false,
    },
    showOnCart: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes

couponSchema.index({ status: 1 });
couponSchema.index({ validFrom: 1, validUntil: 1 });

// Check if coupon is valid
couponSchema.methods.isValid = function () {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.validFrom &&
    now <= this.validUntil &&
    (this.usageLimit === null || this.usedCount < this.usageLimit)
  );
};

// Check if user can use this coupon
couponSchema.methods.canUserUse = function (userId, orderCount = 0) {
  // Check first order only
  if (this.firstOrderOnly && orderCount > 0) {
    return { valid: false, reason: 'This coupon is valid for first order only' };
  }

  // Check user usage limit
  const userUsage = this.usedBy.find(
    (u) => u.user && u.user.toString() === userId.toString()
  );

  if (userUsage && userUsage.count >= this.userUsageLimit) {
    return {
      valid: false,
      reason: `You have already used this coupon ${this.userUsageLimit} time(s)`,
    };
  }

  return { valid: true };
};

// Calculate discount amount
couponSchema.methods.calculateDiscount = function (subtotal, items = []) {
  // Check minimum purchase
  if (subtotal < this.minPurchase) {
    return {
      valid: false,
      reason: `Minimum purchase amount of ৳${this.minPurchase} required`,
    };
  }

  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (subtotal * this.discountValue) / 100;

    // Apply max discount cap
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else {
    discount = this.discountValue;
  }

  // Ensure discount doesn't exceed subtotal
  if (discount > subtotal) {
    discount = subtotal;
  }

  return {
    valid: true,
    discount: Math.round(discount),
    discountType: this.discountType,
    discountValue: this.discountValue,
    couponCode: this.code,
  };
};

// Apply coupon usage
couponSchema.methods.applyUsage = async function (userId) {
  this.usedCount += 1;

  const userIndex = this.usedBy.findIndex(
    (u) => u.user && u.user.toString() === userId.toString()
  );

  if (userIndex >= 0) {
    this.usedBy[userIndex].count += 1;
    this.usedBy[userIndex].lastUsed = new Date();
  } else {
    this.usedBy.push({
      user: userId,
      count: 1,
      lastUsed: new Date(),
    });
  }

  // Check if usage limit reached
  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    this.status = 'expired';
  }

  await this.save();
};

// Static method to validate and apply coupon
 couponSchema.statics.validateAndApply = async function (code, userId, subtotal, items = [], orderCount = 0) {
  const coupon = await this.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    return { valid: false, reason: 'Invalid coupon code' };
  }

  if (!coupon.isValid()) {
    return { valid: false, reason: 'This coupon has expired or is no longer active' };
  }

  const userCheck = coupon.canUserUse(userId, orderCount);
  if (!userCheck.valid) {
    return userCheck;
  }

  return coupon.calculateDiscount(subtotal, items);
};

// Virtual for remaining uses
couponSchema.virtual('remainingUses').get(function () {
  if (this.usageLimit === null) return 'Unlimited';
  return this.usageLimit - this.usedCount;
});

// Virtual for is expired
couponSchema.virtual('isExpired').get(function () {
  const now = new Date();
  return now > this.validUntil || (this.usageLimit !== null && this.usedCount >= this.usageLimit);
});

module.exports = mongoose.model('Coupon', couponSchema);
