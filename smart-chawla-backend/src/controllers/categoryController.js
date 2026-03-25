const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Course = require("../models/courseModel");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary");
const AppError = require("../utils/errorHandler");
const { cleanupFiles } = require("../middlewares/upload");

// Create category
exports.createCategory = async (req, res, next) => {
  try {
    const categoryData = { ...req.body };

    // Handle image upload
    if (req.file) {
      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "smart-chawla/images/categories",
          "image",
        );
        categoryData.featuredImage = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } finally {
        // Clean up the temp file
        cleanupFiles([req.file]);
      }
    }
    const category = await Category.create(categoryData);

    res.status(201).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// Get all categories
exports.getAllCategories = async (req, res, next) => {
  try {
    const { tree, type, includeInactive } = req.query;

    let query = {};

    if (type) {
      query.$or = [{ type }, { type: "both" }];
    }

    if (includeInactive !== "true") {
      query.isActive = true;
    }

    if (tree === "true") {
      const categories = await Category.buildTree(type);
      return res.status(200).json({
        success: true,
        categories,
      });
    }

    const categories = await Category.find(query)
      .populate("parentCategory", "name slug")
      .populate("subCategories", "name slug")
      .sort({ displayOrder: 1, "name.en": 1 })
      .lean();

    res.status(200).json({
      success: true,
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// Get category by slug
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const category = await Category.findOne({ slug, isActive: true })
      .populate("parentCategory", "name slug")
      .populate("subCategories", "name slug");

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Get product count
    const productCount = await Product.countDocuments({
      category: category._id,
      isActive: true,
    });

    // Get course count
    const courseCount = await Course.countDocuments({
      category: category._id,
      isPublished: true,
    });

    // Get breadcrumb
    const breadcrumb = await category.getBreadcrumb();

    res.status(200).json({
      success: true,
      category,
      counts: {
        products: productCount,
        courses: courseCount,
      },
      breadcrumb,
    });
  } catch (error) {
    next(error);
  }
};

// Update category
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Get current category first
    const currentCategory = await Category.findById(id);
    if (!currentCategory) {
      return next(new AppError("Category not found", 404));
    }

    // Handle image upload
    if (req.file) {
      if (currentCategory?.featuredImage?.public_id) {
        await cloudinary.uploader.destroy(
          currentCategory.featuredImage.public_id,
        );
      }

      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "smart-chawla/images/categories",
          "image",
        );
        updateData.featuredImage = {
          public_id: result.public_id,
          url: result.secure_url,
        };
      } finally {
        cleanupFiles([req.file]);
      }
    }

    // Handle parent category change
    if (updateData.parentCategory !== undefined) {
      const oldParentId = currentCategory.parentCategory?.toString();
      const newParentId = updateData.parentCategory?.toString() || null;

      // Only process if parent actually changed
      if (oldParentId !== newParentId) {
        // Remove from old parent's subCategories
        if (oldParentId) {
          await Category.findByIdAndUpdate(oldParentId, {
            $pull: { subCategories: id },
          });
        }

        // Add to new parent's subCategories
        if (newParentId) {
          // Check for circular reference
          if (newParentId === id) {
            return next(new AppError("Category cannot be its own parent", 400));
          }

          // Check if new parent is not a descendant of current category
          const descendantIds = await currentCategory.getDescendantIds();
          if (descendantIds.map((d) => d.toString()).includes(newParentId)) {
            return next(new AppError("Cannot set a descendant as parent", 400));
          }

          await Category.findByIdAndUpdate(newParentId, {
            $addToSet: { subCategories: id },
          });
        }
      }
    }

    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      category,
    });
  } catch (error) {
    next(error);
  }
};

// Delete category
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    // Check if category has subcategories
    if (category.hasSubCategories()) {
      return next(
        new AppError(
          "Cannot delete category with subcategories. Delete subcategories first.",
          400,
        ),
      );
    }

    // Check if category has products or courses
    const productCount = await Product.countDocuments({ category: id });
    const courseCount = await Course.countDocuments({ category: id });

    if (productCount > 0 || courseCount > 0) {
      return next(
        new AppError(
          `Cannot delete category with associated products (${productCount}) or courses (${courseCount})`,
          400,
        ),
      );
    }

    // Delete image from Cloudinary
    if (category.featuredImage?.public_id) {
      await cloudinary.uploader.destroy(category.featuredImage.public_id);
    }

    // Use deleteOne() instead of remove() for Mongoose 6+
    await category.deleteOne();

    res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Get category tree
exports.getCategoryTree = async (req, res, next) => {
  try {
    const { type } = req.query;

    const tree = await Category.buildTree(type);

    res.status(200).json({
      success: true,
      tree,
    });
  } catch (error) {
    next(error);
  }
};

// Get products by category
exports.getProductsByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12, includeSubcategories = "true" } = req.query;

    const category = await Category.findOne({ slug });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    let categoryIds = [category._id];

    // Include subcategories if requested
    if (includeSubcategories === "true") {
      const descendantIds = await category.getDescendantIds();
      categoryIds = [...categoryIds, ...descendantIds];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const products = await Product.find({
      category: { $in: categoryIds },
      isActive: true,
    })
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .lean();

    const total = await Product.countDocuments({
      category: { $in: categoryIds },
      isActive: true,
    });

    res.status(200).json({
      success: true,
      products,
      category: {
        name: category.name,
        slug: category.slug,
      },
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

// Get courses by category
exports.getCoursesByCategory = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1, limit = 12 } = req.query;

    const category = await Category.findOne({ slug });

    if (!category) {
      return next(new AppError("Category not found", 404));
    }

    const skip = (Number(page) - 1) * Number(limit);

    const courses = await Course.find({
      category: category._id,
      isPublished: true,
    })
      .sort("-createdAt")
      .skip(skip)
      .limit(Number(limit))
      .select("-fullVideo -lessons.videoId")
      .lean();

    const total = await Course.countDocuments({
      category: category._id,
      isPublished: true,
    });

    res.status(200).json({
      success: true,
      courses,
      category: {
        name: category.name,
        slug: category.slug,
      },
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

// Reorder categories
exports.reorderCategories = async (req, res, next) => {
  try {
    const { categories } = req.body;

    if (!Array.isArray(categories)) {
      return next(new AppError("Categories must be an array", 400));
    }

    // categories should be an array of { id, displayOrder }
    const updatePromises = categories.map((cat) => {
      if (!cat.id || cat.displayOrder === undefined) {
        throw new AppError("Each category must have id and displayOrder", 400);
      }
      return Category.findByIdAndUpdate(cat.id, {
        displayOrder: cat.displayOrder,
      });
    });

    await Promise.all(updatePromises);

    res.status(200).json({
      success: true,
      message: "Categories reordered successfully",
    });
  } catch (error) {
    next(error);
  }
};
