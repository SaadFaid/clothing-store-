import { useEffect, useState } from 'react';
import { supabase, CartItem, Product } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { useAuth } from '../contexts/AuthContext';
import { Trash2, Plus, Minus } from 'lucide-react';

type CartPageProps = {
  onNavigate: (page: string) => void;
  onCartUpdate: () => void;
};

type CartItemWithProduct = CartItem & { product: Product };

export function CartPage({ onNavigate, onCartUpdate }: CartPageProps) {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchCart();
    else setLoading(false);
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data } = await supabase
        .from('cart_items')
        .select(`*, product:products(*)`)
        .eq('user_id', user.id);

      setCartItems(data || []);
      onCartUpdate();
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', itemId);

      if (!error) await fetchCart();
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      const { error } = await supabase.from('cart_items').delete().eq('id', itemId);
      if (!error) await fetchCart();
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const totalShipping = cartItems.reduce(
    (sum, item) => sum + (item.product.shipping_cost || 0) * item.quantity,
    0
  );
  const totalTax = cartItems.reduce((sum, item) => sum + (item.product.tax || 0) * item.quantity, 0);
  const total = subtotal + totalShipping + totalTax;

  if (!user)
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="max-w-md w-full text-center">
          <div className="text-gray-400 dark:text-gray-500 text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sign in to view cart</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Create an account or sign in to save and manage your shopping cart.
          </p>
          <div className="space-y-4">
            <button
              onClick={() => onNavigate('register')}
              className="w-full bg-rose-600 text-white py-3 px-4 rounded-md hover:bg-rose-700 transition-colors"
            >
              Create Account
            </button>
            <button
              onClick={() => onNavigate('login')}
              className="w-full bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white py-3 px-4 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading cart...</div>
      </div>
    );

  if (cartItems.length === 0)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your cart is empty</h2>
          <button
            onClick={() => onNavigate('products')}
            className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              {cartItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-6 border-b border-gray-200 dark:border-gray-600 last:border-0"
                >
                  <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.product.name}</h3>
                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                      {item.color && <span>Color: {item.color}</span>}
                      {item.color && item.size && <span> | </span>}
                      {item.size && <span>Size: {item.size}</span>}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-l-lg text-gray-700 dark:text-gray-300"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="px-2 font-medium text-gray-900 dark:text-white">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-r-lg text-gray-700 dark:text-gray-300"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {formatCurrency(item.product.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Order summary */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-24">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4">
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
                  <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                    <span>Total</span>
                    <span>{formatCurrency(total)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onNavigate('checkout')}
                className="w-full py-3 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Proceed to Checkout
              </button>

              <button
                onClick={() => onNavigate('products')}
                className="w-full py-3 mt-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Continue Shopping
              </button>

              {totalShipping === 0 && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                  Add {formatCurrency(50 - subtotal)} more for free shipping!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
