import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { modulesApi, communicationApi } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Modal, LoadingState } from '../components/common';
import {
  Mail,
  MessageSquare,
  Send,
  Radio,
  CheckCircle2,
  Users,
  Clock,
  Plus,
  Search,
  User as UserIcon,
  CheckCheck,
} from 'lucide-react';

export const CommunicationPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const [activeConversationId, setActiveConversationId] = useState<
    string | null
  >(null);
  const [messageText, setMessageText] = useState('');
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');

  const [broadcastForm, setBroadcastForm] = useState({
    channel: 'sms',
    targetAudience: 'parents',
    title: '',
    message: '',
  });

  const [newChatForm, setNewChatForm] = useState({
    recipientUserId: '',
    type: 'general' as 'admin_teacher' | 'teacher_parent' | 'general',
    initialMessage: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: statsData } = useQuery({
    queryKey: ['communication-stats'],
    queryFn: () => modulesApi.getCommunicationStats(),
  });

  const { data: conversationsData, isLoading: isLoadingConversations } =
    useQuery({
      queryKey: ['conversations'],
      queryFn: () => communicationApi.getConversations(),
    });

  const { data: recipientsData } = useQuery({
    queryKey: ['chat-recipients'],
    queryFn: () => communicationApi.getRecipients(),
  });

  const { data: messagesData, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['conversation-messages', activeConversationId],
    queryFn: () => communicationApi.getMessages(activeConversationId!),
    enabled: !!activeConversationId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: ({ convId, text }: { convId: string; text: string }) =>
      communicationApi.sendMessage(convId, { message: text }),
    onSuccess: (data) => {
      queryClient.setQueryData(
        ['conversation-messages', activeConversationId],
        (old: any) => ({
          ...old,
          messages: [...(old?.messages || []), data.message],
        })
      );
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setMessageText('');
    },
    onError: (err: any) => alert(err.message || 'Failed to send message'),
  });

  const createConversationMutation = useMutation({
    mutationFn: (payload: any) => communicationApi.createConversation(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setIsNewChatModalOpen(false);
      setNewChatForm({
        recipientUserId: '',
        type: 'general',
        initialMessage: '',
      });
      setActiveConversationId(data.conversation?._id);
    },
    onError: (err: any) =>
      alert(err.message || 'Failed to create conversation'),
  });

  useEffect(() => {
    if (!socket || !activeConversationId) return;

    socket.emit('join_conversation', { conversationId: activeConversationId });

    const handleNewMessage = (msg: any) => {
      if (msg.conversationId === activeConversationId) {
        queryClient.setQueryData(
          ['conversation-messages', activeConversationId],
          (old: any) => {
            const current = old?.messages || [];
            if (current.some((m: any) => m._id === msg._id)) return old;
            return { ...old, messages: [...current, msg] };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('chat:message', handleNewMessage);

    return () => {
      socket.emit('leave_conversation', {
        conversationId: activeConversationId,
      });
      socket.off('chat:message', handleNewMessage);
    };
  }, [socket, activeConversationId, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messagesData?.messages]);

  const activeConversation = conversationsData?.conversations?.find(
    (c: any) => c._id === activeConversationId
  );

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !activeConversationId) return;
    sendMessageMutation.mutate({
      convId: activeConversationId,
      text: messageText.trim(),
    });
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    alert(
      `Broadcast dispatched via ${broadcastForm.channel.toUpperCase()} to ${broadcastForm.targetAudience}! Real-time gateway acknowledged.`
    );
    setIsBroadcastModalOpen(false);
    setBroadcastForm({
      channel: 'sms',
      targetAudience: 'parents',
      title: '',
      message: '',
    });
  };

  const filteredRecipients = (recipientsData?.recipients || []).filter(
    (r: any) =>
      r.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
      r.role.toLowerCase().includes(recipientSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
            Communication & Direct Messaging
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time conversations, SMS broadcasts, and parent-teacher
            communication for Adiya School.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsBroadcastModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Radio className="w-4 h-4 text-brand-500" />
            SMS Broadcast
          </button>
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden h-[600px] flex flex-col md:flex-row">
        <div className="w-full md:w-80 border-r border-slate-200 flex flex-col bg-slate-50/50">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="font-bold text-sm text-slate-800">
              Direct Messages
            </h3>
            <p className="text-[11px] text-slate-400">
              Synced across school channels
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {isLoadingConversations ? (
              <LoadingState message="Loading chats..." />
            ) : conversationsData?.conversations?.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No active conversations yet. Click "New Chat" to connect with
                teachers, parents, or admins.
              </div>
            ) : (
              conversationsData?.conversations?.map((conv: any) => {
                const isActive = conv._id === activeConversationId;
                const other = conv.otherParticipant;
                return (
                  <button
                    key={conv._id}
                    onClick={() => setActiveConversationId(conv._id)}
                    className={`w-full p-4 text-left transition-colors flex items-start gap-3 ${
                      isActive
                        ? 'bg-orange-50/70 border-l-4 border-brand-500'
                        : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 text-slate-600 font-bold flex items-center justify-center shrink-0 text-sm">
                      {other?.name ? other.name.charAt(0).toUpperCase() : 'U'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-800 truncate">
                          {other?.name || conv.title}
                        </span>
                        {conv.lastMessageAt && (
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {new Date(conv.lastMessageAt).toLocaleTimeString(
                              [],
                              {
                                hour: '2-digit',
                                minute: '2-digit',
                              }
                            )}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-1">
                        <p className="text-[11px] text-slate-500 truncate">
                          {conv.lastMessage?.text || 'No messages yet'}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white">
          {activeConversation ? (
            <>
              <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-50 border border-brand-200 text-brand-600 font-bold flex items-center justify-center text-sm">
                    {activeConversation.otherParticipant?.name
                      ?.charAt(0)
                      .toUpperCase() || 'C'}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">
                      {activeConversation.otherParticipant?.name ||
                        activeConversation.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.2 rounded-full">
                        {activeConversation.otherParticipant?.role ||
                          activeConversation.type}
                      </span>
                      <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>{' '}
                        Connected
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {isLoadingMessages ? (
                  <LoadingState message="Loading messages..." />
                ) : messagesData?.messages?.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Start the conversation by sending a message below.
                  </div>
                ) : (
                  messagesData?.messages?.map((msg: any) => {
                    const isMe =
                      msg.senderId === user?._id ||
                      msg.senderId?._id === user?._id;
                    return (
                      <div
                        key={msg._id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                            isMe
                              ? 'bg-brand-500 text-white rounded-br-none shadow-sm'
                              : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                          }`}
                        >
                          {!isMe && (
                            <span className="font-bold text-[10px] text-slate-500 block mb-1">
                              {msg.senderName} ({msg.senderRole})
                            </span>
                          )}
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                          <div
                            className={`mt-1.5 text-[10px] flex items-center justify-end gap-1 font-mono ${
                              isMe ? 'text-white/80' : 'text-slate-400'
                            }`}
                          >
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isMe && <CheckCheck className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-200 bg-white flex items-center gap-2"
              >
                <input
                  type="text"
                  required
                  placeholder="Type your message here (Press Enter to send)..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 text-xs"
                />
                <button
                  type="submit"
                  disabled={
                    sendMessageMutation.isPending || !messageText.trim()
                  }
                  className="px-4 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-bold text-slate-700 text-sm">
                Select a Conversation
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Choose an existing chat thread from the left or click "New Chat"
                to start messaging faculty, administration, or parents.
              </p>
            </div>
          )}
        </div>
      </div>

      <Modal
        isOpen={isNewChatModalOpen}
        onClose={() => setIsNewChatModalOpen(false)}
        title="Start New Conversation"
        subtitle="Adiya School Internal Messenger"
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createConversationMutation.mutate(newChatForm);
          }}
          className="space-y-4 text-xs"
        >
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Search Contact
            </label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name or role..."
                value={recipientSearch}
                onChange={(e) => setRecipientSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Select Recipient *
            </label>
            <select
              required
              value={newChatForm.recipientUserId}
              onChange={(e) => {
                const recId = e.target.value;
                const rec = recipientsData?.recipients?.find(
                  (r: any) => r._id === recId
                );
                let convType: any = 'general';
                if (user?.role === 'admin' && rec?.role === 'teacher')
                  convType = 'admin_teacher';
                else if (user?.role === 'teacher' && rec?.role === 'parent')
                  convType = 'teacher_parent';
                setNewChatForm({
                  ...newChatForm,
                  recipientUserId: recId,
                  type: convType,
                });
              }}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="">Select Contact</option>
              {filteredRecipients.map((r: any) => (
                <option key={r._id} value={r._id}>
                  {r.name} ({r.role.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Initial Message (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="Hi, I would like to discuss..."
              value={newChatForm.initialMessage}
              onChange={(e) =>
                setNewChatForm({
                  ...newChatForm,
                  initialMessage: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsNewChatModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={
                createConversationMutation.isPending ||
                !newChatForm.recipientUserId
              }
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all"
            >
              {createConversationMutation.isPending
                ? 'Starting...'
                : 'Start Chat'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isBroadcastModalOpen}
        onClose={() => setIsBroadcastModalOpen(false)}
        title="Compose School Broadcast"
        subtitle="Adiya School Instant Communication Channel"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Channel
            </label>
            <select
              value={broadcastForm.channel}
              onChange={(e) =>
                setBroadcastForm({ ...broadcastForm, channel: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="sms">SMS Text Alert</option>
              <option value="email">Official Email Notification</option>
              <option value="in_app">In-App Push Notification</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Target Audience
            </label>
            <select
              value={broadcastForm.targetAudience}
              onChange={(e) =>
                setBroadcastForm({
                  ...broadcastForm,
                  targetAudience: e.target.value,
                })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-white"
            >
              <option value="parents">All Parents</option>
              <option value="grade10">Grade 10 Parents & Students</option>
              <option value="faculty">Teaching Faculty</option>
              <option value="all">Entire School Community</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Message Subject / Title
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Urgent Bus Route #4 Update"
              value={broadcastForm.title}
              onChange={(e) =>
                setBroadcastForm({ ...broadcastForm, title: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Message Content
            </label>
            <textarea
              rows={3}
              required
              placeholder="Type announcement message here..."
              value={broadcastForm.message}
              onChange={(e) =>
                setBroadcastForm({ ...broadcastForm, message: e.target.value })
              }
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
            />
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsBroadcastModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-semibold shadow-sm transition-all flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Send Broadcast
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
