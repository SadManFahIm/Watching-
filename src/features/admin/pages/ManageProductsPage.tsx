import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { Add, DeleteOutline, EditOutlined, Search, Star, Watch } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useProducts, useDeleteProduct } from '@/api/products.api';
import { useCartStore } from '@/store/cart.store';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import { formatCurrency } from '@/utils/helpers';
import type { Product } from '@/types';

const ManageProductsPage = () => {
  const [query, setQuery] = useState('');

  const { data, isLoading, isError, refetch } = useProducts(undefined, 'name-az', 1, 200);
  const deleteProduct = useDeleteProduct();

  const products = (data?.data ?? []).filter((product) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [product.name, product.brand, product.model, product.category]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const handleDelete = (product: Product) => {
    const inCart = useCartStore.getState().items.some((item) => item.productId === product.id);
    if (inCart) {
      toast.error('This product is in a cart — remove it from carts before deleting.');
      return;
    }
    deleteProduct.mutate(product.id, {
      onSuccess: () => toast.success(`${product.name} deleted`),
    });
  };

  return (
    <Box>
      <Seo
        title="Manage Products"
        description="Manage the Classic Watch Pro catalog."
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
          Products
        </Typography>
        <Button
          variant="contained"
          component={RouterLink}
          to="/admin/products/add"
          startIcon={<Add />}
        >
          Add product
        </Button>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {products.length} of {data?.total ?? 0} products
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by name, brand or model…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ maxWidth: 420, mb: 2.5 }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search fontSize="small" />
            </InputAdornment>
          ),
        }}
      />

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          We could not load products.
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader variant="list" count={6} />
      ) : products.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title={query ? `No products match “${query}”` : 'No products yet'}
            message={
              query ? 'Try a different search term.' : 'Add your first timepiece to start selling.'
            }
            action={
              !query ? (
                <Button
                  variant="contained"
                  component={RouterLink}
                  to="/admin/products/add"
                  startIcon={<Add />}
                >
                  Add product
                </Button>
              ) : undefined
            }
          />
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" sx={{ minWidth: 760 }}>
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary' } }}>
                <TableCell>Product</TableCell>
                <TableCell>Category</TableCell>
                <TableCell align="right">Price</TableCell>
                <TableCell align="center">Stock</TableCell>
                <TableCell align="center">Rating</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {products.map((product) => {
                const outOfStock = product.stock <= 0;
                return (
                  <TableRow key={product.id} hover>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        <Box
                          sx={{
                            width: 44,
                            height: 44,
                            borderRadius: 1.5,
                            flexShrink: 0,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'action.hover',
                            color: 'primary.main',
                          }}
                        >
                          {product.thumbnail ? (
                            <img
                              src={product.thumbnail}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Watch fontSize="small" />
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography
                            component={RouterLink}
                            to={`/products/${product.id}`}
                            fontWeight={700}
                            noWrap
                            sx={{ textDecoration: 'none', display: 'block', maxWidth: 260 }}
                          >
                            {product.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {product.brand} · {product.model}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={product.category} size="small" variant="outlined" />
                    </TableCell>
                    <TableCell align="right">
                      <Typography fontWeight={700}>{formatCurrency(product.price)}</Typography>
                      {product.originalPrice && product.originalPrice > product.price && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ textDecoration: 'line-through' }}
                        >
                          {formatCurrency(product.originalPrice)}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={outOfStock ? 'Out of stock' : `${product.stock} in stock`}
                        size="small"
                        color={outOfStock ? 'error' : product.stock <= 5 ? 'warning' : 'success'}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                        justifyContent="center"
                      >
                        <Star sx={{ fontSize: 15, color: 'warning.main' }} />
                        <Typography variant="body2" fontWeight={600}>
                          {product.rating > 0 ? product.rating.toFixed(1) : '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          component={RouterLink}
                          to={`/admin/products/edit/${product.id}`}
                          aria-label={`Edit ${product.name}`}
                        >
                          <EditOutlined fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          aria-label={`Delete ${product.name}`}
                          disabled={deleteProduct.isPending}
                          onClick={() => handleDelete(product)}
                        >
                          <DeleteOutline fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ManageProductsPage;
