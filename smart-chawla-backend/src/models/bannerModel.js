const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide banner title'],
      trim: true,
      maxlength: 200,
    },
    subtitle: {
      type: String,
      maxlength: 500,
    },
    image: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      mobile_url: String,
    },
    link: {
      type: String,
    },
    buttonText: {
      type: String,
      default: 'Shop Now',
    },
    position: {
      type: String,
      enum: ['hero', 'promo', 'sidebar', 'popup', 'footer', 'category'],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    impressionCount: {
      type: Number,
      default: 0,
    },
    targetAudience: {
      all: {
        type: Boolean,
        default: true,
      },
      newUsers: Boolean,
      returningUsers: Boolean,
      specificCategories: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Category',
        },
      ],
    },
    displayConditions: {
      showOnHome: {
        type: Boolean,
        default: true,
      },
      showOnShop: Boolean,
      showOnCourse: Boolean,
      showOnProductDetail: Boolean,
    },
    backgroundColor: {
      type: String,
    },
    textColor: {
      type: String,
      default: '#ffffff',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
bannerSchema.index({ position: 1, status: 1 });
bannerSchema.index({ startDate: 1, endDate: 1 });
bannerSchema.index({ priority: -1 });

// Check if banner is currently active
bannerSchema.methods.isCurrentlyActive = function () {
  const now = new Date();
  return (
    this.status === 'active' &&
    now >= this.startDate &&
    now <= this.endDate
  );
};

// Increment click count
bannerSchema.methods.incrementClick = async function () {
  this.clickCount += 1;
  await this.save();
};

// Increment impression count
bannerSchema.methods.incrementImpression = async function () {
  this.impressionCount += 1;
  await this.save();
};

// Static method to get active banners by position
bannerSchema.statics.getActiveByPosition = async function (position) {
  const now = new Date();
  return await this.find({
    position,
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

// Static method to get all active banners
bannerSchema.statics.getAllActive = async function () {
  const now = new Date();
  return await this.find({
    status: 'active',
    startDate: { $lte: now },
    endDate: { $gte: now },
  })
    .sort({ priority: -1, createdAt: -1 })
    .lean();
};

// Virtual for CTR (Click Through Rate)
bannerSchema.virtual('ctr').get(function () {
  if (this.impressionCount === 0) return 0;
  return ((this.clickCount / this.impressionCount) * 100).toFixed(2);
});

// Virtual for days remaining
bannerSchema.virtual('daysRemaining').get(function () {
  const now = new Date();
  const end = new Date(this.endDate);
  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
});

module.exports = mongoose.model('Banner', bannerSchema);
