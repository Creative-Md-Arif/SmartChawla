// components/auth/Register.jsx
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Helmet } from "react-helmet";
import {
  registerUser,
  clearError,
  setRegistrationEmail,
} from "../../redux/slices/authSlice";
import { User, Mail, Phone, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import InputField from "../../components/form/InputField";

const Register = () => {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [agreed, setAgreed] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, registrationEmail } = useSelector(
    (state) => state.auth,
  );

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Redirect to OTP if registration successful
  useEffect(() => {
    if (registrationEmail) {
      navigate("/verify-otp", {
        state: { email: registrationEmail },
      });
    }
  }, [registrationEmail, navigate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim() || formData.fullName.length < 3) {
      errors.fullName = "Full name must be at least 3 characters";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      errors.email = "Please enter a valid email";
    }

    const phoneRegex = /^01[3-9]\d{8}$/;
    if (!phoneRegex.test(formData.phone)) {
      errors.phone = "Valid Bangladesh number: 01XXXXXXXXX";
    }

    if (formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear field error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;
    if (!agreed) return;

    const { confirmPassword, ...submitData } = formData;

    const result = await dispatch(registerUser(submitData));

    if (result.meta.requestStatus === "fulfilled") {
      // Email stored in Redux, useEffect will redirect
      dispatch(setRegistrationEmail(result.payload.email));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Create Account | Smart Chawla</title>
        <meta
          name="description"
          content="Join Smart Chawla today. Create your account to access exclusive products, courses, and seamless shopping experience."
        />
        <meta
          name="keywords"
          content="Smart Chawla, Register, Sign Up, Create Account, E-commerce Bangladesh"
        />
        <link rel="canonical" href="https://smart-chawla.vercel.app/register" />
        <meta property="og:title" content="Create Account | Smart Chawla" />
        <meta
          property="og:description"
          content="Join Smart Chawla today. Create your account to access exclusive products and courses."
        />
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        <div className="text-center px-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            Create Account
          </h1>
          <p className="mt-1.5 sm:mt-2 text-sm sm:text-base text-gray-600">
            Join Smart Chawla today
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4 sm:space-y-6 bg-white p-4 sm:p-5 md:p-8 rounded-xl shadow-lg"
        >
          {/* Global Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 sm:px-4 sm:py-3 rounded-lg flex items-center gap-2">
              <span className="text-[13px] sm:text-sm">{error}</span>
            </div>
          )}

          {/* Full Name */}
          <InputField
            label="Full Name"
            name="fullName"
            placeholder="Full name"
            value={formData.fullName}
            onChange={handleChange}
            leftIcon={User}
            error={validationErrors.fullName}
            required
          />

          {/* Email */}
          <InputField
            label="Email"
            name="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            leftIcon={Mail}
            error={validationErrors.email}
            required
          />

          {/* Phone */}
          <InputField
            label="Phone Number"
            name="phone"
            type="tel"
            placeholder="01XXXXXXXXX"
            value={formData.phone}
            onChange={handleChange}
            leftIcon={Phone}
            error={validationErrors.phone}
            required
          />

          {/* Password */}
          <div className="relative">
            <InputField
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              leftIcon={Lock}
              error={validationErrors.password}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
             className="absolute right-4 bottom-[12px] sm:bottom-[14px] text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
            {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative">
            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirm password"
              value={formData.confirmPassword}
              onChange={handleChange}
              leftIcon={Lock}
              error={validationErrors.confirmPassword}
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 bottom-[12px] sm:bottom-[14px] text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
              aria-label={
                showConfirmPassword
                  ? "Hide confirm password"
                  : "Show confirm password"
              }
            >
             {showPassword ? <EyeOff size={18} strokeWidth={2.5} /> : <Eye size={18} strokeWidth={2.5} />}
            </button>
          </div>

          {/* Terms Checkbox */}
          <label className="flex items-start gap-2 sm:gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="w-4 h-4 sm:w-5 sm:h-5 mt-1 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
            />
            <span className="text-[12px] sm:text-sm text-gray-600 leading-tight">
              I agree to the{" "}
              <Link
                to="#"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Terms
              </Link>{" "}
              and{" "}
              <Link
                to="#"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Privacy Policy
              </Link>
            </span>
          </label>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !agreed}
            aria-label={
              loading
                ? "Creating your account"
                : "Create your Smart Chawla account"
            }
            title={
              !agreed
                ? "Please agree to the terms and conditions"
                : "Create Account"
            }
            className="w-full py-3 px-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
                <span>Creating...</span>
              </>
            ) : (
              "Create Account"
            )}
          </button>

          {/* Login Link */}
          <p className="text-center text-[13px] sm:text-sm text-gray-600 mt-2">
            Have an account?{" "}
            <Link
              to="/login"
              className="text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
