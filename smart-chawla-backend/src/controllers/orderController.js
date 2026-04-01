const mongoose = require("mongoose");
const Order = require("../models/orderModel");
const Product = require("../models/productModel");
const Course = require("../models/courseModel");
const User = require("../models/userModel");
const Coupon = require("../models/couponModel");
const Notification = require("../models/notificationModel");
const { cloudinary, imageConfig } = require("../config/cloudinary");
const { AppError } = require("../utils/errorHandler");

// Create order
exports.createOrder = async (req, res, next) => {
  try {
    const {
      items,
      paymentMethod,
      transactionId,
      deliveryAddress,
      couponCode,
      notes,
    } = req.body;
    const userId = req.user.id;

    const validPaymentMethods = ["bkash", "nagad", "rocket", "bank", "cash"];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return next(new AppError("Invalid payment method selected", 400));
    }

    // ✅ FIX: Validate items array
    if (!items || !Array.isArray(items) || items.length === 0) {
      return next(new AppError("Please provide at least one item", 400));
    }

    if (!transactionId || transactionId.trim() === "") {
      return next(new AppError("Transaction ID is required", 400));
    }

    // ✅ FIX: Check for duplicate transaction ID immediately
    const existingOrder = await Order.findOne({
      transactionId: transactionId.trim(),
      status: { $nin: ["Cancelled", "Rejected"] },
    });

    if (existingOrder) {
      return next(
        new AppError("This transaction ID has already been used", 400),
      );
    }

    // Validate items and calculate total
    let totalAmount = 0;
    const orderItems = [];
    let isDigital = true;

    for (const item of items) {
      // ✅ FIX: Validate item structure
      if (!item.itemId || !item.itemType || !item.quantity) {
        return next(
          new AppError(
            "Invalid item structure. Required: itemId, itemType, quantity",
            400,
          ),
        );
      }

      let product;
      if (item.itemType === "product") {
        product = await Product.findById(item.itemId);
        isDigital = false;

        if (!product) {
          return next(new AppError(`Product not found: ${item.itemId}`, 404));
        }

        if (!product.isInStock(item.quantity)) {
          return next(
            new AppError(
              `${product.name} is out of stock or insufficient quantity`,
              400,
            ),
          );
        }
      } else if (item.itemType === "course") {
        product = await Course.findById(item.itemId);
        if (!product) {
          return next(new AppError(`Course not found: ${item.itemId}`, 404));
        }
      } else {
        return next(
          new AppError(
            `Invalid itemType: ${item.itemType}. Must be 'product' or 'course'`,
            400,
          ),
        );
      }

      const price = product.discountPrice || product.price;
      totalAmount += price * item.quantity;

      orderItems.push({
        itemType: item.itemType,
        itemId: item.itemId,
        name: product.name || product.title,
        quantity: item.quantity,
        priceAtPurchase: price,
        image: product.images?.[0]?.url || product.thumbnail?.url,
      });
    }

    // Apply coupon if provided
    let discountAmount = 0;
    let finalAmount = totalAmount;

    if (couponCode) {
      const user = await User.findById(userId);
      const orderCount = await Order.countDocuments({
        user: userId,
        status: { $in: ["Verified", "Completed"] },
      });

      const couponResult = await Coupon.validateAndApply(
        couponCode,
        userId,
        totalAmount,
        items,
        orderCount,
      );

      if (couponResult.valid) {
        discountAmount = couponResult.discount;
        finalAmount = totalAmount - discountAmount;
      }
    }

    // ✅ FIX: Validate finalAmount
    if (finalAmount < 0) {
      return next(new AppError("Final amount cannot be negative", 400));
    }

    // Create order
    const orderData = {
      user: userId,
      items: orderItems,
      totalAmount,
      discountAmount,
      transactionId: transactionId?.trim(),
      couponCode,
      finalAmount,
      paymentMethod,
      deliveryAddress: isDigital ? null : deliveryAddress,
      isDigital,
      notes,
    };

    // ✅ FIX: Validate delivery address for physical products
    if (
      !isDigital &&
      (!deliveryAddress ||
        !deliveryAddress.fullName ||
        !deliveryAddress.phone ||
        !deliveryAddress.address)
    ) {
      return next(
        new AppError("Delivery address is required for physical products", 400),
      );
    }

    const order = await Order.create(orderData);

    // Clear user's cart
    await User.findByIdAndUpdate(userId, { $set: { cartItems: [] } });

    res.status(201).json({
      success: true,
      order,
      message: "Order created successfully. Please submit payment proof.",
    });
  } catch (error) {
    next(error);
  }
};

