import { useState } from 'react';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

const InputField = ({
  label,
  name,
  type = 'text',
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
  className = '',
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

  const isPassword = type === 'password';
  const isTextarea = type === 'textarea';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  const baseInputClasses = `
    w-full px-4 py-2.5 rounded-lg border transition-all duration-200
    ${LeftIcon ? 'pl-11' : ''}
    ${(isPassword || RightIcon) ? 'pr-11' : ''}
    ${error
      ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
      : 'border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${floatingLabel ? 'pt-6 pb-2' : ''}
    outline-none
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
      placeholder: floatingLabel ? ' ' : placeholder,
      className: baseInputClasses,
      autoComplete,
      maxLength,
    };

    if (isTextarea) {
      return <textarea {...commonProps} rows={rows || 4} />;
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
    <div className={`${className}`}>
      {/* Label */}
      {!floatingLabel && label && (
        <label
          htmlFor={name}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Input Container */}
      <div className="relative">
        {/* Left Icon */}
        {LeftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <LeftIcon className="w-5 h-5" />
          </div>
        )}

        {/* Input */}
        <div className="relative">
          {renderInput()}

          {/* Floating Label */}
          {floatingLabel && label && (
            <label
              htmlFor={name}
              className={`
                absolute left-4 transition-all duration-200 pointer-events-none
                ${isFocused || value
                  ? 'top-1 text-xs text-purple-600'
                  : 'top-1/2 -translate-y-1/2 text-gray-500'
                }
                ${LeftIcon ? 'left-11' : ''}
              `}
            >
              {label}
              {required && <span className="text-red-500 ml-1">*</span>}
            </label>
          )}
        </div>

        {/* Right Icon / Password Toggle */}
        {(isPassword || RightIcon) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            ) : (
              <div className="text-gray-400">
                <RightIcon className="w-5 h-5" />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-1 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}

      {/* Helper Text */}
      {!error && helperText && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
};

export default InputField;
