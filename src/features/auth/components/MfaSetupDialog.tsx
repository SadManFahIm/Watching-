import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { KeyOutlined, SmartphoneOutlined } from '@mui/icons-material';
import { useAuthStore } from '@/store/auth.store';
import { getApiErrorMessage } from '@/lib/axios';

interface MfaSetupDialogProps {
  open: boolean;
  onClose: () => void;
  /** Called after a successful enrollment so the parent can refresh its state. */
  onEnabled: () => void;
}

type Step = 'init' | 'confirm' | 'done';

const MfaSetupDialog = ({ open, onClose, onEnabled }: MfaSetupDialogProps) => {
  const enableTotp = useAuthStore((state) => state.enableTotp);
  const confirmTotp = useAuthStore((state) => state.confirmTotp);

  const [step, setStep] = useState<Step>('init');
  const [secret, setSecret] = useState('');
  const [otpAuthUrl, setOtpAuthUrl] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Begin enrollment whenever the dialog opens.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setStep('init');
    setCode('');
    setError(null);
    setBusy(true);
    enableTotp()
      .then((result) => {
        if (cancelled) return;
        setSecret(result.secret);
        setOtpAuthUrl(result.otpAuthUrl);
        setStep('confirm');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(getApiErrorMessage(err, 'Could not start enrollment.'));
      })
      .finally(() => {
        if (!cancelled) setBusy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, enableTotp]);

  const handleConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      await confirmTotp(code);
      setStep('done');
      onEnabled();
    } catch (err) {
      setError(getApiErrorMessage(err, 'That code did not match. Please try again.'));
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    if (busy && step !== 'done') return;
    setStep('init');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: 'center',
          }}
        >
          <SmartphoneOutlined color="primary" />
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
              }}
            >
              Two-factor authentication
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
              }}
            >
              Time-based one-time passwords (TOTP)
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <DialogContent dividers>
        {busy && step === 'init' ? (
          <Stack
            spacing={2}
            sx={{
              alignItems: 'center',
              py: 5,
            }}
          >
            <CircularProgress size={28} />
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Generating a secure secret…
            </Typography>
          </Stack>
        ) : step === 'done' ? (
          <Alert severity="success">
            Two-factor authentication is now enabled. The next time you sign in, you'll be asked for
            a code from your authenticator app.
          </Alert>
        ) : (
          <Stack spacing={2}>
            {error && <Alert severity="error">{error}</Alert>}

            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
              }}
            >
              Scan this key into your authenticator app (Google Authenticator, 1Password, Authy…):
            </Typography>

            <Box
              sx={{
                p: 1.5,
                borderRadius: 1.5,
                bgcolor: 'action.hover',
                border: '1px dashed',
                borderColor: 'divider',
                fontFamily: 'monospace',
                wordBreak: 'break-all',
                fontSize: '0.85rem',
              }}
            >
              {secret || '…'}
            </Box>

            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                wordBreak: 'break-all',
              }}
            >
              {otpAuthUrl}
            </Typography>

            <TextField
              label="6-digit code"
              inputMode="numeric"
              autoComplete="one-time-code"
              fullWidth
              value={code}
              autoFocus
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              slotProps={{ htmlInput: { 'aria-label': 'Authenticator code', maxLength: 6 } }}
              helperText="Enter the code shown in your authenticator app."
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} color="inherit" disabled={busy && step !== 'done'}>
          {step === 'done' ? 'Close' : 'Cancel'}
        </Button>
        {step !== 'done' && (
          <Button
            variant="contained"
            onClick={() => void handleConfirm()}
            disabled={busy || code.length < 6}
            startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <KeyOutlined />}
          >
            {busy ? 'Enabling…' : 'Enable 2FA'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default MfaSetupDialog;
