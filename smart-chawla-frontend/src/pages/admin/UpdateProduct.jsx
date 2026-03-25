import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { X, RefreshCw, Image as ImageIcon } from "lucide-react";

const UpdateProduct = ({
  product,
  isOpen,
  onClose,
  onSuccess,
  categories = [],
}) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discountPrice: "",
    category: "",
    subCategory: "",
    stock: "",
    sku: "",
    tags: "",
    isActive: true,
    isFeatured: false,
    metaTitle: "",
    metaDescription: "",
    specifications: {
      weight: "",
      weightUnit: "kg",
      material: "",
      color: "",
      warranty: "",
      dimensions: { length: "", width: "", height: "" },
    },
  });

  const [images, setImages] = useState([]);
  const [imagePreview, setImagePreview] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [priceError, setPriceError] = useState(""); // নতুন: প্রাইস ভ্যালিডেশন এরর

  // Initialize form with product data
  useEffect(() => {
    if (product && isOpen) {
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price?.toString() || "", // string হিসেবে রাখুন
        discountPrice: product.discountPrice?.toString() || "", // string হিসেবে রাখুন
        category: product.category?._id || product.category || "",
        subCategory: product.subCategory?._id || product.subCategory || "",
        stock: product.stock?.toString() || "",
        sku: product.sku || "",
        tags: product.tags?.join(", ") || "",
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
        metaTitle: product.metaTitle || "",
        metaDescription: product.metaDescription || "",
        specifications: {
          weight: product.specifications?.weight?.toString() || "",
          weightUnit: product.specifications?.weightUnit || "kg",
          material: product.specifications?.material || "",
          color: product.specifications?.color || "",
          warranty: product.specifications?.warranty || "",
          dimensions: {
            length:
              product.specifications?.dimensions?.length?.toString() || "",
            width: product.specifications?.dimensions?.width?.toString() || "",
            height:
              product.specifications?.dimensions?.height?.toString() || "",
          },
        },
      });
      setExistingImages(product.images || []);
      setImages([]);
      setImagePreview([]);
      setUploadProgress(0);
      setError(null);
      setPriceError("");
    }
  }, [product, isOpen]);

  // প্রাইস ভ্যালিডেশন চেক
  const validatePrices = () => {
    const price = parseFloat(formData.price);
    const discountPrice = parseFloat(formData.discountPrice);

    if (isNaN(price) || price <= 0) {
      setPriceError("সঠিক মূল্য দিন");
      return false;
    }

    if (formData.discountPrice && !isNaN(discountPrice)) {
      if (discountPrice >= price) {
        setPriceError("ডিসকাউন্ট মূল্য অবশ্যই মূল্যের চেয়ে কম হতে হবে");
        return false;
      }
      if (discountPrice < 0) {
        setPriceError("ডিসকাউন্ট মূল্য নেগেটিভ হতে পারে না");
        return false;
      }
    }

    setPriceError("");
    return true;
  };

  // প্রাইস চেঞ্জ হ্যান্ডলার
  const handlePriceChange = (field, value) => {
    // শুধু নাম্বার বা ডট অ্যালাউ করুন
    const sanitizedValue = value.replace(/[^0-9.]/g, "");

    setFormData((prev) => ({
      ...prev,
      [field]: sanitizedValue,
    }));

    // রিয়েল-টাইম ভ্যালিডেশন
    setTimeout(() => validatePrices(), 0);
  };

  const getSubCategories = useCallback(() => {
    const selectedCat = categories.find((cat) => cat._id === formData.category);
    return selectedCat?.subCategories || [];
  }, [categories, formData.category]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + existingImages.length + imagePreview.length > 5) {
      showNotification("সর্বোচ্চ ৫টি ছবি আপলোড করতে পারবেন", "error");
      return;
    }

    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        showNotification(`${file.name} একটি ছবি নয়`, "error");
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        showNotification(`${file.name} ৫MB এর বেশি`, "error");
        return false;
      }
      return true;
    });

    setImages((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreview((prev) => [...prev, ...previews]);
  };

  const removeImage = (index) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const showNotification = (message, type = "success") => {
    if (type === "error") {
      setError(message);
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!product) return;

    if (!validatePrices()) return;

    setSubmitting(true);
    setUploadProgress(0);

    try {
      const data = new FormData();

      // Basic fields - সব string হিসেবে পাঠান, backend পার্স করবে
      data.append("name", formData.name.trim());
      data.append("description", formData.description.trim());
      data.append("price", formData.price); // string
      data.append("stock", formData.stock); // string

      // discountPrice: empty string পাঠান যদি না থাকে
      if (formData.discountPrice && parseFloat(formData.discountPrice) > 0) {
        data.append("discountPrice", formData.discountPrice);
      } else {
        data.append("discountPrice", ""); // empty string = null হবে backend-এ
      }

      data.append("category", formData.category);
      data.append("isActive", formData.isActive);
      data.append("isFeatured", formData.isFeatured);

      if (formData.subCategory)
        data.append("subCategory", formData.subCategory);
      if (formData.sku) data.append("sku", formData.sku.trim());
      if (formData.metaTitle)
        data.append("metaTitle", formData.metaTitle.trim());
      if (formData.metaDescription)
        data.append("metaDescription", formData.metaDescription.trim());

      // Tags
      if (formData.tags) {
        const tagsArray = formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t);
        tagsArray.forEach((tag) => data.append("tags", tag));
      }

      // Specifications - শুধুমাত্র যেগুলো ভ্যালু আছে
      if (formData.specifications.weight) {
        data.append("specifications[weight]", formData.specifications.weight);
        data.append(
          "specifications[weightUnit]",
          formData.specifications.weightUnit,
        );
      }
      if (formData.specifications.material) {
        data.append(
          "specifications[material]",
          formData.specifications.material.trim(),
        );
      }
      if (formData.specifications.color) {
        data.append(
          "specifications[color]",
          formData.specifications.color.trim(),
        );
      }
      if (formData.specifications.warranty) {
        data.append(
          "specifications[warranty]",
          formData.specifications.warranty.trim(),
        );
      }

      // Dimensions
      if (formData.specifications.dimensions.length) {
        data.append(
          "specifications[dimensions][length]",
          formData.specifications.dimensions.length,
        );
      }
      if (formData.specifications.dimensions.width) {
        data.append(
          "specifications[dimensions][width]",
          formData.specifications.dimensions.width,
        );
      }
      if (formData.specifications.dimensions.height) {
        data.append(
          "specifications[dimensions][height]",
          formData.specifications.dimensions.height,
        );
      }

      // New images
      images.forEach((image) => {
        data.append("images", image);
      });

      // Existing images to keep
      if (existingImages.length > 0) {
        data.append("existingImages", JSON.stringify(existingImages));
      }

      const config = {
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          setUploadProgress(percentCompleted);
        },
      };

      console.log("Sending:", {
        price: formData.price,
        discountPrice: formData.discountPrice || "empty",
      });

      await axiosInstance.patch(`/products/${product._id}`, data, config);

      onSuccess?.("প্রোডাক্ট সফলভাবে আপডেট হয়েছে");
      handleClose();
    } catch (err) {
      console.error("Full error:", err.response?.data);
      showNotification(
        err.response?.data?.message || "আপডেট ব্যর্থ হয়েছে",
        "error",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    imagePreview.forEach((url) => URL.revokeObjectURL(url));
    setPriceError("");
    onClose();
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
      <div className="min-h-screen px-4 text-center">
        <div
          className="fixed inset-0 transition-opacity"
          onClick={handleClose}
        />

        <div className="inline-block w-full max-w-5xl my-8 text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b">
            <h2 className="text-2xl font-bold text-gray-900">
              প্রোডাক্ট সম্পাদনা
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Notification */}
          {error && (
            <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2">
              <span className="font-medium">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">
                  মূল তথ্য
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    প্রোডাক্টের নাম *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="প্রোডাক্টের নাম লিখুন"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ক্যাটাগরি *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value,
                        subCategory: "",
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">ক্যাটাগরি নির্বাচন করুন</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name?.bn || cat.name?.en} ({cat.name?.en})
                      </option>
                    ))}
                  </select>
                </div>

                {getSubCategories().length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      সাব-ক্যাটাগরি
                    </label>
                    <select
                      value={formData.subCategory}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subCategory: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">সাব-ক্যাটাগরি নির্বাচন করুন</option>
                      {getSubCategories().map((sub) => (
                        <option key={sub._id} value={sub._id}>
                          {sub.name?.bn || sub.name?.en}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* প্রাইস সেকশন - সংশোধিত */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      মূল্য (Regular Price) *
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ৳
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        required
                        value={formData.price}
                        onChange={(e) =>
                          handlePriceChange("price", e.target.value)
                        }
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          priceError ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ডিসকাউন্ট মূল্য (Sale Price)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                        ৳
                      </span>
                      <input
                        type="text"
                        inputMode="decimal"
                        value={formData.discountPrice}
                        onChange={(e) =>
                          handlePriceChange("discountPrice", e.target.value)
                        }
                        className={`w-full pl-8 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          priceError ? "border-red-500" : "border-gray-300"
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* প্রাইস এরর মেসেজ */}
                {priceError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    ⚠️ {priceError}
                  </div>
                )}

                {/* প্রাইস প্রিভিউ */}
                {formData.price && !priceError && (
                  <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">মূল্য:</span>
                      <span className="font-semibold">
                        ৳{parseFloat(formData.price).toLocaleString("bn-BD")}
                      </span>
                    </div>
                    {formData.discountPrice &&
                      parseFloat(formData.discountPrice) > 0 && (
                        <>
                          <div className="flex justify-between items-center mt-1">
                            <span className="text-sm text-gray-600">
                              ডিসকাউন্ট:
                            </span>
                            <span className="font-semibold text-green-600">
                              ৳
                              {parseFloat(
                                formData.discountPrice,
                              ).toLocaleString("bn-BD")}
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-1 pt-1 border-t border-blue-200">
                            <span className="text-sm font-medium">
                              সেভ করবেন:
                            </span>
                            <span className="font-bold text-blue-600">
                              ৳
                              {(
                                parseFloat(formData.price) -
                                parseFloat(formData.discountPrice)
                              ).toLocaleString("bn-BD")}
                            </span>
                          </div>
                        </>
                      )}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      স্টক *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={formData.stock}
                      onChange={(e) =>
                        setFormData({ ...formData, stock: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={formData.sku}
                      onChange={(e) =>
                        setFormData({ ...formData, sku: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="প্রোডাক্ট কোড"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">
                  অতিরিক্ত তথ্য
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    বিবরণ *
                  </label>
                  <textarea
                    rows="4"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="প্রোডাক্টের বিস্তারিত বিবরণ"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ওজন
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.01"
                        value={formData.specifications.weight}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specifications: {
                              ...formData.specifications,
                              weight: e.target.value,
                            },
                          })
                        }
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={formData.specifications.weightUnit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            specifications: {
                              ...formData.specifications,
                              weightUnit: e.target.value,
                            },
                          })
                        }
                        className="w-20 px-2 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="kg">কেজি</option>
                        <option value="gm">গ্রাম</option>
                        <option value="lb">পাউন্ড</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ম্যাটেরিয়াল
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.material}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            material: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      রং
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.color}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            color: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ওয়ারেন্টি
                    </label>
                    <input
                      type="text"
                      value={formData.specifications.warranty}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            warranty: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="যেমন: ১ বছর"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ডাইমেনশন (L×W×H)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="দৈর্ঘ্য"
                      value={formData.specifications.dimensions.length}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            dimensions: {
                              ...formData.specifications.dimensions,
                              length: e.target.value,
                            },
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="প্রস্থ"
                      value={formData.specifications.dimensions.width}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            dimensions: {
                              ...formData.specifications.dimensions,
                              width: e.target.value,
                            },
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                    <input
                      type="number"
                      placeholder="উচ্চতা"
                      value={formData.specifications.dimensions.height}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          specifications: {
                            ...formData.specifications,
                            dimensions: {
                              ...formData.specifications.dimensions,
                              height: e.target.value,
                            },
                          },
                        })
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ট্যাগ (কমা দিয়ে আলাদা করুন)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    placeholder="চা, গ্রিন টি, অর্গানিক"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex gap-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) =>
                        setFormData({ ...formData, isActive: e.target.checked })
                      }
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      সক্রিয়
                    </span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isFeatured}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isFeatured: e.target.checked,
                        })
                      }
                      className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      ফিচার্ড
                    </span>
                  </label>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                প্রোডাক্ট ছবি (সর্বোচ্চ ৫টি) -{" "}
                {existingImages.length + imagePreview.length}/5
              </label>

              {existingImages.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm text-gray-600 mb-2">বর্তমান ছবি:</p>
                  <div className="flex gap-4 flex-wrap">
                    {existingImages.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img
                          src={img.url}
                          alt=""
                          className="h-20 w-20 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(idx)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center w-full">
                <label
                  className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${
                    existingImages.length + imagePreview.length >= 5
                      ? "border-gray-200 opacity-50 cursor-not-allowed"
                      : "border-gray-300"
                  }`}
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500">
                      ছবি আপলোড করতে ক্লিক করুন
                    </p>
                    <p className="text-xs text-gray-400">
                      (সর্বোচ্চ ৫টি, প্রতিটি ৫MB এর কম)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={existingImages.length + imagePreview.length >= 5}
                    className="hidden"
                  />
                </label>
              </div>

              {imagePreview.length > 0 && (
                <div className="flex gap-4 mt-4 flex-wrap">
                  {imagePreview.map((src, idx) => (
                    <div key={idx} className="relative">
                      <img
                        src={src}
                        alt={`Preview ${idx}`}
                        className="h-20 w-20 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SEO Fields */}
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  মেটা টাইটেল
                </label>
                <input
                  type="text"
                  value={formData.metaTitle}
                  onChange={(e) =>
                    setFormData({ ...formData, metaTitle: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  maxLength={70}
                  placeholder="SEO টাইটেল (সর্বোচ্চ ৭০ অক্ষর)"
                />
                <span className="text-xs text-gray-500">
                  {formData.metaTitle.length}/70
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  মেটা ডেসক্রিপশন
                </label>
                <textarea
                  value={formData.metaDescription}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      metaDescription: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  maxLength={160}
                  placeholder="SEO ডেসক্রিপশন (সর্বোচ্চ ১৬০ অক্ষর)"
                />
                <span className="text-xs text-gray-500">
                  {formData.metaDescription.length}/160
                </span>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  {uploadProgress}% আপলোড হয়েছে
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-8 flex justify-end gap-4">
              <button
                type="button"
                onClick={handleClose}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={submitting || priceError}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                আপডেট করুন
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default UpdateProduct;
