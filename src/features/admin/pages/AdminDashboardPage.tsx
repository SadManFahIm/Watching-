import { useMemo, useRef, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  ListItemIcon,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import SimpleBarChart from '@/features/admin/components/SimpleBarChart';
import StatusDonut from '@/features/admin/components/StatusDonut';
import {
  AttachMoney,
  BackupOutlined,
  FileDownloadOutlined,
  Inventory2Outlined,
  LocalShippingOutlined,
  PaidOutlined,
  PeopleAltOutlined,
  PictureAsPdfOutlined,
  RestoreOutlined,
  TableChartOutlined,
  WarningAmber,
} from '@mui/icons-material';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAllOrders } from '@/api/orders.api';
import { useUsers } from '@/api/users.api';
import { useProducts } from '@/api/products.api';
import { PRODUCTS_PAGE_SIZE } from '@/features/products/constants';
import Seo from '@/components/seo/Seo';
import { useAuthStore } from '@/store/auth.store';
import { mockApiEnabled } from '@/config';
import { resetMockDb, exportMockDbBackup, importMockDbBackup } from '@/mocks/data';
import { getDemoUser, getDemoSessionUserId, clearDemoSession } from '@/mocks/auth';
import { downloadTextFile, printHtml } from '@/utils/export';
import { buildAnalyticsExport } from '@/features/admin/analyticsExport';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import { formatCurrency, formatDate } from '@/utils/helpers';

