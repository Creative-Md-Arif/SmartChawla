/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // মেইন ব্র্যান্ড কালার (প্রিমিয়াম পার্পল + টি-গ্রিন এর হালকা টাচ)
        primary: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6", // Brand Primary
          600: "#7c3aed", // Hover Color
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
        },
        // সেকেন্ডারি কালার (চা বা ন্যাচারাল ভাইব এর জন্য হালকা অলিভ/গ্রিন)
        secondary: {
          50: "#f0fdf4",
          500: "#22c55e", // Success/Nature
          600: "#16a34a",
        },
        // টেক্সট এবং ব্যাকগ্রাউন্ড কালার
        neutral: {
          50: "#f8fafc", // মেইন বডি ব্যাকগ্রাউন্ড
          100: "#f1f5f9", // কার্ড ব্যাকগ্রাউন্ড
          800: "#1e293b", // মেইন হেডিং টেক্সট
          900: "#0f172a", // ডার্ক টেক্সট
        },
        accent: "#f59e0b", // অর্ডারের নোটিফিকেশন বা সেলের জন্য আম্বার/গোল্ডেন
      },
      fontFamily: {
        // 'Inter' আধুনিক লুকের জন্য, 'Hind Siliguri' বাংলার জন্য বেস্ট
        sans: ["Inter", "system-ui", "sans-serif"],
        bangla: ["Hind Siliguri", "Noto Sans Bengali", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      boxShadow: {
        soft: "0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)",
        premium:
          "0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02)",
        glow: "0 0 20px rgba(124, 58, 237, 0.15)",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("@tailwindcss/typography"),
    require("@tailwindcss/aspect-ratio"),
  ],
};
