import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { History } from '@mui/icons-material';
import { useRecentlyViewedStore } from '@/store/recentlyViewed.store';
import ProductGrid from '@/features/products/components/ProductGrid';

const RecentlyViewedProducts = () => {
  const items = useRecentlyViewedStore((state) => state.items);
  const clear = useRecentlyViewedStore((state) => state.clear);

  // Avoid an empty section on the very first visit.
  const products = items.slice(0, 8);
  if (products.length === 0) return null;

  return (
    <Box>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 3,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <History fontSize="small" color="primary" />
            <Typography
              variant="h4"
              component="h2"
              sx={{
                fontWeight: 700,
              }}
            >
              Recently viewed
            </Typography>
          </Stack>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={RouterLink}
              to="/products"
              color="primary"
              aria-label="Browse all recently viewed watches"
            >
              View all
            </Button>
            <Button color="inherit" onClick={clear} aria-label="Clear recently viewed">
              Clear
            </Button>
          </Box>
        </Stack>
        <ProductGrid products={products} />
      </Container>
    </Box>
  );
};

export default RecentlyViewedProducts;
