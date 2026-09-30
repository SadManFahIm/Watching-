import { useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Paper,
  Rating,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  CheckCircle,
  Close,
  DeleteOutlined,
  ThumbUpAlt,
  ThumbUpAltOutlined,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import type { Product, Review } from '@/types';
import {
  useReviews,
  useCreateReview,
  useMarkReviewHelpful,
  useDeleteReview,
} from '@/api/reviews.api';
import { useAuthStore } from '@/store/auth.store';
import { formatDate } from '@/utils/helpers';

interface ReviewsSectionProps {
  product: Product;
}

const ratingBands = (reviews: Review[]) =>
  [5, 4, 3, 2, 1].map((value) => ({
    value,
    count: reviews.filter((review) => review.rating === value).length,
  }));

/** Small component so the delete mutation hook lives at component top level. */
const AdminDeleteButton = ({ review }: { review: Review }) => {
  const deleteReview = useDeleteReview();
  return (
    <Button
      size="small"
      color="error"
      startIcon={<DeleteOutlined fontSize="small" />}
      onClick={() => deleteReview.mutate(review)}
      disabled={deleteReview.isPending}
      sx={{ textTransform: 'none' }}
    >
      Remove
    </Button>
  );
};

const ReviewCard = ({ review, isAdmin }: { review: Review; isAdmin: boolean }) => {
  const [helped, setHelped] = useState(false);
  const markHelpful = useMarkReviewHelpful(review.productId);

  const handleHelpful = () => {
    if (helped) return;
    setHelped(true);
    markHelpful.mutate(review.id);
  };

  return (
    <Box component="article" aria-label={`Review by ${review.userName}`} sx={{ py: 2.5 }}>
      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'flex-start',
        }}
      >
        <Avatar
          sx={{ width: 40, height: 40, bgcolor: 'primary.main', fontSize: '1rem' }}
          aria-hidden="true"
        >
          {(review.userName || 'R').charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
              }}
            >
              {review.userName}
            </Typography>
            {review.verified && (
              <Chip
                icon={<CheckCircle />}
                label="Verified purchase"
                size="small"
                color="success"
                variant="outlined"
                sx={{ '& .MuiChip-label': { fontSize: '0.7rem' } }}
              />
            )}
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              {formatDate(review.createdAt, 'long')}
            </Typography>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{
              alignItems: 'center',
              flexWrap: 'wrap',
              mt: 0.75,
            }}
          >
            <Rating
              value={review.rating}
              readOnly
              size="small"
              aria-label={`${review.rating} out of 5 stars`}
            />
            <Typography
              component="h3"
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
              }}
            >
              {review.title}
            </Typography>
          </Stack>

          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              mt: 0.75,
            }}
          >
            {review.comment}
          </Typography>

          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
              mt: 1.25,
            }}
          >
            <Tooltip title={helped ? 'Thanks for your feedback' : 'Mark this review helpful'}>
              <Button
                size="small"
                startIcon={
                  helped ? <ThumbUpAlt fontSize="small" /> : <ThumbUpAltOutlined fontSize="small" />
                }
                onClick={handleHelpful}
                disabled={helped || markHelpful.isPending}
                sx={{ textTransform: 'none' }}
              >
                Helpful ({review.helpful + (helped ? 1 : 0)})
              </Button>
            </Tooltip>
            {isAdmin && <AdminDeleteButton review={review} />}
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
};

