// app.js
const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const compression = require("compression");
const { setupSecurity } = require("./middlewares/security");
const { globalErrorHandler, notFound } = require("./utils/errorHandler");

// Import routes
const authRoutes = require("./routes/authRoutes");
const productRoutes = require("./routes/productRoutes");
const courseRoutes = require("./routes/courseRoutes");
const orderRoutes = require("./routes/orderRoutes");
const adminRoutes = require("./routes/adminRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const couponRoutes = require("./routes/couponRoutes");

const app = express();

app.use(
  compression({
    level: 6,
    threshold: 1024,
  }),
);

app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL,
      "http://localhost:5173",
      "https://smart-chawla.vercel.app",
    ].filter(Boolean),
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

setupSecurity(app);

// ✅ 3. Body parser
app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    return next();
  }
  express.json({ limit: "10mb" })(req, res, next);
});

app.use((req, res, next) => {
  if (req.headers["content-type"]?.includes("multipart/form-data")) {
    return next();
  }
  express.urlencoded({ extended: true, limit: "10mb", parameterLimit: 1000 })(
    req,
    res,
    next,
  );
});

app.use((req, res, next) => {
  // API routes কে short cache
  if (
    req.path.startsWith("/api/v1/products") ||
    req.path.startsWith("/api/v1/courses") ||
    req.path.startsWith("/api/v1/orders") ||
    req.path.startsWith("/api/v1/admin") ||
    req.path.startsWith("/api/v1/categories") ||
    req.path.startsWith("/api/v1/banners") ||
    req.path.startsWith("/api/v1/coupons") ||
    req.path.startsWith("/api/v1/auth")
  ) {
    res.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  }
  next();
});

// ✅ 4. Logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ✅ 5. Health check
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ✅ 6. API routes
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/courses", courseRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/admin", adminRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/banners", bannerRoutes);
app.use("/api/v1/coupons", couponRoutes);

// ✅ 7. Root endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to Smart Chawla API",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// ✅ 8. Error handlers (সবার শেষে)
app.use(notFound);
app.use(globalErrorHandler);

module.exports = app;
