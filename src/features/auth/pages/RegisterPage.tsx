import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Box, Button, CircularProgress, Stack, TextField, Typography } from '@mui/material';
import { useAuthStore } from '@/store/auth.store';
import { mockApiEnabled } from '@/config';
import { getApiErrorMessage } from '@/lib/axios';
import AuthLayout from '@/features/auth/components/AuthLayout';
import Seo from '@/components/seo/Seo';

const registerSchema = z
  .object({
    displayName: z.string().min(2, 'Please enter your name').max(80, 'Name is too long'),
    email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
    password: z
      .string()
      .min(8, 'Use at least 8 characters')
      .regex(/[a-zA-Z]/, 'Include at least one letter')
      .regex(/[0-9]/, 'Include at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type RegisterValues = z.infer<typeof registerSchema>;

const RegisterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, signUp } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { displayName: '', email: '', password: '', confirmPassword: '' },
    mode: 'onTouched',
  });

  if (isAuthenticated && !isLoading && user) {
    return <Navigate to={destination ?? '/dashboard'} replace />;
  }

  const handleRegister = async (values: RegisterValues) => {
    setFormError(null);
    try {
      await signUp(values.email, values.password, values.displayName);
      navigate(destination ?? '/dashboard', { replace: true });
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Registration failed. Please try again.'));
    }
  };

  return (
    <AuthLayout>
      <Seo
        title="Create an Account"
        description="Create your Classic Watch Pro account for member pricing, order tracking and exclusive releases."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={800}>
        Create your account
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Join Classic Watch Pro for member pricing, order tracking, and exclusive releases.
      </Typography>

      {mockApiEnabled && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Demo mode is active — your account is created in-memory only and resets on reload.
        </Alert>
      )}

      {formError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {formError}
        </Alert>
      )}

      <Box
        component="form"
        noValidate
        onSubmit={(event) => void handleSubmit(handleRegister)(event)}
      >
        <Stack spacing={2}>
          <TextField
            label="Full name"
            autoComplete="name"
            fullWidth
            autoFocus
            {...register('displayName')}
            error={Boolean(errors.displayName)}
            helperText={errors.displayName?.message}
          />
          <TextField
            label="Email address"
            type="email"
            autoComplete="email"
            fullWidth
            {...register('email')}
            error={Boolean(errors.email)}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register('password')}
            error={Boolean(errors.password)}
            helperText={
              errors.password?.message ?? 'At least 8 characters with a letter and a number.'
            }
          />
          <TextField
            label="Confirm password"
            type="password"
            autoComplete="new-password"
            fullWidth
            {...register('confirmPassword')}
            error={Boolean(errors.confirmPassword)}
            helperText={errors.confirmPassword?.message}
          />
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </Button>
        </Stack>
      </Box>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        Already have an account?{' '}
        <Typography
          component={RouterLink}
          to="/login"
          color="primary.main"
          fontWeight={700}
          sx={{ textDecoration: 'none' }}
        >
          Sign in
        </Typography>
      </Typography>
    </AuthLayout>
  );
};

export default RegisterPage;
