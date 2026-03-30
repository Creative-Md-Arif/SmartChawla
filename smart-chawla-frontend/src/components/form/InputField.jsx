import { useState } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

const InputField = ({
  label,
  name,
  type = "text",
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  helperText,
  required = false,
  disabled = false,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = "",
  autoComplete,
  maxLength,
  min,
  max,
  step,
  rows,
  floatingLabel = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const isPassword = type === "password";
  const isTextarea = type === "textarea";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  // ৩২০ পিক্সেলের জন্য প্যাডিং একদম মিনিমাম রাখা হয়েছে যাতে টেক্সট বড় দেখায়
  const baseInputClasses = `
    w-full px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-lg border transition-all duration-200 text-[13px] sm:text-base
    ${LeftIcon ? "pl-9 sm:pl-11" : ""}
    ${isPassword || RightIcon ? "pr-9 sm:pr-11" : ""}
    ${
      error
        ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-100"
        : "border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-100"
    }
    ${disabled ? "bg-gray-50 cursor-not-allowed opacity-70" : "bg-white"}
    ${floatingLabel ? "pt-5 pb-1 sm:pt-6 sm:pb-2" : ""}
    outline-none shadow-sm
  `;

  const renderInput = () => {
    const commonProps = {
      name,
      id: name,
      value,
      onChange,
      onBlur: (e) => {
        setIsFocused(false);
        onBlur?.(e);
      },
      onFocus: () => setIsFocused(true),
      disabled,
      placeholder: floatingLabel ? " " : placeholder,
      className: baseInputClasses,
      autoComplete,
      maxLength,
    };

    if (isTextarea) {
      return <textarea {...commonProps} rows={rows || 3} />;
    }

    return (
      <input
        {...commonProps}
        type={inputType}
        min={min}
        max={max}
        step={step}
      />
    );
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Label - একদম ছোট স্ক্রিনে সাইজ ব্যালেন্স করা হয়েছে */}
      {!floatingLabel && label && (
        <label
          htmlFor={name}
          className="block text-[12px] sm:text-sm font-semibold text-gray-700 mb-1 ml-0.5"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative group">
        {/* Left Icon - ৩২০ পিক্সেলের জন্য পজিশন নিখুঁত করা হয়েছে */}
        {LeftIcon && (
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
            <LeftIcon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        )}

        {/* Input Render */}
        <div className="relative">
          {renderInput()}

          {/* Floating Label - ফন্ট সাইজ এবং গ্যাপ অপ্টিমাইজড */}
          {floatingLabel && label && (
            <label
              htmlFor={name}
              className={`
                absolute left-3 sm:left-4 transition-all duration-200 pointer-events-none
                ${
                  isFocused || value
                    ? "top-1 text-[10px] text-purple-600 font-bold"
                    : "top-1/2 -translate-y-1/2 text-[13px] text-gray-400"
                }
                ${LeftIcon ? "left-9 sm:left-11" : ""}
              `}
            >
              {label}
              {required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
          )}
        </div>

        {/* Right Icon / Password Toggle */}
        {(isPassword || RightIcon) && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-gray-400 hover:text-purple-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>
            ) : (
              <div className="p-1 text-gray-400">
                <RightIcon className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error & Helper - কম জায়গায় ফিট হওয়ার জন্য */}
      {error ? (
        <div className="mt-1 flex items-center text-[10px] sm:text-xs text-red-500 font-medium">
          <AlertCircle className="w-3 h-3 mr-1 shrink-0" />
          <span className="truncate">{error}</span>
        </div>
      ) : helperText ? (
        <p className="mt-1 text-[10px] sm:text-xs text-gray-400 ml-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default InputField;
