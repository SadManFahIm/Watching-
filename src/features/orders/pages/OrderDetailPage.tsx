import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Paper,
  Stack,
  Step,
  StepConnector,
  StepContent,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useOrder, useCancelOrder } from '@/api/orders.api';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/axios';
import { ORDER_FLOW, ORDER_STATUS_LABELS, PAYMENT_META } from '@/features/orders/constants';
import AuditTimeline from '@/features/orders/components/AuditTimeline';
import Seo from '@/components/seo/Seo';
import { formatCurrency, formatDate } from '@/utils/helpers';

const OrderDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const cancelOrder = useCancelOrder();

  const { data: order, isLoading, isError, error, refetch } = useOrder(id ?? '');
  const isOwner = Boolean(order && user && order.userId === user.id);

  const canCancel = Boolean(
    order && isOwner && (order.orderStatus === 'pending' || order.orderStatus === 'processing')
  );

  const handleCancel = async () => {
    if (!order) return;
    if (!window.confirm('Cancel this order? This cannot be undone.')) return;
    try {
      await cancelOrder.mutateAsync(order.id);
      await refetch();
    } catch {
      // Toast handled by the mutation hook
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box className="skeleton" sx={{ width: 200, height: 20, borderRadius: 1, mb: 3 }} />
        <Box className="skeleton" sx={{ height: 260, borderRadius: 2 }} />
      </Container>
    );
  }

  if (isError || !order) {
    return (
      <Container maxWidth="sm" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Order not found
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {getApiErrorMessage(error, 'This order could not be loaded.')}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button variant="outlined" onClick={() => navigate('/dashboard/orders')}>
            Back to orders
          </Button>
        </Stack>
      </Container>
    );
  }

  const paymentMeta = PAYMENT_META[order.paymentStatus];
  const flowIndex = ORDER_FLOW.indexOf(order.orderStatus);
  const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Seo
        title={`Order ${order.id.toUpperCase()}`}
        description={`Track your Classic Watch Pro order ${order.id.toUpperCase()} — ${ORDER_STATUS_LABELS[order.orderStatus]}.`}
        noindex
      />
      <Button
        component={RouterLink}
        to="/dashboard/orders"
        startIcon={<ArrowBack />}
        sx={{ mb: 2 }}
      >
        Back to my orders
      </Button>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 0.5 }}
      >
        <Box>
          <Typography variant="overline" color="text.secondary" fontWeight={700}>
            Order details
          </Typography>
          <Typography variant="h4" component="h1" fontWeight={700}>
            Order #{order.id.toUpperCase()}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label={ORDER_STATUS_LABELS[order.orderStatus]}
            color="primary"
            size="small"
            sx={{ fontWeight: 700 }}
          />
          <Chip
            label={paymentMeta.label}
            color={paymentMeta.color}
            size="small"
            variant="outlined"
          />
        </Stack>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Placed {formatDate(order.createdAt, 'long')} · {itemCount} item{itemCount === 1 ? '' : 's'}
        {order.trackingNumber ? ` · Tracking ${order.trackingNumber}` : ''}
      </Typography>

      {order.orderStatus === 'cancelled' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          This order was cancelled.{' '}
          {order.paymentStatus === 'refunded'
            ? 'Your payment has been refunded.'
            : 'No payment was captured.'}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          {/* Timeline */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Order progress
            </Typography>
            <Stepper activeStep={flowIndex >= 0 ? flowIndex : 0} orientation="vertical" nonLinear>
              {ORDER_FLOW.map((status, index) => {
                const reached = flowIndex >= 0 && index <= flowIndex;
                return (
                  <Step key={status}>
                    <StepConnector />
                    <StepLabel StepIconComponent={() => null} optional={null}>
                      <Typography
                        fontWeight={status === order.orderStatus ? 700 : 500}
                        color={
                          order.orderStatus === 'cancelled' && index === 0
                            ? 'text.secondary'
                            : undefined
                        }
                      >
                        {ORDER_STATUS_LABELS[status]}
                      </Typography>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        {reached
                          ? status === order.orderStatus
                            ? 'Current status'
                            : 'Completed'
                          : 'Pending'}
                      </Typography>
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
            {canCancel && (
              <Button
                color="error"
                variant="outlined"
                onClick={() => void handleCancel()}
                disabled={cancelOrder.isPending}
                sx={{ mt: 2 }}
              >
                {cancelOrder.isPending ? 'Cancelling…' : 'Cancel order'}
              </Button>
            )}
          </Paper>

          {/* Items */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Items
            </Typography>
            <Stack divider={<Divider />} spacing={1.5}>
              {order.items.map((item) => (
                <Box
                  key={item.productId}
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 2,
                  }}
                >
                  <Box>
                    <Typography fontWeight={600}>{item.product.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(item.product.price)} × {item.quantity}
                    </Typography>
                  </Box>
                  <Typography fontWeight={700}>
                    {formatCurrency(item.product.price * item.quantity)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Audit trail */}
          {order.history && order.history.length > 0 && (
            <Paper variant="outlined" sx={{ p: 3, mt: 3 }}>
              <AuditTimeline events={order.history} title="Order history" />
            </Paper>
          )}
        </Grid>

        <Grid item xs={12} md={5}>
          {/* Totals */}
          <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Payment summary
            </Typography>
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={600}>{formatCurrency(order.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography fontWeight={600}>
                  {order.shipping === 0 ? 'Free' : formatCurrency(order.shipping)}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Tax</Typography>
                <Typography fontWeight={600}>{formatCurrency(order.tax)}</Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography variant="h6" fontWeight={800} color="primary.main">
                {formatCurrency(order.total)}
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textTransform="capitalize"
              sx={{ mt: 1 }}
            >
              Paid via{' '}
              {order.paymentMethod === 'card'
                ? 'card'
                : order.paymentMethod === 'cod'
                  ? 'cash on delivery'
                  : 'digital wallet'}
            </Typography>
          </Paper>

          {/* Shipping address */}
          <Paper variant="outlined" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
              Shipping address
            </Typography>
            <Typography fontWeight={600}>{order.shippingAddress.fullName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress.addressLine1}
              {order.shippingAddress.addressLine2 ? `, ${order.shippingAddress.addressLine2}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress.city}
              {order.shippingAddress.state ? `, ${order.shippingAddress.state}` : ''}{' '}
              {order.shippingAddress.postalCode}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {order.shippingAddress.country}
            </Typography>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {order.shippingAddress.phone}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default OrderDetailPage;
