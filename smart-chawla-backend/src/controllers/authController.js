const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { sendEmail, getEmailTemplate } = require("../utils/sendEmail");
const { cloudinary, uploadToCloudinary } = require("../config/cloudinary");
const { AppError } = require("../utils/errorHandler");
const { cleanupFiles } = require("../middlewares/upload");

// Validation helper functions
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) return "Email is required";
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return null;
};

const validatePassword = (password) => {
  if (!password) return "Password is required";
  if (password.length < 6) return "Password must be at least 6 characters";
  return null;
};

const validatePhone = (phone) => {
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phone) return "Phone number is required";
  if (!phoneRegex.test(phone))
    return "Please enter a valid Bangladeshi phone number (01XXXXXXXXX)";
  return null;
};

const validateName = (name) => {
  if (!name || !name.trim()) return "Full name is required";
  if (name.trim().length < 3) return "Full name must be at least 3 characters";
  return null;
};

// Register new user
exports.register = async (req, res, next) => {
  try {
    const { fullName, email, password, phone } = req.body;

    const errors = {};
    const nameError = validateName(fullName);
    if (nameError) errors.fullName = nameError;
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const phoneError = validatePhone(phone);
    if (phoneError) errors.phone = phoneError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists with this email",
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone,
    });

    // Generate verification token
    const otp = user.generateVerificationOTP();
    await user.save({ validateBeforeSave: false });

    // Send verification email
    // Send OTP via email
    const emailContent = `
      <h2>Welcome to Smart Chawla!</h2>
      <p>Hi ${fullName},</p>
      <p>Thank you for registering. Please use the following OTP to verify your email:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This OTP will expire in <strong>5 minutes</strong>.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Email Verification OTP - Smart Chawla",
        htmlContent: getEmailTemplate(emailContent),
      });

      res.status(201).json({
        success: true,
        message: "Registration successful. Please check your email for OTP.",
        email: email, // Frontend এ দেখানোর জন্য
        otpSent: true,
      });
    } catch (error) {
      user.verificationOTP = undefined;
      user.verificationOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Error sending verification email",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Login user
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validation
    const errors = {};
    const emailError = validateEmail(email);
    if (emailError) errors.email = emailError;
    const passwordError = validatePassword(password);
    if (passwordError) errors.password = passwordError;
    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    // Check if email is verified
    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your email before logging in",
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Generate tokens
    const token = user.generateJWT();
    const refreshToken = user.generateRefreshToken();

    res.status(200).json({
      success: true,
      token,
      refreshToken,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isVerified: user.isVerified,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const { fullName, phone } = req.body;
    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (phone) updateData.phone = phone.trim();

    // Find current user
    const user = await User.findById(req.user.id);
    if (!user) return next(new AppError("User not found", 404));

    // Handle Avatar Upload
    if (req.file) {
      // Delete old avatar if it exists in Cloudinary
      if (user.avatar && user.avatar.includes("cloudinary")) {
        const publicId = user.avatar.split("/").pop().split(".")[0];
        await cloudinary.uploader
          .destroy(`smart-chawla/avatars/${publicId}`)
          .catch(() => {});
      }

      try {
        const result = await uploadToCloudinary(
          req.file.path,
          "smart-chawla/avatars",
          "image",
        );
        updateData.avatar = result.secure_url;
      } finally {
        cleanupFiles([req.file]);
      }
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateData, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    next(error);
  }
};

// Logout user
exports.logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

// Forgot password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({
        success: false,
        message: emailError,
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found with this email",
      });
    }

    // Generate reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false });

    // Send reset email
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    const emailContent = `
      <h2>Password Reset Request</h2>
      <p>Hi ${user.fullName},</p>
      <p>You requested a password reset. Click the button below to reset your password:</p>
      <a href="${resetUrl}" class="button">Reset Password</a>
      <p>Or copy this link: ${resetUrl}</p>
      <p>This link will expire in 30 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        to: email,
        subject: "Password Reset - Smart Chawla",
        htmlContent: getEmailTemplate(emailContent),
      });

      res.status(200).json({
        success: true,
        message: "Password reset email sent",
      });
    } catch (error) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Error sending email",
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Reset password
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Validation
    const passwordError = validatePassword(password);
    if (passwordError) {
      return res.status(400).json({
        success: false,
        message: passwordError,
      });
    }

    // Hash token
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message:
        "Password reset successful. Please login with your new password.",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Verify email
