const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  itemType: {
    type: String,
    enum: ["product", "course"],
    required: true,
  },
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: "items.itemType",
  },
  name: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  priceAtPurchase: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: [
      "Pending",
      "Verified",
      "Rejected",
      "Processing",
      "Shipped",
      "Delivered",
      "Completed",
      "Cancelled",
    ],
    required: true,
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  note: {
    type: String,
  },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    items: [orderItemSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
    },
    couponCode: {
      type: String,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentMethod: {
      type: String,
      enum: ["bkash", "nagad", "rocket", "bank", "cash"],
      required: true,
    },
    transactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    paymentScreenshot: {
      public_id: String,
      url: String,
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Verified",
        "Rejected",
        "Processing",
        "Shipped",
        "Delivered",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
    },

    trackingNumber: {
      type: String,
      default: null,
    },
    shippingProvider: {
      type: String,
      default: null,
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    verifiedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
    },
    deliveryAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      district: String,
      postalCode: String,
    },
    isDigital: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      maxlength: 1000,
    },
    statusHistory: [statusHistorySchema],
    shippingCost: {
      type: Number,
      default: 0,
    },
    estimatedDelivery: {
      type: Date,
    },
    deliveredAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// ✅ FIXED: Generate unique order number with retry
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    let isUnique = false;
    let attempts = 0;
    const maxAttempts = 5;

    while (!isUnique && attempts < maxAttempts) {
      const date = new Date();
      const prefix = "SC";
      const year = date.getFullYear().toString().slice(-2);
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      const random = Math.floor(1000 + Math.random() * 9000);
      const timestamp = Date.now().toString().slice(-4); // Add timestamp for uniqueness
      const proposedOrderNumber = `${prefix}${year}${month}${day}${random}${timestamp}`;

      // Check if exists
      const existing = await mongoose
        .model("Order")
        .findOne({ orderNumber: proposedOrderNumber });

      if (!existing) {
        this.orderNumber = proposedOrderNumber;
        isUnique = true;
      }

      attempts++;
    }

    if (!isUnique) {
      return next(
        new Error(
          "Failed to generate unique order number after maximum attempts",
        ),
      );
    }
  }

  // Add to status history if status changed
  if (this.isModified("status")) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      note: this.notes,
    });
  }

  next();
});

// Check if order contains only digital products
orderSchema.pre("save", function (next) {
  if (this.isModified("items")) {
    this.isDigital = this.items.every((item) => item.itemType === "course");
  }
  next();
});

// Virtual for item count
orderSchema.virtual("itemCount").get(function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
});

// Method to verify payment
// Method to verify payment (সেশন রিসিভ করার জন্য আপডেট করা হয়েছে)
orderSchema.methods.verifyPayment = async function (adminId, session) {
  this.status = "Verified";
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();

  await this.save();
};

// Method to reject payment (হিস্ট্রিতে সঠিক রিজন ও এডমিন আইডি সেভ করার জন্য আপডেট)
orderSchema.methods.rejectPayment = async function (reason, adminId) {
  this.status = "Rejected";
  this.rejectionReason = reason;
  this.verifiedBy = adminId;
  this.verifiedAt = new Date();

  // Status History তে ডাটা ম্যানুয়ালি পুশ করা হলো
  this.statusHistory.push({
    status: "Rejected",
    changedBy: adminId,
    note: reason,
  });

  await this.save();
};

// Method to cancel order
orderSchema.methods.cancelOrder = async function () {
  if (this.status !== "Pending") {
    throw new Error("Only pending orders can be cancelled");
  }
  this.status = "Cancelled";
  await this.save();
};

module.exports = mongoose.model("Order", orderSchema);
