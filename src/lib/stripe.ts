// Server-side Stripe integration example
// This would typically be in your backend/server

import { loadStripe } from '@stripe/stripe-js';

// Client-side: Initialize Stripe (already done in StripeContext)
// const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY!);

// Server-side functions (these would be in your backend API)

/**
 * Example backend function to process payment
 * This should be called from your server, not from the client
 */
export async function processStripePayment(
  paymentMethodId: string,
  amount: number, // in cents
  currency: string = 'usd',
  metadata?: Record<string, any>
) {
  // This is server-side code - it should NOT be in your React app
  // Move this to your backend API

  /*
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

  try {
    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // amount in cents
      currency: currency,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata || {},
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    };
  } catch (error) {
    console.error('Payment failed:', error);
    return {
      success: false,
      error: error.message,
    };
  }
  */

  // For now, return a mock response
  return {
    success: true,
    paymentIntentId: `pi_mock_${Date.now()}`,
    status: 'succeeded',
  };
}

/**
 * Example of how to call the payment processing from your checkout page
 */
export async function handlePayment(
  paymentMethodId: string,
  orderData: {
    total: number;
    userId: string;
    items: any[];
    shippingAddress: any;
  }
) {
  try {
    // Convert total to cents (assuming total is in dollars)
    const amountInCents = Math.round(orderData.total * 100);

    // Call your backend API
    const response = await fetch('/api/payments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentMethodId,
        amount: amountInCents,
        currency: 'usd',
        metadata: {
          userId: orderData.userId,
          orderItems: JSON.stringify(orderData.items),
          shippingAddress: JSON.stringify(orderData.shippingAddress),
        },
      }),
    });

    const result = await response.json();

    if (result.success) {
      // Payment successful - create order in database
      await createOrder({
        ...orderData,
        paymentIntentId: result.paymentIntentId,
        paymentStatus: 'completed',
      });

      return { success: true };
    } else {
      throw new Error(result.error || 'Payment failed');
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Payment failed' };
  }
}

// Mock function for creating order (replace with your actual implementation)
async function createOrder(orderData: any) {
  // This would save the order to your database

  return { success: true };
}

// Environment variables needed:
// REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
// STRIPE_SECRET_KEY=sk_test_your_secret_key_here (server-side only)