exports.verifyEmailWithOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and OTP",
      });
    }

    // Find user with OTP
    const user = await User.findOne({
      email: email.toLowerCase(),
    }).select("+verificationOTP +verificationOTPExpire");

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Check if OTP expired
    if (
      !user.verificationOTPExpire ||
      user.verificationOTPExpire < Date.now()
    ) {
      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new one.",
        expired: true,
      });
    }

    // Hash provided OTP and compare
    const hashedOTP = require("crypto")
      .createHash("sha256")
      .update(otp)
      .digest("hex");

    if (hashedOTP !== user.verificationOTP) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Verify user
    user.isVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Refresh token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    );
    const user = await User.findById(decoded.id);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Invalid refresh token",
      });
    }

    const newToken = user.generateJWT();

    res.status(200).json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid refresh token",
    });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate("purchasedCourses.course", "title thumbnail slug")
      .populate("cartItems.itemId")
      .select("-password -verificationToken -resetPasswordToken"); // addresses already included

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Change password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      return res.status(400).json({
        success: false,
        message: newPasswordError,
      });
    }

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};
// Add these methods to your existing userController.js

exports.addAddress = async (req, res, next) => {
  try {
    const { fullName, phone, address, city, district, postalCode, isDefault } =
      req.body;

    const user = await User.findById(req.user.id);

    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr) => (addr.isDefault = false));
    }

    user.addresses.push({
      fullName,
      phone,
      address,
      city,
      district,
      postalCode,
      isDefault: isDefault || false,
    });

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address added successfully",
      address: user.addresses[user.addresses.length - 1],
    });
  } catch (error) {
    next(error);
  }
};

// ADDED: Update address
exports.updateAddress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { fullName, phone, address, city, district, postalCode, isDefault } =
      req.body;

    const user = await User.findById(req.user.id);
    const addrIndex = user.addresses.findIndex((a) => a._id.toString() === id);

    if (addrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      user.addresses.forEach((addr, idx) => {
        if (idx !== addrIndex) addr.isDefault = false;
      });
    }

    // Update fields
    if (fullName) user.addresses[addrIndex].fullName = fullName;
    if (phone) user.addresses[addrIndex].phone = phone;
    if (address) user.addresses[addrIndex].address = address;
    if (city) user.addresses[addrIndex].city = city;
    if (district) user.addresses[addrIndex].district = district;
    if (postalCode) user.addresses[addrIndex].postalCode = postalCode;
    if (typeof isDefault === "boolean")
      user.addresses[addrIndex].isDefault = isDefault;

    await user.save();

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: user.addresses[addrIndex],
    });
  } catch (error) {
    next(error);
  }
};

// ADDED: Delete address
exports.deleteAddress = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(req.user.id);
    const addrIndex = user.addresses.findIndex((a) => a._id.toString() === id);

    if (addrIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    user.addresses.splice(addrIndex, 1);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

exports.resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new OTP
    const otp = user.generateVerificationOTP();
    await user.save({ validateBeforeSave: false });

    const emailContent = `
      <h2>Email Verification OTP - Smart Chawla</h2>
      <p>Hi ${user.fullName},</p>
      <p>Your new verification OTP is:</p>
      <div style="background: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <h1 style="color: #4f46e5; font-size: 32px; letter-spacing: 8px; margin: 0;">${otp}</h1>
      </div>
      <p>This OTP will expire in <strong>10 minutes</strong>.</p>
    `;

    try {
      await sendEmail({
        to: user.email,
        subject: "New Verification OTP - Smart Chawla",
        htmlContent: getEmailTemplate(emailContent),
      });

      res.status(200).json({
        success: true,
        message: "New OTP sent successfully",
      });
    } catch (error) {
      user.verificationOTP = undefined;
      user.verificationOTPExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Error sending OTP email",
      });
    }
  } catch (error) {
    next(error);
  }
};
