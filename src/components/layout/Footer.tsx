import { Link as RouterLink } from 'react-router-dom';
import { Box, Container, Divider, Grid, Stack, Typography } from '@mui/material';
import { DiamondOutlined, LocalShippingOutlined, SecurityOutlined } from '@mui/icons-material';

interface FooterLink {
  label: string;
  to: string;
}

const SHOP_LINKS: FooterLink[] = [
  { label: 'All Products', to: '/products' },
  { label: 'Luxury Watches', to: '/products?category=luxury' },
  { label: 'Sport Watches', to: '/products?category=sport' },
  { label: 'Classic Watches', to: '/products?category=classic' },
  { label: 'Smart Watches', to: '/products?category=smart' },
];

const ACCOUNT_LINKS: FooterLink[] = [
  { label: 'My Account', to: '/dashboard' },
  { label: 'My Orders', to: '/dashboard/orders' },
  { label: 'Wishlist', to: '/wishlist' },
  { label: 'Cart', to: '/cart' },
];

const SUPPORT_LINKS: FooterLink[] = [
  { label: 'Sign In', to: '/login' },
  { label: 'Create Account', to: '/register' },
  { label: 'Track Order', to: '/dashboard/orders' },
];

const TRUST_ITEMS = [
  { icon: SecurityOutlined, label: '100% Authentic', caption: 'Certified timepieces' },
  { icon: LocalShippingOutlined, label: 'Insured Delivery', caption: 'Worldwide shipping' },
  { icon: DiamondOutlined, label: 'Luxury Warranty', caption: 'Official coverage' },
];

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: '1px solid',
        borderColor: 'divider',
        mt: 'auto',
      }}
    >
      {/* Trust strip */}
      <Container maxWidth="lg">
        <Grid container spacing={2} sx={{ py: 3 }}>
          {TRUST_ITEMS.map((item) => (
            <Grid
              key={item.label}
              size={{
                xs: 12,
                sm: 4,
              }}
            >
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                  justifyContent: { xs: 'flex-start', sm: 'center' },
                }}
              >
                <item.icon sx={{ color: 'primary.main' }} />
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                    }}
                  >
                    {item.caption}
                  </Typography>
                </Box>
              </Stack>
            </Grid>
          ))}
        </Grid>
        <Divider />
      </Container>

      {/* Link columns */}
      <Container maxWidth="lg">
        <Grid container spacing={4} sx={{ py: 4 }}>
          <Grid
            size={{
              xs: 12,
              md: 4,
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 800,
                color: 'primary.main',
                mb: 1,
              }}
            >
              Classic Watch Pro
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'text.secondary',
                maxWidth: 320,
              }}
            >
              A curated collection of luxury timepieces. Every watch is certified authentic and
              delivered with full warranty coverage.
            </Typography>
          </Grid>
          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Shop
            </Typography>
            <Stack spacing={0.75}>
              {SHOP_LINKS.map((link) => (
                <Typography
                  key={link.label}
                  variant="body2"
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Account
            </Typography>
            <Stack spacing={0.75}>
              {ACCOUNT_LINKS.map((link) => (
                <Typography
                  key={link.label}
                  variant="body2"
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
          <Grid
            size={{
              xs: 6,
              sm: 4,
              md: 2,
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 700,
                mb: 1,
              }}
            >
              Support
            </Typography>
            <Stack spacing={0.75}>
              {SUPPORT_LINKS.map((link) => (
                <Typography
                  key={link.label}
                  variant="body2"
                  component={RouterLink}
                  to={link.to}
                  sx={{
                    color: 'text.secondary',
                    '&:hover': { color: 'primary.main' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          </Grid>
        </Grid>
        <Divider />
        <Box
          sx={{ py: 2, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'space-between' }}
        >
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            © {year} Classic Watch Pro. All rights reserved.
          </Typography>
          <Typography
            variant="caption"
            sx={{
              color: 'text.secondary',
            }}
          >
            Secure checkout · Privacy first
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;
