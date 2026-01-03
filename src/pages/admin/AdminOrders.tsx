import { useEffect, useState } from 'react';
import { supabase, Order, OrderItem } from '../../lib/supabase';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';

type OrderWithItems = Order & { order_items: OrderItem[] };

export function AdminOrders() {
  const { isAdmin, user } = useAuth();
  const { theme } = useTheme();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [showModal, setShowModal] = useState(false);

  const setupRealtimeSubscription = () => {
    const subscription = supabase
      .channel('admin_orders_updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        () => {
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  };

  useEffect(() => {
    if (isAdmin) {
      fetchOrders();
      const cleanup = setupRealtimeSubscription();
      return cleanup;
    }
  }, [isAdmin]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      // If not admin, only fetch user's own orders
      if (!isAdmin) {
        query = query.eq('user_id', user?.id);
      }
      // If admin, fetch all orders (RLS will handle permissions)

      const { data } = await query;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, status: Order['status']) => {


    // Find the current order to store its original status
    const currentOrder = orders.find(order => order.id === orderId);
    if (!currentOrder) {
      return;
    }

    const originalStatus = currentOrder.status;

    // Optimistically update the UI first
    setOrders(prevOrders =>
      prevOrders.map(order =>
        order.id === orderId ? { ...order, status } : order
      )
    );

    // Also update the selected order in the modal if it's the same order
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status });
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .select('id, status');

      if (error) {
        console.error('Error updating order:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        alert(`Error updating order status: ${errorMessage}`);
        // Revert the optimistic update on error
        setOrders(prevOrders =>
          prevOrders.map(order =>
            order.id === orderId ? { ...order, status: originalStatus } : order
          )
        );
        // Also revert the modal update
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: originalStatus });
        }
        throw error;
      }


    } catch (error) {
      console.error('Error updating order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to update order status: ${errorMessage}`);
      // Revert the optimistic update on error
      setOrders(prevOrders =>
        prevOrders.map(order =>
          order.id === orderId ? { ...order, status: originalStatus } : order
        )
      );
      // Also revert the modal update
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: originalStatus });
      }
    }
  };

  const viewOrderDetails = async (order: Order) => {
    try {
      const { data } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .eq('id', order.id)
        .single();

      setSelectedOrder(data as OrderWithItems);
      setShowModal(true);
    } catch (error) {
      console.error('Error fetching order details:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    const isDark = theme === 'dark';
    switch (status) {
      case 'pending':
        return <Package className={`w-5 h-5 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`} />;
      case 'processing':
        return <Package className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />;
      case 'shipped':
        return <Truck className={`w-5 h-5 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />;
      case 'delivered':
        return <CheckCircle className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />;
      case 'cancelled':
        return <XCircle className={`w-5 h-5 ${isDark ? 'text-red-400' : 'text-red-600'}`} />;
      default:
        return <Package className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isAdmin) {
    return <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-white'} flex items-center justify-center`}>
      <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Access Denied</p>
    </div>;
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Orders Management</h1>
            <p className={`text-gray-600 mt-1 ${theme === 'dark' ? 'text-gray-300' : ''}`}>{orders.length} total orders</p>
          </div>

        </div>

        {loading ? (
          <div className={`text-center py-12 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow p-12 text-center`}>
            <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>No orders yet</p>
          </div>
        ) : (
          <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow overflow-hidden`}>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className={theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Order #</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Date</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Total</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Payment</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Status</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase ${theme === 'dark' ? 'text-gray-300' : 'text-gray-500'}`}>Actions</th>
                </tr>
              </thead>
              <tbody className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} divide-y divide-gray-200`}>
                {orders.map((order) => (
                  <tr key={order.id} className={theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className={`px-6 py-4 text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.order_number}</td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-900'}`}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.total)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        order.payment_status === 'completed'
                          ? (theme === 'dark' ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800')
                          : (theme === 'dark' ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800')
                      }`}>
                        {order.payment_status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])}
                        className={`text-sm border rounded px-2 py-1 focus:outline-none focus:ring-2 ${
                          theme === 'dark'
                            ? 'border-gray-600 bg-gray-700 text-white focus:ring-gray-500'
                            : 'border-gray-300 focus:ring-gray-900'
                        }`}
                        disabled={false}
                      >
                        <option value="pending">Pending</option>
                        <option value="processing">Processing</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </td>
                    <td className={`px-6 py-4 text-sm ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      <button
                        onClick={() => viewOrderDetails(order)}
                        className={`hover:underline ${theme === 'dark' ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-900'}`}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Order Details Modal */}
        {showModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto`}>
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    Order #{selectedOrder.order_number}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`text-2xl ${theme === 'dark' ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    ✕
                  </button>
                </div>

                <div className={`border-b ${theme === 'dark' ? 'border-gray-600' : 'border-gray-200'} pb-6 mb-6`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(selectedOrder.status)}
                        <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Order #{selectedOrder.order_number}
                        </h3>
                      </div>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                        Placed on {new Date(selectedOrder.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-col items-start sm:items-end gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                      </span>
                      <p className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedOrder.total)}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>Order Items</h4>
                  <div className="space-y-4">
                    {selectedOrder.order_items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className={`w-20 h-20 ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-100'} rounded overflow-hidden flex-shrink-0`}>
                          {item.product_image && (
                            <img
                              src={item.product_image}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{item.product_name}</h4>
                          <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                            {item.color && `Color: ${item.color}`}
                            {item.color && item.size && ' | '}
                            {item.size && `Size: ${item.size}`}
                          </p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>Quantity: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(item.price)}</p>
                          <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>each</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Shipping Address</h4>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      {selectedOrder.shipping_address.full_name}<br />
                      {selectedOrder.shipping_address.address_line1}<br />
                      {selectedOrder.shipping_address.address_line2 && (
                        <>{selectedOrder.shipping_address.address_line2}<br /></>
                      )}
                      {selectedOrder.shipping_address.city}, {selectedOrder.shipping_address.state} {selectedOrder.shipping_address.postal_code}<br />
                      {selectedOrder.shipping_address.phone}
                    </p>
                  </div>
                  <div>
                    <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-2`}>Payment</h4>
                    <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
                      Method: {selectedOrder.payment_method.replace('_', ' ').toUpperCase()}<br />
                      Status: <span className={selectedOrder.payment_status === 'completed' ? (theme === 'dark' ? 'text-green-400' : 'text-green-600') : (theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600')}>
                        {selectedOrder.payment_status.charAt(0).toUpperCase() + selectedOrder.payment_status.slice(1)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
