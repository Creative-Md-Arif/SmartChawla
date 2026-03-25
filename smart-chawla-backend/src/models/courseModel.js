const mongoose = require("mongoose");
const slugify = require("slugify");

const lessonSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  videoId: {
    type: String,
    required: false,
    default: "",
  },
  videoUrl: {
    // ✅ ADD THIS
    type: String,
    default: "",
  },
  duration: {
    type: Number,
    default: 0,
  },
  isPreview: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Number,
    default: 0,
  },
  resources: [
    {
      name: String,
      fileUrl: String,
      fileType: String,
    },
  ],
});

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Please provide course title"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Please provide course description"],
      maxlength: [10000, "Description cannot exceed 10000 characters"],
    },
    shortVideo: {
      public_id: String,
      url: String,
      duration: Number,
    },
    fullVideo: {
      public_id: String,
      url: String,
      duration: Number,
    },
    thumbnail: {
      public_id: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
    },
    instructor: {
      name: {
        type: String,
        required: true,
      },
      bio: {
        type: String,
        maxlength: 1000,
      },
      avatar: {
        type: String,
        default: "",
      },
    },
    duration: {
      type: Number,
      default: 0,
    },
    lessons: [lessonSchema],
    price: {
      type: Number,
      required: [true, "Please provide course price"],
      min: [0, "Price cannot be negative"],
    },
    // courseSchema এর ভেতরে
    discountPrice: {
      type: Number,
      min: [0, "Discount price cannot be negative"],
      validate: {
        validator: function (val) {
          // যদি discountPrice না দেওয়া হয় (null/undefined), তবে ভ্যালিডেশন পাস করবে
          if (val == null) return true;

          // যদি this.price থাকে, তবেই চেক করবে discountPrice ছোট কিনা
          if (this.price != null) {
            return val < this.price;
          }
          return true; // আপডেটের সময় this.price না থাকলে যেন ক্র্যাশ না করে
        },
        message: "Discount price must be less than regular price",
      },
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Please select a category"],
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced", "All Levels"],
      default: "All Levels",
    },
    courseLanguage: {
      type: String,
      default: "Bengali",
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
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
          maxlength: 2000,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: {
      type: Date,
    },
    resources: [
      {
        name: String,
        description: String,
        fileUrl: String,
        fileType: String,
      },
    ],
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    whatYouWillLearn: [
      {
        type: String,
        trim: true,
      },
    ],
    metaTitle: {
      type: String,
      maxlength: 70,
    },
    metaDescription: {
      type: String,
      maxlength: 160,
    },
    totalViews: {
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
courseSchema.index({ title: "text", description: "text" });
courseSchema.index({ category: 1, isPublished: 1 });
courseSchema.index({ level: 1 });
courseSchema.index({ createdAt: -1 });

// Virtual for average rating
courseSchema.virtual("averageRating").get(function () {
  if (!this.ratings?.length) return 0;
  const sum = this.ratings.reduce((acc, item) => acc + item.rating, 0);
  return Math.round((sum / this.ratings.length) * 10) / 10;
});

// Virtual for total students
courseSchema.virtual("totalStudents").get(function () {
  return this.enrolledStudents?.length || 0;
});

// Virtual for discount percentage
courseSchema.virtual("discountPercentage").get(function () {
  if (!this.discountPrice || !this.price || this.discountPrice >= this.price)
    return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Generate slug before saving
courseSchema.pre("save", function (next) {
  if (this.isModified("title")) {
    this.slug =
      slugify(this.title, { lower: true, strict: true }) + "-" + Date.now();
  }
  if (this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

// Check if user is enrolled
courseSchema.methods.isEnrolled = function (userId) {
  return this.enrolledStudents.some(
    (studentId) => studentId.toString() === userId.toString(),
  );
};

// Get preview lessons
courseSchema.methods.getPreviewLessons = function () {
  return this.lessons.filter((lesson) => lesson.isPreview);
};

module.exports = mongoose.model("Course", courseSchema);
