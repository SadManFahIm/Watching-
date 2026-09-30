import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { Star, Watch } from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { Product } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { formatCurrency, calculateDiscount } from '@/utils/helpers';

interface QuickViewDialogProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

const QuickViewDialog = ({ product, open, onClose }: QuickViewDialogProps) => {
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);

  const outOfStock = product.stock <= 0;
  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : product.discount;

  const handleAddToCart = () => {
    if (outOfStock) return;
    addItem(product);
    toast.success(`${product.name} added to cart`);
    onClose();
  };

  const goToDetail = () => {
    onClose();
    navigate(`/products/${product.id}`);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ p: 0 }}>
        <Box
          sx={{
            position: 'relative',
            aspectRatio: '16 / 10',
            bgcolor: 'action.hover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {product.thumbnail ? (
            <img
              src={product.thumbnail}
              alt={product.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Watch sx={{ fontSize: 80, color: 'text.disabled' }} />
          )}
          {discount ? (
            <Chip
              label={`-${discount}%`}
              color="error"
              size="small"
              sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
            />
          ) : null}
        </Box>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
              fontWeight: 700,
              textTransform: 'uppercase',
            }}
          >
            {product.brand} · {product.category}
          </Typography>
          <Typography
            variant="h5"
            component="h2"
            sx={{
              fontWeight: 700,
              mt: 0.25,
            }}
          >
            {product.name}
          </Typography>

          <Stack
            direction="row"
            spacing={0.75}
            sx={{
              alignItems: 'center',
              mt: 0.5,
            }}
          >
            <Star sx={{ fontSize: 18, color: 'warning.main' }} />
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
              }}
            >
              {product.rating > 0 ? product.rating.toFixed(1) : '—'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'baseline',
              mt: 1,
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
              }}
            >
              {formatCurrency(product.price)}
            </Typography>
            {product.originalPrice && product.originalPrice > product.price && (
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                  textDecoration: 'line-through',
                }}
              >
                {formatCurrency(product.originalPrice)}
              </Typography>
            )}
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 1,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.description}
          </Typography>

          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{
              flexWrap: 'wrap',
              mt: 1.5,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              Case: {product.specifications.caseDiameter} · {product.specifications.caseMaterial}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              Movement: {product.specifications.movement}
            </Typography>
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Stack
            direction="row"
            spacing={1.5}
            useFlexGap
            sx={{
              flexWrap: 'wrap',
            }}
          >
            <Button
              variant="contained"
              onClick={handleAddToCart}
              disabled={outOfStock}
              sx={{ flexGrow: 1 }}
            >
              {outOfStock ? 'Out of stock' : 'Add to Cart'}
            </Button>
            <Button variant="outlined" onClick={goToDetail} sx={{ flexGrow: 1 }}>
              View full details
            </Button>
          </Stack>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default QuickViewDialog;