// Get my orders
exports.getMyOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const userId = req.user.id;

    // ✅ FIX: Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10)); // Max 50 per page

    const query = { user: userId };
    if (status) {
      const validStatuses = [
        "Pending",
        "Verified",
        "Rejected",
        "Processing",
        "Shipped",
        "Delivered",
        "Completed",
        "Cancelled",
      ];
      if (!validStatuses.includes(status)) {
        return next(new AppError("Invalid status filter", 400));
      }
      query.status = status;
    }

    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query).sort("-createdAt").skip(skip).limit(limitNum).lean(),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin যেকোনো order দেখতে পারবে (including courses)
exports.getOrderByIdAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    const order = await Order.findById(id)
      .populate("user", "fullName email phone")
      .populate("verifiedBy", "fullName email");

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Get order by ID
exports.getOrderById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ FIX: Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    const order = await Order.findOne({
      _id: id,
      user: userId, // ✅ FIX: Only user's own order (remove verifiedBy check)
    });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Submit payment proof
// submitPaymentProof function এ এই change করুন:

exports.submitPaymentProof = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { transactionId } = req.body;
    const userId = req.user.id;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    if (!transactionId || transactionId.trim() === "") {
      return next(new AppError("Transaction ID is required", 400));
    }

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (order.status !== "Pending") {
      return next(
        new AppError(
          "Payment proof already submitted or order is not pending",
          400,
        ),
      );
    }

    // ✅ FIX: File validation
    if (!req.file) {
      return next(new AppError("Payment screenshot is required", 400));
    }

    console.log("File received:", req.file); // Debug log

    // ✅ FIX: Handle both memory and disk storage
    let screenshotData;
    try {
      let uploadResult;

      if (req.file.buffer) {
        // Memory storage - use buffer stream
        const stream = require("stream");
        const bufferStream = new stream.PassThrough();
        bufferStream.end(req.file.buffer);

        uploadResult = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              ...imageConfig,
              folder: "smart-chawla/images/payments",
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            },
          );
          bufferStream.pipe(uploadStream);
        });
      } else if (req.file.path) {
        // Disk storage - use path
        uploadResult = await cloudinary.uploader.upload(req.file.path, {
          ...imageConfig,
          folder: "smart-chawla/images/payments",
        });

        // Cleanup temp file
        const fs = require("fs");
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } else {
        throw new Error("No file data found");
      }

      screenshotData = {
        public_id: uploadResult.public_id,
        url: uploadResult.secure_url,
      };
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
      return next(
        new AppError(
          "Failed to upload payment screenshot: " + uploadError.message,
          500,
        ),
      );
    }

    // Update order
    order.transactionId = transactionId.trim();
    order.paymentScreenshot = screenshotData;

    await order.save();

    // Notify admins
    const io = require("../socket/io").getIO();
    io.to("admin").emit("new_payment_proof", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      transactionId,
    });

    res.status(200).json({
      success: true,
      message: "Payment proof submitted successfully",
      order,
    });
  } catch (error) {
    console.error("Submit payment proof error:", error);
    next(error);
  }
};

