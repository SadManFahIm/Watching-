import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Drawer,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { Close, CompareArrows } from '@mui/icons-material';
import { useCompareStore } from '@/store/compare.store';
import { useCrossTabCompareSync } from '@/features/products/hooks/useCrossTabCompareSync';
import { formatCurrency } from '@/utils/helpers';
import type { Product } from '@/types';

interface CompareRow {
  label: string;
  render: (product: Product) => string;
}

const COMPARE_ROWS: CompareRow[] = [
  { label: 'Price', render: (product) => formatCurrency(product.price) },
  {
    label: 'Rating',
    render: (product) => (product.rating > 0 ? `${product.rating.toFixed(1)} ★` : '—'),
  },
  { label: 'Category', render: (product) => product.category },
  {
    label: 'Availability',
    render: (product) => (product.stock > 0 ? `In stock (${product.stock})` : 'Out of stock'),
  },
  { label: 'Movement', render: (product) => product.specifications.movement },
  { label: 'Case diameter', render: (product) => product.specifications.caseDiameter },
  { label: 'Case material', render: (product) => product.specifications.caseMaterial },
  { label: 'Water resistance', render: (product) => product.specifications.waterResistance },
  { label: 'Strap', render: (product) => product.specifications.strapMaterial },
  { label: 'Warranty', render: (product) => product.specifications.warranty },
];

const CompareDrawer = () => {
  useCrossTabCompareSync();
  const navigate = useNavigate();
  const items = useCompareStore((state) => state.items);
  const drawerOpen = useCompareStore((state) => state.drawerOpen);
  const remove = useCompareStore((state) => state.remove);
  const clear = useCompareStore((state) => state.clear);
  const closeDrawer = useCompareStore((state) => state.closeDrawer);

  return (
    <Drawer
      anchor="bottom"
      open={drawerOpen}
      onClose={closeDrawer}
      aria-label="Compare watches"
      slotProps={{
        paper: {
          sx: {
            maxHeight: '80vh',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            px: { xs: 1.5, md: 3 },
            py: 1.5,
          },
        },
      }}
    >
      <Stack spacing={2}>
        <Stack
          direction="row"
          sx={{
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <CompareArrows color="primary" />
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
              }}
            >
              Compare ({items.length}/4)
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: 'center',
            }}
          >
            <Button size="small" color="inherit" onClick={clear} disabled={items.length === 0}>
              Clear all
            </Button>
            <Tooltip title="Close compare">
              <IconButton onClick={closeDrawer} aria-label="Close compare" size="small">
                <Close fontSize="small" />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {items.length === 0 ? (
          <Typography
            variant="body2"
            sx={{
              color: 'text.secondary',
              py: 3,
              textAlign: 'center',
            }}
          >
            Select up to 4 watches with the compare icon on any product card to see them side by
            side.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 720 }}>
              <TableHead>
                <TableRow>
                  <TableCell component="th" scope="col" sx={{ width: 150 }} />
                  {items.map((product) => (
                    <TableCell key={product.id} component="th" scope="col" align="center">
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: 0.5,
                        }}
                      >
                        {product.thumbnail && (
                          <img
                            src={product.thumbnail}
                            alt=""
                            loading="lazy"
                            style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }}
                          />
                        )}
                        <Link
                          component="button"
                          onClick={() => {
                            closeDrawer();
                            navigate(`/products/${product.id}`);
                          }}
                          underline="hover"
                          sx={{ fontWeight: 700, fontSize: '0.85rem', textAlign: 'center' }}
                        >
                          {product.name}
                        </Link>
                        <IconButton
                          size="small"
                          aria-label={`Remove ${product.name} from compare`}
                          color="error"
                          onClick={() => remove(product.id)}
                        >
                          <Close fontSize="small" />
                        </IconButton>
                      </Box>
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {COMPARE_ROWS.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell
                      component="th"
                      scope="row"
                      sx={{ color: 'text.secondary', fontWeight: 600 }}
                    >
                      {row.label}
                    </TableCell>
                    {items.map((product) => (
                      <TableCell key={product.id} align="center">
                        {row.render(product)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </Stack>
    </Drawer>
  );
};

export default CompareDrawer;
