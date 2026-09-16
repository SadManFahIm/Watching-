import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BadgeOutlined,
  DeleteOutline,
  KeyOutlined,
  Logout,
  MarkEmailReadOutlined,
  ShieldOutlined,
  SmartphoneOutlined,
} from '@mui/icons-material';
import MfaSetupDialog from '@/features/auth/components/MfaSetupDialog';
import { useAuthStore } from '@/store/auth.store';
import { mockApiEnabled } from '@/config';
import { getApiErrorMessage } from '@/lib/axios';
import { formatDate } from '@/utils/helpers';
import { webauthnSupported } from '@/lib/webauthn';
import Seo from '@/components/seo/Seo';

const ProfilePage = () => {
  const navigate = useNavigate();
  const {
    user,
    isAdmin,
    signOut,
    sendEmailVerification,
    refreshAuthState,
    disableMfa,
    registerPasskey,
    removePasskey,
  } = useAuthStore();
  const [verifyBusy, setVerifyBusy] = useState<'send' | 'check' | null>(null);
  const [verifyNotice, setVerifyNotice] = useState<string | null>(null);
  const [mfaDialogOpen, setMfaDialogOpen] = useState(false);
  const [mfaNotice, setMfaNotice] = useState<string | null>(null);
  const [passkeyName, setPasskeyName] = useState('');
  const [passkeyBusy, setPasskeyBusy] = useState(false);
  const [passkeyNotice, setPasskeyNotice] = useState<string | null>(null);

  const handleDisableMfa = async () => {
    if (!window.confirm('Disable two-factor authentication? Your account becomes password-only.')) {
      return;
    }
    try {
      await disableMfa();
      setMfaNotice('Two-factor authentication disabled.');
    } catch (error) {
      setMfaNotice(getApiErrorMessage(error, 'Could not disable two-factor authentication.'));
    }
  };

  const handleRegisterPasskey = async () => {
    if (!passkeyName.trim()) return;
    setPasskeyBusy(true);
    setPasskeyNotice(null);
    try {
      const record = await registerPasskey(passkeyName);
      setPasskeyName('');
      setPasskeyNotice(`Passkey “${record.name}” registered.`);
    } catch (error) {
      setPasskeyNotice(getApiErrorMessage(error, 'Could not register the passkey.'));
    } finally {
      setPasskeyBusy(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (!user) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>
          Not signed in
        </Typography>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Sign In
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Seo
        title="Profile"
        description="Manage your Classic Watch Pro account, security and preferences."
        noindex
      />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
        Profile
      </Typography>

      {mockApiEnabled && (
        <Alert severity="info" sx={{ mb: 3 }}>
          You are browsing in demo mode with the built-in Demo account. Add your Firebase
          credentials to `.env.local` to use real authentication.
        </Alert>
      )}

      <Stack spacing={3} maxWidth={640}>
        {/* Identity card */}
        <Card variant="outlined">
          <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2.5, flexWrap: 'wrap' }}>
            <Avatar
              src={user.photoURL}
              sx={{ width: 72, height: 72, bgcolor: 'primary.main', fontSize: '1.8rem' }}
            >
              {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flexGrow: 1, minWidth: 200 }}>
              <Stack direction="row" spacing={1} alignItems="center">
                {/* Profile identity is data, not a document heading. */}
                <Typography variant="h6" component="div" fontWeight={700}>
                  {user.displayName || 'User'}
                </Typography>
                <Chip
                  label={isAdmin ? 'Admin' : 'Member'}
                  color={isAdmin ? 'secondary' : 'default'}
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Member since {formatDate(user.createdAt, 'long')}
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={() => void handleSignOut()}
            >
              Sign out
            </Button>
          </CardContent>
        </Card>

        {/* Details */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
            Account details
          </Typography>
          <Stack spacing={1.5}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Account ID</Typography>
              <Typography fontWeight={600}>{user.id}</Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Role</Typography>
              <Typography fontWeight={600} textTransform="capitalize">
                {user.role}
              </Typography>
            </Box>
            <Divider />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary">Photo</Typography>
              <Typography fontWeight={600}>{user.photoURL ? 'Connected' : 'Not set'}</Typography>
            </Box>
          </Stack>
        </Paper>

        {/* Security */}
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
            <ShieldOutlined color="primary" />
            <Typography variant="h6" component="h2" fontWeight={700}>
              Security
            </Typography>
          </Stack>
          <Typography variant="body2" color="text.secondary">
            Authentication is managed by your identity provider. Password resets and verification
            links are sent to your registered email address.
          </Typography>

          <Divider sx={{ my: 2 }} />

          {user.emailVerified === false && !mockApiEnabled ? (
            <Alert
              severity="warning"
              action={
                <Button
                  color="inherit"
                  size="small"
                  onClick={() =>
                    void refreshAuthState().then(() => setVerifyNotice('Status refreshed.'))
                  }
                >
                  Check status
                </Button>
              }
            >
              <Stack spacing={1}>
                <Box>
                  <Typography fontWeight={700} variant="body2">
                    Email not verified yet
                  </Typography>
                  <Typography variant="body2">
                    Check your inbox for the confirmation link, then refresh. Until then some
                    account features are locked.
                  </Typography>
                </Box>
                <Box>
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={verifyBusy !== null}
                    onClick={() => {
                      setVerifyBusy('send');
                      setVerifyNotice(null);
                      void sendEmailVerification()
                        .then(() => setVerifyNotice('Verification email sent.'))
                        .catch((error: unknown) =>
                          setVerifyNotice(getApiErrorMessage(error, 'Could not send the email.'))
                        )
                        .finally(() => setVerifyBusy(null));
                    }}
                    startIcon={
                      verifyBusy === 'send' ? (
                        <CircularProgress size={14} />
                      ) : (
                        <MarkEmailReadOutlined />
                      )
                    }
                  >
                    {verifyBusy === 'send' ? 'Sending…' : 'Resend verification email'}
                  </Button>
                  {verifyNotice && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      sx={{ mt: 0.5 }}
                    >
                      {verifyNotice}
                    </Typography>
                  )}
                </Box>
              </Stack>
            </Alert>
          ) : (
            <Stack direction="row" spacing={1.5} alignItems="center">
              <MarkEmailReadOutlined fontSize="small" color="success" />
              <Typography variant="body2">
                Email verified
                {mockApiEnabled ? ' (demo accounts are pre-verified)' : ''}
              </Typography>
              <Chip
                label="Verified"
                size="small"
                color="success"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Stack>
          )}

          <Divider sx={{ my: 2 }} />

          {/* Two-factor authentication */}
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <KeyOutlined fontSize="small" color="primary" />
              <Typography fontWeight={700} variant="body2">
                Two-factor authentication
              </Typography>
              <Chip
                label={user.mfaEnabled === true ? 'On' : 'Off'}
                size="small"
                color={user.mfaEnabled === true ? 'success' : 'default'}
                variant={user.mfaEnabled === true ? 'filled' : 'outlined'}
                sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700 }}
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {user.mfaEnabled === true
                ? `Protected with an authenticator app${user.mfaEnrolledAt ? ` since ${formatDate(user.mfaEnrolledAt, 'short')}` : ''}.`
                : 'Add a second factor so your account stays safe even if your password leaks.'}
            </Typography>
            {user.mfaEnabled === true ? (
              <Button
                variant="outlined"
                size="small"
                color="error"
                onClick={() => void handleDisableMfa()}
              >
                Disable two-factor authentication
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                startIcon={<SmartphoneOutlined />}
                onClick={() => setMfaDialogOpen(true)}
              >
                Enable two-factor authentication
              </Button>
            )}
            {mfaNotice && (
              <Typography variant="caption" color="text.secondary" display="block">
                {mfaNotice}
              </Typography>
            )}
          </Stack>

          {mockApiEnabled && (
            <>
              <Divider sx={{ my: 2 }} />

              {/* Passkeys (WebAuthn when the platform supports it) */}
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <SmartphoneOutlined fontSize="small" color="primary" />
                  <Typography fontWeight={700} variant="body2">
                    Passkeys
                  </Typography>
                  <Chip
                    label={`${user.passkeys?.length ?? 0} registered`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.68rem' }}
                  />
                  <Chip
                    label={webauthnSupported() ? 'WebAuthn' : 'Demo stand-in'}
                    size="small"
                    color={webauthnSupported() ? 'primary' : 'default'}
                    variant={webauthnSupported() ? 'filled' : 'outlined'}
                    sx={{ height: 20, fontSize: '0.68rem' }}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {webauthnSupported()
                    ? 'Secured by your device biometrics — sign in with a passkey instead of a code.'
                    : 'Your browser does not expose WebAuthn here (passkeys need HTTPS or localhost) — using the demo stand-in.'}
                </Typography>
                {user.passkeys && user.passkeys.length > 0 && (
                  <Stack spacing={1}>
                    {user.passkeys.map((record) => (
                      <Stack
                        key={record.id}
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        sx={{
                          px: 1.5,
                          py: 0.75,
                          borderRadius: 1.5,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {record.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Registered {formatDate(record.createdAt, 'short')}
                            {record.isWebAuthn ? ' · WebAuthn' : ' · demo stand-in'}
                          </Typography>
                        </Box>
                        <Tooltip title="Remove passkey">
                          <IconButton
                            size="small"
                            aria-label={`Remove passkey ${record.name}`}
                            onClick={() =>
                              void removePasskey(record.id).then(() =>
                                setPasskeyNotice('Passkey removed.')
                              )
                            }
                          >
                            <DeleteOutline fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    ))}
                  </Stack>
                )}
                <Stack direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    placeholder="Device name (e.g. MacBook Pro)"
                    value={passkeyName}
                    onChange={(event) => setPasskeyName(event.target.value)}
                    sx={{ flexGrow: 1, maxWidth: 300 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={passkeyBusy || !passkeyName.trim()}
                    onClick={() => void handleRegisterPasskey()}
                  >
                    {passkeyBusy ? 'Registering…' : 'Register passkey'}
                  </Button>
                </Stack>
                {passkeyNotice && (
                  <Typography variant="caption" color="text.secondary" display="block">
                    {passkeyNotice}
                  </Typography>
                )}
              </Stack>
            </>
          )}
        </Paper>

        <MfaSetupDialog
          open={mfaDialogOpen}
          onClose={() => setMfaDialogOpen(false)}
          onEnabled={() => setMfaNotice('Two-factor authentication enabled.')}
        />

        {/* Demo info */}
        <Stack direction="row" spacing={1} alignItems="center" color="text.secondary">
          <BadgeOutlined fontSize="small" />
          <Typography variant="caption">
            Last updated {formatDate(user.updatedAt, 'short')}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
};

export default ProfilePage;
