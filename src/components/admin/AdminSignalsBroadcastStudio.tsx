import React, { useCallback, useEffect, useState } from 'react';
import {
  Archive,
  Check,
  Edit3,
  Film,
  ImagePlus,
  Pin,
  PinOff,
  Radio,
  RefreshCw,
  RotateCcw,
  Save,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { adminApiFetch, adminUploadMediaFile } from '../../lib/adminApi';
import { formatLocalDateTime } from '../../lib/api';
import type {
  PushJobSummary,
  SignalChatMessage,
  SignalChatMessageType,
  SignalChatPriority,
} from '../../types';

interface AdminSignalsBroadcastStudioProps {
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
  onPublishReceipt: (receipt: {
    title: string;
    signalMessageId: string | null;
    pushJob: PushJobSummary | null;
  }) => void;
  onOpenPublicSignals: (messageId?: string) => void;
  liveTick?: number;
}

const MESSAGE_TYPE_LABELS: Record<SignalChatMessageType, string> = {
  signal: 'Forex Signal',
  setup: 'Buy / Sell Setup',
  analysis: 'Market Analysis',
  update: 'Market Update',
  news: 'Economic News Alert',
  announcement: 'Important Announcement',
};

export const AdminSignalsBroadcastStudio: React.FC<AdminSignalsBroadcastStudioProps> = ({
  onNotify,
  onError,
  onPublishReceipt,
  onOpenPublicSignals,
  liveTick = 0,
}) => {
  const [channelTab, setChannelTab] = useState<'active' | 'draft' | 'completed'>('active');
  const [messages, setMessages] = useState<SignalChatMessage[]>([]);
  const [counts, setCounts] = useState({ active: 0, completed: 0, draft: 0 });
  const [onlineCount, setOnlineCount] = useState(0);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Composer State
  const [content, setContent] = useState('');
  const [messageType, setMessageType] = useState<SignalChatMessageType>('signal');
  const [priority, setPriority] = useState<SignalChatPriority>('normal');
  const [pinned, setPinned] = useState(false);
  const [sendPush, setSendPush] = useState(true);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [mediaName, setMediaName] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [publishing, setPublishing] = useState(false);

  // Edit & Complete Modal / Inline State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<SignalChatMessageType>('update');
  const [editPriority, setEditPriority] = useState<SignalChatPriority>('normal');

  const [completingMsg, setCompletingMsg] = useState<SignalChatMessage | null>(null);
  const [completeSummary, setCompleteSummary] = useState('');

  const loadMessages = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({
        status: channelTab,
        limit: '50',
        scope: 'admin',
      });
      if (search.trim()) qs.set('search', search.trim());

      const res = await adminApiFetch<{
        messages: SignalChatMessage[];
        counts: { active: number; completed: number; draft: number };
        online_count: number;
        subscriber_count: number;
      }>(`/api/signals/messages?${qs.toString()}`);

      setMessages(res.messages || []);
      setCounts(res.counts || { active: 0, completed: 0, draft: 0 });
      setOnlineCount(res.online_count || 0);
      setSubscriberCount(res.subscriber_count || 0);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load Signals broadcast feed.');
    } finally {
      setLoading(false);
    }
  }, [channelTab, search, onError]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages, liveTick]);

  const handleUploadAttachment = async (file: File | undefined) => {
    if (!file) return;
    setUploadingMedia(true);
    try {
      const uploaded = await adminUploadMediaFile(file);
      const isVideo = uploaded.mimetype.startsWith('video/') || /\.(mp4|webm)$/i.test(uploaded.url);
      setMediaUrl(uploaded.url);
      setMediaType(isVideo ? 'video' : 'image');
      setMediaName(uploaded.original_name);
      onNotify(`Attached ${uploaded.original_name}`);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Media upload failed.');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handlePublish = async (targetStatus: 'active' | 'draft') => {
    if (!content.trim() && !mediaUrl) {
      onError('Enter a broadcast message or attach an image/video before publishing.');
      return;
    }

    setPublishing(true);
    try {
      const clientRequestId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

      const res = await adminApiFetch<{
        message: SignalChatMessage;
        push_job?: PushJobSummary | null;
      }>('/api/signals/messages', {
        method: 'POST',
        body: JSON.stringify({
          content: content.trim(),
          media_url: mediaUrl,
          media_type: mediaType,
          media_name: mediaName,
          image_url: mediaType === 'image' ? mediaUrl : null,
          image_name: mediaType === 'image' ? mediaName : null,
          message_type: messageType,
          priority,
          pinned: targetStatus === 'active' ? pinned : false,
          status: targetStatus,
          send_push: targetStatus === 'active' ? sendPush : false,
          client_request_id: clientRequestId,
        }),
      });

      setContent('');
      setMediaUrl(null);
      setMediaType(null);
      setMediaName(null);
      setPinned(false);

      if (targetStatus === 'draft') {
        onNotify('Saved message to Private Drafts.');
        setChannelTab('draft');
      } else {
        onNotify('Published live to the public MeridianFX Signals channel.');
        onPublishReceipt({
          title: `${MESSAGE_TYPE_LABELS[messageType]} published to public Signals channel`,
          signalMessageId: res.message.id,
          pushJob: res.push_job || null,
        });
        setChannelTab('active');
      }
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to publish broadcast.');
    } finally {
      setPublishing(false);
    }
  };

  const handlePublishDraft = async (msg: SignalChatMessage) => {
    try {
      const res = await adminApiFetch<{
        message: SignalChatMessage;
        push_job?: PushJobSummary | null;
      }>(`/api/signals/messages/${msg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active', send_push: true }),
      });
      onNotify('Draft published live to Signals Channel.');
      onPublishReceipt({
        title: `Draft published live to public Signals channel`,
        signalMessageId: res.message.id,
        pushJob: res.push_job || null,
      });
      setChannelTab('active');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to publish draft.');
    }
  };

  const handleTogglePin = async (msg: SignalChatMessage) => {
    try {
      await adminApiFetch(`/api/signals/messages/${msg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !msg.pinned }),
      });
      onNotify(msg.pinned ? 'Message unpinned.' : 'Message pinned to channel top.');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update pin.');
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await adminApiFetch(`/api/signals/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: editContent.trim(),
          message_type: editType,
          priority: editPriority,
        }),
      });
      setEditingId(null);
      onNotify('Channel message updated.');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update message.');
    }
  };

  const handleConfirmComplete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!completingMsg) return;
    try {
      await adminApiFetch(`/api/signals/messages/${completingMsg.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'completed',
          completed_summary: completeSummary.trim() || null,
        }),
      });
      setCompletingMsg(null);
      setCompleteSummary('');
      onNotify('Signal message moved to Completed Archive.');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to archive message.');
    }
  };

  const handleRestoreMessage = async (id: string) => {
    try {
      await adminApiFetch(`/api/signals/messages/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'active' }),
      });
      onNotify('Restored message to Active Channel.');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to restore message.');
    }
  };

  const handleDeleteMessage = async (id: string) => {
    try {
      await adminApiFetch(`/api/signals/messages/${id}`, { method: 'DELETE' });
      onNotify('Channel message deleted.');
      await loadMessages();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete message.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Studio Banner & Quick Stats */}
      <div className="rounded-2xl border border-[#881337]/30 bg-rose-50/70 dark:bg-rose-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#881337] text-white flex items-center justify-center shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Signals Live Broadcast Composer
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Publish once from Admin Portal. Every update broadcasts immediately via WebSocket &amp; push notifications to public readers.
            </p>
            <p className="text-[11px] font-mono text-slate-500 mt-1">
              {onlineCount} live socket(s) · {subscriberCount} active push subscriber(s)
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onOpenPublicSignals()}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#881337]/30 bg-white dark:bg-slate-900 px-3.5 py-2 text-xs font-semibold text-[#881337] dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-slate-800 shrink-0"
        >
          <span>View Public /signals Channel</span>
        </button>
      </div>

      {/* Composer + Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Composer Card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4 h-fit">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Compose Channel Broadcast
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Message Type
              </label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as SignalChatMessageType)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-medium"
              >
                {Object.entries(MESSAGE_TYPE_LABELS).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-medium text-slate-500 mb-1">
                Alert Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SignalChatPriority)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-medium"
              >
                <option value="normal">Standard Broadcast</option>
                <option value="urgent">Urgent Alert</option>
              </select>
            </div>
          </div>

          <textarea
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write signal setup, entry/SL/TP zones, chart commentary, or market bulletin..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm leading-relaxed"
          />

          {mediaUrl && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-2.5 space-y-2 bg-slate-50 dark:bg-slate-900/60">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-mono truncate">{mediaName || 'Attached media'}</span>
                <button
                  type="button"
                  onClick={() => {
                    setMediaUrl(null);
                    setMediaType(null);
                    setMediaName(null);
                  }}
                  className="text-slate-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {mediaType === 'video' ? (
                <video src={mediaUrl} controls className="max-h-44 w-full rounded-lg bg-black" />
              ) : (
                <img
                  src={mediaUrl}
                  alt={mediaName || 'Preview'}
                  className="max-h-44 w-auto rounded-lg object-contain"
                />
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-800">
              {mediaType === 'video' ? (
                <Film className="w-3.5 h-3.5" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5" />
              )}
              <span>{uploadingMedia ? 'Uploading...' : 'Attach Chart / Image / Video'}</span>
              <input
                type="file"
                accept="image/*,video/mp4,video/webm"
                className="hidden"
                disabled={uploadingMedia}
                onChange={(e) => {
                  handleUploadAttachment(e.target.files?.[0]);
                  e.target.value = '';
                }}
              />
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
                className="accent-[#881337]"
              />
              <span>Pin to top</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sendPush}
                onChange={(e) => setSendPush(e.target.checked)}
                className="accent-[#881337]"
              />
              <span>Send Push Notification</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              disabled={publishing || uploadingMedia}
              onClick={() => handlePublish('draft')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Draft</span>
            </button>
            <button
              type="button"
              disabled={publishing || uploadingMedia}
              onClick={() => handlePublish('active')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#881337] px-4 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#6B0F2B] disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{publishing ? 'Publishing...' : 'PUBLISH'}</span>
            </button>
          </div>
        </div>

        {/* Channel Messages Feed & Drafts */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'active', label: `Active (${counts.active})` },
                  { id: 'draft', label: `Drafts (${counts.draft})` },
                  { id: 'completed', label: `Completed (${counts.completed})` },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setChannelTab(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    channelTab === t.id
                      ? 'bg-[#881337] text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter messages..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-7 pr-2.5 py-1.5 text-xs"
                />
              </div>
              <button
                type="button"
                onClick={loadMessages}
                className="rounded-lg border border-slate-300 dark:border-slate-700 p-1.5 text-slate-600 dark:text-slate-300"
                title="Refresh feed"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {completingMsg && (
            <form
              onSubmit={handleConfirmComplete}
              className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/25 p-4 space-y-3"
            >
              <p className="text-xs font-bold text-[#15803D] dark:text-emerald-400">
                Archive Message to Completed Results
              </p>
              <input
                type="text"
                placeholder="Optional outcome summary (e.g. TP2 Hit +95 pips)"
                value={completeSummary}
                onChange={(e) => setCompleteSummary(e.target.value)}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCompletingMsg(null)}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Confirm Complete &amp; Archive
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {loading ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 text-center text-xs text-slate-500">
                Loading channel messages...
              </div>
            ) : messages.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 text-center text-xs text-slate-500">
                No {channelTab} messages in Signals channel.
              </div>
            ) : (
              messages
                .slice()
                .reverse()
                .map((m) => (
                  <div
                    key={m.id}
                    className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                        <span className="font-bold text-[#881337] dark:text-rose-400">
                          {MESSAGE_TYPE_LABELS[m.message_type] || m.message_type}
                        </span>
                        {m.priority === 'urgent' && (
                          <span className="rounded bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            Urgent
                          </span>
                        )}
                        {m.pinned && (
                          <span className="rounded bg-rose-100 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300 px-1.5 py-0.5 text-[10px] font-bold uppercase">
                            Pinned
                          </span>
                        )}
                        <span className="text-slate-400">· {formatLocalDateTime(m.created_at)}</span>
                      </div>

                      <div className="flex items-center gap-1">
                        {channelTab === 'draft' && (
                          <button
                            type="button"
                            onClick={() => handlePublishDraft(m)}
                            className="inline-flex items-center gap-1 rounded-md bg-[#15803D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#166534]"
                          >
                            <Send className="w-3 h-3" />
                            <span>Publish Live</span>
                          </button>
                        )}
                        {channelTab === 'active' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleTogglePin(m)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#881337]"
                              title={m.pinned ? 'Unpin' : 'Pin to top'}
                            >
                              {m.pinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingId(m.id);
                                setEditContent(m.content);
                                setEditType(m.message_type);
                                setEditPriority(m.priority);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#881337]"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCompletingMsg(m);
                                setCompleteSummary('');
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#15803D]"
                              title="Mark Completed & Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {channelTab === 'completed' && (
                          <button
                            type="button"
                            onClick={() => handleRestoreMessage(m.id)}
                            className="inline-flex items-center gap-1 rounded-md border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] font-medium"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restore</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteMessage(m.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-500"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {editingId === m.id ? (
                      <div className="space-y-2 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as SignalChatMessageType)}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                          >
                            {Object.entries(MESSAGE_TYPE_LABELS).map(([k, label]) => (
                              <option key={k} value={k}>
                                {label}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editPriority}
                            onChange={(e) => setEditPriority(e.target.value as SignalChatPriority)}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1.5 text-xs"
                          >
                            <option value="normal">Standard</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </div>
                        <textarea
                          rows={3}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(m.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-[#881337] px-3 py-1 text-xs font-semibold text-white"
                          >
                            <Check className="w-3 h-3" />
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {m.content && (
                          <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {m.content}
                          </p>
                        )}
                        {(m.media_url || m.image_url) && (
                          <div className="pt-1">
                            {m.media_type === 'video' ? (
                              <video
                                src={m.media_url || m.image_url || ''}
                                controls
                                className="max-h-48 rounded-lg bg-black"
                              />
                            ) : (
                              <img
                                src={m.media_url || m.image_url || ''}
                                alt={m.media_name || m.image_name || 'Attachment'}
                                className="max-h-48 rounded-lg object-contain border border-slate-200 dark:border-slate-800"
                              />
                            )}
                          </div>
                        )}
                        {m.completed_summary && (
                          <p className="text-[11px] font-semibold text-[#15803D] dark:text-emerald-400">
                            Outcome: {m.completed_summary}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-mono">
                          <span>❤️ {m.reactions.love >= 1000 ? `${(m.reactions.love / 1000).toFixed(1).replace(/\.0$/, '')}K` : m.reactions.love}</span>
                          <span>🤙 {m.reactions.like >= 1000 ? `${(m.reactions.like / 1000).toFixed(1).replace(/\.0$/, '')}K` : m.reactions.like}</span>
                          <span>💥 {m.reactions.fire >= 1000 ? `${(m.reactions.fire / 1000).toFixed(1).replace(/\.0$/, '')}K` : m.reactions.fire}</span>
                          <span>💯 {m.reactions.hundred >= 1000 ? `${(m.reactions.hundred / 1000).toFixed(1).replace(/\.0$/, '')}K` : m.reactions.hundred}</span>
                        </div>
                      </>
                    )}
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
