import React, { useState, useEffect, useCallback } from 'react';
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
} from '@mui/material';
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
  AttachMoney as MoneyIcon,
  Discount as DiscountIcon,
  Inventory as InventoryIcon,
  School as SchoolIcon,
  Email as EmailIcon,
  // 🔴 [NEW] Add Processing icon
  Settings as SettingsIcon,
} from '@mui/icons-material';
import axiosInstance from '../../utils/axiosInstance';
import { format } from 'date-fns';

// ✅ All Statuses from Order Model
const STATUS_CONFIG = {
  Pending: { color: 'warning', icon: <PaymentIcon />, label: 'Pending' },
  Verified: { color: 'success', icon: <CheckCircleIcon />, label: 'Verified' },
  Rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
  Processing: { color: 'info', icon: <SettingsIcon />, label: 'Processing' }, // 🔴 [CHANGED] Icon changed
  Shipped: { color: 'primary', icon: <ShippingIcon />, label: 'Shipped' },
  Delivered: { color: 'success', icon: <CheckCircleIcon />, label: 'Delivered' },
  Completed: { color: 'success', icon: <CheckCircleIcon />, label: 'Completed' },
  Cancelled: { color: 'default', icon: <CancelIcon />, label: 'Cancelled' },
};

const PAYMENT_METHODS = {
  bkash: 'bKash',
  nagad: 'Nagad',
  rocket: 'Rocket',
  bank: 'Bank Transfer',
  cash: 'Cash on Delivery',
};

