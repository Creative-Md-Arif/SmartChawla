const mongoose = require("mongoose");
const slugify = require("slugify");

const categorySchema = new mongoose.Schema(
  {
    name: {
      bn: {
        type: String,
        required: [true, "Please provide Bengali name"],
        trim: true,
      },
      en: {
        type: String,
        required: [true, "Please provide English name"],
        trim: true,
      },
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      bn: String,
      en: String,
    },
    icon: {
      type: String,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    subCategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    type: {
      type: String,
      enum: ["product", "course", "both"],
      default: "product",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
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
    featuredImage: {
      public_id: String,
      url: String,
    },
    bannerImage: {
      public_id: String,
      url: String,
    },
    productCount: {
      type: Number,
      default: 0,
    },
    courseCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

// Indexes
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ type: 1, isActive: 1 });
categorySchema.index({ displayOrder: 1 });

// Virtual for full name
categorySchema.virtual("fullName").get(function () {
  return this.name.bn || this.name.en;
});

// Generate slug before saving
categorySchema.pre("save", function (next) {
  if (this.isModified("name.en")) {
    this.slug = slugify(this.name.en, { lower: true, strict: true });
  }
  next();
});

// Handle parent category change on update
categorySchema.pre("save", async function (next) {
  if (this.isModified("parentCategory") && !this.isNew) {
    // Get the old document from DB
    const oldDoc = await mongoose.model("Category").findById(this._id);

    // Remove from old parent's subCategories
    if (oldDoc?.parentCategory) {
      await mongoose
        .model("Category")
        .findByIdAndUpdate(oldDoc.parentCategory, {
          $pull: { subCategories: this._id },
        });
    }
  }
  next();
});

// Add to new parent's subCategories after save
categorySchema.post("save", async function (doc) {
  if (doc.parentCategory) {
    await mongoose
      .model("Category")
      .findByIdAndUpdate(doc.parentCategory, {
        $addToSet: { subCategories: doc._id },
      });
  }
});

// Remove from parent's subCategories before deleteOne (Mongoose 6+ compatible)
categorySchema.pre(
  "deleteOne",
  { document: true, query: false },
  async function (next) {
    if (this.parentCategory) {
      await mongoose
        .model("Category")
        .findByIdAndUpdate(this.parentCategory, {
          $pull: { subCategories: this._id },
        });
    }
    next();
  },
);

// Also handle deleteMany and findOneAndDelete if needed
categorySchema.pre("findOneAndDelete", async function (next) {
  const doc = await this.model.findOne(this.getQuery());
  if (doc?.parentCategory) {
    await mongoose
      .model("Category")
      .findByIdAndUpdate(doc.parentCategory, {
        $pull: { subCategories: doc._id },
      });
  }
  next();
});

// Check if category has subcategories
categorySchema.methods.hasSubCategories = function () {
  return this.subCategories.length > 0;
};

// Get all descendant category IDs (recursive)
categorySchema.methods.getDescendantIds = async function () {
  const descendants = [];
  const queue = [this._id];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = await mongoose.model("Category").find({
      parentCategory: currentId,
    });

    for (const child of children) {
      descendants.push(child._id);
      queue.push(child._id);
    }
  }

  return descendants;
};

// Get breadcrumb path
categorySchema.methods.getBreadcrumb = async function () {
  const breadcrumb = [];
  let current = this;

  while (current) {
    breadcrumb.unshift({
      _id: current._id,
      name: current.name,
      slug: current.slug,
    });

    if (current.parentCategory) {
      current = await mongoose
        .model("Category")
        .findById(current.parentCategory);
    } else {
      current = null;
    }
  }

  return breadcrumb;
};

// Static method to build category tree
categorySchema.statics.buildTree = async function (type = null) {
  const query = { parentCategory: null };
  if (type) {
    query.$or = [{ type }, { type: "both" }];
  }

  const rootCategories = await this.find(query)
    .populate({
      path: "subCategories",
      match: { isActive: true },
      populate: {
        path: "subCategories",
        match: { isActive: true },
      },
    })
    .sort({ displayOrder: 1 })
    .lean();

  return rootCategories;
};

module.exports = mongoose.model("Category", categorySchema);
