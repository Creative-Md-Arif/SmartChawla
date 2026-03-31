import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Helmet } from "react-helmet";

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying");

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/auth/verify-email/${token}`;

        const response = await axios.get(fullUrl);

        if (response.data.success) {
          setStatus("success");
          setTimeout(() => navigate("/login"), 3000);
        }
      } catch (error) {
        setStatus("error");
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus("error");
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      {/* SEO Meta Tags */}
      <Helmet>
        <title>Email Verification | Smart Chawla</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === "verifying" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <h1 className="text-2xl font-bold text-gray-800">
              Verifying Email...
            </h1>
            <p className="text-gray-600 mt-2">
              Please wait while we verify your email address.
            </p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="text-green-500 text-5xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Email Verified!
            </h2>
            <p className="text-gray-600 mt-2">
              Your email has been successfully verified. Redirecting to login
              page...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div className="text-red-500 text-5xl mb-4">✗</div>
            <h2 className="text-2xl font-bold text-gray-800">
              Verification Failed
            </h2>
            <p className="text-gray-600 mt-2">
              The verification link is invalid or has expired.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Go to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
