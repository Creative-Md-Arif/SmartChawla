import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Mail, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { loginUser } from "../../redux/slices/authSlice";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { loading, error: apiError } = useSelector((state) => state.auth);

  const from = location.state?.from?.pathname || "/dashboard";

  // Validation rules
  const validateEmail = (email) => {
    if (!email || !email.trim()) return "Email is required";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (password) => {
    if (!password) return "Password is required";
    if (password.length < 6) return "Password must be at least 6 characters";
    return "";
  };

  // Validate single field
  const validateField = useCallback((name, value) => {
    if (name === "email") return validateEmail(value);
    if (name === "password") return validatePassword(value);
    return "";
  }, []);

  // Validate entire form
  const validateForm = useCallback(() => {
    const emailError = validateEmail(formData.email);
    const passwordError = validatePassword(formData.password);

    const newErrors = {};
    if (emailError) newErrors.email = emailError;
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    setIsFormValid(!emailError && !passwordError);
    return !emailError && !passwordError;
  }, [formData]);

  // Real-time validation when form data changes
  useEffect(() => {
    validateForm();
  }, [formData, validateForm]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear API error when user types
    if (apiError) {
      // This will trigger a re-render without the API error
    }
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));

    // Validate on blur
    const error = validateField(name, formData[name]);
    setErrors((prev) => ({
      ...prev,
      [name]: error,
    }));
  };

  const handleFocus = (e) => {
    const { name } = e.target;
    // Remove error when user focuses on field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({ email: true, password: true });

    // Final validation before API call
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    try {
      const result = await dispatch(loginUser(formData));

      if (result.meta.requestStatus === "fulfilled") {
        // Check if email is verified
        if (!result.payload.user.isVerified) {
          setErrors({
            general:
              "Please verify your email first. Check your inbox for the verification link.",
          });
          return;
        }

        // Success - navigate
        navigate(from, { replace: true });
      }
      // If rejected, error will be in Redux state and displayed below
    } catch (err) {
      console.error("Login error:", err);
    }
  };

  // Determine which error to show for each field
  const getFieldError = (fieldName) => {
    if (touched[fieldName] || !isFormValid) {
      return errors[fieldName];
    }
    return "";
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-lg">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-purple-600" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your Smart Chawla account
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate>
          {/* General Error Message */}
          {(errors.general || apiError) && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">
                  {errors.general || apiError}
                </p>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div className="space-y-1">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={`block w-full pl-10 pr-3 py-3 border ${
                  getFieldError("email")
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors`}
                placeholder="you@example.com"
              />
            </div>
            {getFieldError("email") && (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {getFieldError("email")}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-1">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                onBlur={handleBlur}
                onFocus={handleFocus}
                className={`block w-full pl-10 pr-10 py-3 border ${
                  getFieldError("password")
                    ? "border-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-purple-500 focus:border-purple-500"
                } rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 transition-colors`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            {getFieldError("password") && (
              <p className="text-sm text-red-600 flex items-center mt-1">
                <AlertCircle className="h-4 w-4 mr-1" />
                {getFieldError("password")}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-900"
              >
                Remember me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-purple-600 hover:text-purple-500"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading || !isFormValid}
            className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white ${
              isFormValid
                ? "bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                : "bg-gray-400 cursor-not-allowed"
            } transition-colors`}
          >
            {loading ? (
              <div className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Signing in...
              </div>
            ) : (
              "Sign In"
            )}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-medium text-purple-600 hover:text-purple-500"
            >
              Create one now
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
