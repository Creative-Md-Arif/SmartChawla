import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Avatar,
  Divider,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  Alert,
  Snackbar,
  CircularProgress,
  Tabs,
  Tab,
  Badge,
  Stack,
  Breadcrumbs,
  Link as MuiLink,
  useMediaQuery,
  useTheme,
  Menu,
} from "@mui/material";
import {
  Visibility as VisibilityIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Image as ImageIcon,
  LocalShipping as ShippingIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  AttachMoney as AttachMoneyIcon,
  Discount as DiscountIcon,
  Inventory as InventoryIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  NavigateNext as NavigateNextIcon,
  Home as HomeIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import { format } from "date-fns";
import AdminSidebar from "./AdminSidebar";

// ✅ All Statuses from Order Model
const STATUS_CONFIG = {
  Pending: {
    color: "warning",
    icon: <PaymentIcon />,
    label: "Pending",
    labelBn: "অপেক্ষমাণ",
  },
  Verified: {
    color: "success",
    icon: <CheckCircleIcon />,
    label: "Verified",
    labelBn: "যাচাইকৃত",
  },
  Rejected: {
    color: "error",
    icon: <CancelIcon />,
    label: "Rejected",
    labelBn: "বাতিলকৃত",
  },
  Processing: {
    color: "info",
    icon: <SettingsIcon />,
    label: "Processing",
    labelBn: "প্রক্রিয়াধীন",
  },
  Shipped: {
    color: "primary",
    icon: <ShippingIcon />,
    label: "Shipped",
    labelBn: "পাঠানো হয়েছে",
  },
  Delivered: {
    color: "success",
    icon: <CheckCircleIcon />,
    label: "Delivered",
    labelBn: "ডেলিভার্ড",
  },
  Completed: {
    color: "success",
    icon: <CheckCircleIcon />,
    label: "Completed",
    labelBn: "সম্পন্ন",
  },
  Cancelled: {
    color: "default",
    icon: <CancelIcon />,
    label: "Cancelled",
    labelBn: "বাতিল",
  },
};

const PAYMENT_METHODS = {
  bkash: "bKash",
  nagad: "Nagad",
  rocket: "Rocket",
  bank: "Bank Transfer",
  cash: "Cash on Delivery",
};

// ✅ ALL STATUS ACTIONS CONFIGURATION
const STATUS_ACTIONS = {
  Pending: [
    {
      action: "verify",
      label: "Verify Payment",
      labelBn: "পেমেন্ট যাচাই করুন",
      color: "success",
      icon: <CheckCircleIcon />,
    },
    {
      action: "reject",
      label: "Reject Payment",
      labelBn: "পেমেন্ট বাতিল করুন",
      color: "error",
      icon: <CancelIcon />,
    },
    {
      action: "cancel",
      label: "Cancel Order",
      labelBn: "অর্ডার বাতিল করুন",
      color: "default",
      icon: <CancelIcon />,
    },
  ],
  Verified: [
    {
      action: "process",
      label: "Start Processing",
      labelBn: "প্রক্রিয়া শুরু করুন",
      color: "info",
      icon: <InventoryIcon />,
    },
  ],
  Processing: [
    {
      action: "ship",
      label: "Mark Shipped",
      labelBn: "পাঠানো হয়েছে চিহ্নিত করুন",
      color: "primary",
      icon: <ShippingIcon />,
    },
  ],
  Shipped: [
    {
      action: "deliver",
      label: "Mark Delivered",
      labelBn: "ডেলিভার্ড চিহ্নিত করুন",
      color: "success",
      icon: <CheckCircleIcon />,
    },
  ],
  Delivered: [
    {
      action: "complete",
      label: "Complete Order",
      labelBn: "অর্ডার সম্পন্ন করুন",
      color: "success",
      icon: <CheckCircleIcon />,
    },
  ],
  Rejected: [],
  Cancelled: [],
  Completed: [],
};

const ManageOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shippingData, setShippingData] = useState({
    trackingNumber: "",
    shippingProvider: "",
    estimatedDelivery: "",
  });

  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  // 🔴 [NEW] BREADCRUMB CONFIGURATION
  const BREADCRUMB_MAP = useMemo(
    () => ({
      admin: { label: "Admin", labelBn: "অ্যাডমিন", icon: HomeIcon },
      "order-list": {
        label: "Orders",
        labelBn: "অর্ডারসমূহ",
        icon: InventoryIcon,
      },
      products: {
        label: "Products",
        labelBn: "প্রোডাক্টস",
        icon: InventoryIcon,
      },
      courses: { label: "Courses", labelBn: "কোর্সসমূহ", icon: SchoolIcon },
      categories: {
        label: "Categories",
        labelBn: "ক্যাটাগরিস",
        icon: InventoryIcon,
      },
      payments: { label: "Payments", labelBn: "পেমেন্টস", icon: PaymentIcon },
      coupons: { label: "Coupons", labelBn: "কুপনস", icon: DiscountIcon },
      "sales-report": {
        label: "Sales Report",
        labelBn: "বিক্রয় রিপোর্ট",
        icon: AttachMoneyIcon,
      },
      banners: { label: "Banners", labelBn: "ব্যানারস", icon: ImageIcon },
      notifications: {
        label: "Notifications",
        labelBn: "নোটিফিকেশন",
        icon: CalendarIcon,
      },
      userlist: {
        label: "All Users",
        labelBn: "ব্যবহারকারী",
        icon: PersonIcon,
      },
      dashboard: { label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: HomeIcon },
    }),
    [],
  );

  // 🔴 [NEW] Breadcrumb Component
  const OrderBreadcrumbs = () => {
    const paths = location.pathname.split("/").filter(Boolean);

    return (
      <Breadcrumbs
        separator={
          <NavigateNextIcon fontSize="small" sx={{ color: "text.secondary" }} />
        }
        sx={{
          mb: 3,
          p: 2,
          bgcolor: "background.paper",
          borderRadius: 2,
          boxShadow: 1,
          flexWrap: "wrap",
        }}
      >
        <MuiLink
          component={Link}
          to="/admin/dashboard"
          color="inherit"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            textDecoration: "none",
            "&:hover": { color: "primary.main" },
          }}
        >
          <HomeIcon fontSize="small" />
          <span className="font-bangla">ড্যাশবোর্ড</span>
        </MuiLink>

        {paths.slice(1).map((segment, index) => {
          const config = BREADCRUMB_MAP[segment];
          if (!config) return null;

          const path = "/" + paths.slice(0, index + 2).join("/");
          const isLast = index === paths.length - 2;

          return isLast ? (
            <Typography
              key={path}
              color="primary"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                fontWeight: 600,
              }}
            >
              <config.icon fontSize="small" />
              <span className="font-bangla">{config.labelBn}</span>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
                sx={{ ml: 0.5 }}
              >
                / {config.label}
              </Typography>
            </Typography>
          ) : (
            <MuiLink
              key={path}
              component={Link}
              to={path}
              color="inherit"
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                textDecoration: "none",
                "&:hover": { color: "primary.main" },
              }}
            >
              <config.icon fontSize="small" />
              <span className="font-bangla">{config.labelBn}</span>
            </MuiLink>
          );
        })}
      </Breadcrumbs>
    );
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // 🔴 [UNCHANGED] All API functions remain exactly the same
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      let endpoint = "/orders/admin/pending";
      if (activeTab === 1) {
        endpoint = "/orders/admin/all";
        if (statusFilter) params.status = statusFilter;
      }

      const response = await axiosInstance.get(endpoint, { params });

      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to fetch orders",
        "error",
      );
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, activeTab, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (event, value) => {
    setPagination((prev) => ({ ...prev, page: value }));
  };

  const handleLimitChange = (event) => {
    setPagination((prev) => ({ ...prev, limit: event.target.value, page: 1 }));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleViewDetails = async (orderId) => {
    try {
      const response = await axiosInstance.get(`/orders/${orderId}`);
      if (response.data.success) {
        setSelectedOrder(response.data.order);
        setDetailOpen(true);
      }
    } catch (error) {
      showSnackbar("Failed to fetch order details", "error");
    }
  };

  // 🔴 [UNCHANGED] Status Update Handler
  const handleStatusUpdate = async (
    orderId,
    newStatus,
    additionalData = {},
  ) => {
    try {
      let endpoint = "";
      let method = "patch";
      let data = {};

      switch (newStatus) {
        case "Verified":
          endpoint = `/orders/${orderId}/verify`;
          break;
        case "Rejected":
          endpoint = `/orders/${orderId}/reject`;
          data = { reason: additionalData.reason };
          break;
        case "Processing":
          endpoint = `/orders/${orderId}/status`;
          data = { status: "Processing", note: "Order processing started" };
          break;
        case "Shipped":
          endpoint = `/orders/${orderId}/ship`;
          data = {
            trackingNumber: additionalData.trackingNumber,
            shippingProvider: additionalData.shippingProvider,
            estimatedDelivery: additionalData.estimatedDelivery,
          };
          break;
        case "Delivered":
          endpoint = `/orders/${orderId}/deliver`;
          data = { deliveredAt: new Date() };
          break;
        case "Completed":
          endpoint = `/orders/${orderId}/complete`;
          break;
        case "Cancelled":
          endpoint = `/orders/${orderId}/cancel`;
          break;
        default:
          throw new Error("Unknown status");
      }

      const response = await axiosInstance[method](endpoint, data);

      if (response.data.success) {
        showSnackbar(`Order ${newStatus.toLowerCase()} successfully`);
        fetchOrders();
        if (detailOpen) {
          setSelectedOrder(response.data.order);
        }
        return true;
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message ||
          `Failed to ${newStatus.toLowerCase()} order`,
        "error",
      );
      return false;
    }
  };

  // 🔴 [UNCHANGED] Action Handler
  const handleAction = async (order, actionType) => {
    switch (actionType) {
      case "verify":
        if (!window.confirm("Verify this payment? / এই পেমেন্ট যাচাই করবেন?"))
          return;
        await handleStatusUpdate(order._id, "Verified");
        break;

      case "reject":
        handleOpenRejectDialog(order);
        break;

      case "cancel":
        if (!window.confirm("Cancel this order? / এই অর্ডার বাতিল করবেন?"))
          return;
        await handleStatusUpdate(order._id, "Cancelled");
        break;

      case "process":
        if (
          !window.confirm(
            "Start processing this order? / অর্ডার প্রক্রিয়া শুরু করবেন?",
          )
        )
          return;
        await handleStatusUpdate(order._id, "Processing");
        break;

      case "ship":
        setSelectedOrder(order);
        setShippingDialogOpen(true);
        break;

      case "deliver":
        if (!window.confirm("Mark as delivered? / ডেলিভার্ড চিহ্নিত করবেন?"))
          return;
        await handleStatusUpdate(order._id, "Delivered");
        break;

      case "complete":
        if (!window.confirm("Complete this order? / অর্ডার সম্পন্ন করবেন?"))
          return;
        await handleStatusUpdate(order._id, "Completed");
        break;

      default:
        console.error("Unknown action:", actionType);
    }
  };

  const handleOpenRejectDialog = (order) => {
    setSelectedOrder(order);
    setRejectReason("");
    setRejectDialogOpen(true);
  };

  const handleRejectPayment = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      showSnackbar(
        "Rejection reason must be at least 10 characters / বাতিলের কারণ কমপক্ষে ১০ অক্ষর হতে হবে",
        "error",
      );
      return;
    }

    const success = await handleStatusUpdate(selectedOrder._id, "Rejected", {
      reason: rejectReason.trim(),
    });
    if (success) {
      setRejectDialogOpen(false);
    }
  };

  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setImagePreviewOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-BD", {
      style: "currency",
      currency: "BDT",
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderStatusChip = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return (
      <Chip
        icon={config.icon}
        label={
          <Box
            component="span"
            sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
          >
            <span className="font-bangla">{config.labelBn}</span>
            <Typography
              component="span"
              variant="caption"
              sx={{ opacity: 0.8 }}
            >
              / {config.label}
            </Typography>
          </Box>
        }
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderOrderItems = (items) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Order Items / অর্ডার আইটেম ({items?.length || 0})
      </Typography>
      {items?.map((item, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: "auto" }}>
                <Avatar
                  src={item.image}
                  alt={item.name}
                  variant="rounded"
                  sx={{ width: 60, height: 60 }}
                >
                  {item.itemType === "course" ? (
                    <SchoolIcon />
                  ) : (
                    <InventoryIcon />
                  )}
                </Avatar>
              </Grid>
              <Grid size={{ xs: 12, sm: true }}>
                <Typography variant="body1" fontWeight="medium">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type / ধরন:{" "}
                  {item.itemType === "course"
                    ? "Course / কোর্স"
                    : "Product / প্রোডাক্ট"}{" "}
                  | Qty / পরিমাণ: {item.quantity}
                </Typography>
                <Typography variant="body2" color="primary">
                  {formatCurrency(item.priceAtPurchase)} each / প্রতিটি
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: "auto" }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatCurrency(item.priceAtPurchase * item.quantity)}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderDeliveryAddress = (address) => {
    if (!address)
      return (
        <Typography color="text.secondary">
          Digital Product / ডিজিটাল প্রোডাক্ট - No delivery needed / ডেলিভারি
          প্রয়োজন নেই
        </Typography>
      );

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Delivery Address / ডেলিভারি ঠিকানা
        </Typography>
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1}>
              {address.fullName && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PersonIcon fontSize="small" color="action" />
                  <Typography variant="body2">{address.fullName}</Typography>
                </Box>
              )}
              {address.phone && (
                <Box display="flex" alignItems="center" gap={1}>
                  <PhoneIcon fontSize="small" color="action" />
                  <Typography variant="body2">{address.phone}</Typography>
                </Box>
              )}
              <Box display="flex" alignItems="flex-start" gap={1}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2">
                  {[
                    address.address,
                    address.city,
                    address.district,
                    address.postalCode && `-${address.postalCode}`,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    );
  };

  const renderStatusHistory = (history) => {
    if (!history || history.length === 0) return null;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Status History / স্ট্যাটাস ইতিহাস
        </Typography>
        <Stack spacing={1}>
          {history.map((record, index) => (
            <Box
              key={index}
              display="flex"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
            >
              <Chip
                label={
                  <span className="font-bangla">
                    {STATUS_CONFIG[record.status]?.labelBn || record.status}
                  </span>
                }
                size="small"
                color={STATUS_CONFIG[record.status]?.color || "default"}
              />
              <Typography variant="caption" color="text.secondary">
                {format(new Date(record.changedAt), "MMM dd, yyyy HH:mm")}
              </Typography>
              {record.changedBy && (
                <Typography variant="caption" color="text.secondary">
                  by {record.changedBy?.fullName || "System / সিস্টেম"}
                </Typography>
              )}
              {record.note && (
                <Typography variant="caption" color="text.secondary">
                  - {record.note}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      {/* Admin Sidebar */}
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content Area */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 2, md: 3 },
          ml: { xs: 0, sm: "0", md: "0" },
          transition: "margin 0.3s ease",
          width: {
            xs: "100%",
            sm: "calc(100% - 80px)",
            md: "calc(100% - 280px)",
          },
          minWidth: 0,
        }}
      >
        {/* Breadcrumb Section */}
        <OrderBreadcrumbs />

        {/* Page Header */}
        <Typography
          variant="h4"
          gutterBottom
          fontWeight="bold"
          sx={{
            fontSize: { xs: "1.25rem", sm: "1.75rem", md: "2.25rem" },
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <InventoryIcon color="primary" />
          <span className="font-bangla">অর্ডার ম্যানেজমেন্ট</span>
          <Typography
            component="span"
            color="text.secondary"
            fontWeight="normal"
          >
            / Manage Orders
          </Typography>
        </Typography>

        {/* Tabs */}
        <Paper sx={{ mb: 3, overflow: "hidden" }}>
          <Tabs
            value={activeTab}
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab
              label={
                <Badge
                  color="error"
                  variant="dot"
                  invisible={!orders.some((o) => o.status === "Pending")}
                >
                  <span className="font-bangla">অপেক্ষমাণ অর্ডার</span> /
                  Pending
                </Badge>
              }
            />
            <Tab
              label={
                <span className="font-bangla">সব অর্ডার / All Orders</span>
              }
            />
          </Tabs>
        </Paper>

        {/* Filters */}
        <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                label="Search by Order # / অর্ডার নম্বর দিয়ে খুঁজুন"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Status / স্ট্যাটাস</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status / স্ট্যাটাস"
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <MenuItem value="">
                    <span className="font-bangla">সব</span> / All
                  </MenuItem>
                  {Object.keys(STATUS_CONFIG).map((status) => (
                    <MenuItem key={status} value={status}>
                      <span className="font-bangla">
                        {STATUS_CONFIG[status].labelBn}
                      </span>{" "}
                      / {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Per Page / পৃষ্ঠায়</InputLabel>
                <Select
                  value={pagination.limit}
                  label="Per Page / পৃষ্ঠায়"
                  onChange={handleLimitChange}
                >
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                onClick={fetchOrders}
                fullWidth
                startIcon={<RefreshIcon />}
              >
                <span className="font-bangla">রিফ্রেশ</span> / Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Orders Table */}
        <TableContainer
          component={Paper}
          sx={{
            overflowX: "auto",
            maxWidth: "100%",
          }}
        >
          <Table size="small" sx={{ minWidth: { xs: 900, md: "100%" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Order # / অর্ডার</TableCell>
                <TableCell>Customer / কাস্টমার</TableCell>
                <TableCell>Items / আইটেম</TableCell>
                <TableCell>Amount / মূল্য</TableCell>
                <TableCell>Payment / পেমেন্ট</TableCell>
                <TableCell>Status / স্ট্যাটাস</TableCell>
                <TableCell>Date / তারিখ</TableCell>
                <TableCell align="center">Actions / অ্যাকশন</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">
                      <span className="font-bangla">
                        কোনো অর্ডার পাওয়া যায়নি
                      </span>{" "}
                      / No orders found
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => (
                  <TableRow key={order._id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {order.orderNumber}
                      </Typography>
                      {order.isDigital && (
                        <Chip
                          label={<span className="font-bangla">ডিজিটাল</span>}
                          size="small"
                          color="info"
                          sx={{ mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.user?.fullName || "N/A"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.user?.email || order.user?.phone}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {order.items?.length || 0} item(s) / আইটেম
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.items
                          ?.map((i) =>
                            i.itemType === "course"
                              ? "Course/কোর্স"
                              : "Product/প্রোডাক্ট",
                          )
                          .join(", ")}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {formatCurrency(order.finalAmount)}
                      </Typography>
                      {order.discountAmount > 0 && (
                        <Typography
                          variant="caption"
                          color="success.main"
                          display="block"
                        >
                          -{formatCurrency(order.discountAmount)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={
                          PAYMENT_METHODS[order.paymentMethod] ||
                          order.paymentMethod
                        }
                        size="small"
                        variant="outlined"
                      />
                      {order.transactionId && (
                        <Typography
                          variant="caption"
                          display="block"
                          color="text.secondary"
                        >
                          TXN: {order.transactionId.substring(0, 10)}...
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{renderStatusChip(order.status)}</TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {format(new Date(order.createdAt), "MMM dd, yyyy")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {format(new Date(order.createdAt), "HH:mm")}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                        flexWrap="wrap"
                      >
                        <Tooltip title="View Details / বিস্তারিত দেখুন">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(order._id)}
                            color="primary"
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>

                        {STATUS_ACTIONS[order.status]?.map((action) => (
                          <Tooltip
                            key={action.action}
                            title={`${action.label} / ${action.labelBn}`}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleAction(order, action.action)}
                              color={action.color}
                            >
                              {action.icon}
                            </IconButton>
                          </Tooltip>
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {pagination.pages > 1 && (
          <Box
            sx={{
              mt: 3,
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 1,
            }}
          >
            <Pagination
              count={pagination.pages}
              page={pagination.page}
              onChange={handlePageChange}
              color="primary"
              showFirstButton
              showLastButton
              size={isMobile ? "small" : "medium"}
              siblingCount={isMobile ? 0 : 1}
              boundaryCount={isMobile ? 1 : 2}
            />
          </Box>
        )}

        {/* Order Detail Dialog */}
        <Dialog
          open={detailOpen}
          onClose={() => setDetailOpen(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
        >
          {selectedOrder && (
            <>
              <DialogTitle>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  flexWrap="wrap"
                  gap={1}
                >
                  <Typography variant="h6">
                    Order / অর্ডার #{selectedOrder.orderNumber}
                  </Typography>
                  {renderStatusChip(selectedOrder.status)}
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Order Summary / অর্ডার সারাংশ
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">
                              Subtotal / মোট
                            </Typography>
                            <Typography>
                              {formatCurrency(selectedOrder.totalAmount)}
                            </Typography>
                          </Box>

                          {selectedOrder.discountAmount > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="success.main">
                                <DiscountIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5, verticalAlign: "middle" }}
                                />
                                Discount / ছাড়{" "}
                                {selectedOrder.couponCode &&
                                  `(${selectedOrder.couponCode})`}
                              </Typography>
                              <Typography color="success.main">
                                -{formatCurrency(selectedOrder.discountAmount)}
                              </Typography>
                            </Box>
                          )}

                          {selectedOrder.shippingCost > 0 && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">
                                Shipping / শিপিং
                              </Typography>
                              <Typography>
                                {formatCurrency(selectedOrder.shippingCost)}
                              </Typography>
                            </Box>
                          )}

                          <Divider />

                          <Box display="flex" justifyContent="space-between">
                            <Typography variant="h6">
                              Total / সর্বমোট
                            </Typography>
                            <Typography variant="h6" color="primary">
                              {formatCurrency(selectedOrder.finalAmount)}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Payment Information / পেমেন্ট তথ্য
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Stack spacing={2}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">
                              Method / পদ্ধতি
                            </Typography>
                            <Chip
                              label={
                                PAYMENT_METHODS[selectedOrder.paymentMethod]
                              }
                              size="small"
                            />
                          </Box>

                          {selectedOrder.transactionId && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">
                                Transaction ID / ট্রানজেকশন আইডি
                              </Typography>
                              <Typography
                                fontFamily="monospace"
                                fontSize="small"
                              >
                                {selectedOrder.transactionId}
                              </Typography>
                            </Box>
                          )}

                          {selectedOrder.paymentScreenshot?.url && (
                            <Box>
                              <Typography color="text.secondary" gutterBottom>
                                Payment Screenshot / পেমেন্ট স্ক্রিনশট
                              </Typography>
                              <Button
                                variant="outlined"
                                startIcon={<ImageIcon />}
                                onClick={() =>
                                  handlePreviewImage(
                                    selectedOrder.paymentScreenshot.url,
                                  )
                                }
                                fullWidth
                              >
                                View / দেখুন
                              </Button>
                            </Box>
                          )}

                          {selectedOrder.verifiedBy && (
                            <>
                              <Divider />
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography color="text.secondary">
                                  Verified By / যাচাইকারী
                                </Typography>
                                <Typography>
                                  {selectedOrder.verifiedBy?.fullName ||
                                    "Admin / অ্যাডমিন"}
                                </Typography>
                              </Box>
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography color="text.secondary">
                                  Verified At / যাচাইের সময়
                                </Typography>
                                <Typography>
                                  {selectedOrder.verifiedAt &&
                                    format(
                                      new Date(selectedOrder.verifiedAt),
                                      "MMM dd, yyyy HH:mm",
                                    )}
                                </Typography>
                              </Box>
                            </>
                          )}

                          {selectedOrder.rejectionReason && (
                            <Alert severity="error" sx={{ mt: 1 }}>
                              <Typography variant="subtitle2">
                                Rejection Reason / বাতিলের কারণ:
                              </Typography>
                              {selectedOrder.rejectionReason}
                            </Alert>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>

                  {selectedOrder.trackingNumber && (
                    <Grid size={{ xs: 12 }}>
                      <Card variant="outlined">
                        <CardContent>
                          <Typography variant="h6" gutterBottom>
                            Shipping Information / শিপিং তথ্য
                          </Typography>
                          <Divider sx={{ mb: 2 }} />
                          <Stack spacing={1}>
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">
                                Provider / প্রদানকারী
                              </Typography>
                              <Typography>
                                {selectedOrder.shippingProvider}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">
                                Tracking Number / ট্র্যাকিং নম্বর
                              </Typography>
                              <Typography fontFamily="monospace">
                                {selectedOrder.trackingNumber}
                              </Typography>
                            </Box>
                            {selectedOrder.estimatedDelivery && (
                              <Box
                                display="flex"
                                justifyContent="space-between"
                              >
                                <Typography color="text.secondary">
                                  Estimated Delivery / সম্ভাব্য ডেলিভারি
                                </Typography>
                                <Typography>
                                  {format(
                                    new Date(selectedOrder.estimatedDelivery),
                                    "PPP",
                                  )}
                                </Typography>
                              </Box>
                            )}
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Customer Information / কাস্টমার তথ্য
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Grid container spacing={2}>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PersonIcon color="action" />
                              <Typography>
                                {selectedOrder.user?.fullName || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <EmailIcon color="action" />
                              <Typography>
                                {selectedOrder.user?.email || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <PhoneIcon color="action" />
                              <Typography>
                                {selectedOrder.user?.phone || "N/A"}
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <CalendarIcon color="action" />
                              <Typography>
                                Ordered / অর্ডারের সময়:{" "}
                                {format(
                                  new Date(selectedOrder.createdAt),
                                  "PPP",
                                )}
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>

                  {!selectedOrder.isDigital && (
                    <Grid size={{ xs: 12 }}>
                      {renderDeliveryAddress(selectedOrder.deliveryAddress)}
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    {renderOrderItems(selectedOrder.items)}
                  </Grid>

                  {selectedOrder.notes && (
                    <Grid size={{ xs: 12 }}>
                      <Alert severity="info">
                        <Typography variant="subtitle2">
                          Customer Notes / কাস্টমার নোট:
                        </Typography>
                        {selectedOrder.notes}
                      </Alert>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    {renderStatusHistory(selectedOrder.statusHistory)}
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions sx={{ flexWrap: "wrap", gap: 1 }}>
                {selectedOrder.status === "Pending" && (
                  <>
                    <Button
                      onClick={() => handleOpenRejectDialog(selectedOrder)}
                      color="error"
                      variant="outlined"
                      size={isMobile ? "small" : "medium"}
                    >
                      Reject / বাতিল
                    </Button>
                    <Button
                      onClick={() => handleAction(selectedOrder, "verify")}
                      color="success"
                      variant="contained"
                      startIcon={<CheckCircleIcon />}
                      size={isMobile ? "small" : "medium"}
                    >
                      Verify / যাচাই করুন
                    </Button>
                  </>
                )}
                {selectedOrder.status === "Verified" && (
                  <Button
                    onClick={() => handleAction(selectedOrder, "process")}
                    color="info"
                    variant="contained"
                    startIcon={<InventoryIcon />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Process / প্রক্রিয়া করুন
                  </Button>
                )}
                {selectedOrder.status === "Processing" && (
                  <Button
                    onClick={() => handleAction(selectedOrder, "ship")}
                    color="primary"
                    variant="contained"
                    startIcon={<ShippingIcon />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Ship / পাঠান
                  </Button>
                )}
                {selectedOrder.status === "Shipped" && (
                  <Button
                    onClick={() => handleAction(selectedOrder, "deliver")}
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Deliver / ডেলিভার করুন
                  </Button>
                )}
                {selectedOrder.status === "Delivered" && (
                  <Button
                    onClick={() => handleAction(selectedOrder, "complete")}
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                    size={isMobile ? "small" : "medium"}
                  >
                    Complete / সম্পন্ন করুন
                  </Button>
                )}
                <Button
                  onClick={() => setDetailOpen(false)}
                  size={isMobile ? "small" : "medium"}
                >
                  Close / বন্ধ করুন
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Reject Payment / পেমেন্ট বাতিল করুন</DialogTitle>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Order / অর্ডার: {selectedOrder?.orderNumber}
            </Typography>
            <TextField
              autoFocus
              margin="dense"
              label="Rejection Reason / বাতিলের কারণ"
              fullWidth
              multiline
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a detailed reason / বিস্তারিত কারণ দিন (minimum / কমপক্ষে 10 characters / অক্ষর)"
              helperText={`${rejectReason.length} characters / অক্ষর (min / কমপক্ষে 10)`}
              error={rejectReason.length > 0 && rejectReason.length < 10}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setRejectDialogOpen(false)}
              size={isMobile ? "small" : "medium"}
            >
              Cancel / বাতিল
            </Button>
            <Button
              onClick={handleRejectPayment}
              color="error"
              variant="contained"
              disabled={rejectReason.trim().length < 10}
              size={isMobile ? "small" : "medium"}
            >
              Reject / বাতিল করুন
            </Button>
          </DialogActions>
        </Dialog>

        {/* Shipping Dialog */}
        <Dialog
          open={shippingDialogOpen}
          onClose={() => setShippingDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
        >
          <DialogTitle>Ship Order / অর্ডার পাঠান</DialogTitle>
          <DialogContent>
            <Typography variant="body2" gutterBottom>
              Order / অর্ডার: {selectedOrder?.orderNumber}
            </Typography>
            <Stack spacing={2} sx={{ mt: 2 }}>
              <TextField
                label="Tracking Number / ট্র্যাকিং নম্বর"
                fullWidth
                value={shippingData.trackingNumber}
                onChange={(e) =>
                  setShippingData({
                    ...shippingData,
                    trackingNumber: e.target.value,
                  })
                }
                required
              />
              <FormControl fullWidth>
                <InputLabel>Shipping Provider / শিপিং প্রদানকারী</InputLabel>
                <Select
                  value={shippingData.shippingProvider}
                  label="Shipping Provider / শিপিং প্রদানকারী"
                  onChange={(e) =>
                    setShippingData({
                      ...shippingData,
                      shippingProvider: e.target.value,
                    })
                  }
                >
                  <MenuItem value="Pathao">Pathao</MenuItem>
                  <MenuItem value="RedX">RedX</MenuItem>
                  <MenuItem value="SteadFast">SteadFast</MenuItem>
                  <MenuItem value="Paperfly">Paperfly</MenuItem>
                  <MenuItem value="Sundarban">
                    Sundarban Courier / সুন্দরবন কুরিয়ার
                  </MenuItem>
                  <MenuItem value="Other">Other / অন্যান্য</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Estimated Delivery Date / সম্ভাব্য ডেলিভারি তারিখ"
                type="date"
                fullWidth
                value={shippingData.estimatedDelivery}
                onChange={(e) =>
                  setShippingData({
                    ...shippingData,
                    estimatedDelivery: e.target.value,
                  })
                }
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setShippingDialogOpen(false)}
              size={isMobile ? "small" : "medium"}
            >
              Cancel / বাতিল
            </Button>
            <Button
              onClick={async () => {
                const success = await handleStatusUpdate(
                  selectedOrder._id,
                  "Shipped",
                  shippingData,
                );
                if (success) {
                  setShippingDialogOpen(false);
                  setShippingData({
                    trackingNumber: "",
                    shippingProvider: "",
                    estimatedDelivery: "",
                  });
                }
              }}
              variant="contained"
              disabled={
                !shippingData.trackingNumber || !shippingData.shippingProvider
              }
              size={isMobile ? "small" : "medium"}
            >
              Confirm / নিশ্চিত করুন
            </Button>
          </DialogActions>
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={imagePreviewOpen}
          onClose={() => setImagePreviewOpen(false)}
          maxWidth="lg"
          fullScreen={isMobile}
        >
          <DialogContent sx={{ p: 0, position: "relative" }}>
            <img
              src={previewImage}
              alt="Payment Screenshot / পেমেন্ট স্ক্রিনশট"
              style={{
                width: "100%",
                height: "auto",
                maxHeight: isMobile ? "100vh" : "80vh",
                objectFit: "contain",
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setImagePreviewOpen(false)}
              size={isMobile ? "small" : "medium"}
            >
              Close / বন্ধ করুন
            </Button>
            <Button
              href={previewImage}
              target="_blank"
              rel="noopener noreferrer"
              color="primary"
              size={isMobile ? "small" : "medium"}
            >
              Open in New Tab / নতুন ট্যাবে খুলুন
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Box>
  );
};

export default ManageOrders;
