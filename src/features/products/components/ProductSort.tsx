import { FormControl, InputLabel, MenuItem, Select, Stack } from '@mui/material';
import type { SortOption } from '@/types';
import { SORT_OPTIONS } from '@/features/products/constants';

interface ProductSortProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const ProductSort = ({ value, onChange }: ProductSortProps) => {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
      }}
    >
      {/* FormControl + InputLabel is the accessible pattern MUI supports for
          standalone selects: the label names the combobox (axe
          aria-input-field-name) instead of landing an aria-label on the plain
          wrapper div (axe aria-prohibited-attr). */}
      <FormControl size="small" sx={{ minWidth: 190 }}>
        <InputLabel id="product-sort-label">Sort by</InputLabel>
        <Select
          labelId="product-sort-label"
          label="Sort by"
          value={value}
          onChange={(event) => onChange(event.target.value as SortOption)}
        >
          {SORT_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Stack>
  );
};

export default ProductSort;
