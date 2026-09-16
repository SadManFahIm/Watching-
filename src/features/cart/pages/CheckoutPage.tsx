import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { Close } from '@mui/icons-material';
import toast from 'react-hot-toast';
import { useCreateOrder } from '@/api/orders.api';
import { validatePromoCode } from '@/api/promos.api';
import { useAuthStore } from '@/store/auth.store';
import { useCartStore } from '@/store/cart.store';
import { useNotificationsStore } from '@/store/notifications.store';
import { getApiErrorMessage } from '@/lib/axios';
import { formatCurrency } from '@/utils/helpers';
import EmptyState from '@/components/common/EmptyState';
import Seo from '@/components/seo/Seo';
import type { Order } from '@/types';

const COUNTRIES = [
  'United States',
  'United Kingdom',
  'Switzerland',
  'Germany',
  'France',
  'Italy',
  'United Arab Emirates',
  'Japan',
  'Singapore',
  'India',
  'Bangladesh',
  'Australia',
  'Canada',
];

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  phone: z.string().min(7, 'Please enter a valid phone number'),
  addressLine1: z.string().min(4, 'Please enter your street address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'Please enter your city'),
  postalCode: z.string().min(3, 'Please enter your postal code'),
  country: z.string().min(1, 'Please select your country'),
});

const paymentSchema = z
  .object({
    paymentMethod: z.enum(['card', 'cod', 'wallet']),
    cardNumber: z.string().optional(),
    cardExpiry: z.string().optional(),
    cardCvc: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.paymentMethod === 'card') {
      const digits = (value.cardNumber ?? '').replace(/\s+/g, '');
      if (!/^\d{15,19}$/.test(digits)) {
        ctx.addIssue({
          code: 'custom',
          path: ['cardNumber'],
          message: 'Enter a valid card number',
        });
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value.cardExpiry ?? '')) {
        ctx.addIssue({ code: 'custom', path: ['cardExpiry'], message: 'Use MM/YY format' });
      }
      if (!/^\d{3,4}$/.test(value.cardCvc ?? '')) {
        ctx.addIssue({ code: 'custom', path: ['cardCvc'], message: 'Enter the 3–4 digit CVC' });
      }
    }
  });

type CheckoutValues = z.infer<typeof shippingSchema> &
  z.infer<typeof paymentSchema> & { addressLine2?: string };

const STEPS = ['Shipping', 'Payment', 'Review'];

const STEP_FIELDS: (keyof CheckoutValues)[][] = [
  ['fullName', 'phone', 'addressLine1', 'addressLine2', 'city', 'postalCode', 'country'],
  ['paymentMethod', 'cardNumber', 'cardExpiry', 'cardCvc'],
  [],
];

const formatCardNumber = (value: string): string =>
  value
    .replace(/\D/g, '')
    .slice(0, 16)
    .replace(/(\d{4})(?=\d)/g, '$1 ');

