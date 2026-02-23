import { Box, CircularProgress, Typography } from '@mui/material';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen = ({ message = 'Loading...' }: LoadingScreenProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
      }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <CircularProgress size={60} thickness={4} />
      </motion.div>
      
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.3 }}
      >
        <Typography
          variant="h6"
          color="text.secondary"
          fontWeight="medium"
        >
          {message}
        </Typography>
      </motion.div>
    </Box>
  );
};

export default LoadingScreen;
