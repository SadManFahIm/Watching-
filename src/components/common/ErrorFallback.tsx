import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Home, Refresh } from '@mui/icons-material';
import { FallbackProps } from 'react-error-boundary';
import { ServerErrorIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Box component="main">
      <Container maxWidth="md" sx={{ py: { xs: 5, md: 9 } }}>
        <Seo
          title="Something Went Wrong"
          description="Something went wrong on Classic Watch Pro. Please try again."
          noindex
          nofollow
        />

        <Stack alignItems="center" spacing={2.5} sx={{ textAlign: 'center', pt: { xs: 2, md: 4 } }}>
          <ServerErrorIllustration size={176} />

          <Box>
            <Typography
              variant="overline"
              color="secondary.main"
              sx={{ fontWeight: 700, letterSpacing: '0.28em' }}
            >
              Error 500
            </Typography>
            <Typography variant="h3" component="h1" fontWeight={700} sx={{ mt: 0.5 }}>
              The works are out of order.
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', mt: 1.5 }}>
              An unexpected error stopped the page mid-tick. Try again, or head back to the
              collection.
            </Typography>
          </Box>

          {import.meta.env.DEV && (
            <Box
              sx={{
                mt: 1,
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 2,
                maxWidth: 640,
                textAlign: 'left',
              }}
              component="pre"
            >
              <Typography variant="subtitle2" fontWeight="bold" color="error.dark" gutterBottom>
                Error Details (Development Only):
              </Typography>
              <Typography
                variant="body2"
                component="pre"
                sx={{
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'error.dark',
                }}
              >
                {error.message}
              </Typography>
              {error.stack && (
                <Typography
                  variant="caption"
                  component="pre"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    color: 'error.dark',
                    opacity: 0.7,
                    mt: 1,
                  }}
                >
                  {error.stack}
                </Typography>
              )}
            </Box>
          )}

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
            <Button
              variant="contained"
              size="large"
              onClick={resetErrorBoundary}
              startIcon={<Refresh />}
            >
              Try again
            </Button>
            <Button variant="outlined" size="large" href="/" startIcon={<Home />}>
              Back to home
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default ErrorFallback;
