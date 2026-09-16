import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { Add, ArrowBack, DeleteOutline, Remove, Watch } from '@mui/icons-material';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency } from '@/utils/helpers';
import EmptyState from '@/components/common/EmptyState';
import { CartEmptyIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';

const CartPage = () => {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  if (items.length === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Seo
          title="Shopping Cart"
          description="Your Classic Watch Pro shopping cart — review your selected timepieces and proceed to checkout."
          noindex
        />
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          Shopping Cart
        </Typography>
        <EmptyState
          title="Your cart is empty"
          message="Browse the collection and add a timepiece you love — your cart is waiting."
          illustration={<CartEmptyIllustration />}
          action={
            <Button variant="contained" component={RouterLink} to="/products" size="large">
              Explore products
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Seo
        title="Shopping Cart"
        description="Your Classic Watch Pro shopping cart — review your selected timepieces and proceed to checkout."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
        Shopping Cart
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Stack spacing={1.5}>
            {items.map((item) => {
              const maxQuantity = Math.max(1, item.product.stock);
              const lineTotal = item.product.price * item.quantity;
              return (
                <Paper
                  key={item.productId}
                  variant="outlined"
                  sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}
                >
                  {/* Thumbnail */}
                  <Box
                    component={RouterLink}
                    to={`/products/${item.productId}`}
                    aria-label={`View ${item.product.name}`}
                    sx={{
                      width: 84,
                      height: 84,
                      borderRadius: 1.5,
                      overflow: 'hidden',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: item.product.thumbnail
                        ? undefined
                        : 'linear-gradient(135deg, #24447C 0%, #18315A 100%)',
                    }}
                  >
                    {item.product.thumbnail ? (
                      <img
                        src={item.product.thumbnail}
                        alt={item.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <Watch sx={{ fontSize: 40, color: 'rgba(255,255,255,0.85)' }} />
                    )}
                  </Box>

                  {/* Info */}
                  <Box sx={{ flexGrow: 1, minWidth: 180 }}>
                    <Typography
                      variant="subtitle2"
                      color="text.secondary"
                      textTransform="uppercase"
                      fontWeight={600}
                    >
                      {item.product.brand}
                    </Typography>
                    <Typography
                      component={RouterLink}
                      to={`/products/${item.productId}`}
                      fontWeight={700}
                      sx={{ textDecoration: 'none' }}
                    >
                      {item.product.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {formatCurrency(item.product.price)} each
                    </Typography>
                    {item.quantity > item.product.stock && (
                      <Typography variant="caption" color="error.main">
                        Only {item.product.stock} available — quantity adjusted at checkout.
                      </Typography>
                    )}
                  </Box>

                  {/* Quantity */}
                  <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton
                      onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                      aria-label={`Decrease quantity of ${item.product.name}`}
                      disabled={item.quantity <= 1}
                      size="small"
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography sx={{ minWidth: 34, textAlign: 'center', fontWeight: 700 }}>
                      {item.quantity}
                    </Typography>
                    <IconButton
                      onClick={() =>
                        updateQuantity(item.productId, Math.min(maxQuantity, item.quantity + 1))
                      }
                      aria-label={`Increase quantity of ${item.product.name}`}
                      disabled={item.quantity >= maxQuantity}
                      size="small"
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Paper>

                  {/* Line total */}
                  <Typography fontWeight={800} sx={{ minWidth: 92, textAlign: 'right' }}>
                    {formatCurrency(lineTotal)}
                  </Typography>

                  <IconButton
                    onClick={() => removeItem(item.productId)}
                    aria-label={`Remove ${item.product.name} from cart`}
                    color="error"
                  >
                    <DeleteOutline />
                  </IconButton>
                </Paper>
              );
            })}
          </Stack>

          <Button component={RouterLink} to="/products" startIcon={<ArrowBack />} sx={{ mt: 2 }}>
            Continue shopping
          </Button>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={4}>
          <Paper variant="outlined" sx={{ p: 3, position: 'sticky', top: 96 }}>
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
              Order Summary
            </Typography>
            <Stack spacing={1.25}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography fontWeight={600}>{formatCurrency(total)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Shipping</Typography>
                <Typography fontWeight={600} color="success.main">
                  Free
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography color="text.secondary">Estimated tax</Typography>
                <Typography fontWeight={600}>Calculated at checkout</Typography>
              </Box>
            </Stack>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              {/* Summary totals are data labels, not document headings. */}
              <Typography component="div" variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography component="div" variant="h6" fontWeight={800} color="primary.main">
                {formatCurrency(total)}
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => navigate('/checkout')}
            >
              Proceed to Checkout
            </Button>
            <Typography
              variant="caption"
              color="text.secondary"
              display="block"
              textAlign="center"
              sx={{ mt: 1.5 }}
            >
              Secure checkout · 100% authentic guarantee
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CartPage;
