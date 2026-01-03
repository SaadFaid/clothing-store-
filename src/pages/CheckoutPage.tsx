import { useEffect, useState } from 'react';
import { supabase, CartItem, Product, Address } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { useAuth } from '../contexts/AuthContext';
import { MapPin, Package } from 'lucide-react';
import { PaymentModal } from '../components/PaymentModal';

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'East Timor', 'Ecuador',
    'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea, North', 'Korea, South',
    'Kosovo', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein',
    'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania',
    'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
    'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway',
    'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan',
    'Tajikistan', 'Tanzania', 'Thailand', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
    'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
    'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  type CheckoutPageProps = {
    onNavigate: (page: string) => void;
  };

  type CartItemWithProduct = CartItem & { product: Product };

  export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { user, profile } = useAuth();
    const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddress] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [addressForm, setAddressForm] = useState({
      full_name: '',
      address_line1: '',
      address_line2: '',
      country: '',
      city: '',
      state: '',
      postal_code: '',
      phone: '',
    });

    useEffect(() => {
      if (user) {
        fetchData();
      }
    }, [user]);

    const fetchData = async () => {
      if (!user) return;

      try {
        const [cartData, addressData] = await Promise.all([
          supabase
            .from('cart_items')
            .select('*, product:products(*)')
            .eq('user_id', user!.id),
          supabase
            .from('addresses')
            .select('*')
            .eq('user_id', user!.id)
            .order('is_default', { ascending: false }),
        ]);

        setCartItems(cartData.data || []);
        setAddresses(addressData.data || []);

        if (addressData.data && addressData.data.length > 0) {
          setSelectedAddress(addressData.data[0].id);
        } else {
          setShowAddressForm(true);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleAddAddress = async (e: React.FormEvent) => {
      e.preventDefault();

      try {
        // Delete existing addresses for the user
        await supabase
          .from('addresses')
          .delete()
          .eq('user_id', user!.id);

        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: user!.id,
            ...addressForm,
          })
          .select()
          .single();

        if (error) throw error;

        // Update profile phone with address phone
        if (addressForm.phone) {
          await supabase
            .from('profiles')
            .update({ phone: addressForm.phone })
            .eq('id', user!.id);
        }

        setAddresses([data]);
        setSelectedAddress(data.id);
        setShowAddressForm(false);
        setAddressForm({
          full_name: '',
          address_line1: '',
          address_line2: '',
          country: '',
          city: '',
          state: '',
          postal_code: '',
          phone: '',
        });
      } catch (error) {
        console.error('Error adding address:', error);
      }
    };

    const handlePlaceOrder = async () => {
      if (!user || !selectedAddress) return;

      // Update profile phone with selected address phone
      const address = addresses.find((a) => a.id === selectedAddress);
      if (address?.phone) {
        await supabase
          .from('profiles')
          .update({ phone: address.phone })
          .eq('id', user!.id);
      }

      setShowPaymentModal(true);
    };

    const onConfirmPayment = async (paymentToken: string) => {
      setProcessing(true);
      setShowPaymentModal(false);

      try {
        const address = addresses.find((a) => a.id === selectedAddress);

        // Call backend API for payment processing
        const response = await fetch('http://localhost:3001/api/payments/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentMethodId: paymentToken,
            amount: total,
            currency: 'usd',
            metadata: {
              userId: user!.id,
              subtotal,
              tax: totalTax,
              shippingFee: totalShipping,
              shippingAddress: JSON.stringify(address),
              orderItems: JSON.stringify(cartItems.map((item) => ({
                product_id: item.product_id,
                product_name: item.product.name,
                product_image: item.product.images?.[0] || null,
                quantity: item.quantity,
                size: item.size,
                color: item.color,
                price: item.product.price,
              }))),
            },
          }),
        });

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Payment failed');
        }

        // Clear cart
        await supabase
          .from('cart_items')
          .delete()
          .eq('user_id', user!.id);

        onNavigate('orders');
      } catch (error) {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      } finally {
        setProcessing(false);
      }
    };

    if (!user) {
      onNavigate('login');
      return null;
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-surface flex items-center justify-center">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      );
    }

    if (cartItems.length === 0) {
      onNavigate('cart');
      return null;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const totalShipping = cartItems.reduce((sum, item) => {
      const shippingCost = item.product.shipping_cost || 0;
      return sum + (shippingCost * item.quantity);
    }, 0);
    const totalTax = cartItems.reduce((sum, item) => {
      const taxAmount = item.product.tax || 0;
      return sum + (taxAmount * item.quantity);
    }, 0);
    const total = subtotal + totalShipping + totalTax;

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-luxury-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-body mb-8">Checkout</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <MapPin className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h2 className="text-xl font-bold text-body">Shipping Address</h2>
                </div>

                {!showAddressForm && addresses.length > 0 ? (
                  <div className="space-y-3">
                    {addresses.map((address) => (
                      <label
                        key={address.id}
                        className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                          selectedAddress === address.id
                            ? 'border-gray-900 dark:border-gray-600 bg-gray-50 dark:bg-gray-700'
                            : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddress === address.id}
                          onChange={(e) => setSelectedAddress(e.target.value)}
                          className="sr-only"
                        />
                        <div className="font-medium text-body">{address.full_name}</div>
                        <div className="text-sm text-muted mt-1">
                          {address.address_line1}
                          {address.address_line2 && `, ${address.address_line2}`}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">
                          {address.country}, {address.city}, {address.state} {address.postal_code}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300">{address.phone}</div>
                      </label>
                    ))}
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="text-sm text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-500 font-medium"
                    >
                      + Add New Address
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleAddAddress} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Full Name"
                        required
                        value={addressForm.full_name}
                        onChange={(e) => setAddressForm({ ...addressForm, full_name: e.target.value })}
                        className="px-3 py-2 form-control"
                      />
                      <input
                        type="tel"
                        placeholder="Phone"
                        required
                        value={addressForm.phone}
                        onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                        className="px-3 py-2 form-control"
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Address Line 1"
                      required
                      value={addressForm.address_line1}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line1: e.target.value })}
                      className="w-full px-3 py-2 form-control"
                    />
                    <input
                      type="text"
                      placeholder="Address Line 2 (Optional)"
                      value={addressForm.address_line2}
                      onChange={(e) => setAddressForm({ ...addressForm, address_line2: e.target.value })}
                      className="w-full px-3 py-2 form-control"
                    />
                    <select
                      required
                      value={addressForm.country}
                      onChange={(e) => setAddressForm({ ...addressForm, country: e.target.value })}
                      className="w-full px-3 py-2 form-control"
                    >
                      <option value="">Select Country</option>
                      {countries.map((country) => (
                        <option key={country} value={country}>
                          {country}
                        </option>
                      ))}
                    </select>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      <input
                        type="text"
                        placeholder="City"
                        required
                        value={addressForm.city}
                        onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="State"
                        required
                        value={addressForm.state}
                        onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        placeholder="Postal Code"
                        required
                        value={addressForm.postal_code}
                        onChange={(e) => setAddressForm({ ...addressForm, postal_code: e.target.value })}
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 btn btn-primary"
                      >
                        Save Address
                      </button>
                      {addresses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setShowAddressForm(false)}
                          className="px-4 py-2 btn btn-outline"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>



              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Package className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Order Items</h2>
                </div>

                <div className="space-y-3">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex gap-4">
                      <div className="w-16 h-16 product-image rounded overflow-hidden flex-shrink-0">
                        {item.product.images?.[0] && (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-body">{item.product.name}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {item.color} {item.size && `/ ${item.size}`} × {item.quantity}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-body">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Subtotal</span>
                    <span>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Shipping</span>
                    <span>{totalShipping === 0 ? 'FREE' : formatCurrency(totalShipping)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-300">
                    <span>Tax</span>
                    <span>{formatCurrency(totalTax)}</span>
                  </div>
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handlePlaceOrder}
                  disabled={processing || !selectedAddress}
                  className="w-full py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processing ? 'Processing...' : 'Place Order'}
                </button>

                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  By placing your order, you agree to our terms and conditions
                </p>
              </div>
            </div>
          </div>

          {showPaymentModal && (
            <PaymentModal
              total={total}
              address={addresses.find((a) => a.id === selectedAddress)}
              onClose={() => setShowPaymentModal(false)}
              onConfirm={onConfirmPayment}
              processing={processing}
            />
          )}
        </div>
      </div>
    );
  }
