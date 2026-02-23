import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import config from '@/config';

let stripePromise: Promise<Stripe | null>;

export const getStripe = (): Promise<Stripe | null> => {
  if (!stripePromise && config.stripe?.publishableKey) {
    stripePromise = loadStripe(config.stripe.publishableKey);
  }
  return stripePromise;
};

// Payment Intent creation
export const createPaymentIntent = async (amount: number): Promise<string> => {
  const response = await fetch(`${config.apiBaseUrl}/payments/create-intent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ amount }),
  });

  const data = await response.json();
  return data.clientSecret;
};

// Confirm payment
export const confirmPayment = async (
  stripe: Stripe,
  elements: StripeElements,
  clientSecret: string
) => {
  const { error, paymentIntent } = await stripe.confirmPayment({
    elements,
    confirmParams: {
      return_url: `${window.location.origin}/payment/success`,
    },
    redirect: 'if_required',
  });

  if (error) {
    throw new Error(error.message);
  }

  return paymentIntent;
};

// Payment methods
export interface PaymentMethod {
  id: string;
  type: 'card' | 'wallet';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
}

export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
  const response = await fetch(`${config.apiBaseUrl}/payments/methods`, {
    credentials: 'include',
  });
  return response.json();
};

export const addPaymentMethod = async (paymentMethodId: string): Promise<void> => {
  await fetch(`${config.apiBaseUrl}/payments/methods`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify({ paymentMethodId }),
  });
};

export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  await fetch(`${config.apiBaseUrl}/payments/methods/${paymentMethodId}`, {
    method: 'DELETE',
    credentials: 'include',
  });
};

// Refund
export const createRefund = async (
  paymentIntentId: string,
  amount?: number
): Promise<void> => {
  await fetch(`${config.apiBaseUrl}/payments/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentIntentId, amount }),
  });
};
