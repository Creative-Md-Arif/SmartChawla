const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const Course = require('../models/courseModel');
const Notification = require('../models/notificationModel');
const { AppError } = require("../utils/errorHandler");

// Get dashboard stats
// adminController.js - getDashboardStats
exports.getDashboardStats = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const today = new Date();
    const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);

    // Basic counts
    const [
      totalUsers,
      totalOrders,
      totalProducts,
      totalCourses,
      pendingVerifications,
    ] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ isActive: true }),
      Course.countDocuments({ isPublished: true }),
      Order.countDocuments({ status: 'Pending' }),
    ]);

    // Revenue calculations
    const revenueStats = await Order.aggregate([
      { $match: { status: { $in: ['Verified', 'Completed'] } } },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$finalAmount' },
          totalDiscounts: { $sum: '$discountAmount' },
        },
      },
    ]);

    const totalRevenue = revenueStats[0]?.totalRevenue || 0;
    const totalDiscounts = revenueStats[0]?.totalDiscounts || 0;

    // FIXED: Use startDate instead of thirtyDaysAgo
    const salesData = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ['Verified', 'Completed'] },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          sales: { $sum: '$finalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Order status distribution
    const orderStatusData = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Top categories
    const topCategories = await Order.aggregate([
      { $match: { status: { $in: ['Verified', 'Completed'] } } },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'products',
          localField: 'items.itemId',
          foreignField: '_id',
          as: 'product',
        },
      },
      { $unwind: { path: '$product', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$product.category',
          totalSales: { $sum: '$items.priceAtPurchase' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalSales: -1 } },
      { $limit: 5 },
    ]);

    // Recent users
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(5)
      .select('fullName email createdAt');

    // Low stock products
    const lowStockProducts = await Product.find({
      stock: { $lte: 10 },
      isActive: true,
    })
      .sort('stock')
      .limit(5)
      .select('name stock sku price');

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOrders,
        totalProducts,
        totalCourses,
        pendingVerifications,
        totalRevenue,
        totalDiscounts,
        netRevenue: totalRevenue - totalDiscounts,
      },
      charts: {
        salesData,
        orderStatusData,
        topCategories,
      },
      recentUsers,
      lowStockProducts,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    next(error);
  }
};

// Get all users
// Get all users - UPDATED with status filter
exports.getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role, status } = req.query; // ✅ Added status

    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    
    // Role filter
    if (role) {
      query.role = role;
    }
    
    // ✅ ADDED: Status filter
    if (status) {
      if (status === 'active') {
        query.isActive = true;
      } else if (status === 'inactive') {
        query.isActive = false;
      } else if (status === 'pending') {
        query.isVerified = false;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find(query)
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit))
      .select('-password -verificationToken -resetPasswordToken')
      .lean();

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      users,
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

// Update user role
exports.updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return next(new AppError('User not found', 404));
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};

// Get sales report
exports.getSalesReport = async (req, res, next) => {
  try {
    const { startDate, endDate, format = 'json' } = req.query;

    const query = { status: { $in: ['Verified', 'Completed'] } };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find(query)
      .populate('user', 'fullName email')
      .populate('items.itemId', 'name title')
      .sort('-createdAt');

    if (format === 'csv') {
      // Generate CSV
      const csvData = orders.map((order) => ({
        orderNumber: order.orderNumber,
        date: order.createdAt,
        customer: order.user?.fullName,
        email: order.user?.email,
        totalAmount: order.totalAmount,
        discount: order.discountAmount,
        finalAmount: order.finalAmount,
        status: order.status,
        paymentMethod: order.paymentMethod,
      }));

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');
      // Convert to CSV and send
      // Implementation depends on CSV library
      return res.status(200).json(csvData);
    }

    // Calculate summary
    const summary = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, o) => sum + o.finalAmount, 0),
      totalDiscounts: orders.reduce((sum, o) => sum + o.discountAmount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.finalAmount, 0) / orders.length : 0,
    };

    res.status(200).json({
      success: true,
      summary,
      orders,
    });
  } catch (error) {
    next(error);
  }
};

