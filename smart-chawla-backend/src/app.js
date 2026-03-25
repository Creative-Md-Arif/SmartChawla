const express = require('express');
const morgan = require('morgan');
const { setupSecurity } = require('./middlewares/security');
const { globalErrorHandler, notFound } = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const courseRoutes = require('./routes/courseRoutes');
const orderRoutes = require('./routes/orderRoutes');
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const bannerRoutes = require('./routes/bannerRoutes');
const couponRoutes = require('./routes/couponRoutes');

const app = express();

// Setup security middleware
setupSecurity(app);

// Body parser
app.use(express.json({ limit: "2gb" })); 
app.use(
  express.urlencoded({
    extended: true,
    limit: "2gb", 
    parameterLimit: 10000,
  }),
);



// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/courses', courseRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/categories', categoryRoutes);
app.use('/api/v1/banners', bannerRoutes);
app.use('/api/v1/coupons', couponRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to Smart Chawla API',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// 404 handler
app.use(notFound);

// Global error handler
app.use(globalErrorHandler);

module.exports = app;
