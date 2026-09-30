import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  message?: string;
}

// Pure CSS/CircularProgress loading state — no animation library on the
// critical path (framer-motion previously lived here and rode the eager
// bundle just for a fade-in).
const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
  return (
    <Box
      role="status"
      aria-label={message}
      className="fade-in"
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      <CircularProgress size={60} thickness={4} />

      <Typography
        variant="h6"
        sx={{
          color: 'text.secondary',
          fontWeight: 'medium',
        }}
      >
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingScreen;
