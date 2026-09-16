import { useEffect, useState } from 'react';
import type { ImgHTMLAttributes } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
} from '@mui/material';
import {
  Add,
  CheckCircle,
  Favorite,
  FavoriteBorder,
  LocalShippingOutlined,
  Remove,
  SecurityOutlined,
  Star,
  Watch,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useCrossTabTrackedTabs } from '@/features/products/hooks/useCrossTabTrackedTabs';
import { useProduct, useFeaturedProducts } from '@/api/products.api';
import { getApiErrorMessage } from '@/lib/axios';
import { useCartStore } from '@/store/cart.store';
import { useWishlistStore } from '@/store/wishlist.store';
import { useRecentlyViewedStore } from '@/store/recentlyViewed.store';
import { formatCurrency, calculateDiscount } from '@/utils/helpers';
import ProductGrid from '@/features/products/components/ProductGrid';
import ReviewsSection from '@/features/products/components/ReviewsSection';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import Seo from '@/components/seo/Seo';

const DetailSkeleton = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Box className="skeleton" sx={{ width: 180, height: 16, borderRadius: 1, mb: 2 }} />
    <Grid container spacing={4}>
      <Grid item xs={12} md={6}>
        <Box className="skeleton" sx={{ aspectRatio: '1 / 1', borderRadius: 3 }} />
      </Grid>
      <Grid item xs={12} md={6}>
        <Stack spacing={2}>
          <Box className="skeleton" sx={{ width: 120, height: 18, borderRadius: 1 }} />
          <Box className="skeleton" sx={{ width: '85%', height: 30, borderRadius: 1 }} />
          <Box className="skeleton" sx={{ width: '60%', height: 22, borderRadius: 1 }} />
          <Box className="skeleton" sx={{ width: '100%', height: 90, borderRadius: 1 }} />
          <Box className="skeleton" sx={{ width: '45%', height: 44, borderRadius: 2 }} />
        </Stack>
      </Grid>
    </Grid>
  </Container>
);

const TrustBadges = [
  { icon: SecurityOutlined, label: '100% Authentic' },
  { icon: LocalShippingOutlined, label: 'Free insured delivery' },
  { icon: WorkspacePremiumOutlined, label: '2-year warranty' },
];

