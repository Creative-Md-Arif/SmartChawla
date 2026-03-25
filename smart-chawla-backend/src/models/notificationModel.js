const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    broadcast: {
      type: Boolean,
      default: false,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "order_update",
        "payment_verified",
        "payment_rejected",
        "order_shipped", 
        "order_delivered", 
        "order_completed", 
        "order_cancelled",
        "course_access",
        "course_completed",
        "promotion",
        "system",
        "new_product",
        "new_course",
        "wishlist_price_drop",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    link: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    readAt: {
      type: Date,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    expiresAt: {
      type: Date,
    },
    image: {
      type: String,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
    },
    deliveryStatus: {
      email: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
      inApp: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });
notificationSchema.index({ type: 1 });
notificationSchema.index({ broadcast: 1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Mark as read
notificationSchema.methods.markAsRead = async function () {
  if (!this.isRead) {
    this.isRead = true;
    this.readAt = new Date();
    await this.save();
  }
};

// Static method to create broadcast notification
notificationSchema.statics.createBroadcast = async function (notificationData) {
  return await this.create({
    ...notificationData,
    broadcast: true,
  });
};

// Static method to get unread count for user
notificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({
    $or: [{ recipient: userId }, { broadcast: true }],
    isRead: false,
    $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
  });
};

module.exports = mongoose.model('Notification', notificationSchema);
