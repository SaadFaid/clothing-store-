import { useEffect, useState } from 'react';
import { supabase, Profile } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Swal from 'sweetalert2';
import { DetailsModal } from '../../components/DetailsModal';

export function AdminUsers() {
  const { isAdmin, isOwner } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [viewProfileData, setViewProfileData] = useState<Profile | null>(null);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, role: 'admin' | 'user' | 'owner') => {
    try {
      if (!isOwner) return;

      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const viewUserProfile = async (userId: string) => {
    try {
      const { data: profileRow, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profErr) throw profErr;

      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      setViewProfileData({ ...(profileRow || {}), address: addresses?.[0] || null } as any);
      setProfileViewOpen(true);
    } catch (err) {
      console.error('Error fetching profile:', err);
      Swal.fire({ icon: 'error', title: 'Failed to fetch profile', text: 'An error occurred while fetching the user profile.' });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isOwner) return; 

    const confirmDelete = await Swal.fire({
      title: 'Archive User?',
      text: 'User will be removed but saved in the archive table.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, archive',
      cancelButtonText: 'Cancel',
      background: '#111',
      color: '#fff'
    });

    if (!confirmDelete.isConfirmed) return;

    try {
      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      await supabase.from('archive').insert({
        type: 'profile',
        original_id: userId,
        before_data: profileRow,
      });

      await supabase.from('profiles').delete().eq('id', userId);

      await fetchUsers();
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Archive Error',
        text: 'Could not archive user.',
      });
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-700 dark:text-gray-300">Access Denied</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Users Management</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{users.length} total users</p>

        {loading ? (
          <div className="text-center py-10 text-gray-400">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12 text-center">
            <p className="text-gray-600 dark:text-gray-300">No users found</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-100 font-medium">{user.full_name ?? 'N/A'}</td>
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-100">{user.email}</td>
                    <td className="px-6 py-3 text-gray-900 dark:text-gray-100">{user.phone ?? '—'}</td>

                    <td className="px-6 py-3">
                      {isOwner ? (
                        <select
                          value={user.role}
                          onChange={(e) => updateUserRole(user.id, e.target.value as any)}
                          className="bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200 
                          border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>
                      ) : <span className="text-gray-700 dark:text-gray-300">{user.role}</span>}
                    </td>

                    <td className="px-6 py-3 text-gray-900 dark:text-gray-200">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>

                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end items-center gap-3">
                        <button className="text-blue-600 hover:underline" onClick={() => viewUserProfile(user.id)}>View</button>
                        {isOwner && (
                          <button className="text-red-500 hover:text-red-300" onClick={() => handleDeleteUser(user.id)}>
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      <DetailsModal
        isOpen={profileViewOpen}
        title={viewProfileData ? viewProfileData.full_name || viewProfileData.email : 'User Profile'}
        data={viewProfileData || {}}
        itemType="user"
        onClose={() => setProfileViewOpen(false)}
      />

    </div>
  );
}
