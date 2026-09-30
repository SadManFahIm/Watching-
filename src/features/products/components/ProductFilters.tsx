import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Divider,
  FormControlLabel,
  Slider,
  Stack,
  Switch,
  Typography,
} from '@mui/material';
import type { ProductFilters as ProductFiltersType } from '@/types';
import {
  PRODUCT_CATEGORIES,
  DEFAULT_PRICE_RANGE,
  PRICE_SLIDER_STEP,
} from '@/features/products/constants';
import { formatCurrency } from '@/utils/helpers';

interface ProductFiltersProps {
  value: ProductFiltersType;
  onChange: (filters: ProductFiltersType) => void;
  onClear: () => void;
}

const RATING_OPTIONS = [
  { label: 'Any rating', value: undefined },
  { label: '4★ & up', value: 4 },
  { label: '3★ & up', value: 3 },
];

const ProductFilters = ({ value, onChange, onClear }: ProductFiltersProps) => {
  const selectedCategories = value.category ?? [];
  const [localPrice, setLocalPrice] = useState<[number, number]>(
    value.priceRange ?? DEFAULT_PRICE_RANGE
  );

  // Keep the displayed range in sync when the committed value changes
  useEffect(() => {
    setLocalPrice(value.priceRange ?? DEFAULT_PRICE_RANGE);
  }, [value.priceRange]);

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter((item) => item !== category)
      : [...selectedCategories, category];
    onChange({ ...value, category: next.length ? next : undefined });
  };

  const handlePriceCommit = (newRange: number | number[]) => {
    if (Array.isArray(newRange)) {
      onChange({
        ...value,
        priceRange: newRange as [number, number],
      });
    }
  };

  const handleRatingSelect = (rating: number | undefined) => {
    onChange({ ...value, rating });
  };

  const activeFilterCount = [
    selectedCategories.length > 0,
    Boolean(value.rating),
    Boolean(value.inStock),
    Boolean(value.priceRange),
  ].filter(Boolean).length;

  return (
    <Box component="form" onSubmit={(event) => event.preventDefault()}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 1,
        }}
      >
        <Typography
          variant="h6"
          component="h2"
          sx={{
            fontWeight: 700,
          }}
        >
          Filters
        </Typography>
        {activeFilterCount > 0 && (
          <Button size="small" onClick={onClear}>
            Clear all
          </Button>
        )}
      </Stack>

      <Divider sx={{ mb: 2 }} />

      {/* Categories */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        Category
      </Typography>
      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          gap: 0.75,
          mb: 2.5,
        }}
      >
        {PRODUCT_CATEGORIES.map((category) => {
          const selected = selectedCategories.includes(category.value);
          return (
            <Chip
              key={category.value}
              label={category.label}
              clickable
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => toggleCategory(category.value)}
            />
          );
        })}
      </Stack>

      {/* Price */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        Price range
      </Typography>
      <Typography
        variant="body2"
        sx={{
          color: 'text.secondary',
          mb: 0.5,
        }}
      >
        {formatCurrency(localPrice[0])} — {formatCurrency(localPrice[1])}
      </Typography>
      <Slider
        value={localPrice}
        min={DEFAULT_PRICE_RANGE[0]}
        max={DEFAULT_PRICE_RANGE[1]}
        step={PRICE_SLIDER_STEP}
        valueLabelDisplay="auto"
        valueLabelFormat={(value) => formatCurrency(value)}
        // Range thumbs are individual inputs — give each an accessible name
        // (the component renders twice: desktop panel + mobile drawer).
        getAriaLabel={(index) => (index === 0 ? 'Minimum price' : 'Maximum price')}
        onChange={(_, newValue) => setLocalPrice(newValue as [number, number])}
        onChangeCommitted={(_, newValue) => handlePriceCommit(newValue)}
        disableSwap
        sx={{ mb: 2.5 }}
      />

      {/* Rating */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          mb: 1,
        }}
      >
        Rating
      </Typography>
      <Stack
        direction="row"
        sx={{
          flexWrap: 'wrap',
          gap: 0.75,
          mb: 2.5,
        }}
      >
        {RATING_OPTIONS.map((option) => {
          const selected = (value.rating ?? undefined) === option.value;
          return (
            <Chip
              key={option.label}
              label={option.label}
              clickable
              color={selected ? 'primary' : 'default'}
              variant={selected ? 'filled' : 'outlined'}
              onClick={() => handleRatingSelect(option.value)}
            />
          );
        })}
      </Stack>

      {/* Stock */}
      <FormControlLabel
        control={
          <Switch
            checked={Boolean(value.inStock)}
            onChange={(event) => onChange({ ...value, inStock: event.target.checked || undefined })}
          />
        }
        label={<Typography variant="body2">In stock only</Typography>}
      />
    </Box>
  );
};

export default ProductFilters;
