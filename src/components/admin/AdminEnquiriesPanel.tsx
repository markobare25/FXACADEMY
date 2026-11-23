import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  CheckCheck,
  ImagePlus,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  Send,
  X,
} from 'lucide-react';
import { adminApiFetch, adminUploadMediaFile } from '../../lib/adminApi';
import { formatLocalDateTime } from '../../lib/api';
import type {
  ContactSubmission,
  SupportConversation,
  SupportMessage,
} from '../../types';

interface AdminEnquiriesPanelProps {
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
  onGlobalRefresh: () => Promise<void>;
  liveTick?: number;
}

interface ConversationsListResponse {
  conversations: SupportConversation[];
  summary: {
    total: number;
    open: number;
    resolved: number;
    unread_messages: number;
  };
}

interface ConversationThreadResponse {
  conversation: SupportConversation;
  messages: SupportMessage[];
}

export const AdminEnquiriesPanel: React.FC<AdminEnquiriesPanelProps> = ({
  onNotify,
  onError,
  onGlobalRefresh,
  liveTick = 0,
}) => {
  const [subTab, setSubTab] = useState<'chat' | 'contacts'>('chat');

  // Support Chat State
  const [convData, setConvData] = useState<ConversationsListResponse | null>(null);
  const [convFilter, setConvFilter] = useState<'all' | 'open' | 'resolved'>('all');
  const [convSearch, setConvSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ConversationThreadResponse | null>(null);
  const [loadingThread, setLoadingThread] = useState(false);

  const [replyText, setReplyText] = useState('');
  const [replyAttachmentUrl, setReplyAttachmentUrl] = useState<string | null>(null);
  const [replyAttachmentName, setReplyAttachmentName] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [sendingReply, setSendingReply] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const threadBottomRef = useRef<HTMLDivElement | null>(null);

  // Contact Form Enquiries State
  const [contacts, setContacts] = useState<ContactSubmission[]>([]);
  const [contactFilter, setContactFilter] = useState<'all' | 'new' | 'reviewed' | 'replied'>('all');
  const [contactSearch, setContactSearch] = useState('');
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [savingContactId, setSavingContactId] = useState<string | null>(null);

  const loadConversations = useCallback(async () => {
    try {
      const res = await adminApiFetch<ConversationsListResponse>(
        '/api/admin/support/conversations'
      );
      setConvData(res);
      setSelectedId((prev) => prev || res.conversations[0]?.id || null);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load customer chat inbox.');
    }
  }, [onError]);

  const loadContacts = useCallback(async () => {
    try {
      const res = await adminApiFetch<{ messages: ContactSubmission[] }>('/api/admin/contacts');
      setContacts(res.messages || []);
      setReplyDrafts((prev) => {
        const next = { ...prev };
        for (const c of res.messages || []) {
          if (next[c.id] === undefined) {
            next[c.id] = c.admin_reply || '';
          }
        }
        return next;
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load contact enquiries.');
    }
  }, [onError]);

  const loadThread = useCallback(
    async (convId: string, silent = false) => {
      if (!silent) setLoadingThread(true);
      try {
        const res = await adminApiFetch<ConversationThreadResponse>(
          `/api/admin/support/conversations/${convId}?markRead=true`
        );
        setThread(res);
        setConvData((prev) =>
          prev
            ? {
                ...prev,
                conversations: prev.conversations.map((c) =>
                  c.id === convId ? { ...res.conversation, unread_admin: 0 } : c
                ),
              }
            : prev
        );
      } catch (err) {
        onError(err instanceof Error ? err.message : 'Failed to load customer conversation.');
      } finally {
        if (!silent) setLoadingThread(false);
      }
    },
    [onError]
  );

  useEffect(() => {
    loadConversations();
    loadContacts();
  }, [loadConversations, loadContacts, liveTick]);

  useEffect(() => {
    if (selectedId && subTab === 'chat') {
      loadThread(selectedId, Boolean(thread?.conversation.id === selectedId));
    }
  }, [selectedId, subTab, liveTick, loadThread, thread?.conversation.id]);

  useEffect(() => {
    threadBottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [thread?.messages.length]);

  const filteredConversations = useMemo(() => {
    const list = convData?.conversations || [];
    const q = convSearch.trim().toLowerCase();
    return list.filter((c) => {
      if (convFilter !== 'all' && c.status !== convFilter) return false;
      if (!q) return true;
      return (
        c.visitor_name.toLowerCase().includes(q) ||
        (c.visitor_email || '').toLowerCase().includes(q) ||
        c.reference_code.toLowerCase().includes(q) ||
        c.last_message_preview.toLowerCase().includes(q)
      );
    });
  }, [convData, convFilter, convSearch]);

  const filteredContacts = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contacts.filter((c) => {
      if (contactFilter !== 'all' && c.status !== contactFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.subject.toLowerCase().includes(q) ||
        (c.reference_code || '').toLowerCase().includes(q) ||
        c.message.toLowerCase().includes(q)
      );
    });
  }, [contacts, contactFilter, contactSearch]);

  const handleUploadAttachment = async (file: File | undefined) => {
    if (!file) return;
    setUploadingAttachment(true);
    try {
      const uploaded = await adminUploadMediaFile(file);
      setReplyAttachmentUrl(uploaded.url);
      setReplyAttachmentName(uploaded.original_name);
      onNotify(`Attached ${uploaded.original_name}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to upload image.');
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    if (!replyText.trim() && !replyAttachmentUrl) return;
    setSendingReply(true);
    try {
      const res = await adminApiFetch<{
        conversation: SupportConversation;
        message: SupportMessage;
      }>(`/api/admin/support/conversations/${selectedId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          content: replyText.trim(),
          attachment_url: replyAttachmentUrl,
          attachment_name: replyAttachmentName,
        }),
      });

      setThread((prev) =>
        prev && prev.conversation.id === selectedId
          ? {
              conversation: res.conversation,
              messages: [...prev.messages, res.message],
            }
          : prev
      );
      setReplyText('');
      setReplyAttachmentUrl(null);
      setReplyAttachmentName(null);
      await Promise.all([loadConversations(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to send reply.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleToggleConversationStatus = async (conv: SupportConversation) => {
    const nextStatus = conv.status === 'open' ? 'resolved' : 'open';
    try {
      const res = await adminApiFetch<{ conversation: SupportConversation }>(
        `/api/admin/support/conversations/${conv.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: nextStatus }),
        }
      );
      setThread((prev) =>
        prev && prev.conversation.id === conv.id
          ? { ...prev, conversation: res.conversation }
          : prev
      );
      onNotify(`Conversation marked ${nextStatus}.`);
      await Promise.all([loadConversations(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update conversation status.');
    }
  };

  const handleUpdateContact = async (
    id: string,
    patch: { status?: 'new' | 'reviewed' | 'replied'; admin_reply?: string | null },
    msg: string
  ) => {
    setSavingContactId(id);
    try {
      await adminApiFetch<{ contact: ContactSubmission }>(`/api/admin/contacts/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      onNotify(msg);
      await Promise.all([loadContacts(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update contact enquiry.');
    } finally {
      setSavingContactId(null);
    }
  };

  const newContactsCount = contacts.filter((c) => c.status === 'new').length;
  const unreadChatCount = convData?.summary.unread_messages || 0;

  return (
    <div className="space-y-5">
      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800/80">
          <button
            type="button"
            onClick={() => setSubTab('chat')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              subTab === 'chat'
                ? 'bg-[#881337] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Two-Way Customer Chat</span>
            {unreadChatCount > 0 && (
              <span className="rounded-full bg-white text-[#881337] px-1.5 py-0.5 text-[10px] font-bold">
                {unreadChatCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => setSubTab('contacts')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
              subTab === 'contacts'
                ? 'bg-[#881337] text-white'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-700/60'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Contact Form Enquiries</span>
            {newContactsCount > 0 && (
              <span className="rounded-full bg-amber-400 text-slate-950 px-1.5 py-0.5 text-[10px] font-bold">
                {newContactsCount}
              </span>
            )}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            loadConversations();
            loadContacts();
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Inbox</span>
        </button>
      </div>

      {/* LIVE TWO-WAY CUSTOMER CHAT */}
      {subTab === 'chat' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Conversations List */}
          <div className="lg:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col max-h-[640px]">
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 space-y-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="Search visitor or ref code..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[11px]">
                {(['all', 'open', 'resolved'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setConvFilter(st)}
                    className={`flex-1 py-1 rounded-md font-semibold capitalize ${
                      convFilter === st
                        ? 'bg-[#881337] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800 overflow-y-auto flex-1">
              {filteredConversations.map((c) => {
                const active = selectedId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setSelectedId(c.id)}
                    className={`w-full text-left p-3.5 transition-colors ${
                      active
                        ? 'bg-rose-50/80 dark:bg-rose-950/25 border-l-4 border-[#881337]'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-xs text-slate-900 dark:text-white truncate">
                        {c.visitor_name}
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {c.unread_admin > 0 && (
                          <span className="rounded-full bg-[#881337] text-white text-[10px] font-bold px-1.5 py-0.5">
                            {c.unread_admin}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                            c.status === 'open'
                              ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                      {c.reference_code} · {formatLocalDateTime(c.last_message_at)}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-1">
                      {c.last_message_preview || 'No messages yet'}
                    </p>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No customer chat threads match your filter.
                </div>
              )}
            </div>
          </div>

          {/* Right: Active Conversation Thread */}
          <div className="lg:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col h-[640px]">
            {!selectedId || !thread ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-xs text-slate-500">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                <p>
                  {loadingThread
                    ? 'Loading conversation...'
                    : 'Select a customer chat conversation to view history and reply live.'}
                </p>
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {thread.conversation.visitor_name}
                      </h3>
                      <span className="font-mono text-[11px] font-semibold text-[#881337] dark:text-rose-400">
                        {thread.conversation.reference_code}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                      {thread.conversation.visitor_email && (
                        <span>Email: {thread.conversation.visitor_email}</span>
                      )}
                      {thread.conversation.visitor_phone && (
                        <span className="font-mono">Phone: {thread.conversation.visitor_phone}</span>
                      )}
                      {!thread.conversation.visitor_email && !thread.conversation.visitor_phone && (
                        <span>Guest visitor (no account required)</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleConversationStatus(thread.conversation)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold border ${
                        thread.conversation.status === 'open'
                          ? 'border-emerald-300 text-[#15803D] bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400'
                          : 'border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-200'
                      }`}
                    >
                      {thread.conversation.status === 'open'
                        ? 'Mark Resolved'
                        : 'Reopen Conversation'}
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/70 dark:bg-slate-950/40">
                  {thread.messages.map((m) => {
                    const isAdminMsg = m.sender_type === 'admin';
                    return (
                      <div
                        key={m.id}
                        className={`flex ${isAdminMsg ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm space-y-1.5 ${
                            isAdminMsg
                              ? 'bg-[#881337] text-white rounded-br-sm'
                              : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                            <span className="font-semibold">{m.sender_name}</span>
                            <span>{formatLocalDateTime(m.created_at)}</span>
                          </div>
                          {m.content && (
                            <p className="whitespace-pre-wrap leading-relaxed text-[13px]">
                              {m.content}
                            </p>
                          )}
                          {m.attachment_url && (
                            <button
                              type="button"
                              onClick={() => setLightboxImage(m.attachment_url || null)}
                              className="block mt-1 overflow-hidden rounded-lg border border-black/10 dark:border-white/10"
                            >
                              <img
                                src={m.attachment_url}
                                alt={m.attachment_name || 'Attachment'}
                                className="max-h-56 w-auto object-contain"
                              />
                            </button>
                          )}
                          {isAdminMsg && (
                            <div className="flex justify-end items-center gap-1 text-[10px] opacity-80">
                              {m.read_by_visitor ? (
                                <>
                                  <CheckCheck className="w-3 h-3" />
                                  <span>Read by visitor</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Delivered</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={threadBottomRef} />
                </div>

                {/* Reply Composer */}
                <form
                  onSubmit={handleSendReply}
                  className="p-3.5 border-t border-slate-200 dark:border-slate-800 space-y-2.5 bg-white dark:bg-[#111827] rounded-b-2xl"
                >
                  {replyAttachmentUrl && (
                    <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs">
                      <span className="truncate font-mono">{replyAttachmentName || 'Image ready'}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setReplyAttachmentUrl(null);
                          setReplyAttachmentName(null);
                        }}
                        className="text-slate-400 hover:text-red-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    <label className="cursor-pointer rounded-xl border border-slate-300 dark:border-slate-700 p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 shrink-0">
                      <ImagePlus className="w-4 h-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingAttachment}
                        onChange={(e) => {
                          handleUploadAttachment(e.target.files?.[0]);
                          e.target.value = '';
                        }}
                      />
                    </label>
                    <textarea
                      rows={2}
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Reply directly to visitor (pushes live & triggers push alert if subscribed)..."
                      className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs resize-none"
                    />
                    <button
                      type="submit"
                      disabled={sendingReply || uploadingAttachment || (!replyText.trim() && !replyAttachmentUrl)}
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#881337] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#6B0F2B] disabled:opacity-50 min-h-[42px] shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{sendingReply ? 'Sending...' : 'Reply'}</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* CONTACT FORM ENQUIRIES */}
      {subTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {(['all', 'new', 'reviewed', 'replied'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setContactFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                    contactFilter === st
                      ? 'bg-[#881337] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="relative sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
                placeholder="Search contact enquiries..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs"
              />
            </div>
          </div>

          <div className="space-y-3">
            {filteredContacts.map((c) => {
              const badgeCls =
                c.status === 'replied'
                  ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                  : c.status === 'reviewed'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';

              return (
                <div
                  key={c.id}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {c.reference_code && (
                          <span className="font-mono text-xs font-bold text-[#881337] dark:text-rose-400">
                            {c.reference_code}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${badgeCls}`}>
                          {c.status || 'new'}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {formatLocalDateTime(c.created_at)}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                        {c.subject}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                        <span className="font-medium">{c.name}</span>
                        <a
                          href={`mailto:${c.email}?subject=${encodeURIComponent(`Re: ${c.subject}`)}`}
                          className="inline-flex items-center gap-1 text-[#881337] dark:text-rose-400 hover:underline"
                        >
                          <Mail className="w-3 h-3" />
                          <span>{c.email}</span>
                        </a>
                        {c.phone && (
                          <a
                            href={`tel:${c.phone}`}
                            className="inline-flex items-center gap-1 font-mono hover:underline"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{c.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['new', 'reviewed', 'replied'] as const).map((nextSt) => (
                        <button
                          key={nextSt}
                          type="button"
                          disabled={savingContactId === c.id || c.status === nextSt}
                          onClick={() =>
                            handleUpdateContact(
                              c.id,
                              { status: nextSt },
                              `Marked enquiry ${c.reference_code || c.subject} as ${nextSt}.`
                            )
                          }
                          className={`rounded-md px-2.5 py-1 text-[11px] font-semibold capitalize border ${
                            c.status === nextSt
                              ? 'bg-[#881337] text-white border-[#881337]'
                              : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {nextSt}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3 border border-slate-100 dark:border-slate-800">
                    {c.message}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      placeholder="Log reply summary or follow-up note..."
                      value={replyDrafts[c.id] ?? ''}
                      onChange={(e) =>
                        setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                      }
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                    />
                    <button
                      type="button"
                      disabled={savingContactId === c.id}
                      onClick={() =>
                        handleUpdateContact(
                          c.id,
                          {
                            status: 'replied',
                            admin_reply: replyDrafts[c.id] ?? '',
                          },
                          `Saved response note for ${c.reference_code || c.name}.`
                        )
                      }
                      className="rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
                    >
                      Save Note &amp; Mark Replied
                    </button>
                  </div>
                </div>
              );
            })}

            {filteredContacts.length === 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-xs text-slate-500">
                No contact form enquiries found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxImage}
            alt="Chat attachment preview"
            className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
