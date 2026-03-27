import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  X,
  Save,
  Loader2,
  ChevronRight,
  Home,
  Search,
  Edit2,
  Trash2,
  Tag,
  Copy,
  XCircle,
  Store,
  Menu,
  ImageIcon,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchCoupons,
  createCoupon,
  updateCoupon,
  deleteCoupon,
} from "../../redux/slices/couponSlice";
import { Link } from "react-router-dom";
import AdminSidebar from "../../pages/admin/AdminSidebar"; // আপনার path অনুযায়ী ঠিক করুন

const ManageCoupons = () => {
  const dispatch = useDispatch();
  const { coupons, loading } = useSelector((state) => state.coupon);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const breadcrumbs = [
    { label: "Dashboard", labelBn: "ড্যাশবোর্ড", path: "/admin/dashboard" },
    { label: "Coupons", labelBn: "কুপনস", path: "/admin/coupons" },
  ];

  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discountType: "percentage",
    discountValue: "",
    minPurchase: 0,
    maxDiscount: "",
    usageLimit: "",
    userUsageLimit: 1,
    validFrom: "",
    validUntil: "",
    applicableTo: "all",
    firstOrderOnly: false,
    excludeSaleItems: false,
    autoApply: false,
    showOnCart: true,
    status: "active",
    priority: 0,
  });

  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minPurchase: 0,
      maxDiscount: "",
      usageLimit: "",
      userUsageLimit: 1,
      validFrom: "",
      validUntil: "",
      applicableTo: "all",
      firstOrderOnly: false,
      excludeSaleItems: false,
      autoApply: false,
      showOnCart: true,
      status: "active",
      priority: 0,
    });
    setErrors({});
  };

  const generateCode = () => {
    const prefix = "SC";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}${random}`;
  };

  const handleAdd = () => {
    resetForm();
    setFormData((prev) => ({ ...prev, code: generateCode() }));
    setEditingCoupon(null);
    setShowModal(true);
  };

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code || "",
      description: coupon.description || "",
      discountType: coupon.discountType || "percentage",
      discountValue: coupon.discountValue || "",
      minPurchase: coupon.minPurchase || 0,
      maxDiscount: coupon.maxDiscount || "",
      usageLimit: coupon.usageLimit || "",
      userUsageLimit: coupon.userUsageLimit || 1,
      validFrom: coupon.validFrom
        ? new Date(coupon.validFrom).toISOString().split("T")[0]
        : "",
      validUntil: coupon.validUntil
        ? new Date(coupon.validUntil).toISOString().split("T")[0]
        : "",
      applicableTo: coupon.applicableTo || "all",
      firstOrderOnly: coupon.firstOrderOnly || false,
      excludeSaleItems: coupon.excludeSaleItems || false,
      autoApply: coupon.autoApply || false,
      showOnCart: coupon.showOnCart ?? true,
      status: coupon.status || "active",
      priority: coupon.priority || 0,
    });
    setShowModal(true);
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const n = { ...prev };
        delete n[field];
        return n;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.code?.trim()) newErrors.code = "Code is required";
    if (!formData.discountValue || formData.discountValue <= 0)
      newErrors.discountValue = "Valid discount value required";
    if (!formData.validFrom) newErrors.validFrom = "Start date required";
    if (!formData.validUntil) newErrors.validUntil = "End date required";
    if (
      formData.validFrom &&
      formData.validUntil &&
      new Date(formData.validFrom) > new Date(formData.validUntil)
    ) {
      newErrors.validUntil = "End date must be after start date";
    }
    if (
      formData.discountType === "percentage" &&
      formData.discountValue > 100
    ) {
      newErrors.discountValue = "Percentage cannot exceed 100";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        discountValue: Number(formData.discountValue),
        minPurchase: Number(formData.minPurchase),
        maxDiscount: formData.maxDiscount ? Number(formData.maxDiscount) : null,
        usageLimit: formData.usageLimit ? Number(formData.usageLimit) : null,
        userUsageLimit: Number(formData.userUsageLimit),
        priority: Number(formData.priority),
      };

      if (editingCoupon) {
        await dispatch(
          updateCoupon({ id: editingCoupon._id, data: submitData }),
        ).unwrap();
      } else {
        await dispatch(createCoupon(submitData)).unwrap();
      }
      setShowModal(false);
      resetForm();
      dispatch(
        fetchCoupons({
          page: currentPage,
          limit: 10,
          status: statusFilter,
          search: searchQuery,
        }),
      );
    } catch (error) {
      setErrors((prev) => ({ ...prev, submit: error || "Failed to save" }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (coupon) => {
    if (!confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await dispatch(deleteCoupon(coupon._id)).unwrap();
      dispatch(
        fetchCoupons({
          page: currentPage,
          limit: 10,
          status: statusFilter,
          search: searchQuery,
        }),
      );
    } catch (error) {
      alert(error || "Failed to delete");
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
  };

  useEffect(() => {
    dispatch(
      fetchCoupons({
        page: currentPage,
        limit: 10,
        status: statusFilter,
        search: searchQuery,
      }),
    );
  }, [dispatch, currentPage, statusFilter, searchQuery]);

  const getStatusColor = (status) => {
    const colors = {
      active: "bg-green-100 text-green-700",
      inactive: "bg-gray-100 text-gray-700",
      expired: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const renderField = (label, name, type = "text", options = {}) => {
    const { placeholder, required, min, max, step } = options;
    const value = formData[name];
    const error = errors[name];
    const baseClass = `w-full px-4 py-2.5 bg-white border rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all ${
      error ? "border-red-300" : "border-gray-200"
    }`;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        {type === "select" ? (
          <select
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
          >
            {options.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        ) : type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
            rows={3}
            placeholder={placeholder}
          />
        ) : type === "checkbox" ? (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleChange(name, e.target.checked)}
              className="w-4 h-4 text-violet-600 border-gray-300 rounded focus:ring-violet-500"
            />
            <span className="text-sm text-gray-600">{placeholder}</span>
          </label>
        ) : (
          <input
            type={type}
            value={value}
            onChange={(e) => handleChange(name, e.target.value)}
            className={baseClass}
            placeholder={placeholder}
            min={min}
            max={max}
            step={step}
          />
        )}
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
      </div>
    );
  };

  if (loading && !coupons?.length) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Mobile Header */}
      <div className="xl:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-40 flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Store className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-gray-900">SmartChawla</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 xl:ml-0 mt-16 xl:mt-0">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2 py-4 text-sm">
              {breadcrumbs.map((crumb, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                  <Link
                    to={crumb.path}
                    className={`flex items-center gap-1.5 ${
                      idx === breadcrumbs.length - 1
                        ? "text-violet-700 font-medium"
                        : "text-gray-500 hover:text-violet-600"
                    }`}
                  >
                    {idx === 0 && <Home className="w-4 h-4" />}
                    <span>{crumb.labelBn}</span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Manage Coupons
              </h1>
              <p className="text-sm text-gray-500 mt-1">কুপন ব্যবস্থাপনা</p>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 active:scale-95 transition-all shadow-lg shadow-violet-200"
            >
              <Plus className="w-5 h-5" />
              <span>Add Coupon</span>
            </button>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search coupons..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 text-sm"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          </div>

          {/* Coupons Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Discount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Validity
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Usage
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {coupons?.map((coupon) => (
                    <tr
                      key={coupon._id}
                      className="hover:bg-violet-50/50 transition-colors group"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-violet-500" />
                          <span className="font-mono font-medium text-gray-900">
                            {coupon.code}
                          </span>
                          <button
                            onClick={() => copyCode(coupon.code)}
                            className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Copy className="w-3 h-3 text-gray-500" />
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[200px]">
                          {coupon.description || "No description"}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-medium text-gray-900">
                          {coupon.discountType === "percentage"
                            ? `${coupon.discountValue}%`
                            : `৳${coupon.discountValue}`}
                        </div>
                        <div className="text-xs text-gray-500">
                          Min: ৳{coupon.minPurchase || 0}
                          {coupon.maxDiscount &&
                            ` • Max: ৳${coupon.maxDiscount}`}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {formatDate(coupon.validFrom)} -{" "}
                          {formatDate(coupon.validUntil)}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {coupon.applicableTo}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-700">
                          {coupon.usedCount || 0} / {coupon.usageLimit || "∞"}
                        </div>
                        <div className="text-xs text-gray-500">
                          Limit: {coupon.userUsageLimit}/user
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                            coupon.status,
                          )}`}
                        >
                          {coupon.status}
                        </span>
                        {coupon.autoApply && (
                          <span className="ml-1 text-xs text-violet-600">
                            Auto
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEdit(coupon)}
                            className="p-2 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(coupon)}
                            className="p-2 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!coupons?.length && (
                <div className="p-12 text-center text-gray-500">
                  <Tag className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No coupons found</p>
                  <button
                    onClick={handleAdd}
                    className="mt-4 text-violet-600 hover:underline text-sm"
                  >
                    Create your first coupon
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {editingCoupon ? "Edit Coupon" : "Add New Coupon"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  {editingCoupon ? "কুপন সম্পাদনা" : "নতুন কুপন যোগ করুন"}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]"
            >
              {errors.submit && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> {errors.submit}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      {renderField("Coupon Code", "code", "text", {
                        placeholder: "SCXXXXXX",
                        required: true,
                      })}
                    </div>
                    {!editingCoupon && (
                      <button
                        type="button"
                        onClick={() => handleChange("code", generateCode())}
                        className="px-4 py-2.5 mt-7 bg-violet-100 text-violet-700 rounded-xl hover:bg-violet-200 transition-colors text-sm font-medium"
                      >
                        Generate
                      </button>
                    )}
                  </div>
                </div>

                <div className="md:col-span-2">
                  {renderField("Description", "description", "textarea", {
                    placeholder: "Coupon description...",
                  })}
                </div>

                {renderField("Discount Type", "discountType", "select", {
                  options: [
                    { value: "percentage", label: "Percentage (%)" },
                    { value: "fixed", label: "Fixed Amount (৳)" },
                  ],
                })}

                {renderField("Discount Value", "discountValue", "number", {
                  required: true,
                  min: 0,
                  step: "0.01",
                })}

                {renderField("Minimum Purchase (৳)", "minPurchase", "number", {
                  min: 0,
                  step: "0.01",
                })}

                {formData.discountType === "percentage" &&
                  renderField("Maximum Discount (৳)", "maxDiscount", "number", {
                    min: 0,
                    step: "0.01",
                  })}

                {renderField("Total Usage Limit", "usageLimit", "number", {
                  min: 1,
                  placeholder: "Unlimited if empty",
                })}

                {renderField("Usage Per User", "userUsageLimit", "number", {
                  required: true,
                  min: 1,
                })}

                {renderField("Valid From", "validFrom", "date", {
                  required: true,
                })}

                {renderField("Valid Until", "validUntil", "date", {
                  required: true,
                })}

                {renderField("Applicable To", "applicableTo", "select", {
                  options: [
                    { value: "all", label: "All Items" },
                    { value: "product", label: "Products Only" },
                    { value: "course", label: "Courses Only" },
                    { value: "specific", label: "Specific Items" },
                  ],
                })}

                {renderField("Priority", "priority", "number", {
                  min: 0,
                  placeholder: "0",
                })}
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Additional Settings
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {renderField("", "firstOrderOnly", "checkbox", {
                    placeholder: "First order only",
                  })}
                  {renderField("", "excludeSaleItems", "checkbox", {
                    placeholder: "Exclude sale items",
                  })}
                  {renderField("", "autoApply", "checkbox", {
                    placeholder: "Auto apply at checkout",
                  })}
                  {renderField("", "showOnCart", "checkbox", {
                    placeholder: "Show on cart page",
                  })}
                </div>
              </div>

              <div className="mt-4">
                {renderField("Status", "status", "select", {
                  options: [
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                    { value: "expired", label: "Expired" },
                  ],
                })}
              </div>

              <div className="flex gap-3 pt-6 mt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 font-medium transition-all"
                >
                  {submitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-5 h-5" />{" "}
                      {editingCoupon ? "Update" : "Create"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCoupons;
