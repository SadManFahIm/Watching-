import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
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
import GoogleIcon from '@mui/icons-material/Google';
import { KeyOutlined, SmartphoneOutlined } from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { mockApiEnabled } from '@/config';
import { getApiErrorMessage } from '@/lib/axios';
import AuthLayout from '@/features/auth/components/AuthLayout';
import Seo from '@/components/seo/Seo';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginValues = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    isAuthenticated,
    isLoading,
    pendingMfa,
    signIn,
    signInWithGoogle,
    signOut,
    verifyMfaChallenge,
    signInWithPasskey,
  } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);
  const [googlePending, setGooglePending] = useState(false);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);
  const [mfaSubmitting, setMfaSubmitting] = useState(false);

  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onTouched',
  });

  if (isAuthenticated && !isLoading && user) {
    return <Navigate to={destination ?? '/dashboard'} replace />;
  }

  const handleEmailLogin = async (values: LoginValues) => {
    setFormError(null);
    try {
      await signIn(values.email, values.password);
      // MFA-required sign-ins stop here and render the challenge step below.
      if (!useAuthStore.getState().pendingMfa) {
        navigate(destination ?? '/dashboard', { replace: true });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Failed to sign in. Please try again.'));
    }
  };

  const handleMfaSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMfaError(null);
    setMfaSubmitting(true);
    try {
      await verifyMfaChallenge(mfaCode);
      navigate(destination ?? '/dashboard', { replace: true });
    } catch (error) {
      setMfaError(getApiErrorMessage(error, 'That code did not work. Please try again.'));
    } finally {
      setMfaSubmitting(false);
    }
  };

  const handlePasskeyLogin = async () => {
    setMfaError(null);
    setMfaSubmitting(true);
    try {
      await signInWithPasskey();
      navigate(destination ?? '/dashboard', { replace: true });
    } catch (error) {
      setMfaError(getApiErrorMessage(error, 'Passkey sign-in failed. Please try again.'));
    } finally {
      setMfaSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setFormError(null);
    setGooglePending(true);
    try {
      await signInWithGoogle();
      // Google accounts with 2FA enrolled also land on the challenge step.
      if (!useAuthStore.getState().pendingMfa) {
        navigate(destination ?? '/dashboard', { replace: true });
      }
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Google sign-in failed. Please try again.'));
    } finally {
      setGooglePending(false);
    }
  };

  // -----------------------------------------------------------------------
  // Second-factor challenge (TOTP code or passkey)
  // -----------------------------------------------------------------------
  if (pendingMfa) {
    return (
      <AuthLayout>
        <Seo
          title="Two-factor authentication"
          description="Confirm it's you with a second factor to continue to your Classic Watch Pro account."
          noindex
        />
        <Typography variant="h4" component="h1" fontWeight={800}>
          Two-factor authentication
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
          {pendingMfa.mode === 'passkey'
            ? 'Confirm it is you with a passkey.'
            : 'Enter the 6-digit code from your authenticator app.'}
        </Typography>

        {pendingMfa.email && (
          <Alert severity="info" sx={{ mb: 2.5 }}>
            Signing in as <strong>{pendingMfa.email}</strong> — second factor required.
          </Alert>
        )}

        {mfaError && (
          <Alert severity="error" sx={{ mb: 2.5 }}>
            {mfaError}
          </Alert>
        )}

        <Box component="form" noValidate onSubmit={(event) => void handleMfaSubmit(event)}>
          <Stack spacing={2}>
            <TextField
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              fullWidth
              autoFocus
              value={mfaCode}
              onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              slotProps={{ htmlInput: { 'aria-label': 'Authenticator code', maxLength: 6 } }}
            />
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={mfaSubmitting || mfaCode.length < 6}
              startIcon={
                mfaSubmitting ? <CircularProgress size={18} color="inherit" /> : <KeyOutlined />
              }
            >
              {mfaSubmitting ? 'Verifying…' : 'Verify code'}
            </Button>
            {pendingMfa.passkeyAvailable && (
              <Button
                variant="outlined"
                size="large"
                fullWidth
                disabled={mfaSubmitting}
                onClick={() => void handlePasskeyLogin()}
                startIcon={<SmartphoneOutlined />}
              >
                Use a passkey instead
              </Button>
            )}
            <Button size="small" disabled={mfaSubmitting} onClick={() => void signOut()}>
              Use a different account
            </Button>
          </Stack>
        </Box>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Seo
        title="Sign In"
        description="Sign in to your Classic Watch Pro account to manage your collection, track orders and save your favourite timepieces."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={800}>
        Welcome back
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        Sign in to manage your collection and orders.
      </Typography>

      {mockApiEnabled && (
        <Alert severity="info" sx={{ mb: 2.5 }}>
          Demo mode is active — sign in with <strong>demo@classicwatch.local</strong> and any
          password (4+ characters), or register a new account.
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
        onSubmit={(event) => void handleSubmit(handleEmailLogin)(event)}
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
          <TextField
            label="Password"
            type="password"
            autoComplete="current-password"
            fullWidth
            {...register('password')}
            error={Boolean(errors.password)}
            helperText={errors.password?.message}
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: -0.5 }}>
            <Typography
              component={RouterLink}
              to="/forgot-password"
              variant="body2"
              color="primary.main"
              fontWeight={600}
              sx={{ textDecoration: 'none' }}
            >
              Forgot password?
            </Typography>
          </Box>
          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isSubmitting || googlePending}
            startIcon={isSubmitting ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </Button>
        </Stack>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="caption" color="text.secondary">
          OR
        </Typography>
      </Divider>

      <Button
        variant="outlined"
        size="large"
        fullWidth
        disabled={isSubmitting || googlePending}
        onClick={() => void handleGoogleLogin()}
        startIcon={googlePending ? <CircularProgress size={18} /> : <GoogleIcon />}
      >
        {googlePending ? 'Connecting…' : 'Continue with Google'}
      </Button>

      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>
        New to Classic Watch Pro?{' '}
        <Typography
          component={RouterLink}
          to="/register"
          color="primary.main"
          fontWeight={700}
          sx={{ textDecoration: 'none' }}
        >
          Create an account
        </Typography>
      </Typography>
    </AuthLayout>
  );
};

export default LoginPage;