// Generic status update
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const order = await Order.findById(id);
    if (!order) return next(new AppError("Order not found", 404));

    // Validate status transition
    const validTransitions = {
      Verified: ["Processing"],
      Processing: ["Shipped"],
      Shipped: ["Delivered"],
      Delivered: ["Completed"],
    };

    if (!validTransitions[order.status]?.includes(status)) {
      return next(
        new AppError(
          `Cannot transition from ${order.status} to ${status}`,
          400,
        ),
      );
    }

    order.status = status;
    order.statusHistory.push({
      status,
      changedBy: adminId,
      changedAt: new Date(),
      note: note || `Status changed to ${status}`,
    });

    await order.save();

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// Ship order
// Ship order
exports.shipOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber, shippingProvider, estimatedDelivery } = req.body;

    // 🔴 [ADD] Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    // 🔴 [ADD] Validate required fields
    if (!trackingNumber || trackingNumber.trim() === "") {
      return next(new AppError("Tracking number is required", 400));
    }
    if (!shippingProvider) {
      return next(new AppError("Shipping provider is required", 400));
    }

    const order = await Order.findById(id);
    if (!order) return next(new AppError("Order not found", 404));

    if (order.status !== "Processing" && order.status !== "Verified") {
      return next(
        new AppError("Order must be verified/processing before shipping", 400),
      );
    }

    // 🔴 [FIX] Handle date properly
    let deliveryDate = null;
    if (estimatedDelivery) {
      deliveryDate = new Date(estimatedDelivery);
      if (isNaN(deliveryDate.getTime())) {
        return next(new AppError("Invalid estimated delivery date", 400));
      }
    }

    order.status = "Shipped";
    order.trackingNumber = trackingNumber.trim();
    order.shippingProvider = shippingProvider;
    order.estimatedDelivery = deliveryDate;

    // 🔴 [FIX] Add to status history properly
    order.statusHistory.push({
      status: "Shipped",
      changedBy: req.user.id,
      changedAt: new Date(),
      note: `Shipped via ${shippingProvider}, Tracking: ${trackingNumber.trim()}`,
    });

    await order.save();

    // 🔴 [FIX] Notification with proper error handling
    try {
      await Notification.create({
        recipient: order.user,
        type: "order_shipped", // ✅ CORRECT TYPE
        title: "Order Shipped! 🚚",
        message: `Your order #${order.orderNumber} has been shipped via ${shippingProvider}. Tracking: ${trackingNumber}`,
        link: `/my-orders/${order._id}`,
        priority: "high",
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    console.error("Ship order error:", error);
    next(error);
  }
};

// Deliver order
exports.deliverOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return next(new AppError("Order not found", 404));

    if (order.status !== "Shipped") {
      return next(
        new AppError("Order must be shipped before marking delivered", 400),
      );
    }

    order.status = "Delivered";
    order.deliveredAt = new Date();
    order.statusHistory.push({
      status: "Delivered",
      changedBy: req.user.id,
      changedAt: new Date(),
      note: "Order delivered to customer",
    });

    await order.save();

    try {
      await Notification.create({
        recipient: order.user,
        type: "order_delivered", // ✅ CORRECT TYPE
        title: "Order Delivered! 📦",
        message: `Your order #${order.orderNumber} has been delivered successfully.`,
        link: `/my-orders/${order._id}`,
        priority: "high",
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// Complete order
exports.completeOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) return next(new AppError("Order not found", 404));

    if (order.status !== "Delivered") {
      return next(
        new AppError("Order must be delivered before completion", 400),
      );
    }

    order.status = "Completed";
    order.statusHistory.push({
      status: "Completed",
      changedBy: req.user.id,
      changedAt: new Date(),
      note: "Order completed successfully",
    });

    await order.save();

    try {
      await Notification.create({
        recipient: order.user,
        type: "order_completed", // ✅ CORRECT TYPE
        title: "Order Completed! 🎉",
        message: `Your order #${order.orderNumber} has been completed. Thank you for shopping with us!`,
        link: `/my-orders/${order._id}`,
        priority: "medium",
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    res.status(200).json({ success: true, order });
  } catch (error) {
    next(error);
  }
};

// Cancel order
exports.cancelOrder = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // ✅ FIX: Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    const order = await Order.findOne({ _id: id, user: userId });

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    // ✅ FIX: Use model method instead of direct assignment
    try {
      await order.cancelOrder(); // Using model method
    } catch (error) {
      return next(new AppError(error.message, 400));
    }

    try {
      await Notification.create({
        recipient: order.user,
        type: "order_cancelled", // ✅ CORRECT TYPE
        title: "Order Cancelled",
        message: `Your order #${order.orderNumber} has been cancelled.`,
        link: `/my-orders/${order._id}`,
        priority: "medium",
      });
    } catch (notifError) {
      console.error("Notification error:", notifError);
    }

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order,
    });
  } catch (error) {
    next(error);
  }
};

