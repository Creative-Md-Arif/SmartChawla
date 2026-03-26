const { AppError } = require("../utils/errorHandler");

// Authorize specific roles - admin has access to everything
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Please login first", 401));
    }

    // Admin has access to everything, regardless of required roles
    if (req.user.role === "admin") {
      return next();
    }

    // For non-admin users, check if their role is in the allowed list
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403),
      );
    }

    next();
  };
};

exports.protect = (req, res, next) => {
  if (!req.user) {
    return next(new AppError("Please login first", 401));
  }
  next();
};
