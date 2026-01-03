import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import Swal from 'sweetalert2';

export function AdminArchive() {
  const { isAdmin, isOwner } = useAuth();
  const { theme } = useTheme();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin || isOwner) fetchArchive();
  }, [isAdmin, isOwner]);

  const fetchArchive = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from('archive').select('*').order('deleted_at', { ascending: false });
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching archive:', error);
    } finally {
      setLoading(false);
    }
  };

  const restore = async (item: any) => {
    if (!confirm('Restore this archived item?')) return;
    try {
      if (item.type === 'profile') {
        await supabase.from('profiles').insert(item.before_data);
      } else if (item.type === 'conversation') {
        const conv = item.before_data.conversation;
        const msgs = item.before_data.messages || [];
          // If conversation exists, un-archive it; otherwise insert conversation and messages
          const { data: existing } = await supabase.from('conversations').select('id').eq('id', conv.id).maybeSingle();
          if (existing) {
            await supabase.from('conversations').update({ is_archived: false }).eq('id', conv.id);
          } else {
            await supabase.from('conversations').insert(conv);
            if (msgs.length) {
              const msgsToInsert = msgs.map((m: any) => ({ ...m, conversation_id: conv.id }));
              await supabase.from('messages').insert(msgsToInsert);
            }
          }
      } else if (item.type === 'product') {
        await supabase.from('products').insert(item.before_data);
      } else {
        // generic attempt
        await supabase.from(item.type).insert(item.before_data);
      }

      await supabase.from('archive').delete().eq('id', item.id);
      await fetchArchive();
    } catch (error) {
      console.error('Error restoring item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to restore',
        text: (error as any)?.message || 'An error occurred while restoring the item.',
      });
    }
  };

  const removePermanent = async (item: any) => {
    if (!confirm('Permanently delete this archived item? This cannot be undone.')) return;
    try {
      await supabase.from('archive').delete().eq('id', item.id);
      await fetchArchive();
    } catch (error) {
      console.error('Error deleting archived item:', error);
      Swal.fire({
        icon: 'error',
        title: 'Failed to delete',
        text: (error as any)?.message || 'An error occurred while deleting the item.',
      });
    }
  };

  if (!isAdmin && !isOwner) return <div className="min-h-screen flex items-center justify-center">Access Denied</div>;

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className={`text-2xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Archive</h1>

        {loading ? (
          <div className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>Loading...</div>
        ) : items.length === 0 ? (
          <div className={`rounded-lg shadow p-8 text-center ${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}>No archived items</div>
        ) : (
          <div className="space-y-4">
            {items.map((it) => (
              <div key={it.id} className={`rounded-lg shadow p-4 flex justify-between items-start ${theme === 'dark' ? 'bg-gray-800' : 'bg-white'}`}>
                <div className="flex-1 min-w-0">
                  <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{it.type} — {it.original_id}</div>
                  <div className="overflow-x-auto">
                    <pre className={`text-xs max-h-48 overflow-auto mt-2 p-2 rounded whitespace-pre ${theme === 'dark' ? 'text-gray-300 bg-gray-700' : 'text-gray-700 bg-gray-50'}`}>{JSON.stringify(it.before_data, null, 2)}</pre>
                  </div>
                </div>
                <div className="flex flex-col gap-2 ml-4 flex-shrink-0">
                  <button onClick={() => restore(it)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Restore</button>
                  <button onClick={() => removePermanent(it)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Delete Permanently</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
