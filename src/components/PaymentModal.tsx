import { useState } from 'react';
import { Address } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from '@stripe/react-stripe-js';

interface PaymentModalProps {
  total: number;
  address: Address | undefined;
  onClose: () => void;
  onConfirm: (paymentToken: string) => void;
  processing: boolean;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    invalid: {
      color: '#9e2146',
    },
  },
};

export function PaymentModal({ total, address, onClose, onConfirm, processing }: PaymentModalProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardholderName, setCardholderName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [cardError, setCardError] = useState<string>('');

  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    if (!cardholderName.trim()) {
      setErrors({ cardholderName: 'Cardholder name is required' });
      return;
    }

    setErrors({});

    const cardElement = elements.getElement(CardNumberElement);
    if (!cardElement) return;

    // Create payment method with Stripe
    const { error, paymentMethod: stripePaymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: cardElement,
      billing_details: {
        name: cardholderName,
      },
    });

    if (error) {
      setCardError(error.message || 'An error occurred');
      return;
    }

    // Return the payment method ID to be used on the server
    onConfirm(stripePaymentMethod.id);
  };

  const handlePayPalSubmit = () => {
    // For PayPal, you would typically redirect to PayPal's site
    // This is a simplified implementation
    const paypalToken = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    onConfirm(paypalToken);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-600">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
              disabled={processing}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 dark:text-gray-300">Total Amount</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">{formatCurrency(total)}</span>
            </div>
            {address && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                <div className="font-medium text-gray-800 dark:text-gray-200">{address.full_name}</div>
                <div>{address.address_line1}</div>
                <div>{address.city}, {address.state} {address.postal_code}</div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <div className="flex bg-gray-200 dark:bg-gray-700 rounded-lg p-1 mb-4">
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  paymentMethod === 'card'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => setPaymentMethod('card')}
              >
                <div className="flex items-center justify-center gap-2">
                  Card
                </div>
              </button>
              <button
                className={`flex-1 py-2 px-4 rounded-md transition-all ${
                  paymentMethod === 'paypal'
                    ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                onClick={() => setPaymentMethod('paypal')}
              >
                <div className="flex items-center justify-center gap-2">
                  PayPal
                </div>
              </button>
            </div>

            {paymentMethod === 'card' && (
              <form onSubmit={handleCardSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Card Number
                  </label>
                  <div className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                    <CardNumberElement
                      options={CARD_ELEMENT_OPTIONS}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Expiry Date
                    </label>
                    <div className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                      <CardExpiryElement
                        options={CARD_ELEMENT_OPTIONS}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      CVV
                    </label>
                    <div className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus-within:ring-2 focus-within:ring-blue-500">
                      <CardCvcElement
                        options={CARD_ELEMENT_OPTIONS}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cardholder Name
                  </label>
                  <input
                    type="text"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="John Doe"
                    className={`w-full px-3 py-2 bg-white dark:bg-gray-700 border rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cardholderName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                    disabled={processing}
                  />
                  {errors.cardholderName && (
                    <p className="text-red-500 text-xs mt-1">{errors.cardholderName}</p>
                  )}
                </div>

                {cardError && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-red-700 dark:text-red-400 text-sm">{cardError}</p>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    disabled={processing}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={processing || !stripe}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {processing ? 'Processing...' : 'Pay Now'}
                  </button>
                </div>
              </form>
            )}

            {paymentMethod === 'paypal' && (
              <div className="text-center py-8">
                <div className="mb-6">
                  <p className="text-gray-700 dark:text-gray-300 mb-4">Complete your payment securely with PayPal</p>
                </div>
                <button
                  onClick={handlePayPalSubmit}
                  disabled={processing}
                  className="w-full px-6 py-3 bg-[#0070ba] text-white rounded-lg hover:bg-[#005ea6] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  {processing ? 'Processing...' : 'Pay with PayPal'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
