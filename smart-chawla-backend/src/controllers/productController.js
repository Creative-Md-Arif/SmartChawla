const Product = require("../models/productModel");
const {
  cloudinary,
  uploadToCloudinary,
  imageConfig,
} = require("../config/cloudinary");
const AppError = require("../utils/errorHandler");
const { cleanupFiles } = require("../middlewares/upload");


// Get all products (with pagination & filtering)
exports.getAllProducts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      search,
      category,
      subCategory,
      minPrice,
      maxPrice,
      inStock,
      isFeatured,
      sort = "-createdAt",
    } = req.query;

    // Build filter object
    const filter = { isActive: true };

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (category) filter.category = category;
    if (subCategory) filter.subCategory = subCategory;
    if (inStock === "true") filter.stock = { $gt: 0 };
    if (isFeatured === "true") filter.isFeatured = true;

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Execute query
    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .populate("subCategory", "name slug")
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Product.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: {
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        total,
        limit: limitNum,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get featured products
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = Math.min(20, parseInt(req.query.limit) || 8);

    const products = await Product.find({
      isFeatured: true,
      isActive: true,
      stock: { $gt: 0 },
    })
      .populate("category", "name slug")
      .limit(limit)
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// Get product by slug
// Get product by slug
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .populate("subCategory", "name slug");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // Fix 1: Safely increment views (যদি আগে থেকে views না থাকে তাহলে 0 ধরে নিবে)
    product.views = (product.views || 0) + 1;
    await product.save({ validateBeforeSave: false });

    // Fix 2: Get related products safely using the extracted category ID
    let relatedProducts = [];
    const categoryId = product.category
      ? product.category._id || product.category
      : null;

    if (categoryId) {
      relatedProducts = await Product.find({
        category: categoryId,
        _id: { $ne: product._id },
        isActive: true,
      })
        .limit(4)
        .select("name slug price discountPrice images");
    }

    res.status(200).json({
      success: true,
      product,
      relatedProducts,
    });
  } catch (error) {
    // Console log the exact error so you can see it in your backend terminal
    console.error("Error in getProductBySlug:", error);
    next(error);
  }
};

// Create product
exports.createProduct = async (req, res, next) => {
  try {
    const productData = { ...req.body };

    // Parse tags
    if (productData.tags) {
      if (typeof productData.tags === "string") {
        try {
          productData.tags = JSON.parse(productData.tags);
        } catch (e) {
          productData.tags = productData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }
    }

    // Parse specifications from nested form data
    const specifications = {};
    Object.keys(productData).forEach((key) => {
      if (key.startsWith("specifications[")) {
        const field = key.match(/\[(.*?)\]/)[1];
        specifications[field] = productData[key];
        delete productData[key];
      }
    });
    if (Object.keys(specifications).length > 0) {
      productData.specifications = specifications;
    }

    // Upload images to Cloudinary from buffer
    if (req.files && req.files.length > 0) {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.path, "smart-chawla/images/products", "image"),
      );

      const uploadResults = await Promise.all(uploadPromises);
      productData.images = uploadResults.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
    }

    const product = await Product.create(productData);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    next(error);
  }
};

// Update product
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.price !== undefined && updateData.price !== "") {
      updateData.price = parseFloat(updateData.price);
    }

    if (
      updateData.discountPrice === "" ||
      updateData.discountPrice === "null" ||
      updateData.discountPrice === null
    ) {
      updateData.discountPrice = null;
    } else if (updateData.discountPrice !== undefined) {
      updateData.discountPrice = parseFloat(updateData.discountPrice);
      // যদি 0 হয় বা price এর সমান/বেশি হয়, তাহলে null করুন
      if (
        updateData.discountPrice <= 0 ||
        (updateData.price && updateData.discountPrice >= updateData.price)
      ) {
        updateData.discountPrice = null;
      }
    }

    if (updateData.stock !== undefined && updateData.stock !== "") {
      updateData.stock = parseInt(updateData.stock, 10);
    }

    // Parse tags
    if (updateData.tags) {
      if (typeof updateData.tags === "string") {
        try {
          updateData.tags = JSON.parse(updateData.tags);
        } catch (e) {
          updateData.tags = updateData.tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
        }
      }
    }

    // Parse specifications from nested form data (improved)
    const specifications = {};
    const dimensions = {};

    Object.keys(updateData).forEach((key) => {
      if (key.startsWith("specifications[")) {
        // dimensions[...] ফিল্ড চেক করুন
        const dimMatch = key.match(/specifications\[dimensions\]\[(.*?)\]/);
        if (dimMatch) {
          const dimField = dimMatch[1];
          const val = parseFloat(updateData[key]);
          if (!isNaN(val)) {
            dimensions[dimField] = val;
          }
          delete updateData[key];
        } else {
          // regular specifications field
          const fieldMatch = key.match(/specifications\[(.*?)\]/);
          if (fieldMatch) {
            const field = fieldMatch[1];
            let val = updateData[key];
            // weight নাম্বারে কনভার্ট
            if (field === "weight" && val !== "") {
              val = parseFloat(val);
            }
            if (val !== "" && val !== null) {
              specifications[field] = val;
            }
            delete updateData[key];
          }
        }
      }
    });

    if (
      Object.keys(specifications).length > 0 ||
      Object.keys(dimensions).length > 0
    ) {
      updateData.specifications = { ...specifications };
      if (Object.keys(dimensions).length > 0) {
        updateData.specifications.dimensions = dimensions;
      }
    }

    if (updateData.existingImages) {
      try {
        if (typeof updateData.existingImages === "string") {
          updateData.existingImages = JSON.parse(updateData.existingImages);
        }
        // existing images কে আপডেটে রাখুন (নতুন ছবি না থাকলে)
        if (!req.files || req.files.length === 0) {
          updateData.images = updateData.existingImages;
        }
      } catch (e) {
        console.log("existingImages parse error:", e);
      }
      delete updateData.existingImages;
    }

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Get existing product to delete old images
      const existingProduct = await Product.findById(id);

      if (existingProduct && existingProduct.images.length > 0) {
        // Delete old images from Cloudinary
        const deletePromises = existingProduct.images.map((img) =>
          cloudinary.uploader.destroy(img.public_id),
        );
        await Promise.all(deletePromises);
      }

      // Upload new images from buffer
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file.path, "smart-chawla/images/products", "image"),
      );

      const uploadResults = await Promise.all(uploadPromises);
      updateData.images = uploadResults.map((result) => ({
        public_id: result.public_id,
        url: result.secure_url,
      }));
    }

    // undefined ফিল্ড রিমুভ করুন
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });


    const product = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).populate("category", "name slug");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Update error:", error);
    next(error);
  }
};