const ReviewsSection = ({ product }: ReviewsSectionProps) => {
  const user = useAuthStore((state) => state.user);
  const isAdmin = useAuthStore((state) => state.isAdmin);
  const { data: reviews, isLoading } = useReviews(product.id);
  const createReview = useCreateReview();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftRating, setDraftRating] = useState<number | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftComment, setDraftComment] = useState('');

  const rows = reviews ?? [];
  const average = product.rating > 0 ? product.rating : 0;
  const bands = ratingBands(rows);
  const maxBand = Math.max(1, ...bands.map((band) => band.count));

  const openDialog = () => {
    if (!user) {
      toast('Please sign in to write a review.', { icon: '🔐' });
      return;
    }
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setDraftRating(null);
    setDraftTitle('');
    setDraftComment('');
  };

  const submitReview = async () => {
    if (!draftRating) {
      toast.error('Please choose a star rating.');
      return;
    }
    if (draftTitle.trim().length < 3) {
      toast.error('Please add a short headline for your review.');
      return;
    }
    if (draftComment.trim().length < 10) {
      toast.error('Please write a sentence or two about your experience.');
      return;
    }
    try {
      await createReview.mutateAsync({
        productId: product.id,
        rating: draftRating,
        title: draftTitle.trim(),
        comment: draftComment.trim(),
        userId: user?.id,
        userName: user?.displayName,
      });
      closeDialog();
    } catch {
      // Error toast is shown by the mutation hook.
    }
  };

  return (
    <Paper variant="outlined" sx={{ mt: 6, p: { xs: 2, md: 4 } }} id="reviews">
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Typography
          variant="h5"
          component="h2"
          sx={{
            fontWeight: 700,
          }}
        >
          Customer reviews
        </Typography>
        <Button variant="contained" size="small" onClick={openDialog}>
          Write a review
        </Button>
      </Box>

      {isLoading ? (
        <Stack spacing={1} sx={{ mt: 3 }} role="status" aria-label="Loading reviews">
          <Skeleton variant="text" width={220} height={32} />
          <Skeleton variant="rounded" height={120} />
          <Skeleton variant="rounded" height={120} />
        </Stack>
      ) : rows.length === 0 ? (
        <Alert severity="info" sx={{ mt: 3 }}>
          No reviews yet — be the first to share your experience with this timepiece.
        </Alert>
      ) : (
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} sx={{ mt: 3 }}>
          {/* Summary */}
          <Box sx={{ width: { xs: '100%', md: 260 }, flexShrink: 0 }}>
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: 'baseline',
              }}
            >
              <Typography
                component="span"
                variant="h2"
                sx={{
                  fontWeight: 800,
                  fontSize: '3rem',
                  lineHeight: 1,
                }}
              >
                {average > 0 ? average.toFixed(1) : '—'}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: 'text.secondary',
                }}
              >
                out of 5
              </Typography>
            </Stack>
            <Rating
              value={average}
              readOnly
              precision={0.1}
              aria-label={`Average rating ${average} out of 5`}
            />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                mt: 0.5,
              }}
            >
              {product.reviewCount} review{product.reviewCount === 1 ? '' : 's'} in total
            </Typography>

            <Stack spacing={0.75} sx={{ mt: 2 }} role="list" aria-label="Rating distribution">
              {bands.map((band) => (
                <Stack
                  key={band.value}
                  direction="row"
                  spacing={1}
                  role="listitem"
                  aria-label={`${band.value} star reviews: ${band.count}`}
                  sx={{
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" sx={{ width: 34 }} aria-hidden="true">
                    {band.value} ★
                  </Typography>
                  <Box
                    sx={{
                      flexGrow: 1,
                      height: 8,
                      borderRadius: 1,
                      bgcolor: 'action.hover',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      sx={{
                        width: `${rows.length > 0 ? (band.count / maxBand) * 100 : 0}%`,
                        height: '100%',
                        bgcolor: 'warning.main',
                      }}
                    />
                  </Box>
                  <Typography
                    variant="caption"
                    aria-hidden="true"
                    sx={{
                      color: 'text.secondary',
                      width: 22,
                      textAlign: 'right',
                    }}
                  >
                    {band.count}
                  </Typography>
                </Stack>
              ))}
            </Stack>
          </Box>

          {/* Review list */}
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {rows.map((review, index) => (
              <Box key={review.id}>
                {index > 0 && <Divider />}
                <ReviewCard review={review} isAdmin={isAdmin} />
              </Box>
            ))}
          </Box>
        </Stack>
      )}

      {/* Write-review dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} fullWidth maxWidth="sm">
        <DialogTitle>Write a review</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            How was your experience with the {product.name}? Honest feedback helps other collectors
            choose with confidence.
          </DialogContentText>

          <Typography
            component="legend"
            variant="subtitle2"
            sx={{
              fontWeight: 700,
              mb: 0.5,
            }}
          >
            Your rating
          </Typography>
          <Rating
            value={draftRating}
            onChange={(_event, value) => setDraftRating(value)}
            size="large"
            aria-label="Select a star rating"
          />
          <TextField
            autoFocus
            margin="dense"
            label="Headline"
            fullWidth
            placeholder="A short summary, e.g. Flawless craftsmanship"
            value={draftTitle}
            onChange={(event) => setDraftTitle(event.target.value)}
            slotProps={{ htmlInput: { maxLength: 80 } }}
            sx={{ mt: 1 }}
          />
          <TextField
            margin="dense"
            label="Your review"
            fullWidth
            multiline
            minRows={4}
            placeholder="What stood out? Share details about the dial, movement, strap or service."
            value={draftComment}
            onChange={(event) => setDraftComment(event.target.value)}
          />
          {!user?.emailVerified && (
            <Alert severity="info" sx={{ mt: 1.5 }}>
              Only email-verified customers earn the “Verified purchase” badge.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} startIcon={<Close />}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void submitReview()}
            disabled={createReview.isPending}
          >
            {createReview.isPending ? 'Publishing…' : 'Publish review'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default ReviewsSection;
