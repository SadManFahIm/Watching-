import { Box, Grid } from '@mui/material';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'grid' | 'list';
}

const LINE_WIDTHS = [92, 75, 88];

const SkeletonLoader = ({ count = 6, variant = 'grid' }: SkeletonLoaderProps) => {
  if (variant === 'list') {
    return (
      <Box
        role="status"
        aria-label="Loading"
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        {Array.from({ length: Math.min(count, 6) }, (_, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              gap: 2,
              p: 2,
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
            }}
          >
            <Box
              className="skeleton"
              sx={{ width: 88, height: 88, borderRadius: 1.5, flexShrink: 0 }}
            />
            <Box
              sx={{
                flexGrow: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 1,
                justifyContent: 'center',
              }}
            >
              <Box className="skeleton" sx={{ width: '45%', height: 14, borderRadius: 1 }} />
              <Box
                className="skeleton"
                sx={{
                  width: `${LINE_WIDTHS[index % LINE_WIDTHS.length]}%`,
                  height: 14,
                  borderRadius: 1,
                }}
              />
              <Box className="skeleton" sx={{ width: '25%', height: 14, borderRadius: 1 }} />
            </Box>
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={{ xs: 2, sm: 3 }} role="status" aria-label="Loading products">
      {Array.from({ length: count }, (_, index) => (
        <Grid
          key={index}
          size={{
            xs: 6,
            sm: 4,
            lg: 3,
          }}
        >
          {/* Mirror the real ProductCard block-for-block (image aspect-ratio +
              text rows at the same heights/padding) so the skeleton-to-content
              swap causes zero layout shift. */}
          <Box
            sx={{
              height: '100%',
              borderRadius: 2,
              bgcolor: 'background.paper',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }}
          >
            <Box className="skeleton" sx={{ aspectRatio: '1 / 1' }} />
            <Box
              sx={{
                p: '12px 16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 0.5,
              }}
            >
              {/* brand (caption) */}
              <Box className="skeleton" sx={{ width: '35%', height: 20, borderRadius: 1 }} />
              {/* name — 2 lines of subtitle1 at lineHeight 1.3 */}
              <Box className="skeleton" sx={{ width: '75%', height: 42, borderRadius: 1 }} />
              {/* rating row */}
              <Box className="skeleton" sx={{ width: '45%', height: 20, borderRadius: 1 }} />
              {/* price row */}
              <Box className="skeleton" sx={{ width: '40%', height: 28, borderRadius: 1 }} />
              {/* flex spacer (keeps gap count identical to the card) */}
              <Box sx={{ height: 0 }} />
              {/* button */}
              <Box className="skeleton" sx={{ height: 46, borderRadius: 1, mt: 1 }} />
            </Box>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
};

export default SkeletonLoader;
