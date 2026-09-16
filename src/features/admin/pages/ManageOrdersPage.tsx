import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import { useAllOrders, useUpdateOrderStatus, useRefundOrder } from '@/api/orders.api';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';
import AuditTimeline from '@/features/orders/components/AuditTimeline';
import { ORDER_STATUS_LABELS, PAYMENT_META } from '@/features/orders/constants';
import { pushNotification } from '@/store/notifications.store';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import { formatCurrency, formatDate } from '@/utils/helpers';
import type { Order, OrderStatus } from '@/types';

const STATUS_FILTERS: { value: 'all' | OrderStatus; label: string }[] = [
  { value: 'all', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const NEXT_STATUS_OPTIONS: Partial<Record<OrderStatus, OrderStatus[]>> = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
};

const canAdvance = (status: OrderStatus): boolean => Boolean(NEXT_STATUS_OPTIONS[status]?.length);

const ManageOrdersPage = () => {
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const { data: orders, isLoading, isError, refetch } = useAllOrders(1, 200);
  const updateStatus = useUpdateOrderStatus();
  const refundOrder = useRefundOrder();

  const allOrders = useMemo(() => orders?.data ?? [], [orders]);

  const visibleOrders = useMemo(
    () => allOrders.filter((order) => filter === 'all' || order.orderStatus === filter),
    [allOrders, filter]
  );

  const handleStatusChange = async (order: Order, status: OrderStatus) => {
    const trackingNumber =
      status === 'shipped' && !order.trackingNumber ? undefined : order.trackingNumber;
    try {
      await updateStatus.mutateAsync({
        orderId: order.id,
        status,
        trackingNumber,
      });
      pushNotification({
        type: status === 'cancelled' ? 'warning' : 'info',
        title: `Order ${order.id} updated`,
        message: `Order ${order.id} is now ${status}.`,
      });
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  const handleRefund = async (order: Order) => {
    try {
      await refundOrder.mutateAsync(order.id);
      pushNotification({
        type: 'success',
        title: `Refund issued for ${order.id}`,
        message: `${formatCurrency(order.total)} was refunded to the original payment method.`,
      });
    } catch {
      // Error toast is handled by the mutation hook.
    }
  };

  return (
    <Box>
      <Seo
        title="Manage Orders"
        description="Manage fulfilment and refunds for Classic Watch Pro orders."
        noindex
        nofollow
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {allOrders.length} order{allOrders.length === 1 ? '' : 's'} · update fulfilment status as
        you ship.
      </Typography>

      <FormControl size="small" sx={{ minWidth: 200, mb: 2.5 }}>
        <InputLabel id="order-status-filter-label">Filter by status</InputLabel>
        <Select
          label="Filter by status"
          labelId="order-status-filter-label"
          id="order-status-filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value as typeof filter)}
        >
          {STATUS_FILTERS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          We could not load orders.
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader variant="list" count={5} />
      ) : visibleOrders.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title={filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            message="Orders placed on the storefront will appear here for fulfilment."
          />
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {visibleOrders.map((order) => {
            const paymentMeta = PAYMENT_META[order.paymentStatus];
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            const updatePending =
              updateStatus.isPending && updateStatus.variables?.orderId === order.id;
            const refundPending = refundOrder.isPending && refundOrder.variables === order.id;
            const refundable = order.paymentStatus === 'paid' && order.orderStatus !== 'cancelled';
            const nextOptions = NEXT_STATUS_OPTIONS[order.orderStatus] ?? [];

            return (
              <Accordion
                key={order.id}
                disableGutters
                elevation={0}
                // Accordion summaries default to <h3> — under the page h1 that
                // skips a level, so render them as h2 section titles.
                slotProps={{ heading: { component: 'h2' } }}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  '&:before': { display: 'none' },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    '& .MuiAccordionSummary-content': {
                      alignItems: 'center',
                      gap: 2,
                      flexWrap: 'wrap',
                    },
                  }}
                >
                  <Box sx={{ minWidth: 130 }}>
                    <Typography fontWeight={700}>#{order.id.toUpperCase()}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(order.createdAt, 'short')}
                    </Typography>
                  </Box>
                  <Box sx={{ minWidth: 170, flexGrow: 1 }}>
                    <Typography variant="body2" noWrap>
                      {order.shippingAddress.fullName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" noWrap display="block">
                      {itemCount} item{itemCount === 1 ? '' : 's'} ·{' '}
                      {order.items.map((item) => item.product.name).join(', ')}
                    </Typography>
                  </Box>
                  <OrderStatusBadge status={order.orderStatus} />
                  <Chip
                    label={paymentMeta.label}
                    color={paymentMeta.color}
                    size="small"
                    variant="outlined"
                  />
                  <Typography fontWeight={800} sx={{ minWidth: 100, textAlign: 'right' }}>
                    {formatCurrency(order.total)}
                  </Typography>
                </AccordionSummary>

                <AccordionDetails sx={{ borderTop: '1px solid', borderColor: 'divider', pt: 2 }}>
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={5}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Customer & shipping
                      </Typography>
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {order.shippingAddress.fullName} · {order.shippingAddress.phone}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {[
                            order.shippingAddress.addressLine1,
                            order.shippingAddress.addressLine2,
                            order.shippingAddress.city,
                            order.shippingAddress.state,
                            order.shippingAddress.postalCode,
                            order.shippingAddress.country,
                          ]
                            .filter(Boolean)
                            .join(', ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Payment: {order.paymentMethod.toUpperCase()} · {order.paymentStatus}
                          {order.trackingNumber ? ` · Tracking: ${order.trackingNumber}` : ''}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={4}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Items
                      </Typography>
                      <Stack spacing={0.5}>
                        {order.items.map((item) => (
                          <Stack
                            key={item.productId}
                            direction="row"
                            justifyContent="space-between"
                            gap={1}
                          >
                            <Typography variant="body2" noWrap>
                              {item.product.name} × {item.quantity}
                            </Typography>
                            <Typography variant="body2" fontWeight={600}>
                              {formatCurrency(item.product.price * item.quantity)}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Stack direction="row" justifyContent="space-between" sx={{ mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Subtotal
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatCurrency(order.subtotal)}
                        </Typography>
                      </Stack>
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">
                          Shipping + tax
                        </Typography>
                        <Typography variant="caption" fontWeight={600}>
                          {formatCurrency(order.shipping + order.tax)}
                        </Typography>
                      </Stack>
                    </Grid>

                    <Grid item xs={12} md={3}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                        Fulfilment
                      </Typography>
                      {canAdvance(order.orderStatus) ? (
                        <FormControl size="small" fullWidth disabled={updatePending}>
                          <InputLabel id={`order-status-label-${order.id}`}>
                            Update status
                          </InputLabel>
                          <Select
                            label="Update status"
                            labelId={`order-status-label-${order.id}`}
                            id={`order-status-${order.id}`}
                            value=""
                            onChange={(event) =>
                              handleStatusChange(order, event.target.value as OrderStatus)
                            }
                          >
                            <MenuItem value="" disabled>
                              {updatePending ? 'Updating…' : 'Advance to…'}
                            </MenuItem>
                            {nextOptions.map((status) => (
                              <MenuItem key={status} value={status}>
                                {ORDER_STATUS_LABELS[status]}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      ) : (
                        <Chip
                          label={
                            order.orderStatus === 'cancelled'
                              ? 'Cancelled — no further updates'
                              : order.orderStatus === 'delivered'
                                ? 'Delivered — complete'
                                : 'Complete'
                          }
                          variant="outlined"
                          size="small"
                        />
                      )}
                      {refundable && (
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          disabled={refundPending || updatePending}
                          onClick={() => void handleRefund(order)}
                          sx={{ mt: 1, textTransform: 'none' }}
                        >
                          {refundPending
                            ? 'Refunding…'
                            : order.paymentStatus === 'refunded'
                              ? 'Refunded'
                              : 'Refund order'}
                        </Button>
                      )}
                    </Grid>
                  </Grid>

                  {order.history && order.history.length > 0 && (
                    <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                      <AuditTimeline events={order.history} title="Activity" />
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default ManageOrdersPage;
