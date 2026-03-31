// components/auth/OTPVerification.jsx
import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { verifyOTP, resendOTP, clearError } from "../../redux/slices/authSlice";
import {
  Mail,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { Helmet } from "react-helmet";

const OTPVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  // Redux state থেকে email নিন, না পেলে location state থেকে নিন
  const {
    registrationEmail: reduxEmail,
    otpLoading,
    otpError,
    otpVerified,
  } = useSelector((state) => state.auth);

  const [email, setEmail] = useState(reduxEmail || location.state?.email || "");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [countdown, setCountdown] = useState(300);
  const [canResend, setCanResend] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const inputRefs = useRef([]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0 && !canResend) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      setCanResend(true);
    }
  }, [countdown, canResend]);

  // Auto-focus first input
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Clear errors on mount
  useEffect(() => {
    dispatch(clearError());
  }, [dispatch]);

  // Handle Redux errors
  useEffect(() => {
    if (otpError) {
      setLocalError(otpError);
      // Clear inputs on error
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
  }, [otpError]);

  // Handle successful verification
  useEffect(() => {
    if (otpVerified) {
      setSuccessMessage("Email verified successfully!");
      setTimeout(() => navigate("/login"), 2000);
    }
  }, [otpVerified, navigate]);

  const handleChange = (index, value) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setLocalError(""); // Clear error on input

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }

    // Auto-submit when all filled
    if (index === 5 && value) {
      const fullOtp = [...newOtp.slice(0, 5), value].join("");
      if (fullOtp.length === 6) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    // Allow arrow navigation
    if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1].focus();
    }
    if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!pastedData) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, idx) => {
      if (idx < 6) newOtp[idx] = char;
    });
    setOtp(newOtp);
    setLocalError("");

    // Focus appropriate input or submit if complete
    const focusIndex = Math.min(pastedData.length, 5);
    if (pastedData.length === 6) {
      handleVerify(pastedData);
    } else {
      inputRefs.current[focusIndex].focus();
    }
  };

  const handleVerify = async (fullOtp = null) => {
    const otpCode = fullOtp || otp.join("");

    if (otpCode.length !== 6) {
      setLocalError("Please enter complete 6-digit OTP");
      return;
    }

    if (!email) {
      setLocalError("Email not found. Please register again.");
      return;
    }

    setLocalError("");

    const result = await dispatch(verifyOTP({ email, otp: otpCode }));

    if (result.meta.requestStatus === "rejected") {
      // Error handled by useEffect
    }
  };

  const handleResend = async () => {
    if (!email) {
      setLocalError("Email not found. Please register again.");
      return;
    }

    setLocalError("");
    const result = await dispatch(resendOTP(email));

    if (result.meta.requestStatus === "fulfilled") {
      setSuccessMessage("New OTP sent successfully!");
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0].focus();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(""), 3000);
    }
  };

  // If no email, show error state
  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <AlertCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Session Expired
          </h2>
          <p className="text-gray-600 mb-6">
            We couldn't find your registration details. Please register again.
          </p>
          <button
            onClick={() => navigate("/register")}
            className="w-full py-3 px-4 bg-indigo-600 text-white font-medium rounded-lg
              hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Registration
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Helmet>
        <title>Verify OTP | Smart Chawla</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://smart-chawla.vercel.app/verify-otp" />
      </Helmet>

      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="h-8 w-8 text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Verify Your Email
          </h1>
          <p className="mt-2 text-gray-600">
            We've sent a 6-digit verification code to
          </p>
          <p className="mt-1 font-medium text-indigo-600 bg-indigo-50 inline-block px-3 py-1 rounded-full">
            {email}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {otpVerified ? (
            // Success State
            <div className="text-center py-4">
              <div className="mx-auto h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">
                Verification Successful!
              </h3>
              <p className="text-gray-600 mb-4">
                Your email has been verified. Redirecting to login...
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full animate-pulse w-full"></div>
              </div>
            </div>
          ) : (
            <>
              {/* OTP Inputs */}
              <div className="flex justify-center gap-2 mb-6">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    disabled={otpLoading}
                    className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg 
                      focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200
                      transition-all duration-200
                      ${localError ? "border-red-500 bg-red-50" : "border-gray-300"}
                      ${digit ? "border-indigo-400 bg-indigo-50" : "bg-white"}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
                  />
                ))}
              </div>

              {/* Error Message */}
              {localError && (
                <div
                  className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 
                  flex items-center gap-2 text-red-600 text-sm"
                >
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{localError}</span>
                </div>
              )}

              {/* Success Message */}
              {successMessage && (
                <div
                  className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 
                  flex items-center gap-2 text-green-600 text-sm"
                >
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Verify Button */}
              <button
                onClick={() => handleVerify()}
                disabled={otpLoading || otp.join("").length !== 6}
                aria-label={
                  otpLoading
                    ? "Verifying your 6-digit code"
                    : "Submit OTP for email verification"
                }
                title={
                  otp.join("").length !== 6
                    ? "Please enter the full 6-digit code"
                    : "Click to Verify"
                }
                className="w-full py-3.5 px-4 bg-indigo-600 text-white font-semibold rounded-lg
                  hover:bg-indigo-700 active:bg-indigo-800 
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all duration-200 flex items-center justify-center gap-2
                  shadow-md hover:shadow-lg"
              >
                {otpLoading ? (
                  <>
                    <RefreshCw className="animate-spin h-5 w-5" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </button>

              {/* Resend Section */}
              <div className="mt-6 text-center space-y-3">
                <p className="text-sm text-gray-600">
                  Didn't receive the code?
                </p>

                {canResend ? (
                  <button
                    onClick={handleResend}
                    disabled={otpLoading}
                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm
                      disabled:opacity-50 flex items-center justify-center gap-2 mx-auto
                      hover:underline transition-all"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${otpLoading ? "animate-spin" : ""}`}
                    />
                    {otpLoading ? "Sending..." : "Resend OTP"}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500">
                    Resend available in{" "}
                    <span className="font-semibold text-indigo-600">
                      {countdown}s
                    </span>
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => navigate("/register")}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 
                    flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Registration
                </button>
              </div>
            </>
          )}
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-gray-500">
          Check your spam folder if you don't see the email in your inbox.
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