const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const addItem = useCartStore((state) => state.addItem);
  const wishlistItems = useWishlistStore((state) => state.items);
  const addToWishlist = useWishlistStore((state) => state.addToWishlist);
  const removeFromWishlist = useWishlistStore((state) => state.removeFromWishlist);
  const recordRecentView = useRecentlyViewedStore((state) => state.record);

  const [quantity, setQuantity] = useState(1);
  const [imageFailed, setImageFailed] = useState(false);

  const { data: product, isLoading, isError, error, refetch } = useProduct(id ?? '');
  const featuredQuery = useFeaturedProducts(8);
  const { setCurrent: broadcastFocus } = useCrossTabTrackedTabs();

  // Track the visit for the “Recently viewed” rail (after hooks, before the
  // loading early-return — the effect only records when a product is loaded).
  useEffect(() => {
    if (product) {
      recordRecentView(product);
      broadcastFocus(product);
    }
  }, [product, recordRecentView, broadcastFocus]);

  if (isLoading) return <DetailSkeleton />;

  if (isError || !product) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Watch sx={{ fontSize: 72, color: 'text.disabled', mb: 2 }} />
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Product unavailable
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {getApiErrorMessage(error, 'This product could not be loaded.')}
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button variant="outlined" component={RouterLink} to="/products">
            Back to products
          </Button>
        </Stack>
      </Container>
    );
  }

  const outOfStock = product.stock <= 0;
  const wished = wishlistItems.some((item) => item.productId === product.id);
  const images =
    product.images.length > 0 ? product.images : product.thumbnail ? [product.thumbnail] : [];
  const showImage = images.length > 0 && !imageFailed;

  const discount =
    product.originalPrice && product.originalPrice > product.price
      ? calculateDiscount(product.originalPrice, product.price)
      : product.discount;

  const related = (featuredQuery.data ?? []).filter((item) => item.id !== product.id).slice(0, 4);

  const handleQuantityChange = (delta: number) => {
    setQuantity((current) => Math.min(product.stock, Math.max(1, current + delta)));
  };

  const handleAddToCart = () => {
    addItem(product, quantity);
    toast.success(`${quantity} × ${product.name} added to cart`);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate('/cart');
  };

  const handleToggleWishlist = () => {
    if (wished) {
      removeFromWishlist(product.id);
      toast.success('Removed from wishlist');
    } else {
      addToWishlist(product.id);
      toast.success('Added to wishlist');
    }
  };

  const specRows: { label: string; value: string }[] = [
    { label: 'Movement', value: product.specifications.movement },
    { label: 'Case diameter', value: product.specifications.caseDiameter },
    { label: 'Case material', value: product.specifications.caseMaterial },
    { label: 'Water resistance', value: product.specifications.waterResistance },
    { label: 'Strap', value: product.specifications.strapMaterial },
    { label: 'Warranty', value: product.specifications.warranty },
    { label: 'Category', value: product.category },
    {
      label: 'Availability',
      value: outOfStock ? 'Out of stock' : `In stock (${product.stock} available)`,
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Seo
        title={product.name}
        description={`${product.brand} ${product.model} — ${product.description.slice(0, 150)}${
          product.description.length > 150 ? '…' : ''
        }`}
        image={images[0] || product.thumbnail}
        keywords={[product.brand, product.category, 'watch', 'timepiece']}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Product',
          name: product.name,
          image: images,
          description: product.description,
          brand: { '@type': 'Brand', name: product.brand },
          category: product.category,
          sku: product.id,
          aggregateRating:
            product.reviewCount > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: product.rating,
                  reviewCount: product.reviewCount,
                }
              : undefined,
          offers: {
            '@type': 'Offer',
            url: `https://classic-watch-pro.vercel.app/products/${product.id}`,
            priceCurrency: 'USD',
            price: product.price,
            availability: outOfStock
              ? 'https://schema.org/OutOfStock'
              : 'https://schema.org/InStock',
            itemCondition: 'https://schema.org/NewCondition',
          },
        }}
      />
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 3, fontSize: '0.9rem' }} aria-label="breadcrumb">
        <Typography
          component={RouterLink}
          to="/products"
          color="inherit"
          sx={{ textDecoration: 'none' }}
        >
          Products
        </Typography>
        <Typography color="text.primary" textTransform="capitalize">
          {product.brand}
        </Typography>
      </Breadcrumbs>

      <Grid container spacing={{ xs: 3, md: 5 }}>
        {/* Gallery */}
        <Grid item xs={12} md={6}>
          <Paper
            variant="outlined"
            sx={{
              aspectRatio: '1 / 1',
              overflow: 'hidden',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'action.hover',
            }}
          >
            {showImage ? (
              <img
                src={images[0]}
                alt={product.name}
                {...({ fetchpriority: 'high' } as ImgHTMLAttributes<HTMLImageElement>)}
                decoding="async"
                onError={() => setImageFailed(true)}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #24447C 0%, #18315A 100%)',
                }}
              >
                <Watch sx={{ fontSize: 120, color: 'rgba(255,255,255,0.85)' }} />
              </Box>
            )}
            {discount ? (
              <Chip
                label={`-${discount}%`}
                color="error"
                sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
              />
            ) : (
              product.isNew && (
                <Chip
                  label="New"
                  color="success"
                  sx={{ position: 'absolute', top: 12, left: 12, fontWeight: 700 }}
                />
              )
            )}
          </Paper>
        </Grid>

        {/* Purchase panel */}
        <Grid item xs={12} md={6}>
          <Typography
            variant="overline"
            color="text.secondary"
            fontWeight={700}
            textTransform="uppercase"
          >
            {product.brand} · {product.category}
          </Typography>
          <Typography
            variant="h3"
            component="h1"
            fontWeight={700}
            sx={{ mt: 0.5, fontSize: { xs: '1.8rem', md: '2.3rem' } }}
          >
            {product.name}
          </Typography>

          <Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 1 }}>
            <Star sx={{ color: 'warning.main' }} />
            <Typography fontWeight={600}>
              {product.rating > 0 ? product.rating.toFixed(1) : '—'}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {product.reviewCount > 0
                ? `${product.reviewCount} verified reviews`
                : 'No reviews yet'}
            </Typography>
          </Stack>

          <Stack direction="row" alignItems="baseline" spacing={1.5} sx={{ mt: 2 }}>
            {/* Price is content, not a heading — avoid a phantom <h4> under the
                product <h1> (axe heading-order). */}
            <Typography variant="h4" component="div" fontWeight={800} color="primary.main">
              {formatCurrency(product.price)}
            </Typography>
            {product.originalPrice && product.originalPrice > product.price && (
              <Typography
                variant="body1"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                {formatCurrency(product.originalPrice)}
              </Typography>
            )}
          </Stack>

          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            {product.description}
          </Typography>

          {/* Trust badges */}
          <Stack direction="row" flexWrap="wrap" gap={2} sx={{ mt: 2.5, color: 'text.secondary' }}>
            {TrustBadges.map((badge) => (
              <Stack key={badge.label} direction="row" spacing={0.5} alignItems="center">
                <badge.icon fontSize="small" color="primary" />
                <Typography variant="caption">{badge.label}</Typography>
              </Stack>
            ))}
          </Stack>

          <Divider sx={{ my: 3 }} />

          {/* Quantity + actions */}
          {outOfStock ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              This piece is currently out of stock. Add it to your wishlist and we will notify you
              when it returns.
            </Alert>
          ) : (
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
              <Paper variant="outlined" sx={{ display: 'flex', alignItems: 'center' }}>
                <IconButton
                  onClick={() => handleQuantityChange(-1)}
                  aria-label="Decrease quantity"
                  disabled={quantity <= 1}
                >
                  <Remove fontSize="small" />
                </IconButton>
                <Typography sx={{ minWidth: 40, textAlign: 'center', fontWeight: 700 }}>
                  {quantity}
                </Typography>
                <IconButton
                  onClick={() => handleQuantityChange(1)}
                  aria-label="Increase quantity"
                  disabled={quantity >= product.stock}
                >
                  <Add fontSize="small" />
                </IconButton>
              </Paper>
              <Typography variant="body2" color="text.secondary">
                {product.stock} in stock
              </Typography>
            </Stack>
          )}

          <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
            <Button
              variant="contained"
              size="large"
              disabled={outOfStock}
              onClick={handleAddToCart}
              sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 190 }}
            >
              Add to Cart
            </Button>
            <Button
              variant="outlined"
              size="large"
              disabled={outOfStock}
              onClick={handleBuyNow}
              sx={{ flexGrow: { xs: 1, sm: 0 }, minWidth: 150 }}
            >
              Buy Now
            </Button>
            <IconButton
              onClick={handleToggleWishlist}
              aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
              size="large"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              {wished ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
          </Stack>

          {product.features.length > 0 && (
            <>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 3, mb: 1 }}>
                Highlights
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {product.features.map((feature) => (
                  <Chip
                    key={feature}
                    icon={<CheckCircle />}
                    label={feature}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Stack>
            </>
          )}
        </Grid>
      </Grid>

      {/* Specifications */}
      <Paper variant="outlined" sx={{ mt: 6, p: { xs: 2, md: 4 } }}>
        <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 2 }}>
          Specifications
        </Typography>
        <Table size="small">
          <TableBody>
            {specRows.map((row) => (
              <TableRow key={row.label} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell
                  component="th"
                  scope="row"
                  sx={{ width: '38%', color: 'text.secondary', fontWeight: 600 }}
                >
                  {row.label}
                </TableCell>
                <TableCell sx={{ textTransform: 'capitalize' }}>{row.value}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Customer reviews */}
      <ReviewsSection product={product} />

      {/* Related */}
      {related.length > 0 && (
        <Box sx={{ mt: 7 }}>
          <Typography variant="h5" component="h2" fontWeight={700} sx={{ mb: 3 }}>
            You may also like
          </Typography>
          {featuredQuery.isLoading ? (
            <SkeletonLoader count={4} />
          ) : (
            <ProductGrid products={related} />
          )}
        </Box>
      )}
    </Container>
  );
};

export default ProductDetailPage;
