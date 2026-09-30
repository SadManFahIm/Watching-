import { Link as RouterLink } from 'react-router-dom';
import { Alert, Box, Button, Container, Stack, Typography } from '@mui/material';
import { useFeaturedProducts } from '@/api/products.api';
import ProductGrid from '@/features/products/components/ProductGrid';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';

const FeaturedProducts = () => {
  const { data, isLoading, isError, refetch } = useFeaturedProducts(8);

  return (
    <Box
      sx={{
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
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
            Featured timepieces
          </Typography>
          <Button component={RouterLink} to="/products?sort=rating" color="primary">
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
            We could not load featured products right now.
          </Alert>
        ) : isLoading ? (
          <SkeletonLoader count={8} />
        ) : data && data.length > 0 ? (
          <ProductGrid products={data} />
        ) : (
          <EmptyState
            title="Featured collection coming soon"
            message="Check back shortly — our curators are preparing the next selection."
          />
        )}
      </Container>
    </Box>
  );
};

export default FeaturedProducts;
