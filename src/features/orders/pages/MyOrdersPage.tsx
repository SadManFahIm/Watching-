import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Chip, Paper, Stack, Typography } from '@mui/material';
import { useMyOrders } from '@/api/orders.api';
import { useAuthStore } from '@/store/auth.store';
import type { OrderStatus } from '@/types';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';
import { PAYMENT_META } from '@/features/orders/constants';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import { OrdersEmptyIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';
import { formatCurrency, formatDate } from '@/utils/helpers';

type StatusFilter = 'all' | OrderStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
];

const MyOrdersPage = () => {
  const user = useAuthStore((state) => state.user);
  const [filter, setFilter] = useState<StatusFilter>('all');
  const { data: orders, isLoading, isError, refetch } = useMyOrders(user?.id ?? '');

  const visibleOrders = (orders ?? []).filter(
    (order) => filter === 'all' || order.orderStatus === filter
  );

  return (
    <Box>
      <Seo
        title="My Orders"
        description="Track shipments, review details and manage your Classic Watch Pro orders."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        My Orders
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Track shipments, review details, and manage active orders.
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
        {FILTERS.map((item) => (
          <Chip
            key={item.value}
            label={item.label}
            clickable
            color={filter === item.value ? 'primary' : 'default'}
            variant={filter === item.value ? 'filled' : 'outlined'}
            onClick={() => setFilter(item.value)}
          />
        ))}
      </Stack>

      {isLoading ? (
        <SkeletonLoader variant="list" count={4} />
      ) : isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          We could not load your orders.
        </Alert>
      ) : visibleOrders.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            illustration={<OrdersEmptyIllustration />}
            title={filter === 'all' ? 'No orders yet' : `No ${filter} orders`}
            message={
              filter === 'all'
                ? 'When you place your first order it will appear here with live tracking.'
                : 'Try a different status filter, or browse the collection for something new.'
            }
            action={
              <Button variant="contained" component={RouterLink} to="/products">
                Browse products
              </Button>
            }
          />
        </Paper>
      ) : (
        <Stack spacing={1.5}>
          {visibleOrders.map((order) => {
            const paymentMeta = PAYMENT_META[order.paymentStatus];
            const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
            return (
              <Paper
                key={order.id}
                variant="outlined"
                component={RouterLink}
                to={`/orders/${order.id}`}
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  flexWrap: 'wrap',
                  textDecoration: 'none',
                  '&:hover': { borderColor: 'primary.main' },
                }}
              >
                <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                  <Typography fontWeight={700}>Order #{order.id.toUpperCase()}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {formatDate(order.createdAt, 'short')} · {itemCount} item
                    {itemCount === 1 ? '' : 's'}
                  </Typography>
                  <Stack direction="row" spacing={0.75} sx={{ mt: 0.75 }}>
                    <OrderStatusBadge status={order.orderStatus} />
                    <Chip
                      label={paymentMeta.label}
                      color={paymentMeta.color}
                      size="small"
                      variant="outlined"
                    />
                  </Stack>
                </Box>
                <Typography fontWeight={800} variant="h6">
                  {formatCurrency(order.total)}
                </Typography>
              </Paper>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default MyOrdersPage;
