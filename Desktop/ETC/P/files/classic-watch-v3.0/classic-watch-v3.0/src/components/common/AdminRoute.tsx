import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth.store';
import LoadingScreen from './LoadingScreen';
import { Box, Typography, Button, Container } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const { isAuthenticated, isAdmin, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            minHeight: '80vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            gap: 3,
          }}
        >
          <LockOutlined sx={{ fontSize: 80, color: 'error.main' }} />
          <Typography variant="h3" fontWeight="bold">
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary" maxWidth="400px">
            You don't have permission to access this page. This area is restricted to administrators only.
          </Typography>
          <Button
            variant="contained"
            size="large"
            href="/"
            sx={{ mt: 2 }}
          >
            Back to Home
          </Button>
        </Box>
      </Container>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
