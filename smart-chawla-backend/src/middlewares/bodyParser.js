const express = require("express");

// 🔥 Dynamic limit based on route
const dynamicBodyParser = (req, res, next) => {
  // Course routes - skip JSON parser (Multer handles multipart)
  if (req.path.includes("/courses") && req.method !== "GET") {
    // Check if multipart
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return next(); // Skip - Multer will handle
    }
  }

  // Default JSON parser for other routes
  express.json({ limit: "10mb" })(req, res, next);
};

const dynamicUrlEncoded = (req, res, next) => {
  if (req.path.includes("/courses") && req.method !== "GET") {
    if (req.headers["content-type"]?.includes("multipart/form-data")) {
      return next();
    }
  }

  express.urlencoded({ extended: true, limit: "10mb" })(req, res, next);
};

module.exports = { dynamicBodyParser, dynamicUrlEncoded };