// Get inventory alerts
exports.getInventoryAlerts = async (req, res, next) => {
  try {
    const lowStockProducts = await Product.find({
      stock: { $lte: 10 },
      isActive: true,
    })
      .sort('stock')
      .select('name stock sku price');

    const outOfStockProducts = await Product.find({
      stock: 0,
      isActive: true,
    }).select('name sku');

    res.status(200).json({
      success: true,
      lowStock: lowStockProducts,
      outOfStock: outOfStockProducts,
      totalAlerts: lowStockProducts.length + outOfStockProducts.length,
    });
  } catch (error) {
    next(error);
  }
};

// Get recent activities
exports.getRecentActivities = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Get recent orders
    const recentOrders = await Order.find()
      .sort('-createdAt')
      .limit(Number(limit))
      .populate('user', 'fullName')
      .select('orderNumber status createdAt user');

    // Get recent users
    const recentUsers = await User.find()
      .sort('-createdAt')
      .limit(Number(limit))
      .select('fullName createdAt');

    // Combine and sort activities
    const activities = [
      ...recentOrders.map((o) => ({
        type: 'order',
        description: `New order #${o.orderNumber} - ${o.status}`,
        user: o.user?.fullName,
        timestamp: o.createdAt,
      })),
      ...recentUsers.map((u) => ({
        type: 'user',
        description: 'New user registered',
        user: u.fullName,
        timestamp: u.createdAt,
      })),
    ]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, Number(limit));

    res.status(200).json({
      success: true,
      activities,
    });
  } catch (error) {
    next(error);
  }
};

// Send notification to users
exports.sendNotification = async (req, res, next) => {
  try {
    const { title, message, type, recipients, link } = req.body;

    let notificationData = {
      title,
      message,
      type,
      link,
      priority: 'medium',
    };

    if (recipients === 'all') {
      // Broadcast notification
      await Notification.createBroadcast(notificationData);

      // Send to all connected users via socket
      const io = require('../socket/io').getIO();
      io.emit('notification', notificationData);
    } else {
      // Send to specific users
      const userIds = Array.isArray(recipients) ? recipients : [recipients];

      for (const userId of userIds) {
        await Notification.create({
          ...notificationData,
          recipient: userId,
        });

        // Send via socket
        const io = require('../socket/io').getIO();
        io.to(userId).emit('notification', notificationData);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Notification sent successfully', 
    });
  } catch (error) {
    next(error);
  }
};


exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Prevent self-deletion
    if (id === req.user.id) {
      return next(new AppError("You cannot delete your own account", 400));
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Update user details (admin can update any user)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, isActive, isVerified } = req.body;

    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (email) updateData.email = email.toLowerCase().trim();
    if (phone) updateData.phone = phone.trim();
    if (typeof isActive === "boolean") updateData.isActive = isActive;
    if (typeof isVerified === "boolean") updateData.isVerified = isVerified;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password -verificationToken -resetPasswordToken");

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user,
      message: "User updated successfully",
    });
  } catch (error) {
    next(error);
  }
};

// Toggle user active status
exports.toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return next(new AppError("User not found", 404));
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        isActive: user.isActive,
      },
      message: `User ${user.isActive ? "activated" : "deactivated"} successfully`,
    });
  } catch (error) {
    next(error);
  }
};

// Get single user details
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .select("-password -verificationToken -resetPasswordToken")
      .populate("purchasedCourses.course", "title thumbnail")
      .lean();

    if (!user) {
      return next(new AppError("User not found", 404));
    }

    // Get order history
    const orders = await Order.find({ user: id })
      .sort("-createdAt")
      .select("orderNumber totalAmount status createdAt")
      .limit(5);

    res.status(200).json({
      success: true,
      user: {
        ...user,
        recentOrders: orders,
      },
    });
  } catch (error) {
    next(error);
  }
};

