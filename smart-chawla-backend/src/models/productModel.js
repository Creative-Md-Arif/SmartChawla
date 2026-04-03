const mongoose = require("mongoose");
const slugify = require("slugify");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please provide product name"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please provide product description"],
      maxlength: [5000, "Description cannot exceed 5000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Please provide product price"],
      min: [0, "Price cannot be negative"],
    },
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
    },
    stock: {
      type: Number,
      required: [true, "Please provide stock quantity"],
      min: [0, "Stock cannot be negative"],
      default: 0,
    },
    images: [
      {
        public_id: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        alt: {
          type: String,
          default: "",
        },
      },
    ],
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category"],
    },
    subCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    specifications: {
      weight: {
        type: Number,
        default: 0,
      },
      weightUnit: {
        type: String,
        default: "kg",
      },
      dimensions: {
        length: Number,
        width: Number,
        height: Number,
        unit: {
          type: String,
          default: "cm",
        },
      },
      material: {
        type: String,
        trim: true,
      },
      color: {
        type: String,
        trim: true,
      },
      warranty: {
        type: String,
        trim: true,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
        review: {
          type: String,
          maxlength: 1000,
        },

        images: [
          // এটি নতুন যোগ করুন
          {
            public_id: String,
            url: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    totalSold: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
    },
    metaTitle: {
      type: String,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
productSchema.index({ name: "text", tags: "text" });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ price: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ slug: 1, isActive: 1 }); // 🔥 গুরুত্বপূর্ণ
productSchema.index({ isFeatured: 1, isActive: 1, stock: 1 }); // 🔥 গুরুত্বপূর্ণ
productSchema.index({ views: -1 });

// Virtual for average rating
productSchema.virtual("averageRating").get(function () {
  // Check if ratings exists and is an array with items
  if (!this.ratings || this.ratings.length === 0) return 0;

  const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for discount percentage
productSchema.virtual("discountPercentage").get(function () {
  // Safe check for price and discountPrice
  if (!this.price || !this.discountPrice || this.discountPrice >= this.price)
    return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Generate slug before saving
productSchema.pre("save", function (next) {
  if (this.isModified("name")) {
    this.slug =
      slugify(this.name, { lower: true, strict: true }) + "-" + Date.now();
  }
  next();
});

// Check stock availability
productSchema.methods.isInStock = function (quantity = 1) {
  return this.stock >= quantity;
};

// Update stock
productSchema.methods.updateStock = async function (quantity) {
  this.stock -= quantity;
  this.totalSold += quantity;
  await this.save();
};

module.exports = mongoose.model("Product", productSchema);
