import { Link as RouterLink } from 'react-router-dom';
import { Box, Card, CardActionArea, Container, Grid, Typography } from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { PRODUCT_CATEGORIES } from '@/features/products/constants';

const CATEGORY_TAGLINES: Record<string, string> = {
  luxury: 'Prestige & craftsmanship',
  sport: 'Built for performance',
  casual: 'Everyday elegance',
  smart: 'Connected living',
  classic: 'Timeless heritage',
};

const Categories = () => {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
      <Typography
        variant="h4"
        component="h2"
        sx={{
          fontWeight: 700,
          mb: 3,
        }}
      >
        Shop by category
      </Typography>
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {PRODUCT_CATEGORIES.map((category) => (
          <Grid
            key={category.value}
            size={{
              xs: 12,
              sm: 6,
              md: 4,
            }}
          >
            <Card sx={{ height: '100%', borderRadius: 2 }}>
              <CardActionArea
                component={RouterLink}
                to={`/products?category=${category.value}`}
                sx={{ p: 3 }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.5,
                    minHeight: 104,
                    justifyContent: 'space-between',
                  }}
                >
                  {/* Card content heading — h3 under the section's h2 (axe heading-order). */}
                  <Typography
                    variant="h6"
                    component="h3"
                    sx={{
                      fontWeight: 700,
                    }}
                  >
                    {category.label}
                  </Typography>
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'text.secondary',
                        mb: 1,
                      }}
                    >
                      {CATEGORY_TAGLINES[category.value] ?? 'Explore the collection'}
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        color: 'primary.main',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 0.5,
                      }}
                    >
                      Explore <ArrowForward fontSize="small" />
                    </Typography>
                  </Box>
                </Box>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Categories;
