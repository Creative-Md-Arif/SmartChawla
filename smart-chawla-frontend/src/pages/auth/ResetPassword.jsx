import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";
import InputField from "../../components/form/InputField";
import axiosInstance from "../../utils/axiosInstance";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await axiosInstance.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate("/login"), 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center bg-[#f8fff9] py-8 px-4">
        {/* ৩২০px এর জন্য প্রিমিয়াম মডার্ন সাকসেস কার্ড */}
        <div className="w-full max-w-sm bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-[0_20px_50px_rgba(34,197,94,0.12)] border border-green-50 text-center relative overflow-hidden">
          {/* টপ সাকসেস ইন্ডিকেটর লাইন */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-emerald-500"></div>

          {/* এনিমেটেড সাকসেস আইকন */}
          <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 ring-8 ring-green-50 animate-bounce-short">
            <svg
              className="w-8 h-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>

          {/* মেইন টেক্সট */}
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
            Password Reset <br className="sm:hidden" /> Successful!
          </h2>

          {/* রিডাইরেক্ট মেসেজ উইথ লোডার */}
          <div className="mt-4 flex flex-col items-center gap-3">
            <p className="text-[13px] sm:text-base text-gray-500 font-medium">
              Redirecting to login...
            </p>

            {/* ছোট একটি প্রগ্রেস বার বা ডট লোডার */}
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce"></span>
            </div>
          </div>

          {/* নিচের নোট */}
          <p className="mt-8 text-[11px] text-gray-400 italic">
            Please wait a few seconds.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-[#fcfaff] py-6 px-4">
      <div className="w-full max-w-md bg-white p-6 sm:p-8 rounded-[2.5rem] shadow-[0_20px_50px_rgba(126,34,206,0.1)] border border-purple-50 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-purple-500 to-indigo-500"></div>

        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-gradient-to-tr from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 shadow-inner">
            <Lock size={28} strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Reset Password
          </h2>
          <p className="text-[12px] sm:text-sm text-gray-500 font-medium">
            Secure your account with a new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {/* এরর মেসেজ - স্লিম লুক */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded-r-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
              <AlertCircle size={16} className="text-red-500 shrink-0" />
              <span className="text-[11px] sm:text-sm text-red-600 font-semibold">
                {error}
              </span>
            </div>
          )}

          {/* Input Fields - ৩২০px এর জন্য টাইট স্পেসিং */}
          <div className="space-y-3 sm:space-y-4">
            <InputField
              label="New Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={Lock}
              required
            />

            <InputField
              label="Confirm Password"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={ShieldCheck} // মডার্ন লুকের জন্য আইকন পরিবর্তন (অপশনাল)
              required
            />
          </div>

          {/* সাবমিট বাটন - গ্লসি গ্রেডিয়েন্ট */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-2xl hover:opacity-90 active:scale-[0.98] disabled:opacity-50 transition-all duration-300 shadow-lg shadow-purple-200 text-sm sm:text-base mt-2 flex items-center justify-center"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="animate-spin" size={18} />
                <span>Resetting...</span>
              </div>
            ) : (
              "Save New Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
