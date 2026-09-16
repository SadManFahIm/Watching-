import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Divider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { ArrowBack, LockResetOutlined } from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { mockApiEnabled } from '@/config';
import { getApiErrorMessage } from '@/lib/axios';
import AuthLayout from '@/features/auth/components/AuthLayout';
import Seo from '@/components/seo/Seo';

const forgotSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
});

type ForgotValues = z.infer<typeof forgotSchema>;

const ForgotPasswordPage = () => {
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
    mode: 'onTouched',
  });

  const handleReset = async (values: ForgotValues) => {
    setFormError(null);
    try {
      // Anti-enumeration: succeeds for unknown addresses too.
      await resetPassword(values.email);
      setSubmittedEmail(values.email.trim());
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Could not send the reset link. Please try again.'));
    }
  };

  return (
    <AuthLayout>
      <Seo
        title="Reset Your Password"
        description="Reset your Classic Watch Pro account password with a secure, time-limited email link."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={800}>
        Reset your password
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Enter the email on your account and we'll send you a secure reset link.
      </Typography>

      {mockApiEnabled && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Demo mode has no email provider — this step is simulated. You can keep using the demo
          account with any password of 4+ characters.
        </Alert>
      )}

      {submittedEmail && (
        <Alert severity="success" sx={{ mb: 2.5 }}>
          If an account exists for <strong>{submittedEmail}</strong>, a password reset link is on
          its way. Check your inbox (and spam folder) — the link expires within an hour.
          {mockApiEnabled && (
            <Box component="span" display="block" sx={{ mt: 1 }}>
              Demo tip: sign in again at any time with any password of 4+ characters.
            </Box>
          )}
        </Alert>
      )}

      {formError && (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {formError}
        </Alert>
      )}

      {!submittedEmail && (
        <Box
          component="form"
          noValidate
          onSubmit={(event) => void handleSubmit(handleReset)(event)}
        >
          <Stack spacing={2}>
            <TextField
              label="Email address"
              type="email"
              autoComplete="email"
              fullWidth
              autoFocus
              {...register('email')}
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={isSubmitting}
              startIcon={
                isSubmitting ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <LockResetOutlined />
                )
              }
            >
              {isSubmitting ? 'Sending…' : 'Send reset link'}
            </Button>
          </Stack>
        </Box>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography
          component={RouterLink}
          to="/login"
          color="text.secondary"
          sx={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
        >
          <ArrowBack sx={{ fontSize: 16 }} />
          Back to sign in
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
