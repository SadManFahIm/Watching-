import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Grid, Stack, Typography } from '@mui/material';
import { Watch } from '@mui/icons-material';

const Hero = () => {
  return (
    <Box
      sx={{
        color: 'common.white',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 55%, #18315A 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative glow */}
      <Box
        aria-hidden="true"
        sx={{
          position: 'absolute',
          width: 520,
          height: 520,
          borderRadius: '50%',
          right: -140,
          top: -160,
          background: 'radial-gradient(circle, rgba(243,156,18,0.22) 0%, transparent 65%)',
          pointerEvents: 'none',
        }}
      />
      <Container maxWidth="lg" sx={{ position: 'relative', py: { xs: 8, md: 12 } }}>
        <Grid
          container
          spacing={4}
          sx={{
            alignItems: 'center',
          }}
        >
          <Grid
            size={{
              xs: 12,
              md: 7,
            }}
          >
            <Typography
              variant="overline"
              sx={{ color: 'secondary.light', letterSpacing: '0.2em', fontWeight: 700 }}
            >
              The finest timepieces
            </Typography>
            <Typography
              variant="h2"
              component="h1"
              sx={{
                fontWeight: 800,
                mt: 1.5,
                letterSpacing: '-0.02em',
                fontSize: { xs: '2.4rem', md: '3.4rem' },
              }}
            >
              Time, perfected.
            </Typography>
            <Typography
              variant="body1"
              sx={{ mt: 2, maxWidth: 560, color: 'rgba(255,255,255,0.82)', fontSize: '1.05rem' }}
            >
              Discover a hand-picked collection of luxury watches — certified authentic, expertly
              curated, and delivered with complete peace of mind.
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 4, flexWrap: 'wrap' }}>
              <Button
                variant="contained"
                size="large"
                component={RouterLink}
                to="/products"
                sx={{
                  color: 'common.white',
                  background: 'linear-gradient(135deg, #24447C 0%, #18315A 100%)',
                }}
              >
                Shop Collection
              </Button>
              <Button
                variant="outlined"
                size="large"
                component={RouterLink}
                to="/products?category=luxury"
                sx={{
                  color: 'common.white',
                  borderColor: 'rgba(255,255,255,0.5)',
                  '&:hover': { borderColor: 'common.white', bgcolor: 'rgba(255,255,255,0.08)' },
                }}
              >
                Explore Luxury
              </Button>
            </Stack>
          </Grid>
          <Grid
            sx={{ display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}
            size={{
              xs: 12,
              md: 5,
            }}
          >
            <Box
              aria-hidden="true"
              sx={{
                width: 300,
                height: 300,
                borderRadius: '50%',
                border: '2px dashed rgba(255,255,255,0.35)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <Box
                sx={{
                  width: 220,
                  height: 220,
                  borderRadius: '50%',
                  bgcolor: 'rgba(255,255,255,0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,255,255,0.2)',
                }}
              >
                <Watch sx={{ fontSize: 96, color: 'rgba(255,255,255,0.9)' }} />
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Hero;
