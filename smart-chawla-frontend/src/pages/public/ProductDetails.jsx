import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Star, Check, Camera, X, Send } from "lucide-react";
import { useSelector } from "react-redux";
import axiosInstance from "../../utils/axiosInstance";
import { formatPrice } from "../../utils/formatters";
import { toast } from "react-hot-toast";
import CategoryBreadcrumb from "../../components/category/CategoryBreadcrumb";
import AddToCartButton from "../../components/common/AddToCartButton";

const ProductDetails = (index = 0) => {
  const { slug } = useParams();
  const { isAuthenticated } = useSelector((state) => state.auth);

  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState("description");

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewImages, setReviewImages] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosInstance.get(`/products/${slug}`);
      setProduct(response.data.product);
      setRelatedProducts(response.data.relatedProducts || []);
    } catch (error) {
      console.error("Error fetching product:", error);
      setError(error.response?.data?.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  };

  // Breadcrumb Items তৈরি করা
  const getBreadcrumbItems = () => {
    if (!product) return [];
    const items = [];

    // ক্যাটাগরি থাকলে অ্যাড করুন
    if (product.category) {
      items.push({
        name: product.category.name?.en || product.category.name,
        url: `/category/${product.category.slug}`,
      });
    }

    // সাব-ক্যাটাগরি থাকলে অ্যাড করুন
    if (product.subCategory) {
      items.push({
        name: product.subCategory.name?.en || product.subCategory.name,
        url: `/category/${product.category?.slug}/${product.subCategory.slug}`,
      });
    }

    // সবশেষে কারেন্ট প্রোডাক্টের নাম
    items.push({ name: product.name, url: `/product/${product.slug}` });

    return items;
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setReviewImages((prev) => [...prev, ...files]);
  };

  const removeReviewImage = (index) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) return toast.error("Please login to write a review");

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("rating", rating);
      formData.append("review", comment);
      reviewImages.forEach((img) => formData.append("images", img));

      await axiosInstance.post(`/products/${product._id}/reviews`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Review submitted successfully!");
      setComment("");
      setReviewImages([]);
      setRating(5);
      fetchProduct();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  // 1. Handle Loading State First
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb Skeleton */}
        <div className="h-4 bg-gray-200 rounded w-48 mb-8"></div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4">
          {/* Image Skeleton - Fixed dimensions NO CLS */}
          <div>
            <div className="h-[400px] md:h-[500px] lg:h-[600px] bg-gray-200 rounded-lg"></div>
            <div className="flex space-x-2 mt-4 h-[88px] overflow-hidden">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0"
                ></div>
              ))}
            </div>
          </div>

          {/* Info Skeleton */}
          <div className="space-y-6">
            <div className="h-4 bg-gray-200 rounded w-24"></div>
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-24 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Handle Error/Not Found State Second
  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 mb-4">
            {error || "The product you are looking for does not exist."}
          </p>
          <Link
            to="/shop"
            className="inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // 3. NOW it is safe to declare cartItem because we guarantee `product` exists
  const cartItem = {
    itemType: "product",
    itemId: product?._id,
    name: product?.name,
    price: product?.discountPrice || product?.price,
    image: product?.images?.[0]?.url,
    stock: product?.stock,
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <CategoryBreadcrumb items={getBreadcrumbItems()} />

      {/* FIXED: Main grid with min-height to prevent shift */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-4 min-h-[600px]">
        {/* Images Section - FIXED DIMENSIONS NO CLS */}
        <div>
          {/* Main Image - Fixed pixel height, no aspect-ratio trick */}
          <div className="h-[400px] md:h-[500px] lg:h-[600px] bg-gray-100 rounded-lg overflow-hidden border relative">
            <img
              src={product.images?.[selectedImage]?.url || "/placeholder.jpg"}
              alt={product.name}
              loading="eager"
              fetchpriority="high"
              width="600"
              height="600"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnails - Fixed height, overflow hidden to prevent push */}
          <div className="flex space-x-2 mt-4 h-[88px] overflow-hidden">
            {product.images?.map((img, index) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                  selectedImage === index
                    ? "border-purple-600"
                    : "border-transparent"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  width="80"
                  height="80"
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>

        {/* Details Section */}
        <div>
          <p className="text-sm font-medium text-purple-600 uppercase tracking-wide">
            {product.category?.name?.en || product.category?.name}
          </p>
          <h1 className="text-3xl font-bold text-gray-900 mt-2">
            {product.name}
          </h1>

          {/* Rating Summary */}
          <div className="flex items-center mt-4">
            <div className="flex text-yellow-400">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < Math.round(product.averageRating || 0) ? "fill-current" : "text-gray-300"}`}
                />
              ))}
            </div>
            <span className="ml-2 text-sm text-gray-500">
              ({product.ratings?.length || 0} customer reviews)
            </span>
          </div>

          <div className="mt-6">
            {product.discountPrice ? (
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-purple-600">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-xl text-gray-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-bold">
                  -
                  {Math.round(
                    ((product.price - product.discountPrice) / product.price) *
                      100,
                  )}
                  %
                </span>
              </div>
            ) : (
              <span className="text-3xl font-bold text-purple-600">
                {formatPrice(product.price)}
              </span>
            )}
          </div>

          <p className="mt-6 text-gray-600 leading-relaxed line-clamp-3">
            {product.description}
          </p>

          <div className="mt-8 space-y-4">
            <AddToCartButton
              item={cartItem}
              variant="quantity"
              showQuantity={true}
              className="mt-6"
              onAddSuccess={() => toast.success("Added to cart!")}
              onAddError={(msg) => toast.error(msg)}
            />
          </div>

          <div className="mt-8 pt-6 border-t grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Check className="w-4 h-4 mr-2 text-green-500" />
              {product.stock > 0
                ? `In Stock (${product.stock})`
                : "Out of Stock"}
            </div>
            <div className="text-gray-600">
              SKU: <span className="font-medium">{product.sku || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="mt-16">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("description")}
            className={`py-4 px-8 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "description"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Description
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={`py-4 px-8 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "reviews"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            Reviews ({product.ratings?.length || 0})
          </button>
        </div>

        <div className="py-8">
          {activeTab === "description" ? (
            <div className="prose max-w-none text-gray-600 leading-relaxed">
              <p className="whitespace-pre-line">{product.description}</p>
              {product.specifications && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(
                      ([key, value]) =>
                        value &&
                        typeof value !== "object" && (
                          <div key={key} className="flex border-b pb-2">
                            <span className="font-medium w-32 capitalize text-gray-900">
                              {key}:
                            </span>
                            <span className="text-gray-600">{value}</span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Review List */}
              <div className="lg:col-span-2 space-y-8">
                {product.ratings && product.ratings.length > 0 ? (
                  product.ratings.map((review, index) => (
                    <div key={index} className="flex space-x-4 border-b pb-6">
                      <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 font-bold uppercase">
                        {review.user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-gray-900">
                            {review.user?.name || "Customer"}
                          </h4>
                          <span className="text-xs text-gray-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex text-yellow-400 my-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${i < review.rating ? "fill-current" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                        <p className="text-gray-600 mt-2">{review.review}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          {review.images?.map((img, idx) => (
                            <img
                              key={idx}
                              src={img.url}
                              loading="lazy"
                              fetchpriority="low"
                              className="w-20 h-20 object-cover rounded-lg border"
                              alt="review"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-gray-500 py-10">
                    No reviews yet. Be the first to review!
                  </p>
                )}
              </div>

              {/* Review Form */}
              <div className="bg-gray-50 p-6 rounded-xl h-fit border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Write a Review
                </h3>
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rating
                    </label>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((num) => (
                        <Star
                          key={num}
                          onClick={() => setRating(num)}
                          className={`w-6 h-6 cursor-pointer transition-colors ${num <= rating ? "text-yellow-400 fill-current" : "text-gray-300"}`}
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Comment
                    </label>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg p-3 h-32 focus:ring-2 focus:ring-purple-500 outline-none"
                      placeholder="Share your experience..."
                      required
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Add Photos
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {reviewImages.map((img, idx) => (
                        <div key={idx} className="relative w-16 h-16">
                          <img
                            src={URL.createObjectURL(img)}
                            className="w-full h-full object-cover rounded-lg"
                            loading="lazy"
                            fetchpriority="low"
                            alt="preview"
                          />
                          <button
                            type="button"
                            onClick={() => removeReviewImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <label className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-100">
                        <Camera className="w-6 h-6 text-gray-400" />
                        <input
                          type="file"
                          multiple
                          onChange={handleImageChange}
                          className="hidden"
                          accept="image/*"
                        />
                      </label>
                    </div>
                  </div>
                  <button
                    disabled={submitting}
                    type="submit"
                    className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold flex items-center justify-center hover:bg-purple-700 disabled:opacity-50"
                  >
                    {submitting ? (
                      "Submitting..."
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" /> Submit Review
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Related Products - FIXED: min-height to prevent CLS */}
      {relatedProducts.length > 0 && (
        <div className="mt-10 border-t pt-16 min-h-[400px]">
          <h2 className="text-3xl font-black text-gray-900 mb-10">
            Releted Products
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <Link
                key={rel._id}
                to={`/product/${rel.slug}`}
                className="group bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-2xl hover:shadow-purple-100 transition-all duration-300"
              >
                {/* FIXED: Fixed height container for image */}
                <div className="h-[200px] md:h-[250px] rounded-xl overflow-hidden bg-gray-50 mb-4">
                  <img
                    src={rel.images?.[0]?.url?.replace(
                      "/upload/",
                      "/upload/w_400,q_auto,f_auto/",
                    )}
                    alt={rel.name}
                    width="300"
                    height="300"
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-bold text-gray-800 truncate text-sm md:text-base">
                  {rel.name}
                </h3>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-purple-600 font-black">
                    {formatPrice(rel.discountPrice || rel.price)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
