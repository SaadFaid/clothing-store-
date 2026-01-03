import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Address, Payment } from '../lib/supabase';
import { formatCurrency } from '../lib/currency';
import { User, MapPin, CreditCard } from 'lucide-react';

export function ProfilePage() {
  const { user, profile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setPhone(profile.phone || '');
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchAddresses();
      fetchPayments();
    }
  }, [user]);

  const fetchAddresses = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id);
      setAddresses(data || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };

  const fetchPayments = async () => {
    if (!user) return;
    try {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      setPayments(data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone,
        })
        .eq('id', user!.id);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      setEditing(false);
      setTimeout(() => setMessage(''), 3000);
    } catch {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black transition-colors">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {message && (
          <div className={`mb-6 p-4 rounded-lg transition-colors
            ${message.includes('success')
              ? 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200'
              : 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">

          {/* ================= PERSONAL INFORMATION ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Personal Information</h2>
              </div>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-sm text-rose-600 hover:text-rose-700 font-medium dark:text-rose-400 dark:hover:text-rose-300"
                >
                  Edit
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2 form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    disabled
                    value={profile?.email || ''}
                    className="w-full px-3 py-2 form-control"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-muted mb-1">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 form-control"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-gray-800 dark:hover:bg-gray-600 disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(false)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <Item label="Full Name" value={profile?.full_name} />
                <Item label="Email" value={profile?.email} />
                <Item label="Phone" value={profile?.phone || 'Not set'} />
                <Item label="Account Type" value={profile?.role || 'User'} />
              </div>
            )}
          </div>

          {/* ================= ADDRESSES ================= */}
          <div className="card p-6 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="w-5 h-5 text-muted" />
              <h2 className="text-xl font-bold text-body">Saved Addresses</h2>
            </div>

            {addresses.length > 0 ? (
              <div className="space-y-3">
                {addresses.map(a => (
                  <div key={a.id} className="p-4 border-2 border-subtle bg-surface rounded-lg">
                    <p className="text-body font-medium">{a.full_name}</p>
                    <p className="text-sm text-muted">{a.address_line1}{a.address_line2 && `, ${a.address_line2}`}</p>
                    <p className="text-sm text-muted">{a.city}, {a.state}, {a.country} {a.postal_code}</p>
                    <p className="text-sm text-muted">{a.phone}</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600 dark:text-gray-300">No saved addresses yet.</p>}
          </div>

          {/* ================= PAYMENTS ================= */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 transition-colors">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-gray-700 dark:text-gray-300" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Payment Methods</h2>
            </div>

            {payments.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {payments.map(p => (
                  <div key={p.id} className="p-4 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 rounded-lg">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">{p.payment_method.replace('_', ' ')}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Transaction ID: {p.transaction_id}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Amount: {formatCurrency(p.amount)}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium
                        ${p.status === 'completed'
                          ? 'text-green-700 dark:text-green-300'
                          : p.status === 'pending'
                          ? 'text-yellow-700 dark:text-yellow-300'
                          : p.status === 'failed'
                          ? 'text-red-700 dark:text-red-300'
                          : p.status === 'refunded'
                          ? 'text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                        }`}>
                        {p.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : <p className="text-gray-600 dark:text-gray-300">No payment history found.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

/* UI Component for compact lines */
const Item = ({ label, value }: { label: string; value: any }) => (
  <div>
    <p className="text-sm text-gray-600 dark:text-gray-300">{label}</p>
    <p className="text-gray-900 dark:text-white font-medium">{value}</p>
  </div>
);
