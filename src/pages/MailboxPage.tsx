import { useEffect, useState, useRef } from 'react';
import { supabase, Message as MessageType, Conversation as ConversationType } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Send, MessageSquare } from 'lucide-react';

type Thread = {
  conversation: ConversationType;
  messages: MessageType[];
  unreadCount: number;
};

export function MailboxPage() {
  const { user, profile } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          subject,
          created_at,
          messages (
            id,
            sender_name,
            sender_role,
            body,
            is_read,
            created_at
          )
        `)
        .eq('user_id', profile?.id)
        .order('created_at', { ascending: false });

      const result: Thread[] = (convs || []).map((c: any) => {
        const msgs: MessageType[] = (c.messages || []).sort(
          (a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        // Count unread messages FROM admin or owner
        const unreadCount = msgs.filter(
          (m: any) => !m.is_read && (m.sender_role === 'admin' || m.sender_role === 'owner')
        ).length;

        return {
          conversation: { id: c.id, user_id: c.user_id, subject: c.subject, created_at: c.created_at },
          messages: msgs,
          unreadCount
        };
      });

      setThreads(result);
    } catch (error) {
      console.error('Error fetching mailbox threads:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) fetchThreads();
  }, [profile?.id]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('mailbox_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        fetchThreads().catch(console.error);
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => {
        fetchThreads().catch(console.error);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  const openConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);
    try {
      // Mark admin/owner messages as read
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('conversation_id', conversationId)
        .eq('is_read', false)
        .in('sender_role', ['admin', 'owner']);

      fetchThreads();
    } catch (error) {
      console.error('Error marking messages read:', error);
    }
  };

  const handleSendReply = async (conversationId: string) => {
    if (!replyText.trim() || !profile) return;
    setSendingReply(true);
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_name: profile.full_name || profile.email,
        sender_role: 'user',
        body: replyText,
        is_read: false
      });

      if (error) throw error;

      setReplyText('');
      fetchThreads();

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send reply: ' + (error as any)?.message);
    } finally {
      setSendingReply(false);
    }
  };



  if (!user) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-muted">Please sign in to view your mailbox</p>
    </div>
  );

  if (loading) return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <p className="text-muted">Loading mailbox...</p>
    </div>
  );

  const currentThread = threads.find((t) => t.conversation.id === activeConversation);

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-body mb-8">My Mailbox</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Inbox / Conversations */}
          <div className="lg:col-span-1 card bg-elevated overflow-hidden">
            <div className="p-4 border-b border-subtle">
              <h2 className="text-lg font-bold text-body">Inbox</h2>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-600 max-h-[calc(100vh-200px)] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-4 text-center text-muted">No messages yet</div>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.conversation.id}
                    onClick={() => openConversation(t.conversation.id)}
                    className={`w-full p-4 text-left hover:bg-elevated transition-colors flex justify-between items-center ${activeConversation === t.conversation.id ? 'bg-blue-50 dark:bg-blue-900' : ''}`}
                  >
                    <div className="flex flex-col min-w-0">
                      <p className="text-sm font-medium text-body truncate">{t.conversation.subject || 'No subject'}</p>
                      <p className="text-xs text-muted truncate">{new Date(t.conversation.created_at).toLocaleDateString()}</p>
                    </div>
                    {t.unreadCount > 0 && (
                      <div className="ml-2 inline-flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                        {t.unreadCount}
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Conversation view */}
          <div className="lg:col-span-2 flex flex-col h-[80vh] relative card bg-elevated overflow-hidden">
            {!currentThread ? (
              <div className="p-12 text-center flex-1 flex flex-col justify-center items-center">
                <MessageSquare className="w-16 h-16 text-muted mb-4" />
                <p className="text-muted">Select a conversation to view messages</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-6 py-4 border-b border-subtle flex justify-between items-center">
                  <div className="text-lg font-semibold text-body">{currentThread.conversation.subject}</div>
                  <div className="text-sm text-muted">Conversation ID: {currentThread.conversation.id}</div>
                </div>

                {/* Messages container */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col-reverse gap-2">
                  {currentThread.messages
                    .slice()
                    .reverse()
                    .map((m) => {
                      const isUser = m.sender_role === 'user';
                      return (
                        <div
                          key={m.id}
                          className={`px-4 py-2 rounded-lg break-words max-w-[80%] ${isUser ? 'bg-blue-50 dark:bg-blue-900 self-end' : 'bg-gray-100 dark:bg-gray-700 self-start'}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`font-medium ${isUser ? 'text-body dark:text-white' : 'text-body'}`}>{isUser ? profile?.full_name || profile?.email : 'Admin'}</p>
                            <p className={`text-xs ${isUser ? 'text-muted dark:text-gray-300' : 'text-muted'}`}>{new Date(m.created_at).toLocaleTimeString()}</p>
                          </div>
                          <p className={`whitespace-pre-wrap ${isUser ? 'text-body dark:text-white' : 'text-muted'}`}>{m.body}</p>
                        </div>
                      );
                    })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Fixed reply box */}
                <div className="px-6 py-4 border-t border-subtle bg-elevated flex gap-2 sticky bottom-0">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply..."
                    rows={2}
                    className="form-control resize-none"
                  />
                  <button
                    onClick={() => handleSendReply(currentThread.conversation.id)}
                    disabled={!replyText.trim() || sendingReply}
                    className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    {sendingReply ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
