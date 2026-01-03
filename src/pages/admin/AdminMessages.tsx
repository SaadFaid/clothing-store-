import { useEffect, useRef, useState } from "react";
import {
  supabase,
  Message as MessageType,
  Conversation as ConversationType,
} from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DetailsModal } from "../../components/DetailsModal";
import Swal from 'sweetalert2';

type Thread = {
  conversation: ConversationType;
  messages: MessageType[];
  unreadCount: number;
};

export function AdminMessages() {
  const { isAdmin, isOwner, profile } = useAuth();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedMessage] = useState<MessageType | null>(null);
  const [profileViewOpen, setProfileViewOpen] = useState(false);
  const [viewProfileData, setViewProfileData] = useState<any>(null);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Fetch a user's profile (and primary address) for quick admin view
  const viewUserProfile = async (userId?: string | null) => {
    if (!userId) return Swal.fire({ icon: 'info', title: 'No user', text: 'No user ID available for this conversation.' });

    try {
      const { data: profileRow, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profErr) throw profErr;

      // Try to fetch a saved address for the user to show a location
      const { data: addresses } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      const profileWithAddress = { ...profileRow, address: addresses?.[0] || null };
      setViewProfileData(profileWithAddress);
      setProfileViewOpen(true);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      Swal.fire({ icon: 'error', title: 'Failed to fetch profile', text: (err?.message || 'An error occurred while fetching the user profile.') });
    }
  };

  // -------------------------------
  // FETCH THREADS
  // -------------------------------
  const fetchThreads = async () => {
    setLoading(true);
    try {
      const { data: convs } = await supabase
        .from("conversations")
        .select("id, user_id, subject, created_at, messages(*)")
        .order("created_at", { ascending: false });

      const result: Thread[] = (convs || []).map((c: any) => {
        const msgs: MessageType[] = (c.messages || []).sort((a: any, b: any) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );

        const unread = msgs.filter(
          (m: any) => !m.is_read && m.sender_role === "user"
        ).length;

        return {
          conversation: {
            id: c.id,
            user_id: c.user_id,
            subject: c.subject,
            created_at: c.created_at,
          },
          messages: msgs,
          unreadCount: unread,
        };
      });

      setThreads(result);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
    } catch (err) {
      console.error("Error fetching admin threads:", err);
    }
    setLoading(false);
  };

  // -----------------------------------
  useEffect(() => {
    if (isAdmin || isOwner) fetchThreads();
  }, [isAdmin, isOwner]);

  useEffect(() => {
    if (!isAdmin && !isOwner) return;

    const channel = supabase
      .channel("admin_messages_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages" },
        () => fetchThreads()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => fetchThreads()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin, isOwner]);

  // -------------------------------
  const openConversation = async (conversationId: string) => {
    setActiveConversation(conversationId);

    try {
      await supabase
        .from("messages")
        .update({ is_read: true })
        .eq("conversation_id", conversationId)
        .eq("is_read", false)
        .eq("sender_role", "user");

      fetchThreads();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      console.error("Error marking messages read:", err);
    }
  };

  const sendReply = async () => {
    if (!activeConversation || !profile) return;

    try {
      await supabase.from("messages").insert({
        conversation_id: activeConversation,
        sender_name: profile.full_name || profile.email,
        sender_role: isOwner ? "owner" : "admin",
        body: replyText,
        is_read: false,
      });

      setReplyText("");
      fetchThreads();
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 300);
    } catch (err) {
      console.error("Error sending reply:", err);
    }
  };

  const archiveConversation = async (conversationId: string) => {
    try {
      const { data: conv } = await supabase
        .from("conversations")
        .select("*")
        .eq("id", conversationId)
        .maybeSingle();

      const { data: msgs } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId);

      if (!conv) return;

      await supabase.from("archive").insert({
        type: "conversation",
        original_id: conversationId,
        before_data: { conversation: conv, messages: msgs },
        deleted_by: profile?.id || null,
      });

      await supabase.from("conversations").delete().eq("id", conversationId);
      setActiveConversation(null);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to archive conversation',
        text: 'An error occurred while archiving the conversation.',
      });
    }
  };

  // -------------------------------
  if (!isAdmin && !isOwner)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-red-500 dark:text-red-400 text-xl">Unauthorized</p>
      </div>
    );

  if (loading)
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">Loading messages...</p>
      </div>
    );

  const currentThread = threads.find((t) => t.conversation.id === activeConversation);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-6 py-10 grid lg:grid-cols-3 gap-6">

        {/* SIDEBAR */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 font-bold text-lg border-b border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white">
            Inbox
          </div>
          <div className="max-h-[650px] overflow-y-auto">
            {threads.map((t) => (
              <button
                key={t.conversation.id}
                onClick={() => openConversation(t.conversation.id)}
                className={`w-full p-4 text-left border-b border-gray-200 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white ${
                  activeConversation === t.conversation.id ? "bg-blue-50 dark:bg-blue-900" : ""
                }`}
              >
                <div className="font-semibold">{t.conversation.subject}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {t.messages[t.messages.length - 1]?.body?.slice(0, 45)}...
                </div>
                {t.unreadCount > 0 && (
                  <div className="mt-1 text-xs text-blue-600 dark:text-blue-400 font-semibold">
                    🔹 {t.unreadCount} unread
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* MAIN CHAT */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow relative">

          {!currentThread ? (
            <div className="text-center p-20 opacity-40">
              <MessageSquare size={60} className="mx-auto mb-4 text-gray-400 dark:text-gray-500"/>
              <p className="text-gray-600 dark:text-gray-300">Select a conversation to view messages</p>
            </div>
          ) : (
            <>
              <div className="p-5 border-b flex justify-between border-gray-200 dark:border-gray-600">
                <h2 className="font-bold text-xl text-gray-900 dark:text-white">{currentThread.conversation.subject}</h2>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => viewUserProfile(currentThread.conversation.user_id)}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => archiveConversation(currentThread.conversation.id)}
                    className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {/* CHAT SCROLL AREA */}
              <div className="h-[550px] overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900">
                <AnimatePresence>
                  {currentThread.messages.map((m) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className={`mb-4 p-4 rounded-lg max-w-[80%] break-words ${
                        m.sender_role === "user"
                          ? "bg-blue-50 dark:bg-blue-900 text-gray-900 dark:text-white"
                          : "bg-gray-100 dark:bg-gray-700 ml-auto text-gray-900 dark:text-white"
                      }`}
                    >
                      <div className="text-sm font-semibold">{m.sender_name}</div>
                      <div className="whitespace-pre-wrap mt-1">{m.body}</div>
                      <div className="text-[10px] text-gray-500 dark:text-gray-300 mt-2 text-right">
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={bottomRef} />
              </div>

              {/* FIXED SEND BAR */}
              <div className="border-t p-3 flex gap-2 sticky bottom-0 bg-white dark:bg-gray-800">
                <input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 border rounded-lg p-2 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                />
                <button
                  onClick={sendReply}
                  className="bg-blue-600 text-white px-4 rounded-lg hover:bg-blue-700"
                >
                  Send
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <DetailsModal
        isOpen={detailsOpen}
        title={selectedMessage ? `Message from ${selectedMessage.sender_name}` : "Message Details"}
        data={selectedMessage || {}}
        itemType="message"
        onClose={() => setDetailsOpen(false)}
      />

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
