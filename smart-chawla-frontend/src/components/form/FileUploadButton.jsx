import { useState, useRef } from "react";
import { Upload, X, File, Image as ImageIcon, Check } from "lucide-react";

const FileUploadButton = ({
  onFileSelect,
  accept = "image/*",
  maxSize = 5 * 1024 * 1024, // 5MB
  multiple = false,
  label = "Upload File",
  helperText = "Drag & drop or click to upload",
  preview = true,
  className = "",
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const validateFile = (file) => {
    if (file.size > maxSize) {
      return `File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`;
    }

    const acceptedTypes = accept.split(",").map((t) => t.trim());
    const fileType = file.type;
    const fileExtension = `.${file.name.split(".").pop().toLowerCase()}`;

    const isAccepted = acceptedTypes.some((type) => {
      if (type.includes("*")) {
        return fileType.startsWith(type.replace("/*", ""));
      }
      return type === fileType || type === fileExtension;
    });

    if (!isAccepted) {
      return `File type not accepted. Please upload ${accept}`;
    }

    return null;
  };

  const handleFiles = (files) => {
    setError("");
    const newFiles = [];

    Array.from(files).forEach((file) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      const fileWithPreview = {
        file,
        id: Math.random().toString(36).substring(7),
        preview: file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : null,
        name: file.name,
        size: file.size,
        type: file.type,
      };

      newFiles.push(fileWithPreview);
    });

    if (newFiles.length > 0) {
      const updatedFiles = multiple
        ? [...selectedFiles, ...newFiles]
        : newFiles;
      setSelectedFiles(updatedFiles);
      onFileSelect?.(multiple ? updatedFiles : updatedFiles[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleInputChange = (e) => {
    handleFiles(e.target.files);
  };

  const handleRemoveFile = (fileId) => {
    const updatedFiles = selectedFiles.filter((f) => f.id !== fileId);
    setSelectedFiles(updatedFiles);
    onFileSelect?.(multiple ? updatedFiles : updatedFiles[0] || null);
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <div className={`${className}`}>
      {/* Drop Zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-6 cursor-pointer
          transition-all duration-200 text-center
          ${
            isDragging
              ? "border-purple-500 bg-purple-50"
              : "border-gray-300 hover:border-purple-400 hover:bg-gray-50"
          }
          ${error ? "border-red-300 bg-red-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center">
          <div
            className={`
            w-12 h-12 rounded-full flex items-center justify-center mb-3
            ${isDragging ? "bg-purple-100" : "bg-gray-100"}
          `}
          >
            <Upload
              className={`w-6 h-6 ${isDragging ? "text-purple-600" : "text-gray-500"}`}
            />
          </div>
          <p className="font-medium text-gray-700">{label}</p>
          <p className="text-sm text-gray-500 mt-1">{helperText}</p>
          <p className="text-xs text-gray-400 mt-2">
            Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600 flex items-center">
          <X className="w-4 h-4 mr-1" />
          {error}
        </p>
      )}

      {/* File Previews */}
      {preview && selectedFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          {selectedFiles.map((file) => (
            <div
              key={file.id}
              className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              {/* Preview */}
              {file.preview ? (
                <img
                  src={file.preview}
                  alt={file.name}
                  loading="lazy"
                  fetchpriority="low"
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                  <File className="w-6 h-6 text-gray-500" />
                </div>
              )}

              {/* File Info */}
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
              </div>

              {/* Success Icon */}
              <div className="mr-2">
                <Check className="w-5 h-5 text-green-500" />
              </div>

              {/* Remove Button */}
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploadButton;
