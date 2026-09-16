import { useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  IconButton,
  InputAdornment,
  Paper,
  Rating,
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
import { CheckCircle, DeleteOutline, Search } from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAllReviews, useDeleteReview } from '@/api/reviews.api';
import { useProducts } from '@/api/products.api';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import { formatDate } from '@/utils/helpers';
import type { Review } from '@/types';

const ManageReviewsPage = () => {
  const [query, setQuery] = useState('');
  const { data: reviews, isLoading, isError, refetch } = useAllReviews();
  const { data: productsPage } = useProducts(undefined, 'name-az', 1, 200);
  const deleteReview = useDeleteReview();

  const products = useMemo(() => productsPage?.data ?? [], [productsPage]);
  const productName = (productId: string): string =>
    products.find((product) => product.id === productId)?.name ?? productId;

  const rows = (reviews ?? []).filter((review) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [productName(review.productId), review.userName, review.title, review.comment]
      .join(' ')
      .toLowerCase()
      .includes(term);
  });

  const handleDelete = (review: Review) => {
    deleteReview.mutate(review, {
      onSuccess: () => undefined,
    });
  };

  return (
    <Box>
      <Seo
        title="Review Moderation"
        description="Moderate customer reviews and the verified purchase programme at Classic Watch Pro."
        noindex
        nofollow
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        Reviews
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {rows.length} review{rows.length === 1 ? '' : 's'} · moderate customer feedback and the
        &quot;Verified purchase&quot; programme.
      </Typography>

      <TextField
        fullWidth
        size="small"
        placeholder="Search by product, reviewer, title or comment…"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        sx={{ maxWidth: 460, mb: 2.5 }}
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
          We could not load reviews.
        </Alert>
      ) : isLoading ? (
        <SkeletonLoader variant="list" count={6} />
      ) : rows.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState
            title="No reviews found"
            message="Customer reviews will appear here for moderation."
            action={
              <Button component={RouterLink} to="/admin/products" variant="contained" size="small">
                Browse products
              </Button>
            }
          />
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small" aria-label="Customer reviews">
            <TableHead>
              <TableRow>
                <TableCell>Product</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Review</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((review) => (
                <TableRow key={review.id} hover>
                  <TableCell sx={{ maxWidth: 180 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {productName(review.productId)}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 140 }}>
                    <Stack spacing={0.25}>
                      <Typography variant="body2" noWrap>
                        {review.userName}
                      </Typography>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {review.verified ? (
                          <Chip
                            icon={<CheckCircle />}
                            label="Verified"
                            size="small"
                            color="success"
                            variant="outlined"
                            sx={{ '& .MuiChip-label': { fontSize: '0.65rem' } }}
                          />
                        ) : (
                          <Chip
                            label="Unverified"
                            size="small"
                            variant="outlined"
                            sx={{ '& .MuiChip-label': { fontSize: '0.65rem' } }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Rating
                      value={review.rating}
                      readOnly
                      size="small"
                      aria-label={`${review.rating} stars`}
                    />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 360 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>
                      {review.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {review.comment}
                    </Typography>
                    <Typography variant="caption" color="text.disabled">
                      {formatDate(review.createdAt, 'short')}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Remove review">
                      <IconButton
                        aria-label={`Remove review by ${review.userName}`}
                        color="error"
                        onClick={() => handleDelete(review)}
                        disabled={deleteReview.isPending}
                      >
                        <DeleteOutline fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default ManageReviewsPage;
