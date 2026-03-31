import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Loader2, AlertCircle } from "lucide-react";
import { Helmet } from "react-helmet";
import InputField from "../../components/form/InputField";
import axiosInstance from "../../utils/axiosInstance";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axiosInstance.post("/auth/forgot-password", { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fff9] py-8 px-4">
        <Helmet>
          <title>Email Sent | Smart Chawla</title>
          <meta name="robots" content="noindex, nofollow" />
        </Helmet>
        <div className="w-full max-w-sm bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(34,197,94,0.1)] border border-green-50 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-green-500"></div>

          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 ring-8 ring-green-50 animate-bounce-short">
            <Mail className="w-8 h-8" />
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Check Your Email!
          </h2>

          <p className="mt-3 text-[13px] sm:text-base text-gray-500 leading-relaxed px-1">
            We've sent a password reset link to <br className="sm:hidden" />
            <strong className="text-green-600 break-all"> {email}</strong>
          </p>

          {/* অ্যাকশন বাটন */}
          <div className="mt-8">
            <Link
              to="/login"
              className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 bg-gray-900 text-white text-sm font-bold rounded-xl hover:bg-gray-800 transition-all active:scale-95 shadow-lg shadow-gray-200"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </Link>
          </div>

          {/* নিচের ছোট নোট */}
          <p className="mt-6 text-[11px] text-gray-400">
            Didn't receive the email? Check your spam folder.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#fdfaff] py-4 px-3 sm:py-6 sm:px-6 md:px-8">
      <Helmet>
        <title>Forgot Password | Smart Chawla</title>
        <meta
          name="description"
          content="Recover your Smart Chawla account password by entering your email address."
        />
        <link rel="canonical" href="https://smart-chawla.vercel.app/forgot-password" />
      </Helmet>
      <div className="w-full max-w-md bg-white p-5 sm:p-8 rounded-[2rem] shadow-[0_20px_50px_rgba(126,34,206,0.08)] border border-purple-50">
        <div className="text-center space-y-1.5">
          <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 ring-4 ring-purple-50">
            <Mail size={24} />
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Forgot Password?
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 leading-snug px-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-[11px] sm:text-sm px-3 py-2.5 rounded-xl flex items-center gap-2 animate-shake">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="relative group">
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={Mail}
              required
              className="text-sm transition-all duration-300"
            />
          </div>

          {/* সাবমিট বাটন - গ্লসি ইফেক্ট */}
          <button
            type="submit"
            disabled={loading}
            aria-label="Send password reset link"
            className="w-full py-3.5 px-4 bg-purple-600 text-white font-bold rounded-2xl hover:bg-purple-700 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 transition-all duration-300 shadow-lg shadow-purple-200 text-sm flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Sending...</span>
              </div>
            ) : (
              "Send Reset Link"
            )}
          </button>

          {/* ব্যাক টু লগইন */}
          <p className="text-center text-[12px] sm:text-sm text-gray-500 font-medium">
            Back to{" "}
            <Link
              to="/login"
              className="text-purple-600 hover:text-purple-700 font-bold underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
