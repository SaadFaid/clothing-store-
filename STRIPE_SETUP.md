# Stripe Payment Integration Setup

This guide explains how to properly integrate Stripe payments into your fashion e-commerce application.

## 🚀 Quick Setup

### 1. Install Stripe Dependencies
```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 2. Get Your Stripe Keys

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create an account or log in
3. In the dashboard, go to "Developers" → "API keys"
4. Copy your **Publishable key** (starts with `pk_test_` for test mode)

### 3. Environment Variables

Create a `.env` file in your project root:

```env
# Stripe Configuration
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_actual_publishable_key_here

# Supabase (if not already set)
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Update Your Code

The following files have been updated for Stripe integration:

- `src/contexts/StripeContext.tsx` - Stripe provider setup
- `src/components/PaymentModal.tsx` - Updated to use Stripe Elements
- `src/lib/stripe.ts` - Payment processing utilities
- `src/main.tsx` - Wrapped with StripeProvider

## 🔧 How It Works

### Client-Side (Frontend)
1. **Stripe Elements**: Secure input fields that tokenize payment data
2. **Payment Method Creation**: Creates a payment method ID without storing card details
3. **Tokenization**: Card data is sent directly to Stripe, not your server

### Server-Side (Backend)
You'll need to create a backend API endpoint to:
1. Receive the payment method ID from the frontend
2. Create a PaymentIntent with Stripe
3. Confirm the payment
4. Save order details to your database

## 📝 Backend Implementation Example

Create an API endpoint (e.g., `/api/payments/create`) in your backend:

```javascript
// Example using Node.js/Express
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

app.post('/api/payments/create', async (req, res) => {
  try {
    const { paymentMethodId, amount, currency, metadata } = req.body;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount, // in cents
      currency: currency || 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata || {},
    });

    // Save order to database here
    // await saveOrder({ ...metadata, paymentIntentId: paymentIntent.id });

    res.json({
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
    });
  } catch (error) {
    console.error('Payment failed:', error);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});
```

## 🔒 Security Benefits

- **No Card Data Storage**: Card details never touch your servers
- **PCI Compliance**: Stripe handles all PCI compliance
- **Tokenization**: Sensitive data is replaced with secure tokens
- **SSL Required**: Stripe requires HTTPS in production

## 🧪 Testing

Use Stripe's test card numbers:
- **4242 4242 4242 4242** - Successful payment
- **4000 0000 0000 0002** - Declined payment
- **4000 0025 0000 3155** - Requires authentication

## 🚀 Going Live

1. Replace test keys with live keys in Stripe Dashboard
2. Update environment variables
3. Test thoroughly with small amounts
4. Enable SSL/HTTPS
5. Monitor payments in Stripe Dashboard

## 📚 Additional Resources

- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Elements](https://stripe.com/docs/stripe-js)
- [Payment Intents API](https://stripe.com/docs/api/payment_intents)
- [Testing Guide](https://stripe.com/docs/testing)

## ❓ Troubleshooting

**Payment fails with "Invalid API Key"**
- Check your publishable key in `.env`
- Ensure it's the correct environment (test/live)

**Elements don't load**
- Verify StripeProvider wraps your app
- Check console for JavaScript errors

**Payment succeeds but order isn't created**
- Ensure your backend properly handles the payment confirmation
- Check server logs for errors

---

**Need help?** Check the Stripe documentation or create an issue in your project repository.
