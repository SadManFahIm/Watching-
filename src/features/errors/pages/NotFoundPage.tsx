import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Container, Stack, Typography } from '@mui/material';
import { Explore, Home } from '@mui/icons-material';
import { NotFoundIllustration } from '@/components/illustrations';
import Seo from '@/components/seo/Seo';

const NotFoundPage = () => {
  return (
    <Container maxWidth="md" sx={{ py: { xs: 5, md: 9 } }}>
      <Seo
        title="Page Not Found"
        description="This page has stopped keeping time. Explore the Classic Watch Pro collection instead."
        noindex
      />

      <Stack alignItems="center" spacing={2.5} sx={{ textAlign: 'center', pt: { xs: 2, md: 4 } }}>
        <NotFoundIllustration size={176} />

        <Box>
          <Typography
            variant="overline"
            color="secondary.main"
            sx={{ fontWeight: 700, letterSpacing: '0.28em' }}
          >
            Error 404
          </Typography>
          <Typography variant="h3" component="h1" fontWeight={700} sx={{ mt: 0.5 }}>
            This page has stopped keeping time.
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 540, mx: 'auto', mt: 1.5 }}>
            The address you followed is broken or no longer exists. The rest of the collection is
            still ticking away — head back to the shop.
          </Typography>
        </Box>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="contained"
            size="large"
            component={RouterLink}
            to="/products"
            startIcon={<Explore />}
          >
            Browse the collection
          </Button>
          <Button
            variant="outlined"
            size="large"
            component={RouterLink}
            to="/"
            startIcon={<Home />}
          >
            Back to home
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
};

export default NotFoundPage;
