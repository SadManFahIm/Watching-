import { Box } from '@mui/material';
import { lazy, Suspense } from 'react';
import Hero from '@/features/home/components/Hero';
import LoadingScreen from '@/components/common/LoadingScreen';
import Seo from '@/components/seo/Seo';

// Rails below the fold load lazily so the hero paints without waiting on
// them (perf pass); the recently-viewed rail is empty for first-time
// visitors, so it joins the same lazy boundary.
const Categories = lazy(() => import('@/features/home/components/Categories'));
const FeaturedProducts = lazy(() => import('@/features/home/components/FeaturedProducts'));
const LatestProducts = lazy(() => import('@/features/home/components/LatestProducts'));
const RecentlyViewedProducts = lazy(
  () => import('@/features/home/components/RecentlyViewedProducts')
);

const HomePage = () => {
  return (
    <Box>
      <Seo
        title="Luxury & Classic Timepieces"
        description="Discover luxurious classic, sport, casual and smart watches. Authentic timepieces with verified reviews, promo codes, free insured delivery and a 2-year warranty at Classic Watch Pro."
        keywords={[
          'luxury watches',
          'classic watches',
          'automatic watches',
          "men's watches",
          "women's watches",
          'authentic timepieces',
        ]}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'OnlineStore',
          name: 'Classic Watch Pro',
          description: 'Luxury and classic timepieces with verified reviews and secure checkout.',
          url: 'https://classic-watch-pro.vercel.app',
          priceRange: '$150-$5000+',
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://classic-watch-pro.vercel.app/products?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <Hero />
      <Suspense fallback={<LoadingScreen />}>
        <Categories />
        <FeaturedProducts />
        <LatestProducts />
        <RecentlyViewedProducts />
      </Suspense>
    </Box>
  );
};

export default HomePage;
