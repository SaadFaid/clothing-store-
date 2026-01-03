import { Package, ShoppingBag, Users, Mail, Archive } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatCurrency } from '../../lib/currency';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

type AdminDashboardProps = {
  onNavigate: (page: string) => void;
};

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Access Denied</h2>
          <p className="text-gray-600 dark:text-gray-400">You do not have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const quickActions = [
    { title: 'Products', icon: Package, color: 'bg-blue-500', page: 'admin-products' },
    { title: 'Orders', icon: ShoppingBag, color: 'bg-green-500', page: 'admin-orders' },
    { title: 'Users', icon: Users, color: 'bg-purple-500', page: 'admin-users' },
    { title: 'Messages', icon: Mail, color: 'bg-red-500', page: 'admin-messages' },
    { title: 'Archive', icon: Archive, color: 'bg-gray-600', page: 'admin-archive' },
  ];

  const [statsLoading, setStatsLoading] = useState(true);
  const [stats, setStats] = useState({ products: 0, activeOrders: 0, users: 0, revenue: 0 });
  const [recentItems, setRecentItems] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      setStatsLoading(true);
      try {
        const { count: productsCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
        const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
        const { count: activeOrdersCount } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing', 'shipped']);

        const { data: payments } = await supabase.from('payments').select('amount').eq('status', 'completed');
        const revenue = (payments || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);

        setStats({ products: productsCount || 0, activeOrders: activeOrdersCount || 0, users: usersCount || 0, revenue });

        const [ordersRes, messagesRes, usersRes] = await Promise.all([
          supabase.from('orders').select('id,order_number,user_id,total,created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('messages').select('id,body,sender_name,created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('profiles').select('id,full_name,created_at').order('created_at', { ascending: false }).limit(5),
        ]);

        const items: any[] = [];
        (ordersRes.data || []).forEach((o: any) => items.push({ id: o.id, type: 'order', title: `Order ${o.order_number}`, subtitle: `${formatCurrency(o.total)} placed`, created_at: o.created_at }));
        (messagesRes.data || []).forEach((m: any) => items.push({ id: m.id, type: 'message', title: `Message from ${m.sender_name || 'User'}`, subtitle: m.body ? m.body.slice(0, 80) : '', created_at: m.created_at }));
        (usersRes.data || []).forEach((u: any) => items.push({ id: u.id, type: 'user', title: u.full_name || u.id, subtitle: 'New user', created_at: u.created_at }));

        items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRecentItems(items.slice(0, 6));

      } catch (err) {
        console.error('Error fetching admin stats', err);
      } finally {
        setStatsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your e-commerce platform</p>
        </div>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {quickActions.map((action) => (
            <button
              key={action.title}
              onClick={() => onNavigate(action.page)}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow p-6 text-left"
            >
              <div className={`${action.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <action.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{action.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Manage {action.title.toLowerCase()}
              </p>
            </button>
          ))}
        </div>

        {/* Stats + Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Quick Stats */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-body mb-4">Quick Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Total Products</span>
                <span className="text-xl font-bold text-body">{statsLoading ? '…' : stats.products}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Active Orders</span>
                <span className="text-xl font-bold text-body">{statsLoading ? '…' : stats.activeOrders}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Total Users</span>
                <span className="text-xl font-bold text-body">{statsLoading ? '…' : stats.users}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted">Revenue</span>
                <span className="text-xl font-bold text-body">{statsLoading ? '…' : formatCurrency(stats.revenue)}</span>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card p-6">
            <h2 className="text-xl font-bold text-body mb-4">Recent Activity</h2>

            {statsLoading ? (
              <div className="text-center py-8 text-muted">Loading recent activity…</div>
            ) : recentItems.length === 0 ? (
              <div className="text-center py-8 text-muted">No recent activity yet. View detailed statistics inside each section.</div>
            ) : (
              <div className="space-y-3">
                {recentItems.map((it) => (
                  <div key={it.id} className="flex items-start gap-3">
                    <div className="w-10 h-10 flex items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-muted">
                      {it.type === 'order' ? <ShoppingBag className="w-5 h-5" /> : it.type === 'message' ? <Mail className="w-5 h-5" /> : <Users className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="text-body font-medium">{it.title}</div>
                      {it.subtitle && <div className="text-sm text-muted">{it.subtitle}</div>}
                    </div>
                    <div className="text-sm text-muted">{new Date(it.created_at).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}

          </div>

        </div>
      </div>
    </div>
  );
}
