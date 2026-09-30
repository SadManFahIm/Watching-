import { Link as RouterLink } from 'react-router-dom';
import { Alert, Button, Container, Stack, Typography } from '@mui/material';
import { useLatestProducts } from '@/api/products.api';
import ProductGrid from '@/features/products/components/ProductGrid';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';

const LatestProducts = () => {
  const { data, isLoading, isError, refetch } = useLatestProducts(8);

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
        }}
      >
        <Typography
          variant="h4"
          component="h2"
          sx={{
            fontWeight: 700,
          }}
        >
          New arrivals
        </Typography>
        <Button component={RouterLink} to="/products?sort=newest" color="primary">
          View all
        </Button>
      </Stack>

      {isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Try again
            </Button>
          }
        >
          We could not load the latest arrivals right now.
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader count={8} />
      ) : data && data.length > 0 ? (
        <ProductGrid products={data} />
      ) : (
        <EmptyState
          title="Nothing new yet"
          message="New timepieces land here as soon as they join the collection."
        />
      )}
    </Container>
  );
};

export default LatestProducts;
