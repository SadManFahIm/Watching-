import type { ReactNode } from 'react';
import { Box, Container, Grid, Paper, Stack, Typography, useTheme } from '@mui/material';
import {
  SecurityOutlined,
  LocalShippingOutlined,
  WorkspacePremiumOutlined,
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';

const brandPoints = [
  {
    icon: SecurityOutlined,
    title: '100% authentic',
    text: 'Every timepiece is verified and serialized.',
  },
  {
    icon: LocalShippingOutlined,
    title: 'Insured worldwide delivery',
    text: 'Fully tracked, signature-on-delivery shipping.',
  },
  {
    icon: WorkspacePremiumOutlined,
    title: '2-year international warranty',
    text: 'Backed by our concierge service team.',
  },
];

const AuthLayout = ({ children }: { children: ReactNode }) => {
  const theme = useTheme();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Container maxWidth="xl" sx={{ py: { xs: 3, md: 6 } }}>
        <Paper variant="outlined" sx={{ overflow: 'hidden' }}>
          <Grid container>
            {/* Brand panel (desktop only) */}
            <Grid
              sx={{
                display: { xs: 'none', md: 'flex' },
                flexDirection: 'column',
                justifyContent: 'space-between',
                p: 5,
                color: '#fff',
                background: 'linear-gradient(150deg, #24447C 0%, #1D3682 100%)',
              }}
              size={{
                md: 5,
              }}
            >
              <Box>
                <Typography
                  component={RouterLink}
                  to="/"
                  variant="h5"
                  sx={{
                    fontWeight: 800,
                    color: '#fff',
                    textDecoration: 'none',
                  }}
                >
                  Classic Watch Pro
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    mt: 5,
                    lineHeight: 1.25,
                  }}
                >
                  Time is the only luxury you cannot buy twice.
                </Typography>
                <Typography sx={{ mt: 2, color: 'rgba(255,255,255,0.82)', maxWidth: 380 }}>
                  Sign in to your collection, track deliveries, and manage your account — all in one
                  place.
                </Typography>
              </Box>

              <Stack spacing={2.5} sx={{ mt: 6 }}>
                {brandPoints.map((point) => (
                  <Stack
                    key={point.title}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      alignItems: 'flex-start',
                    }}
                  >
                    <point.icon sx={{ mt: 0.25, fontSize: 22, color: 'rgba(255,255,255,0.9)' }} />
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 700,
                        }}
                      >
                        {point.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                        {point.text}
                      </Typography>
                    </Box>
                  </Stack>
                ))}
              </Stack>
            </Grid>

            {/* Form panel */}
            <Grid
              sx={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                p: { xs: 3, sm: 5, md: 7 },
                bgcolor: theme.palette.mode === 'light' ? '#fff' : 'background.default',
              }}
              size={{
                xs: 12,
                md: 7,
              }}
            >
              <Box sx={{ width: '100%', maxWidth: 460, mx: 'auto' }}>{children}</Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default AuthLayout;