// Add or Update Review with Multiple Images
exports.addProductReview = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    // চেক করুন ইউজার আগে রিভিউ দিয়েছে কি না
    const alreadyReviewed = product.ratings.find(
      (r) => r.user.toString() === req.user._id.toString(),
    );

    // ইমেজ আপলোড হ্যান্ডলিং (Cloudinary তে রিভিউ ইমেজ আপলোড)
    let reviewImages = [];
    if (req.files && req.files.length > 0) {
      try {
        const uploadPromises = req.files.map((file) =>
          uploadToCloudinary(file.path, "smart-chawla/images/reviews", "image"),
        );
        const uploadResults = await Promise.all(uploadPromises);
        reviewImages = uploadResults.map((result) => ({
          public_id: result.public_id,
          url: result.secure_url,
        }));
      } finally {
        // Always clean up temp files
        cleanupFiles(req.files);
      }
    }

    const newReview = {
      user: req.user._id,
      rating: Number(rating),
      review,
      images: reviewImages, // ইমেজের অ্যারে
      createdAt: Date.now(),
    };

    if (alreadyReviewed) {
      // আগের রিভিউ আপডেট করুন (নতুন ইমেজ সহ)
      product.ratings.forEach((r) => {
        if (r.user.toString() === req.user._id.toString()) {
          r.rating = Number(rating);
          r.review = review;
          if (reviewImages.length > 0) r.images = reviewImages;
        }
      });
    } else {
      // নতুন রিভিউ পুশ করুন
      product.ratings.push(newReview);
    }

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Review added successfully",
      ratings: product.ratings,
    });
  } catch (error) {
    console.error("Review Error:", error);
    next(error);
  }
};

// Delete product
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const product = await Product.findById(id);

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    if (permanent === "true") {
      // Delete images from Cloudinary
      if (product.images.length > 0) {
        const deletePromises = product.images.map((img) =>
          cloudinary.uploader.destroy(img.public_id),
        );
        await Promise.all(deletePromises);
      }

      await product.deleteOne();
    } else {
      // Soft delete
      product.isActive = false;
      await product.save();
    }

    res.status(200).json({
      success: true,
      message:
        permanent === "true"
          ? "Product permanently deleted"
          : "Product deactivated",
    });
  } catch (error) {
    next(error);
  }
};

// Search products (autocomplete)
exports.searchProducts = async (req, res, next) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(200).json({
        success: true,
        products: [],
      });
    }

    // Try text search first, fallback to regex
    let products;
    try {
      products = await Product.find(
        {
          $text: { $search: q },
          isActive: true,
        },
        { score: { $meta: "textScore" } },
      )
        .sort({ score: { $meta: "textScore" } })
        .limit(Number(limit))
        .select("name slug price images");
    } catch (textSearchError) {
      // Fallback to regex if text index not set up
      products = await Product.find({
        name: { $regex: q, $options: "i" },
        isActive: true,
      })
        .limit(Number(limit))
        .select("name slug price images");
    }

    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    next(error);
  }
};

// Update stock only
exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;

    if (typeof stock !== "number" && isNaN(Number(stock))) {
      return next(new AppError("Invalid stock value", 400));
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { stock: Number(stock) },
      { new: true, runValidators: true },
    ).select("name stock");

    if (!product) {
      return next(new AppError("Product not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "Stock updated",
      product,
    });
  } catch (error) {
    next(error);
  }
};
