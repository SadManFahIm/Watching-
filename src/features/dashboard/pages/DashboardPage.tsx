import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  AdminPanelSettingsOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  CheckCircleOutline,
  FavoriteBorder,
  ReceiptLongOutlined,
} from '@mui/icons-material';
import { useMyOrders } from '@/api/orders.api';
import { useAuthStore } from '@/store/auth.store';
import { useWishlistStore } from '@/store/wishlist.store';
import OrderStatusBadge from '@/features/orders/components/OrderStatusBadge';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import { formatCurrency, formatDate } from '@/utils/helpers';

const DashboardPage = () => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const wishlistCount = useWishlistStore((state) => state.items.length);

  const { data: orders, isLoading, isError, refetch } = useMyOrders(user?.id ?? '');

  const totalOrders = orders?.length ?? 0;
  const delivered = orders?.filter((order) => order.orderStatus === 'delivered').length ?? 0;
  const inProgress =
    orders?.filter((order) => order.orderStatus === 'processing' || order.orderStatus === 'shipped')
      .length ?? 0;

  const stats = [
    { label: 'Total orders', value: totalOrders, icon: ReceiptLongOutlined, color: 'primary.main' },
    { label: 'In progress', value: inProgress, icon: LocalShippingOutlined, color: 'info.main' },
    { label: 'Delivered', value: delivered, icon: CheckCircleOutline, color: 'success.main' },
    { label: 'Wishlist items', value: wishlistCount, icon: FavoriteBorder, color: 'error.main' },
  ];

  const recentOrders = (orders ?? []).slice(0, 3);

  return (
    <Box>
      <Seo
        title="Dashboard"
        description="Your Classic Watch Pro account dashboard — track orders and manage your collection."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        Welcome back{user?.displayName ? `, ${user.displayName.split(' ')[0]}` : ''}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Here is what is happening with your collection.
      </Typography>

      {/* Stats */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid item key={stat.label} xs={12} sm={6} lg={3}>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex' }}>
                  <stat.icon sx={{ color: stat.color }} />
                </Paper>
                <Box>
                  {/* KPI figures are data, not document headings — render
                      them outside the heading outline. */}
                  <Typography component="div" variant="h5" fontWeight={800} lineHeight={1.2}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.label}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Recent orders */}
        <Grid item xs={12} lg={8}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
            <Typography variant="h6" component="h2" fontWeight={700}>
              Recent orders
            </Typography>
            <Button
              component={RouterLink}
              to="/dashboard/orders"
              endIcon={<ReceiptLongOutlined fontSize="small" />}
            >
              View all
            </Button>
          </Stack>

          {isLoading ? (
            <SkeletonLoader variant="list" count={3} />
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
          ) : recentOrders.length === 0 ? (
            <Paper variant="outlined">
              <EmptyState
                title="No orders yet"
                message="When you place your first order it will appear here with live tracking."
                action={
                  <Button variant="contained" component={RouterLink} to="/products">
                    Start shopping
                  </Button>
                }
              />
            </Paper>
          ) : (
            <Stack spacing={1.5}>
              {recentOrders.map((order) => (
                <Paper
                  key={order.id}
                  variant="outlined"
                  component={RouterLink}
                  to={`/orders/${order.id}`}
                  sx={{
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    flexWrap: 'wrap',
                    textDecoration: 'none',
                  }}
                >
                  <Box sx={{ minWidth: 0, flexGrow: 1 }}>
                    <Typography fontWeight={700}>Order #{order.id.toUpperCase()}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(order.createdAt, 'short')} ·{' '}
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                    </Typography>
                  </Box>
                  <OrderStatusBadge status={order.orderStatus} />
                  <Typography fontWeight={800}>{formatCurrency(order.total)}</Typography>
                </Paper>
              ))}
            </Stack>
          )}
        </Grid>

        {/* Quick actions */}
        <Grid item xs={12} lg={4}>
          <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
            Quick actions
          </Typography>
          <Stack spacing={1.5}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<Inventory2Outlined />}
              component={RouterLink}
              to="/products"
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Browse the collection
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<FavoriteBorder />}
              component={RouterLink}
              to="/wishlist"
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              View your wishlist
            </Button>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<ReceiptLongOutlined />}
              component={RouterLink}
              to="/dashboard/orders"
              sx={{ justifyContent: 'flex-start', py: 1.5 }}
            >
              Track an order
            </Button>
            {isAdmin && (
              <Button
                variant="contained"
                fullWidth
                startIcon={<AdminPanelSettingsOutlined />}
                component={RouterLink}
                to="/admin"
                sx={{ justifyContent: 'flex-start', py: 1.5 }}
              >
                Open admin panel
              </Button>
            )}
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
};

export default DashboardPage;
