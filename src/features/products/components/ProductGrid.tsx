import { Grid } from '@mui/material';
import type { Product } from '@/types';
import ProductCard from './ProductCard';

interface ProductGridProps {
  products: Product[];
  spacing?: number;
  /** Number of leading cards whose images load eagerly (fetchpriority=high). */
  priorityCount?: number;
}

const ProductGrid = ({ products, spacing, priorityCount = 0 }: ProductGridProps) => {
  return (
    <Grid container spacing={spacing ?? { xs: 2, sm: 3 }}>
      {products.map((product, index) => (
        <Grid
          key={product.id}
          size={{
            xs: 6,
            sm: 4,
            lg: 3,
          }}
        >
          <ProductCard product={product} priority={index < priorityCount} />
        </Grid>
      ))}
    </Grid>
  );
};

export default ProductGrid;