const AdminDashboardPage = () => {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const [exportAnchor, setExportAnchor] = useState<HTMLElement | null>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  const handleResetDemo = () => {
    if (
      !window.confirm('Reset demo data to the original seed? Your in-memory changes will be lost.')
    ) {
      return;
    }
    resetMockDb();
    queryClient.clear();
    toast.success('Demo data has been reset to a fresh seed.');
  };

  const handleBackup = () => {
    try {
      const filename = `classic-watch-pro-mockdb-${new Date().toISOString().slice(0, 10)}.json`;
      downloadTextFile(filename, exportMockDbBackup(), 'application/json');
      toast.success('Mock database exported as JSON.');
    } catch {
      toast.error('Could not export the mock database.');
    }
  };

  const handleRestore = async (file: File) => {
    let contents: string;
    try {
      contents = await file.text();
    } catch {
      toast.error('Could not read the backup file.');
      return;
    }
    const result = importMockDbBackup(contents);
    if (!result.ok) {
      toast.error(result.error ?? 'Could not restore the backup.');
      return;
    }
    queryClient.clear();
    // Keep the auth session consistent with the restored user directory.
    if (mockApiEnabled) {
      const restoredUser = getDemoUser(getDemoSessionUserId());
      if (restoredUser) {
        useAuthStore.setState({ user: restoredUser, isAdmin: restoredUser.role === 'admin' });
      } else {
        clearDemoSession();
        useAuthStore.setState({ user: null, isAuthenticated: false, isAdmin: false });
      }
    }
    toast.success('Mock database restored from backup.');
  };

  const handleExportCsv = () => {
    const report = buildAnalyticsExport({
      monthlyRevenue,
      statusSegments,
      orderCount: orders.length,
    });
    downloadTextFile(report.filename, report.csv);
    toast.success('Sales report downloaded as CSV.');
    setExportAnchor(null);
  };

  const handleExportPdf = () => {
    const report = buildAnalyticsExport({
      monthlyRevenue,
      statusSegments,
      orderCount: orders.length,
    });
    try {
      printHtml(report.printHtml);
      toast.success('Print view opened — choose “Save as PDF” in the dialog.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not open the print view.');
    }
    setExportAnchor(null);
  };

  const ordersQuery = useAllOrders(1, 100);
  const usersQuery = useUsers();
  const productsQuery = useProducts(undefined, undefined, 1, PRODUCTS_PAGE_SIZE);

  const orders = useMemo(() => ordersQuery.data?.data ?? [], [ordersQuery.data]);
  const users = useMemo(() => usersQuery.data ?? [], [usersQuery.data]);
  const products = useMemo(() => productsQuery.data?.data ?? [], [productsQuery.data]);

  const revenue = orders
    .filter((order) => order.orderStatus !== 'cancelled')
    .reduce((sum, order) => sum + order.total, 0);
  const pendingOrders = orders.filter((order) => order.orderStatus === 'pending').length;
  const activeOrders = orders.filter(
    (order) => order.orderStatus === 'processing' || order.orderStatus === 'shipped'
  ).length;
  const lowStock = products.filter((product) => product.stock > 0 && product.stock <= 5);
  const outOfStock = products.filter((product) => product.stock <= 0).length;

  const loading = ordersQuery.isLoading || usersQuery.isLoading || productsQuery.isLoading;
  const error = ordersQuery.isError || usersQuery.isError || productsQuery.isError;

  const stats = [
    {
      label: 'Revenue',
      value: formatCurrency(revenue),
      icon: AttachMoney,
      color: 'success.main',
    },
    {
      label: 'Orders',
      value: String(orders.length),
      icon: PaidOutlined,
      color: 'primary.main',
    },
    {
      label: 'Pending / active',
      value: `${pendingOrders} / ${activeOrders}`,
      icon: LocalShippingOutlined,
      color: 'warning.main',
    },
    {
      label: 'Customers',
      value: String(users.length),
      icon: PeopleAltOutlined,
      color: 'info.main',
    },
    {
      label: 'Products',
      value: String(products.length),
      icon: Inventory2Outlined,
      color: 'secondary.main',
    },
    {
      label: 'Out of stock',
      value: String(outOfStock),
      icon: WarningAmber,
      color: 'error.main',
    },
  ];

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const topProducts = [...products].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 5);

  // Top customers by lifetime spend (excludes cancelled orders).
  const topCustomers = useMemo(() => {
    const totals = new Map<string, { name: string; spend: number; orders: number }>();
    for (const order of orders) {
      if (order.orderStatus === 'cancelled') continue;
      const owner = users.find((entry) => entry.id === order.userId);
      const name = owner?.displayName || order.shippingAddress.fullName || 'Guest';
      const current = totals.get(order.userId) ?? { name, spend: 0, orders: 0 };
      current.spend += order.total;
      current.orders += 1;
      totals.set(order.userId, current);
    }
    return [...totals.values()]
      .filter((entry) => entry.spend > 0)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);
  }, [orders, users]);

  // -----------------------------------------------------------------------
  // Sales analytics (computed client-side from the API-fetched order list)
  // -----------------------------------------------------------------------
  const monthlyRevenue = useMemo(() => {
    const buckets: { key: string; label: string; value: number }[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({
        key: `${month.getFullYear()}-${month.getMonth()}`,
        label: month.toLocaleString('en', { month: 'short' }),
        value: 0,
      });
    }
    for (const order of orders) {
      if (order.orderStatus === 'cancelled') continue;
      const at = new Date(order.createdAt);
      const key = `${at.getFullYear()}-${at.getMonth()}`;
      const bucket = buckets.find((item) => item.key === key);
      if (bucket) bucket.value += order.total;
    }
    return buckets;
  }, [orders]);

  const statusSegments = useMemo(() => {
    const count = (status: string) => orders.filter((order) => order.orderStatus === status).length;
    return [
      { label: 'Pending', value: count('pending'), color: '#ed6c02' },
      { label: 'Processing', value: count('processing'), color: '#0288d1' },
      { label: 'Shipped', value: count('shipped'), color: '#7c4dff' },
      { label: 'Delivered', value: count('delivered'), color: '#2e7d32' },
      { label: 'Cancelled', value: count('cancelled'), color: '#9e9e9e' },
    ];
  }, [orders]);

  return (
    <Box>
      <Seo
        title="Admin Console"
        description="Classic Watch Pro admin console — overview, orders, products, users and reviews."
        noindex
        nofollow
      />
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1.5}
        sx={{ mb: 0.5 }}
      >
        <Typography variant="h4" component="h1" fontWeight={700}>
          Admin overview
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap>
          <Button variant="contained" component={RouterLink} to="/admin/products/add" size="small">
            Add product
          </Button>
          <Button variant="outlined" component={RouterLink} to="/admin/orders" size="small">
            Manage orders
          </Button>
        </Stack>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Store health, orders, and inventory at a glance.
      </Typography>

      {mockApiEnabled && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Stack direction="row" spacing={0.5}>
              <Button
                color="inherit"
                size="small"
                startIcon={<BackupOutlined fontSize="small" />}
                onClick={handleBackup}
              >
                Backup
              </Button>
              <Button
                color="inherit"
                size="small"
                startIcon={<RestoreOutlined fontSize="small" />}
                onClick={() => restoreInputRef.current?.click()}
              >
                Restore
              </Button>
              <Button color="inherit" size="small" onClick={handleResetDemo}>
                Reset demo data
              </Button>
              <input
                ref={restoreInputRef}
                type="file"
                accept=".json,application/json"
                style={{ display: 'none' }}
                data-testid="restore-backup-input"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void handleRestore(file);
                  event.target.value = ''; // Allow re-selecting the same file.
                }}
              />
            </Stack>
          }
        >
          Signed in as <strong>{user?.displayName}</strong> in demo mode — stats are computed from
          the in-memory sample data, survive reloads, and can be backed up and restored.
        </Alert>
      )}

      {error ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() =>
                void Promise.all([
                  ordersQuery.refetch(),
                  usersQuery.refetch(),
                  productsQuery.refetch(),
                ])
              }
            >
              Try again
            </Button>
          }
        >
          Could not load admin data.
        </Alert>
      ) : loading ? (
        <SkeletonLoader variant="list" count={4} />
      ) : (
        <>
          {/* KPI cards */}
          <Grid container spacing={2.5} sx={{ mb: 4 }}>
            {stats.map((stat) => (
              <Grid item key={stat.label} xs={12} sm={6} lg={4} xl={2}>
                <Card variant="outlined">
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Paper
                      sx={{ p: 1.5, borderRadius: 2, bgcolor: 'action.hover', display: 'flex' }}
                    >
                      <stat.icon sx={{ color: stat.color }} />
                    </Paper>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        component="div"
                        fontWeight={800}
                        lineHeight={1.2}
                        noWrap
                        title={stat.value}
                      >
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" component="div" color="text.secondary">
                        {stat.label}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Sales analytics */}
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mt: 4, mb: 2 }}
          >
            <Typography variant="h6" component="h2" fontWeight={700}>
              Sales analytics
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption" color="text.secondary">
                Last 6 months · computed from {orders.length} order{orders.length === 1 ? '' : 's'}
              </Typography>
              <Tooltip title="Export report">
                <IconButton
                  size="small"
                  aria-label="Export sales report"
                  onClick={(event) => setExportAnchor(event.currentTarget)}
                >
                  <FileDownloadOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
              <Menu
                anchorEl={exportAnchor}
                open={Boolean(exportAnchor)}
                onClose={() => setExportAnchor(null)}
                slotProps={{ paper: { sx: { minWidth: 220 } } }}
              >
                <MenuItem onClick={handleExportCsv}>
                  <ListItemIcon>
                    <TableChartOutlined fontSize="small" />
                  </ListItemIcon>
                  Download CSV
                </MenuItem>
                <MenuItem onClick={handleExportPdf}>
                  <ListItemIcon>
                    <PictureAsPdfOutlined fontSize="small" />
                  </ListItemIcon>
                  Print / PDF
                </MenuItem>
              </Menu>
            </Stack>
          </Stack>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={7}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Revenue by month
                </Typography>
                <SimpleBarChart
                  data={monthlyRevenue}
                  formatValue={(value) => formatCurrency(value)}
                  ariaLabel="Revenue by month"
                />
              </Paper>
            </Grid>
            <Grid item xs={12} md={5}>
              <Paper variant="outlined" sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                  Orders by status
                </Typography>
                <StatusDonut segments={statusSegments} />
              </Paper>
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            {/* Recent orders */}
            <Grid item xs={12} lg={7}>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
              >
                <Typography variant="h6" component="h2" fontWeight={700}>
                  Recent orders
                </Typography>
                <Button component={RouterLink} to="/admin/orders" size="small">
                  View all
                </Button>
              </Stack>
              <Paper variant="outlined">
                {recentOrders.length === 0 ? (
                  <EmptyState
                    title="No orders yet"
                    message="Orders placed on the storefront will appear here."
                  />
                ) : (
                  <Stack
                    divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}
                  >
                    {recentOrders.map((order) => (
                      <Box
                        key={order.id}
                        component={RouterLink}
                        to="/admin/orders"
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 2,
                          flexWrap: 'wrap',
                          textDecoration: 'none',
                          '&:hover': { bgcolor: 'action.hover' },
                        }}
                      >
                        <Box sx={{ flexGrow: 1, minWidth: 160 }}>
                          <Typography fontWeight={700}>Order #{order.id.toUpperCase()}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(order.createdAt, 'short')} · {order.items.length} item
                            {order.items.length === 1 ? '' : 's'}
                          </Typography>
                        </Box>
                        <Chip
                          label={order.paymentMethod.toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                        <Chip
                          label={order.orderStatus}
                          size="small"
                          color={order.orderStatus === 'cancelled' ? 'default' : 'primary'}
                        />
                        <Typography fontWeight={800}>{formatCurrency(order.total)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>

            {/* Inventory health */}
            <Grid item xs={12} lg={5}>
              <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                Inventory health
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5 }}>
                <Typography fontWeight={700} sx={{ mb: 1.5 }}>
                  Low stock
                </Typography>
                {lowStock.length === 0 ? (
                  <Typography variant="body2" color="success.main" fontWeight={600}>
                    All stocked products are healthy — no reorders needed.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {lowStock.map((product) => (
                      <Stack
                        key={product.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={1}
                      >
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                          {product.name}
                        </Typography>
                        <Chip
                          label={`${product.stock} left`}
                          size="small"
                          color={
                            product.stock === 0
                              ? 'error'
                              : product.stock <= 3
                                ? 'warning'
                                : 'default'
                          }
                        />
                      </Stack>
                    ))}
                  </Stack>
                )}
                <Button component={RouterLink} to="/admin/products" size="small" sx={{ mt: 2 }}>
                  Manage products
                </Button>
              </Paper>

              <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                Top customers
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5, mb: 2.5 }}>
                {topCustomers.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No customer spend yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {topCustomers.map((customer, index) => (
                      <Stack key={customer.name} direction="row" alignItems="center" gap={1.5}>
                        <Typography fontWeight={800} color="text.secondary" sx={{ width: 20 }}>
                          {index + 1}
                        </Typography>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Typography variant="body2" noWrap fontWeight={600}>
                            {customer.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {customer.orders} order{customer.orders === 1 ? '' : 's'}
                          </Typography>
                        </Box>
                        <Typography variant="body2" fontWeight={700}>
                          {formatCurrency(customer.spend)}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>

              <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                Most reviewed
              </Typography>
              <Paper variant="outlined" sx={{ p: 2.5 }}>
                {topProducts.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No products yet.
                  </Typography>
                ) : (
                  <Stack spacing={1}>
                    {topProducts.map((product, index) => (
                      <Stack key={product.id} direction="row" alignItems="center" gap={1.5}>
                        <Typography fontWeight={800} color="text.secondary" sx={{ width: 20 }}>
                          {index + 1}
                        </Typography>
                        <Typography variant="body2" noWrap sx={{ flexGrow: 1 }}>
                          {product.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
};

export default AdminDashboardPage;