// Get pending orders (admin)
exports.getPendingOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    // ✅ FIX: Validate pagination params
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20)); // Max 100 per page

    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find({ status: "Pending" })
        .populate("user", "fullName email phone")
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments({ status: "Pending" }),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.verifyPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // 1. Basic Validations
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    const order = await Order.findById(id).populate("user");

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (order.status !== "Pending") {
      return next(new AppError("Order is not pending", 400));
    }

    if (!order.transactionId) {
      return next(new AppError("No transaction ID found for this order", 400));
    }

    // 2. Check for Duplicate Transaction IDs
    const existingOrder = await Order.findOne({
      transactionId: order.transactionId,
      _id: { $ne: id },
      status: { $in: ["Verified", "Completed"] },
    });

    if (existingOrder) {
      return next(
        new AppError(
          "This transaction ID has already been verified for another order",
          400,
        ),
      );
    }

    // 3. Start Transaction Session
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Update order status (Make sure verifyPayment method can accept session if possible)
      await order.verifyPayment(adminId);

      // Process items (Products & Courses)
      for (const item of order.items) {
        if (item.itemType === "product") {
          const updatedProduct = await Product.findOneAndUpdate(
            {
              _id: item.itemId,
              stock: { $gte: item.quantity },
            },
            {
              $inc: { stock: -item.quantity, soldCount: item.quantity },
            },
            { session, new: true },
          );

          if (!updatedProduct) {
            throw new AppError(
              `Insufficient stock for product: ${item.itemId}`,
              400,
            );
          }
        } else if (item.itemType === "course") {
          await User.findByIdAndUpdate(
            order.user._id,
            {
              $addToSet: {
                purchasedCourses: {
                  course: item.itemId,
                  purchaseDate: new Date(),
                },
              },
            },
            { session },
          );

          await Course.findByIdAndUpdate(
            item.itemId,
            { $addToSet: { enrolledStudents: order.user._id } },
            { session },
          );
        }
      }

      // Apply coupon usage
      if (order.couponCode) {
        const coupon = await Coupon.findOne({ code: order.couponCode }).session(
          session,
        );
        if (coupon) {
          const alreadyUsed = coupon.usedBy.some(
            (usage) => usage.user.toString() === order.user._id.toString(),
          );

          if (!alreadyUsed) {
            await coupon.applyUsage(order.user._id, session);
          }
        }
      }

      await session.commitTransaction();
      session.endSession();

      // 4. Post-Transaction Actions (Notifications/Sockets)
      await Notification.create({
        recipient: order.user._id,
        type: "payment_verified",
        title: "Payment Verified! 🎉",
        message: `Your order #${order.orderNumber} has been verified.`,
        link: `/my-orders/${order._id}`,
      });

      const io = require("../socket/io").getIO();
      io.to(order.user._id.toString()).emit("payment_verified", {
        orderId: order._id,
        orderNumber: order.orderNumber,
      });

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        order,
      });
    } catch (error) {
      // If any logic fails during transaction, roll back changes
      await session.abortTransaction();
      session.endSession();

      return next(
        new AppError(
          error.message || "Transaction failed and rolled back",
          400,
        ),
      );
    }
  } catch (error) {
    // Catch-all for unexpected database crashes or server issues
    return next(new AppError("An internal server error occurred", 500));
  }
};

// Reject payment (admin)
exports.rejectPayment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    // Validate ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return next(new AppError("Invalid order ID format", 400));
    }

    // Validate reason
    if (!reason || reason.trim() === "") {
      return next(new AppError("Rejection reason is required", 400));
    }

    if (reason.trim().length < 10) {
      return next(
        new AppError("Rejection reason must be at least 10 characters", 400),
      );
    }

    const order = await Order.findById(id).populate("user");

    if (!order) {
      return next(new AppError("Order not found", 404));
    }

    if (order.status !== "Pending") {
      return next(new AppError("Only pending orders can be rejected", 400));
    }

    // Use model method
    await order.rejectPayment(reason.trim(), adminId);

    // Send notification to user
    await Notification.create({
      recipient: order.user._id,
      type: "payment_rejected",
      title: "Payment Rejected",
      message: `Your order #${order.orderNumber} payment was rejected. Reason: ${reason.trim()}`,
      link: `/my-orders/${order._id}`,
      priority: "high",
    });

    // Notify user via socket
    const io = require("../socket/io").getIO();
    io.to(order.user._id.toString()).emit("payment_rejected", {
      orderId: order._id,
      orderNumber: order.orderNumber,
      reason: reason.trim(),
    });

    res.status(200).json({
      success: true,
      message: "Payment rejected",
      order,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit) || 10));

    const query = {};

    // Status filter
    if (status) {
      const validStatuses = [
        "Pending",
        "Verified",
        "Rejected",
        "Processing",
        "Shipped",
        "Delivered",
        "Completed",
        "Cancelled",
      ];
      if (validStatuses.includes(status)) {
        query.status = status;
      }
    }

    // Search by order number
    if (search) {
      query.orderNumber = { $regex: search, $options: "i" };
    }

    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate("user", "fullName email phone")
        .sort("-createdAt")
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Order.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};
