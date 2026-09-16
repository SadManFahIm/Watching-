import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Chip,
  CircularProgress,
  Divider,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { Watch } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useProduct, useCreateProduct, useUpdateProduct } from '@/api/products.api';
import { getApiErrorMessage } from '@/lib/axios';
import { PRODUCT_CATEGORIES } from '@/features/products/constants';
import SkeletonLoader from '@/components/common/SkeletonLoader';
import Seo from '@/components/seo/Seo';
import { formatCurrency } from '@/utils/helpers';
import type { Product } from '@/types';

const CATEGORY_VALUES = PRODUCT_CATEGORIES.map((item) => item.value) as [
  Product['category'],
  ...Product['category'][],
];
const productSchema = z.object({
  name: z.string().min(2, 'Product name is required').max(120),
  brand: z.string().min(1, 'Brand is required').max(60),
  model: z.string().min(1, 'Model is required').max(60),
  category: z.enum(CATEGORY_VALUES),
  description: z.string().min(20, 'Describe the piece in at least 20 characters').max(2000),
  price: z.coerce.number().positive('Price must be greater than 0').max(10_000_000),
  originalPrice: z
    .union([z.coerce.number().nonnegative().max(10_000_000), z.literal(0)])
    .optional(),
  stock: z.coerce
    .number()
    .int('Use a whole number')
    .min(0, 'Stock cannot be negative')
    .max(100_000),
  rating: z.coerce.number().min(0).max(5).optional(),
  reviewCount: z.coerce.number().int().min(0).optional(),
  thumbnail: z.string().url('Enter a valid image URL (https://…)').or(z.literal('')).optional(),
  features: z.string().optional(),
  movement: z.string().optional(),
  caseDiameter: z.string().optional(),
  caseMaterial: z.string().optional(),
  waterResistance: z.string().optional(),
  strapMaterial: z.string().optional(),
  warranty: z.string().optional(),
  isNew: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

const toFormValues = (product: Product): ProductFormValues => ({
  name: product.name,
  brand: product.brand,
  model: product.model,
  category: product.category,
  description: product.description,
  price: product.price,
  originalPrice: product.originalPrice,
  stock: product.stock,
  rating: product.rating,
  reviewCount: product.reviewCount,
  thumbnail: product.thumbnail,
  features: product.features?.join('\n') ?? '',
  movement: product.specifications?.movement ?? '',
  caseDiameter: product.specifications?.caseDiameter ?? '',
  caseMaterial: product.specifications?.caseMaterial ?? '',
  waterResistance: product.specifications?.waterResistance ?? '',
  strapMaterial: product.specifications?.strapMaterial ?? '',
  warranty: product.specifications?.warranty ?? '',
  isNew: product.isNew ?? false,
  isFeatured: product.isFeatured ?? false,
});

const AddProductPage = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const editingQuery = useProduct(id ?? '', { enabled: isEdit });
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [formReady, setFormReady] = useState(!isEdit);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      brand: '',
      model: '',
      category: 'classic',
      description: '',
      price: undefined,
      originalPrice: undefined,
      stock: 5,
      rating: 0,
      reviewCount: 0,
      thumbnail: '',
      features: '',
      movement: 'Automatic',
      caseDiameter: '40mm',
      caseMaterial: 'Stainless Steel',
      waterResistance: '50m',
      strapMaterial: 'Calf Leather',
      warranty: 'International 2-year warranty',
      isNew: false,
      isFeatured: false,
    },
    mode: 'onTouched',
  });

  // Load existing product data when editing.
  useEffect(() => {
    if (!isEdit) return;
    if (editingQuery.isSuccess && editingQuery.data) {
      reset(toFormValues(editingQuery.data));
      setFormReady(true);
    }
    if (editingQuery.isError) {
      setFormReady(true);
    }
  }, [editingQuery.isSuccess, editingQuery.isError, editingQuery.data, reset, isEdit]);

  const watched = watch();
  const thumbnailUrl = watched.thumbnail?.trim();
  const showThumbnail = Boolean(thumbnailUrl);

  const handleSave = async (values: ProductFormValues) => {
    try {
      const originalPrice =
        values.originalPrice && values.originalPrice > 0 ? values.originalPrice : undefined;
      const payload = {
        name: values.name.trim(),
        brand: values.brand.trim(),
        model: values.model.trim(),
        category: values.category,
        description: values.description.trim(),
        price: values.price,
        originalPrice,
        stock: values.stock,
        rating: values.rating ?? 0,
        reviewCount: values.reviewCount ?? 0,
        thumbnail: values.thumbnail?.trim() ?? '',
        images: values.thumbnail?.trim() ? [values.thumbnail.trim()] : [],
        features: (values.features ?? '')
          .split('\n')
          .map((feature) => feature.trim())
          .filter(Boolean),
        specifications: {
          movement: values.movement?.trim() || 'Automatic',
          caseDiameter: values.caseDiameter?.trim() || '40mm',
          caseMaterial: values.caseMaterial?.trim() || 'Stainless Steel',
          waterResistance: values.waterResistance?.trim() || '50m',
          strapMaterial: values.strapMaterial?.trim() || 'Calf Leather',
          warranty: values.warranty?.trim() || 'International 2-year warranty',
        },
        isNew: values.isNew ?? false,
        isFeatured: values.isFeatured ?? false,
      };

      if (isEdit && id) {
        await updateProduct.mutateAsync({ id, ...payload });
        toast.success('Product updated successfully');
      } else {
        await createProduct.mutateAsync(payload);
        toast.success('Product created successfully');
      }
      navigate('/admin/products');
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, isEdit ? 'Failed to update product' : 'Failed to create product')
      );
    }
  };

  if (isEdit && !formReady) {
    return (
      <Box>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
          Edit product
        </Typography>
        <SkeletonLoader variant="list" count={5} />
      </Box>
    );
  }

  if (isEdit && editingQuery.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={() => void editingQuery.refetch()}>
            Try again
          </Button>
        }
      >
        We could not load this product for editing.
      </Alert>
    );
  }

  return (
    <Box>
      <Seo
        title={isEdit ? 'Edit Product' : 'Add Product'}
        description="Manage the Classic Watch Pro catalog — add or edit a product."
        noindex
        nofollow
      />
      <Breadcrumbs sx={{ mb: 1, fontSize: '0.85rem' }} aria-label="breadcrumb">
        <Typography
          component={RouterLink}
          to="/admin/products"
          color="inherit"
          sx={{ textDecoration: 'none' }}
        >
          Products
        </Typography>
        <Typography color="text.primary">{isEdit ? 'Edit product' : 'Add product'}</Typography>
      </Breadcrumbs>
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 0.5 }}>
        {isEdit ? 'Edit product' : 'Add a new product'}
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        {isEdit
          ? 'Update the details below — changes appear on the storefront immediately.'
          : 'Fill in the details below to list a new timepiece on the storefront.'}
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper
            variant="outlined"
            component="form"
            noValidate
            onSubmit={(event) => void handleSubmit(handleSave)(event)}
            sx={{ p: { xs: 2.5, md: 4 } }}
          >
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2.5 }}>
              Basics
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Product name"
                  fullWidth
                  autoFocus
                  {...register('name')}
                  error={Boolean(errors.name)}
                  helperText={errors.name?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Brand"
                  fullWidth
                  placeholder="e.g. Aurum"
                  {...register('brand')}
                  error={Boolean(errors.brand)}
                  helperText={errors.brand?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model"
                  fullWidth
                  placeholder="e.g. Heritage Moonphase"
                  {...register('model')}
                  error={Boolean(errors.model)}
                  helperText={errors.model?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="category"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth error={Boolean(errors.category)}>
                      <InputLabel id="product-category-label">Category</InputLabel>
                      <Select
                        {...field}
                        label="Category"
                        id="product-category"
                        labelId="product-category-label"
                      >
                        {PRODUCT_CATEGORIES.map((category) => (
                          <MenuItem key={category.value} value={category.value}>
                            {category.label}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.category && (
                        <FormHelperText>{errors.category.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="SKU / reference (optional)"
                  fullWidth
                  disabled
                  helperText="Assigned automatically"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  minRows={4}
                  maxRows={8}
                  placeholder="Materials, finishing, heritage — what makes this piece special?"
                  {...register('description')}
                  error={Boolean(errors.description)}
                  helperText={
                    errors.description?.message ??
                    `${(watched.description ?? '').length}/2000 characters`
                  }
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3.5 }} />
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2.5 }}>
              Pricing & inventory
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} lg={4}>
                <TextField
                  label="Selling price"
                  type="number"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  {...register('price')}
                  error={Boolean(errors.price)}
                  helperText={errors.price?.message}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <TextField
                  label="Original price (for discount)"
                  type="number"
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  {...register('originalPrice')}
                  error={Boolean(errors.originalPrice)}
                  helperText={errors.originalPrice?.message ?? 'Leave blank to sell at full price'}
                />
              </Grid>
              <Grid item xs={12} sm={6} lg={4}>
                <TextField
                  label="Stock quantity"
                  type="number"
                  fullWidth
                  {...register('stock')}
                  error={Boolean(errors.stock)}
                  helperText={errors.stock?.message}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 3.5 }} />
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2.5 }}>
              Specifications
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Movement" fullWidth {...register('movement')} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Case diameter"
                  fullWidth
                  placeholder="40mm"
                  {...register('caseDiameter')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Case material"
                  fullWidth
                  placeholder="Stainless Steel"
                  {...register('caseMaterial')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Water resistance"
                  fullWidth
                  placeholder="100m"
                  {...register('waterResistance')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Strap material"
                  fullWidth
                  placeholder="Calf Leather"
                  {...register('strapMaterial')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Warranty"
                  fullWidth
                  placeholder="2-year international warranty"
                  {...register('warranty')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Key features (one per line)"
                  fullWidth
                  multiline
                  minRows={3}
                  placeholder={'Sapphire crystal\nExhibition caseback\nQuick-release strap'}
                  {...register('features')}
                  helperText={
                    watched.features
                      ?.split('\n')
                      .map((feature) => feature.trim())
                      .filter(Boolean).length
                      ? `${
                          watched.features
                            .split('\n')
                            .map((feature) => feature.trim())
                            .filter(Boolean).length
                        } features will be shown on the product page`
                      : 'Each line becomes a highlight chip on the product page.'
                  }
                />
              </Grid>
            </Grid>

            <Stack direction="row" spacing={1.5} sx={{ mt: 3.5 }}>
              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting || createProduct.isPending || updateProduct.isPending}
                startIcon={
                  isSubmitting || createProduct.isPending || updateProduct.isPending ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : undefined
                }
              >
                {isEdit ? 'Save changes' : 'Create product'}
              </Button>
              <Button
                component={RouterLink}
                to="/admin/products"
                variant="outlined"
                size="large"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </Stack>
          </Paper>
        </Grid>

        {/* Side panel: image + flags */}
        <Grid item xs={12} lg={4}>
          <Paper variant="outlined" sx={{ p: { xs: 2.5, md: 3 }, position: 'sticky', top: 96 }}>
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
              Media & flags
            </Typography>

            <Box
              sx={{
                aspectRatio: '1 / 1',
                borderRadius: 2,
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'action.hover',
                mb: 2,
              }}
            >
              {showThumbnail ? (
                <img
                  src={thumbnailUrl}
                  alt="Product preview"
                  onError={(event) => {
                    (event.target as HTMLImageElement).style.display = 'none';
                  }}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <Watch sx={{ fontSize: 84, color: 'text.disabled' }} />
              )}
            </Box>

            <TextField
              label="Thumbnail image URL"
              fullWidth
              size="small"
              placeholder="https://res.cloudinary.com/…/watch.jpg"
              {...register('thumbnail')}
              error={Boolean(errors.thumbnail)}
              helperText={
                errors.thumbnail?.message ?? 'Paste a public image URL (Cloudinary, Unsplash…).'
              }
            />

            <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
              <Chip
                label="New"
                variant={watched.isNew ? 'filled' : 'outlined'}
                color={watched.isNew ? 'success' : 'default'}
                onClick={() => void reset({ ...watched, isNew: !watched.isNew })}
              />
              <Chip
                label="Featured"
                variant={watched.isFeatured ? 'filled' : 'outlined'}
                color={watched.isFeatured ? 'secondary' : 'default'}
                onClick={() => void reset({ ...watched, isFeatured: !watched.isFeatured })}
              />
            </Stack>

            <Divider sx={{ my: 2.5 }} />
            <Typography variant="body2" color="text.secondary">
              {watched.price > 0 && (
                <>
                  Listed at{' '}
                  <Typography component="span" fontWeight={800} color="primary.main">
                    {formatCurrency(watched.price)}
                  </Typography>
                  {watched.originalPrice && watched.originalPrice > watched.price && (
                    <>
                      {' '}
                      (was{' '}
                      <Typography
                        component="span"
                        color="text.secondary"
                        sx={{ textDecoration: 'line-through' }}
                      >
                        {formatCurrency(watched.originalPrice)}
                      </Typography>
                      )
                    </>
                  )}
                </>
              )}
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AddProductPage;