// 🔴 [NEW] ADD THIS ENTIRE CONFIGURATION OBJECT
// ✅ ALL STATUS ACTIONS CONFIGURATION
const STATUS_ACTIONS = {
  Pending: [
    { action: 'verify', label: 'Verify Payment', color: 'success', icon: <CheckCircleIcon /> },
    { action: 'reject', label: 'Reject Payment', color: 'error', icon: <CancelIcon /> },
    { action: 'cancel', label: 'Cancel Order', color: 'default', icon: <CancelIcon /> },
  ],
  Verified: [
    { action: 'process', label: 'Start Processing', color: 'info', icon: <InventoryIcon /> },
  ],
  Processing: [
    { action: 'ship', label: 'Mark Shipped', color: 'primary', icon: <ShippingIcon /> },
  ],
  Shipped: [
    { action: 'deliver', label: 'Mark Delivered', color: 'success', icon: <CheckCircleIcon /> },
  ],
  Delivered: [
    { action: 'complete', label: 'Complete Order', color: 'success', icon: <CheckCircleIcon /> },
  ],
  Rejected: [], // No actions
  Cancelled: [], // No actions
  Completed: [], // No actions
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
  const [rejectReason, setRejectReason] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });
  const [imagePreviewOpen, setImagePreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 🔴 [NEW] ADD THESE STATE VARIABLES
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [shippingData, setShippingData] = useState({
    trackingNumber: '',
    shippingProvider: '',
    estimatedDelivery: '',
  });

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: pagination.page,
        limit: pagination.limit,
      };

      let endpoint = '/orders/admin/pending';
      if (activeTab === 1) {
        endpoint = '/orders/admin/all'; // 🔴 [CHANGED] Use admin all orders endpoint
        if (statusFilter) params.status = statusFilter;
      }

      const response = await axiosInstance.get(endpoint, { params });
      
      if (response.data.success) {
        setOrders(response.data.orders);
        setPagination(response.data.pagination || pagination);
      }
    } catch (error) {
      showSnackbar(error.response?.data?.message || 'Failed to fetch orders', 'error');
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
      showSnackbar('Failed to fetch order details', 'error');
    }
  };

  // 🔴 [NEW] ADD THIS ENTIRE FUNCTION - Status Update Handler
  // ✅ STATUS UPDATE API HANDLERS
  const handleStatusUpdate = async (orderId, newStatus, additionalData = {}) => {
    try {
      let endpoint = '';
      let method = 'patch';
      let data = {};

      switch (newStatus) {
        case 'Verified':
          endpoint = `/orders/${orderId}/verify`;
          break;
        case 'Rejected':
          endpoint = `/orders/${orderId}/reject`;
          data = { reason: additionalData.reason };
          break;
        case 'Processing':
          endpoint = `/orders/${orderId}/status`;
          data = { status: 'Processing', note: 'Order processing started' };
          break;
        case 'Shipped':
          endpoint = `/orders/${orderId}/ship`;
          data = { 
            trackingNumber: additionalData.trackingNumber,
            shippingProvider: additionalData.shippingProvider,
            estimatedDelivery: additionalData.estimatedDelivery 
          };
          break;
        case 'Delivered':
          endpoint = `/orders/${orderId}/deliver`;
          data = { deliveredAt: new Date() };
          break;
        case 'Completed':
          endpoint = `/orders/${orderId}/complete`;
          break;
        case 'Cancelled':
          endpoint = `/orders/${orderId}/cancel`;
          break;
        default:
          throw new Error('Unknown status');
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
      showSnackbar(error.response?.data?.message || `Failed to ${newStatus.toLowerCase()} order`, 'error');
      return false;
    }
  };

  // 🔴 [NEW] ADD THIS ENTIRE FUNCTION - Action Handler
  // ✅ ACTION HANDLER
  const handleAction = async (order, actionType) => {
    switch (actionType) {
      case 'verify':
        if (!window.confirm('Verify this payment?')) return;
        await handleStatusUpdate(order._id, 'Verified');
        break;
        
      case 'reject':
        handleOpenRejectDialog(order);
        break;
        
      case 'cancel':
        if (!window.confirm('Cancel this order?')) return;
        await handleStatusUpdate(order._id, 'Cancelled');
        break;
        
      case 'process':
        if (!window.confirm('Start processing this order?')) return;
        await handleStatusUpdate(order._id, 'Processing');
        break;
        
      case 'ship':
        setSelectedOrder(order);
        setShippingDialogOpen(true); // Open shipping dialog
        break;
        
      case 'deliver':
        if (!window.confirm('Mark as delivered?')) return;
        await handleStatusUpdate(order._id, 'Delivered');
        break;
        
      case 'complete':
        if (!window.confirm('Complete this order?')) return;
        await handleStatusUpdate(order._id, 'Completed');
        break;
        
      default:
        console.error('Unknown action:', actionType);
    }
  };

  // 🔴 [CHANGED] Update handleVerifyPayment to use new handler
  const handleVerifyPayment = async (orderId) => {
    await handleAction({ _id: orderId }, 'verify');
  };

  // 🔴 [CHANGED] Update handleOpenRejectDialog
  const handleOpenRejectDialog = (order) => {
    setSelectedOrder(order);
    setRejectReason('');
    setRejectDialogOpen(true);
  };

  // 🔴 [CHANGED] Update handleRejectPayment to use new handler
  const handleRejectPayment = async () => {
    if (!rejectReason.trim() || rejectReason.trim().length < 10) {
      showSnackbar('Rejection reason must be at least 10 characters', 'error');
      return;
    }

    const success = await handleStatusUpdate(selectedOrder._id, 'Rejected', { reason: rejectReason.trim() });
    if (success) {
      setRejectDialogOpen(false);
    }
  };

  // 🔴 [CHANGED] Update handleCancelOrder to use new handler
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    await handleStatusUpdate(order._id, 'Cancelled');
  };

  const handlePreviewImage = (imageUrl) => {
    setPreviewImage(imageUrl);
    setImagePreviewOpen(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-BD', {
      style: 'currency',
      currency: 'BDT',
      minimumFractionDigits: 0,
    }).format(amount || 0);
  };

  const renderStatusChip = (status) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG.Pending;
    return (
      <Chip
        icon={config.icon}
        label={config.label}
        color={config.color}
        size="small"
        variant="outlined"
      />
    );
  };

  const renderOrderItems = (items) => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" gutterBottom>
        Order Items ({items?.length || 0})
      </Typography>
      {items?.map((item, index) => (
        <Card key={index} variant="outlined" sx={{ mb: 1 }}>
          <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 'auto' }}>
                <Avatar
                  src={item.image}
                  alt={item.name}
                  variant="rounded"
                  sx={{ width: 60, height: 60 }}
                >
                  {item.itemType === 'course' ? <SchoolIcon /> : <InventoryIcon />}
                </Avatar>
              </Grid>
              <Grid size={{ xs: 12, sm: true }}>
                <Typography variant="body1" fontWeight="medium">
                  {item.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Type: {item.itemType === 'course' ? 'Course' : 'Product'} | Qty: {item.quantity}
                </Typography>
                <Typography variant="body2" color="primary">
                  {formatCurrency(item.priceAtPurchase)} each
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 'auto' }}>
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
    if (!address) return <Typography color="text.secondary">Digital Product - No delivery needed</Typography>;
    
    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle2" gutterBottom>
          Delivery Address
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
                  {[address.address, address.city, address.district, address.postalCode && `-${address.postalCode}`]
                    .filter(Boolean)
                    .join(', ')}
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
          Status History
        </Typography>
        <Stack spacing={1}>
          {history.map((record, index) => (
            <Box key={index} display="flex" alignItems="center" gap={2} flexWrap="wrap">
              <Chip
                label={record.status}
                size="small"
                color={STATUS_CONFIG[record.status]?.color || 'default'}
              />
              <Typography variant="caption" color="text.secondary">
                {format(new Date(record.changedAt), 'MMM dd, yyyy HH:mm')}
              </Typography>
              {record.changedBy && (
                <Typography variant="caption" color="text.secondary">
                  by {record.changedBy?.fullName || 'System'}
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
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Manage Orders
      </Typography>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab 
            label={
              <Badge 
                color="error" 
                variant="dot" 
                invisible={!orders.some(o => o.status === 'Pending')}
              >
                Pending Orders
              </Badge>
            } 
          />
          <Tab label="All Orders" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField
              fullWidth
              label="Search by Order #"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Statuses</MenuItem>
                {Object.keys(STATUS_CONFIG).map((status) => (
                  <MenuItem key={status} value={status}>
                    {status}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Per Page</InputLabel>
              <Select
                value={pagination.limit}
                label="Per Page"
                onChange={handleLimitChange}
              >
                <MenuItem value={10}>10</MenuItem>
                <MenuItem value={20}>20</MenuItem>
                <MenuItem value={50}>50</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 3 }}>
            <Button variant="outlined" onClick={fetchOrders} fullWidth>
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order #</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Amount</TableCell>
              <TableCell>Payment</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Date</TableCell>
              <TableCell align="center">Actions</TableCell>
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
                  <Typography color="text.secondary">No orders found</Typography>
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
                      <Chip label="Digital" size="small" color="info" sx={{ mt: 0.5 }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.user?.fullName || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.user?.email || order.user?.phone}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {order.items?.length || 0} item(s)
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {order.items?.map(i => i.itemType === 'course' ? 'Course' : 'Product').join(', ')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {formatCurrency(order.finalAmount)}
                    </Typography>
                    {order.discountAmount > 0 && (
                      <Typography variant="caption" color="success.main" display="block">
                        -{formatCurrency(order.discountAmount)}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={PAYMENT_METHODS[order.paymentMethod] || order.paymentMethod}
                      size="small"
                      variant="outlined"
                    />
                    {order.transactionId && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        TXN: {order.transactionId.substring(0, 10)}...
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{renderStatusChip(order.status)}</TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {format(new Date(order.createdAt), 'MMM dd, yyyy')}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {format(new Date(order.createdAt), 'HH:mm')}
                    </Typography>
                  </TableCell>
                  {/* 🔴 [CHANGED] Updated Actions Cell */}
                  <TableCell align="center">
                    <Stack direction="row" spacing={1} justifyContent="center">
                      {/* View Details - Always visible */}
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => handleViewDetails(order._id)}
                          color="primary"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>

                      {/* 🔴 [NEW] Status-specific actions */}
                      {STATUS_ACTIONS[order.status]?.map((action) => (
                        <Tooltip key={action.action} title={action.label}>
                          <IconButton
                            size="small"
                            onClick={() => handleAction(order, action.action)}
                            color={action.color}
                            disabled={action.disabled}
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
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={pagination.pages}
            page={pagination.page}
            onChange={handlePageChange}
            color="primary"
            showFirstButton
            showLastButton
          />
        </Box>
      )}

      {/* Order Detail Dialog */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedOrder && (
          <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">
                  Order #{selectedOrder.orderNumber}
                </Typography>
                {renderStatusChip(selectedOrder.status)}
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Order Summary */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order Summary
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Subtotal</Typography>
                          <Typography>{formatCurrency(selectedOrder.totalAmount)}</Typography>
                        </Box>
                        
                        {selectedOrder.discountAmount > 0 && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="success.main">
                              <DiscountIcon fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                              Discount {selectedOrder.couponCode && `(${selectedOrder.couponCode})`}
                            </Typography>
                            <Typography color="success.main">
                              -{formatCurrency(selectedOrder.discountAmount)}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedOrder.shippingCost > 0 && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Shipping</Typography>
                            <Typography>{formatCurrency(selectedOrder.shippingCost)}</Typography>
                          </Box>
                        )}
                        
                        <Divider />
                        
                        <Box display="flex" justifyContent="space-between">
                          <Typography variant="h6">Total</Typography>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(selectedOrder.finalAmount)}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Payment Info */}
                <Grid size={{ xs: 12, md: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Payment Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Stack spacing={2}>
                        <Box display="flex" justifyContent="space-between">
                          <Typography color="text.secondary">Method</Typography>
                          <Chip
                            label={PAYMENT_METHODS[selectedOrder.paymentMethod]}
                            size="small"
                          />
                        </Box>
                        
                        {selectedOrder.transactionId && (
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Transaction ID</Typography>
                            <Typography fontFamily="monospace" fontSize="small">
                              {selectedOrder.transactionId}
                            </Typography>
                          </Box>
                        )}
                        
                        {selectedOrder.paymentScreenshot?.url && (
                          <Box>
                            <Typography color="text.secondary" gutterBottom>
                              Payment Screenshot
                            </Typography>
                            <Button
                              variant="outlined"
                              startIcon={<ImageIcon />}
                              onClick={() => handlePreviewImage(selectedOrder.paymentScreenshot.url)}
                              fullWidth
                            >
                              View Screenshot
                            </Button>
                          </Box>
                        )}
                        
                        {selectedOrder.verifiedBy && (
                          <>
                            <Divider />
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">Verified By</Typography>
                              <Typography>
                                {selectedOrder.verifiedBy?.fullName || 'Admin'}
                              </Typography>
                            </Box>
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">Verified At</Typography>
                              <Typography>
                                {selectedOrder.verifiedAt && 
                                  format(new Date(selectedOrder.verifiedAt), 'MMM dd, yyyy HH:mm')}
                              </Typography>
                            </Box>
                          </>
                        )}
                        
                        {selectedOrder.rejectionReason && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography variant="subtitle2">Rejection Reason:</Typography>
                            {selectedOrder.rejectionReason}
                          </Alert>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>

                {/* 🔴 [NEW] Shipping Info (if available) */}
                {selectedOrder.trackingNumber && (
                  <Grid size={{ xs: 12 }}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Shipping Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={1}>
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Provider</Typography>
                            <Typography>{selectedOrder.shippingProvider}</Typography>
                          </Box>
                          <Box display="flex" justifyContent="space-between">
                            <Typography color="text.secondary">Tracking Number</Typography>
                            <Typography fontFamily="monospace">{selectedOrder.trackingNumber}</Typography>
                          </Box>
                          {selectedOrder.estimatedDelivery && (
                            <Box display="flex" justifyContent="space-between">
                              <Typography color="text.secondary">Estimated Delivery</Typography>
                              <Typography>{format(new Date(selectedOrder.estimatedDelivery), 'PPP')}</Typography>
                            </Box>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Customer Info */}
                <Grid size={{ xs: 12 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Customer Information
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PersonIcon color="action" />
                            <Typography>
                              {selectedOrder.user?.fullName || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <EmailIcon color="action" />
                            <Typography>
                              {selectedOrder.user?.email || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <PhoneIcon color="action" />
                            <Typography>
                              {selectedOrder.user?.phone || 'N/A'}
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <CalendarIcon color="action" />
                            <Typography>
                              Ordered: {format(new Date(selectedOrder.createdAt), 'PPP')}
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Delivery Address */}
                {!selectedOrder.isDigital && (
                  <Grid size={{ xs: 12 }}>
                    {renderDeliveryAddress(selectedOrder.deliveryAddress)}
                  </Grid>
                )}

                {/* Order Items */}
                <Grid size={{ xs: 12 }}>
                  {renderOrderItems(selectedOrder.items)}
                </Grid>

                {/* Notes */}
                {selectedOrder.notes && (
                  <Grid size={{ xs: 12 }}>
                    <Alert severity="info">
                      <Typography variant="subtitle2">Customer Notes:</Typography>
                      {selectedOrder.notes}
                    </Alert>
                  </Grid>
                )}

                {/* Status History */}
                <Grid size={{ xs: 12 }}>
                  {renderStatusHistory(selectedOrder.statusHistory)}
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              {/* 🔴 [CHANGED] Updated Dialog Actions */}
              {selectedOrder.status === 'Pending' && (
                <>
                  <Button
                    onClick={() => handleOpenRejectDialog(selectedOrder)}
                    color="error"
                    variant="outlined"
                  >
                    Reject Payment
                  </Button>
                  <Button
                    onClick={() => handleAction(selectedOrder, 'verify')}
                    color="success"
                    variant="contained"
                    startIcon={<CheckCircleIcon />}
                  >
                    Verify Payment
                  </Button>
                </>
              )}
              {selectedOrder.status === 'Verified' && (
                <Button
                  onClick={() => handleAction(selectedOrder, 'process')}
                  color="info"
                  variant="contained"
                  startIcon={<InventoryIcon />}
                >
                  Start Processing
                </Button>
              )}
              {selectedOrder.status === 'Processing' && (
                <Button
                  onClick={() => handleAction(selectedOrder, 'ship')}
                  color="primary"
                  variant="contained"
                  startIcon={<ShippingIcon />}
                >
                  Mark Shipped
                </Button>
              )}
              {selectedOrder.status === 'Shipped' && (
                <Button
                  onClick={() => handleAction(selectedOrder, 'deliver')}
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                >
                  Mark Delivered
                </Button>
              )}
              {selectedOrder.status === 'Delivered' && (
                <Button
                  onClick={() => handleAction(selectedOrder, 'complete')}
                  color="success"
                  variant="contained"
                  startIcon={<CheckCircleIcon />}
                >
                  Complete Order
                </Button>
              )}
              <Button onClick={() => setDetailOpen(false)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Order: {selectedOrder?.orderNumber}
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Please provide a detailed reason for rejection (minimum 10 characters)"
            helperText={`${rejectReason.length} characters (min 10)`}
            error={rejectReason.length > 0 && rejectReason.length < 10}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleRejectPayment}
            color="error"
            variant="contained"
            disabled={rejectReason.trim().length < 10}
          >
            Reject Payment
          </Button>
        </DialogActions>
      </Dialog>

      {/* 🔴 [NEW] ADD THIS ENTIRE SHIPPING DIALOG */}
      {/* Shipping Dialog */}
      <Dialog 
        open={shippingDialogOpen} 
        onClose={() => setShippingDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Ship Order</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Order: {selectedOrder?.orderNumber}
          </Typography>
          <Stack spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Tracking Number"
              fullWidth
              value={shippingData.trackingNumber}
              onChange={(e) => setShippingData({...shippingData, trackingNumber: e.target.value})}
              required
            />
            <FormControl fullWidth>
              <InputLabel>Shipping Provider</InputLabel>
              <Select
                value={shippingData.shippingProvider}
                label="Shipping Provider"
                onChange={(e) => setShippingData({...shippingData, shippingProvider: e.target.value})}
              >
                <MenuItem value="Pathao">Pathao</MenuItem>
                <MenuItem value="RedX">RedX</MenuItem>
                <MenuItem value="SteadFast">SteadFast</MenuItem>
                <MenuItem value="Paperfly">Paperfly</MenuItem>
                <MenuItem value="Sundarban">Sundarban Courier</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Estimated Delivery Date"
              type="date"
              fullWidth
              value={shippingData.estimatedDelivery}
              onChange={(e) => setShippingData({...shippingData, estimatedDelivery: e.target.value})}
              InputLabelProps={{ shrink: true }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShippingDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={async () => {
              const success = await handleStatusUpdate(
                selectedOrder._id, 
                'Shipped', 
                shippingData
              );
              if (success) {
                setShippingDialogOpen(false);
                setShippingData({ trackingNumber: '', shippingProvider: '', estimatedDelivery: '' });
              }
            }}
            variant="contained"
            disabled={!shippingData.trackingNumber || !shippingData.shippingProvider}
          >
            Confirm Shipment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Preview Dialog */}
      <Dialog
        open={imagePreviewOpen}
        onClose={() => setImagePreviewOpen(false)}
        maxWidth="lg"
      >
        <DialogContent sx={{ p: 0 }}>
          <img
            src={previewImage}
            alt="Payment Screenshot"
            style={{ width: '100%', height: 'auto', maxHeight: '80vh', objectFit: 'contain' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImagePreviewOpen(false)}>Close</Button>
          <Button
            href={previewImage}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
          >
            Open in New Tab
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ManageOrders;