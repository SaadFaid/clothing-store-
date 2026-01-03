const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Payment endpoint
app.post('/api/payments/create', async (req, res) => {
  try {
    const { paymentMethodId, amount, currency = 'usd', metadata } = req.body;

    // Create PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      payment_method: paymentMethodId,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: metadata || {},
    });

    // Save order to database
    if (metadata && metadata.userId) {
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: metadata.userId,
          order_number: `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          status: 'completed',
          subtotal: metadata.subtotal || 0,
          tax: metadata.tax || 0,
          shipping_fee: metadata.shippingFee || 0,
          total: amount,
          shipping_address: metadata.shippingAddress,
          payment_method: 'credit_card',
          payment_status: 'completed',
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Insert order items
      if (metadata.orderItems) {
        const orderItems = JSON.parse(metadata.orderItems).map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_name: item.product_name,
          product_image: item.product_image,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          price: item.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;
      }

      // Insert payment record
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          order_id: order.id,
          user_id: metadata.userId,
          amount: amount,
          payment_method: 'credit_card',
          status: 'completed',
          transaction_id: paymentIntent.id,
        });

      if (paymentError) throw paymentError;

      // Insert payment metadata
      const { error: metadataError } = await supabase
        .from('payment_metadata')
        .insert({
          payment_token: paymentIntent.id,
          amount: amount,
          status: 'completed',
          created_at: new Date().toISOString(),
        });

      if (metadataError) throw metadataError;
    }

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

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
