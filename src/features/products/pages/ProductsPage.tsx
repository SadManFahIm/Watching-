import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Drawer,
  Pagination,
  Stack,
  Typography,
} from '@mui/material';
import { Tune } from '@mui/icons-material';
import { lazy, Suspense } from 'react';
import { useProducts, useSearchProducts } from '@/api/products.api';
import { getApiErrorMessage } from '@/lib/axios';
import { PRODUCTS_PAGE_SIZE } from '@/features/products/constants';
import { useProductFilters } from '@/features/products/hooks/useProductFilters';
import ProductGrid from '@/features/products/components/ProductGrid';
import ProductSort from '@/features/products/components/ProductSort';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import LoadingScreen from '@/components/common/LoadingScreen';
import { SearchEmptyIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';

const ProductFilters = lazy(() => import('@/features/products/components/ProductFilters'));

const ProductsPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { filters, sort, page, updateFilters, updateSort, setPage, clearFilters } =
    useProductFilters();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const query = (searchParams.get('q') ?? '').trim();
  const isSearching = query.length > 0;

  const catalogQuery = useProducts(filters, sort, page, PRODUCTS_PAGE_SIZE, !isSearching);
  const searchQuery = useSearchProducts(query, isSearching);

  const isLoading = isSearching ? searchQuery.isLoading : catalogQuery.isLoading;

  const error = isSearching ? searchQuery.error : catalogQuery.error;
  const retry = () => {
    if (isSearching) {
      void searchQuery.refetch();
    } else {
      void catalogQuery.refetch();
    }
  };

  const products = isSearching ? (searchQuery.data ?? []) : (catalogQuery.data?.data ?? []);
  const totalProducts = isSearching ? products.length : (catalogQuery.data?.total ?? 0);
  const totalPages = isSearching ? 1 : Math.max(1, catalogQuery.data?.totalPages ?? 1);

  const goToCatalog = () => {
    navigate('/products');
  };

  const filtersPanel = (
    <ProductFilters value={filters} onChange={updateFilters} onClear={clearFilters} />
  );

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Seo
        title={isSearching ? `Search results for "${query}"` : 'Shop Watches'}
        description={
          isSearching
            ? `Search results for "${query}" — browse matching timepieces at Classic Watch Pro.`
            : 'Shop our complete collection of luxury, classic, sport, casual and smart watches. Filter by price, brand, category and rating.'
        }
        noindex={isSearching}
        keywords={['watches', 'timepieces', 'luxury watches', 'classic watches', 'watch store']}
      />
      {/* Page header */}
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        flexWrap="wrap"
        gap={1}
        sx={{ mb: 0.5 }}
      >
        <Typography variant="h4" component="h1" fontWeight={700}>
          {isSearching ? 'Search results' : 'Products'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {isSearching ? `${products.length} found` : `${totalProducts} timepieces`}
        </Typography>
      </Stack>

      {isSearching && (
        <Chip
          label={`Query: "${query}"`}
          onDelete={goToCatalog}
          color="primary"
          variant="outlined"
          sx={{ mb: 2 }}
        />
      )}

      {/* Toolbar */}
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        gap={1.5}
        sx={{ my: 2 }}
      >
        <Button
          variant="outlined"
          startIcon={<Tune />}
          onClick={() => setMobileFiltersOpen(true)}
          sx={{ display: { lg: 'none' } }}
        >
          Filters
        </Button>
        <Box sx={{ display: { xs: 'none', lg: 'block' } }} />
        {!isSearching && <ProductSort value={sort} onChange={updateSort} />}
      </Stack>

      <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
        {/* Desktop filters */}
        <Box
          sx={{
            display: { xs: 'none', lg: 'block' },
            width: 260,
            flexShrink: 0,
            position: 'sticky',
            top: 96,
          }}
        >
          <Box
            sx={{
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 2,
              p: 2,
            }}
          >
            {filtersPanel}
          </Box>
        </Box>

        {/* Results */}
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          {error ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" size="small" onClick={retry}>
                  Try again
                </Button>
              }
            >
              {getApiErrorMessage(error, 'Failed to load products. Please try again.')}
            </Alert>
          ) : isLoading ? (
            /* Match the real page size so the skeleton→grid swap shifts nothing. */
            <SkeletonLoader count={PRODUCTS_PAGE_SIZE} />
          ) : products.length === 0 ? (
            <EmptyState
              title={isSearching ? `No results for "${query}"` : 'No products found'}
              message={
                isSearching
                  ? 'Try a different keyword or browse the full catalog instead.'
                  : 'Try adjusting or clearing the active filters.'
              }
              illustration={<SearchEmptyIllustration />}
              action={
                isSearching ? (
                  <Button variant="contained" onClick={goToCatalog}>
                    Browse all products
                  </Button>
                ) : (
                  <Button variant="contained" onClick={clearFilters}>
                    Clear filters
                  </Button>
                )
              }
            />
          ) : (
            <>
              <ProductGrid products={products} priorityCount={4} />
              {!isSearching && totalPages > 1 && (
                <Stack alignItems="center" sx={{ mt: 4 }}>
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, nextPage) => {
                      setPage(nextPage);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Stack>
              )}
            </>
          )}
        </Box>
      </Box>

      {/* Mobile filters */}
      <Drawer
        anchor="left"
        open={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        PaperProps={{ sx: { width: 320, maxWidth: '92vw' } }}
      >
        <Suspense fallback={<LoadingScreen />}>
          <Box sx={{ p: 2.5 }}>
            {filtersPanel}
            <Button
              fullWidth
              variant="contained"
              sx={{ mt: 3 }}
              onClick={() => setMobileFiltersOpen(false)}
            >
              Show results
            </Button>
          </Box>
        </Suspense>
      </Drawer>
    </Container>
  );
};

export default ProductsPage;
