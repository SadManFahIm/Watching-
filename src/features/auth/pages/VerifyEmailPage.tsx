import { useState } from 'react';
import { Link as RouterLink, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Paper, Stack, Typography } from '@mui/material';
import {
  MarkEmailReadOutlined,
  RefreshOutlined,
  SendOutlined,
  VerifiedUserOutlined,
} from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/axios';
import AuthLayout from '@/features/auth/components/AuthLayout';
import Seo from '@/components/seo/Seo';

/**
 * Route-level email-verification gate. Authenticated-but-unverified Firebase
 * accounts (email/password registrations) are redirected here until they click
 * the verification link. Demo-mode accounts are always verified, so this page
 * only appears with real Firebase credentials configured.
 */
const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, sendEmailVerification, refreshAuthState, signOut } =
    useAuthStore();
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);

  const destination = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  if (isLoading) {
    return null; // Auth still booting — avoid a flash redirect.
  }

  // Verified (or signed out) — normal routing takes over.
  if (!isAuthenticated || !user || user.emailVerified !== false) {
    return <Navigate to={destination ?? '/dashboard'} replace />;
  }

  const handleResend = async () => {
    setSending(true);
    setNotice(null);
    try {
      await sendEmailVerification();
      setNotice({
        tone: 'success',
        message: 'Verification email sent — check your inbox (and spam folder).',
      });
    } catch (error) {
      setNotice({ tone: 'error', message: getApiErrorMessage(error, 'Could not send the email.') });
    } finally {
      setSending(false);
    }
  };

  const handleCheckStatus = async () => {
    setChecking(true);
    setNotice(null);
    try {
      await refreshAuthState();
      const { user: currentUser } = useAuthStore.getState();
      if (currentUser?.emailVerified) {
        navigate(destination ?? '/dashboard', { replace: true });
      } else {
        setNotice({
          tone: 'error',
          message: 'Still not verified — did you click the link in the email?',
        });
      }
    } finally {
      setChecking(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <AuthLayout>
      <Seo
        title="Verify Your Email"
        description="Verify your Classic Watch Pro email to activate your account."
        noindex
      />
      <Typography variant="overline" color="primary.main" fontWeight={800}>
        One last step
      </Typography>
      <Typography variant="h4" component="h1" fontWeight={800}>
        Verify your email
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, mb: 3 }}>
        We sent a confirmation link to your inbox — click it to activate your account.
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        A verification email was sent to <strong>{user.email}</strong>. The link expires shortly, so
        check your inbox now.
      </Alert>

      {notice && (
        <Alert severity={notice.tone} sx={{ mb: 2.5 }}>
          {notice.message}
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
          <MarkEmailReadOutlined color="primary" />
          <Typography fontWeight={700}>What happens next?</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          Click the link in the email, then press “I've verified — continue” below. Until then your
          account stays read-only and checkout, orders and the dashboard remain locked.
        </Typography>
      </Paper>

      <Stack spacing={2}>
        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={() => void handleCheckStatus()}
          disabled={checking || sending}
          startIcon={
            checking ? <CircularProgress size={18} color="inherit" /> : <RefreshOutlined />
          }
        >
          {checking ? 'Checking…' : "I've verified — continue"}
        </Button>
        <Button
          variant="outlined"
          size="large"
          fullWidth
          onClick={() => void handleResend()}
          disabled={sending || checking}
          startIcon={sending ? <CircularProgress size={18} /> : <SendOutlined />}
        >
          {sending ? 'Sending…' : 'Resend verification email'}
        </Button>
        <Button size="small" onClick={() => void handleSignOut()}>
          Sign out and use a different account
        </Button>
      </Stack>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          <VerifiedUserOutlined sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
          Already verified?{' '}
          <Typography
            component={RouterLink}
            to="/login"
            color="primary.main"
            fontWeight={700}
            sx={{ textDecoration: 'none' }}
          >
            Sign in
          </Typography>{' '}
          again.
        </Typography>
      </Box>
    </AuthLayout>
  );
};

export default VerifyEmailPage;