const CheckoutPage = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const items = useCartStore((state) => state.items);
  const total = useCartStore((state) => state.total);
  const discount = useCartStore((state) => state.discount);
  const promoCode = useCartStore((state) => state.promoCode);
  const appliedPromo = useCartStore((state) => state.appliedPromo);
  const applyPromoCode = useCartStore((state) => state.applyPromoCode);
  const removePromoCode = useCartStore((state) => state.removePromoCode);
  const clearCart = useCartStore((state) => state.clearCart);
  const pushNotification = useNotificationsStore((state) => state.push);
  const createOrder = useCreateOrder();
  const [promoInput, setPromoInput] = useState('');
  const [promoBusy, setPromoBusy] = useState(false);

  const [activeStep, setActiveStep] = useState(0);

  const schema = useMemo(
    () => (activeStep === 0 ? shippingSchema : activeStep === 1 ? paymentSchema : shippingSchema),
    [activeStep]
  );

  const {
    control,
    register,
    trigger,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: user?.displayName ?? '',
      phone: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      postalCode: '',
      country: '',
      paymentMethod: 'card',
      cardNumber: '',
      cardExpiry: '',
      cardCvc: '',
    },
    mode: 'onTouched',
  });

  const watched = watch();

  if (items.length === 0 && activeStep === 0) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Seo
          title="Checkout"
          description="Complete your Classic Watch Pro order securely."
          noindex
        />
        <EmptyState
          title="Nothing to check out"
          message="Your cart is empty. Add a timepiece before proceeding to checkout."
          action={
            <Button variant="contained" size="large" onClick={() => navigate('/products')}>
              Explore products
            </Button>
          }
        />
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ py: 6, textAlign: 'center' }}>
        <Seo
          title="Checkout"
          description="Complete your Classic Watch Pro order securely."
          noindex
        />
        <Alert severity="info" sx={{ mb: 2 }}>
          Please sign in to complete your order.
        </Alert>
        <Button variant="contained" onClick={() => navigate('/login')}>
          Go to Sign In
        </Button>
      </Container>
    );
  }

  const subtotal = total;
  const shipping = subtotal >= 500 ? 0 : 15;
  const discountedSubtotal = Math.max(0, subtotal - discount);
  const tax = Math.round(discountedSubtotal * 0.05 * 100) / 100;
  const grandTotal = Math.round((discountedSubtotal + shipping + tax) * 100) / 100;

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) return;
    setPromoBusy(true);
    try {
      const promo = await validatePromoCode(code, subtotal);
      applyPromoCode(promo);
      setPromoInput('');
      toast.success(`Promo ${promo.code} applied`);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'That promo code could not be applied.'));
    } finally {
      setPromoBusy(false);
    }
  };

  const handleNext = async () => {
    const fields = STEP_FIELDS[activeStep];
    const valid = await trigger(fields);
    if (!valid) {
      toast.error('Please fix the highlighted fields before continuing.');
      return;
    }
    setActiveStep((step) => step + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((step) => step - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const buildOrderPayload = (): Omit<Order, 'id' | 'createdAt' | 'updatedAt'> => ({
    userId: user.id,
    items: items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      product: item.product,
    })),
    subtotal,
    shipping,
    tax,
    discount: appliedPromo ? discount : undefined,
    promoCode: appliedPromo?.code,
    total: grandTotal,
    shippingAddress: {
      fullName: watched.fullName,
      phone: watched.phone,
      addressLine1: watched.addressLine1,
      addressLine2: watched.addressLine2 || undefined,
      city: watched.city,
      state: watched.addressLine2 || '',
      postalCode: watched.postalCode,
      country: watched.country,
    },
    orderStatus: 'pending',
    paymentStatus: watched.paymentMethod === 'cod' ? 'pending' : 'paid',
    paymentMethod: watched.paymentMethod,
    notes: undefined,
  });

  const handleConfirm = async () => {
    if (!user) return;
    try {
      const order = await createOrder.mutateAsync(buildOrderPayload());
      pushNotification({
        type: 'success',
        title: 'Order placed',
        message: `Order ${order.id} was placed successfully.${appliedPromo ? ` Promo ${appliedPromo.code} applied.` : ''}`,
      });
      clearCart();
      navigate(`/orders/${order.id}`);
    } catch {
      // Error toast is shown by the mutation hook
    }
  };

  const isCard = watched.paymentMethod === 'card';

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Seo title="Checkout" description="Complete your Classic Watch Pro order securely." noindex />
      <Typography variant="h4" component="h1" fontWeight={700} sx={{ mb: 3 }}>
        Checkout
      </Typography>

      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4, maxWidth: 720, mx: 'auto' }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper variant="outlined" sx={{ p: { xs: 2, md: 3.5 } }}>
            {activeStep === 0 && (
              <>
                <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2.5 }}>
                  Shipping details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Full name"
                      fullWidth
                      {...register('fullName')}
                      error={Boolean(errors.fullName)}
                      helperText={errors.fullName?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Phone"
                      fullWidth
                      {...register('phone')}
                      error={Boolean(errors.phone)}
                      helperText={errors.phone?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address line 1"
                      fullWidth
                      {...register('addressLine1')}
                      error={Boolean(errors.addressLine1)}
                      helperText={errors.addressLine1?.message}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="Address line 2 (optional)"
                      fullWidth
                      {...register('addressLine2')}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="City"
                      fullWidth
                      {...register('city')}
                      error={Boolean(errors.city)}
                      helperText={errors.city?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField
                      label="Postal code"
                      fullWidth
                      {...register('postalCode')}
                      error={Boolean(errors.postalCode)}
                      helperText={errors.postalCode?.message}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Controller
                      name="country"
                      control={control}
                      render={({ field }) => (
                        <FormControl fullWidth error={Boolean(errors.country)}>
                          <InputLabel id="checkout-country-label">Country</InputLabel>
                          <Select
                            {...field}
                            label="Country"
                            id="checkout-country"
                            labelId="checkout-country-label"
                          >
                            {COUNTRIES.map((country) => (
                              <MenuItem key={country} value={country}>
                                {country}
                              </MenuItem>
                            ))}
                          </Select>
                          {errors.country && (
                            <FormHelperText>{errors.country.message}</FormHelperText>
                          )}
                        </FormControl>
                      )}
                    />
                  </Grid>
                </Grid>
              </>
            )}

            {activeStep === 1 && (
              <>
                <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                  Payment method
                </Typography>
                <Controller
                  name="paymentMethod"
                  control={control}
                  render={({ field }) => (
                    <RadioGroup row {...field}>
                      <FormControlLabel
                        value="card"
                        control={<Radio />}
                        label="Credit / Debit card"
                      />
                      <FormControlLabel value="cod" control={<Radio />} label="Cash on delivery" />
                      <FormControlLabel value="wallet" control={<Radio />} label="Digital wallet" />
                    </RadioGroup>
                  )}
                />

                {isCard ? (
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    <Grid item xs={12}>
                      <Controller
                        name="cardNumber"
                        control={control}
                        render={({ field }) => (
                          <TextField
                            label="Card number"
                            fullWidth
                            inputMode="numeric"
                            placeholder="4242 4242 4242 4242"
                            value={field.value}
                            onChange={(event) =>
                              field.onChange(formatCardNumber(event.target.value))
                            }
                            error={Boolean(errors.cardNumber)}
                            helperText={errors.cardNumber?.message}
                          />
                        )}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Expiry (MM/YY)"
                        fullWidth
                        placeholder="12/29"
                        {...register('cardExpiry')}
                        error={Boolean(errors.cardExpiry)}
                        helperText={errors.cardExpiry?.message}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="CVC"
                        fullWidth
                        type="password"
                        inputMode="numeric"
                        placeholder="123"
                        {...register('cardCvc')}
                        error={Boolean(errors.cardCvc)}
                        helperText={errors.cardCvc?.message}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Alert severity="info">
                        Demo checkout — no real payment is processed. Any valid-looking card details
                        will work.
                      </Alert>
                    </Grid>
                  </Grid>
                ) : (
                  <Alert severity="info" sx={{ mt: 2 }}>
                    {watched.paymentMethod === 'cod'
                      ? 'Pay in cash when your order is delivered.'
                      : 'You will be redirected to your wallet provider after placing the order (demo).'}
                  </Alert>
                )}
              </>
            )}

            {activeStep === 2 && (
              <>
                <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
                  Review your order
                </Typography>
                <Stack spacing={0.5} sx={{ mb: 3 }}>
                  <Typography variant="body2" fontWeight={600}>
                    Ship to
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {watched.fullName} · {watched.phone}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {[
                      watched.addressLine1,
                      watched.addressLine2,
                      watched.city,
                      watched.postalCode,
                      watched.country,
                    ]
                      .filter(Boolean)
                      .join(', ')}
                  </Typography>
                </Stack>

                {items.map((item) => (
                  <Box
                    key={item.productId}
                    sx={{ display: 'flex', justifyContent: 'space-between', py: 1 }}
                  >
                    <Typography variant="body2">
                      {item.product.name}{' '}
                      <Typography component="span" variant="caption" color="text.secondary">
                        × {item.quantity}
                      </Typography>
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {formatCurrency(item.product.price * item.quantity)}
                    </Typography>
                  </Box>
                ))}

                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="text.secondary">Payment</Typography>
                  <Typography fontWeight={600} textTransform="capitalize">
                    {watched.paymentMethod === 'card'
                      ? `Card •••• ${(watched.cardNumber ?? '').replace(/\D/g, '').slice(-4) || '4242'}`
                      : watched.paymentMethod === 'cod'
                        ? 'Cash on delivery'
                        : 'Digital wallet'}
                  </Typography>
                </Box>
              </>
            )}

            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button disabled={activeStep === 0} onClick={handleBack}>
                Back
              </Button>
              {activeStep < 2 ? (
                <Button variant="contained" onClick={() => void handleNext()}>
                  Continue
                </Button>
              ) : (
                <Button
                  variant="contained"
                  size="large"
                  disabled={isSubmitting || createOrder.isPending}
                  onClick={() => void handleConfirm()}
                >
                  {createOrder.isPending
                    ? 'Placing order…'
                    : `Place order · ${formatCurrency(grandTotal)}`}
                </Button>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Summary */}
        <Grid item xs={12} md={5}>
          <Paper variant="outlined" sx={{ p: 3, position: 'sticky', top: 96 }}>
            <Typography variant="h6" component="h2" fontWeight={700} sx={{ mb: 2 }}>
              Summary
            </Typography>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Subtotal</Typography>
              <Typography fontWeight={600}>{formatCurrency(subtotal)}</Typography>
            </Box>
            {discount > 0 && appliedPromo && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="success.main" variant="body2" fontWeight={600}>
                  Promo {appliedPromo.code}
                </Typography>
                <Typography color="success.main" fontWeight={600}>
                  −{formatCurrency(discount)}
                </Typography>
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography color="text.secondary">Shipping</Typography>
              <Typography fontWeight={600}>
                {shipping === 0 ? 'Free' : formatCurrency(shipping)}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography color="text.secondary">Estimated tax</Typography>
              <Typography fontWeight={600}>{formatCurrency(tax)}</Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              {/* Summary totals are data labels, not document headings. */}
              <Typography component="div" variant="h6" fontWeight={700}>
                Total
              </Typography>
              <Typography component="div" variant="h6" fontWeight={800} color="primary.main">
                {formatCurrency(grandTotal)}
              </Typography>
            </Box>
            {/* Promo code */}
            {appliedPromo ? (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
                <Chip
                  label={promoCode}
                  color="success"
                  variant="outlined"
                  onDelete={removePromoCode}
                  deleteIcon={<Close fontSize="small" />}
                />
                <Typography variant="caption" color="text.secondary">
                  {formatCurrency(discount)} off applied
                </Typography>
              </Stack>
            ) : (
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                <TextField
                  size="small"
                  fullWidth
                  label="Promo code"
                  value={promoInput}
                  onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      void handleApplyPromo();
                    }
                  }}
                  inputProps={{ maxLength: 20 }}
                />
                <Button
                  variant="outlined"
                  onClick={() => void handleApplyPromo()}
                  disabled={promoBusy || promoInput.trim().length === 0}
                >
                  Apply
                </Button>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
              Free insured shipping on orders over {formatCurrency(500)}.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPage;
