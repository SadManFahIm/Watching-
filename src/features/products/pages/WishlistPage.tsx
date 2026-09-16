import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Container, Paper, Typography } from '@mui/material';
import { useWishlistStore } from '@/store/wishlist.store';
import { useWishlistProducts } from '@/api/wishlist.api';
import ProductGrid from '@/features/products/components/ProductGrid';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import { WishlistEmptyIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';

const WishlistPage = () => {
  const items = useWishlistStore((state) => state.items);
  const productIds = items.map((item) => item.productId);
  const { products, isLoading } = useWishlistProducts(productIds);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Seo
        title="My Wishlist"
        description="Your saved Classic Watch Pro timepieces — revisit and purchase them whenever you like."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        My Wishlist
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {productIds.length === 0
          ? 'Save timepieces you love and revisit them here.'
          : `${productIds.length} saved timepiece${productIds.length === 1 ? '' : 's'}`}
      </Typography>

      {productIds.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            illustration={<WishlistEmptyIllustration />}
            title="Your wishlist is empty"
            message="Tap the heart on any timepiece to save it here for later."
            action={
              <Button variant="contained" component={RouterLink} to="/products" size="large">
                Browse the collection
              </Button>
            }
          />
        </Paper>
      ) : isLoading ? (
        <SkeletonLoader count={8} />
      ) : products.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Some saved pieces are no longer available — they have been removed from your list.
        </Alert>
      ) : (
        <ProductGrid products={products} />
      )}
    </Container>
  );
};

export default WishlistPage;
