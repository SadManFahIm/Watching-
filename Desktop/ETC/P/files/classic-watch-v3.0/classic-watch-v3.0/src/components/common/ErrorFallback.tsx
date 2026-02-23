import { Box, Button, Container, Typography } from '@mui/material';
import { ErrorOutline, Refresh } from '@mui/icons-material';
import { FallbackProps } from 'react-error-boundary';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          gap: 3,
        }}
      >
        <ErrorOutline
          sx={{
            fontSize: 120,
            color: 'error.main',
            opacity: 0.8,
          }}
        />

        <Typography variant="h3" fontWeight="bold" gutterBottom>
          Oops! Something went wrong
        </Typography>

        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: '500px' }}
        >
          We're sorry, but something unexpected happened. Please try refreshing the page or contact support if the problem persists.
        </Typography>

        {import.meta.env.DEV && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: 'error.light',
              borderRadius: 2,
              maxWidth: '600px',
              textAlign: 'left',
            }}
          >
            <Typography
              variant="subtitle2"
              fontWeight="bold"
              color="error.dark"
              gutterBottom
            >
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
                  mt: 1,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  color: 'error.dark',
                  opacity: 0.7,
                }}
              >
                {error.stack}
              </Typography>
            )}
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
          <Button
            variant="contained"
            size="large"
            onClick={resetErrorBoundary}
            startIcon={<Refresh />}
          >
            Try Again
          </Button>

          <Button
            variant="outlined"
            size="large"
            href="/"
          >
            Go to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ErrorFallback;
