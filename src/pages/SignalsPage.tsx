import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellRing,
  Check,
  CheckCircle2,
  Edit3,
  ImagePlus,
  Info,
  Loader2,
  MessageSquareText,
  Moon,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Send,
  Shield,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { usePlatform, type SignalChatWsEvent } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime, getOrCreateVisitorId, uploadMediaFile } from '../lib/api';
import { getCurrentPushSubscription } from '../lib/pushClient';
import type {
  PushJobSummary,
  SignalChatMessage,
  SignalChatMessageType,
  SignalReactionType,
  SignalReactionsMap,
} from '../types';

type ChannelView = 'chat' | 'completed';

const REACTION_OPTIONS: Array<{
  key: SignalReactionType;
  emoji: string;
  label: string;
  activeClass: string;
}> = [
  { key: 'love', emoji: '❤️', label: 'Love', activeClass: 'bg-[#881337] text-white' },
  { key: 'like', emoji: '👍', label: 'Like', activeClass: 'bg-[#15803D] text-white' },
  { key: 'fire', emoji: '💥', label: 'Fire', activeClass: 'bg-amber-600 text-white' },
  { key: 'hundred', emoji: '💯', label: '100', activeClass: 'bg-indigo-600 text-white' },
  { key: 'dislike', emoji: '👎', label: 'Dislike', activeClass: 'bg-slate-700 text-white' },
];

function emptyReactions(): SignalReactionsMap {
  return { love: 0, like: 0, fire: 0, hundred: 0, dislike: 0 };
}

const MESSAGE_TYPE_LABELS: Record<SignalChatMessageType, string> = {
  signal: 'Trading Signal',
  update: 'Market Update',
  analysis: 'Chart Analysis',
  announcement: 'Announcement',
};

function formatChatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

function formatDayHeading(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();

    if (sameDay(d, today)) return 'Today';
    if (sameDay(d, yesterday)) return 'Yesterday';
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return '';
  }
}

function renderMessageText(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, idx) => {
    if (/^https?:\/\/[^\s]+$/i.test(part)) {
      return (
        <a
          key={idx}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline text-[#881337] dark:text-rose-400 break-all hover:opacity-80"
        >
          {part}
        </a>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

const ChatImageAttachment: React.FC<{
  src: string;
  alt: string;
  onOpen: (url: string) => void;
  compact?: boolean;
}> = ({ src, alt, onOpen, compact }) => {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="rounded-xl bg-slate-100 dark:bg-slate-800/80 px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Chart image attachment unavailable
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="block w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-900 focus-visible:outline-2 focus-visible:outline-[#881337]"
    >
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        loading="lazy"
        onError={() => setFailed(true)}
        className={`w-full object-cover transition-opacity hover:opacity-95 ${
          compact ? 'max-h-44' : 'max-h-80'
        }`}
      />
    </button>
  );
};

export const SignalsPage: React.FC = () => {
  const {
    user,
    theme,
    toggleTheme,
    navigate,
    onlineCount,
    wsConnected,
    unreadCount,
    showNotifModal,
    setShowNotifModal,
    subscribeSignalChatEvents,
    subscribePushJobEvents,
  } = usePlatform();
  const isAdmin = user?.role === 'admin';

  // Always default to live chat view when opening Signals
  const [view, setView] = useState<ChannelView>('chat');

  // Channel Info Modal
  const [showChannelInfo, setShowChannelInfo] = useState(false);

  // Active chat state
  const [activeMessages, setActiveMessages] = useState<SignalChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<SignalChatMessage[]>([]);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [activeLoading, setActiveLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [realOnlineCount, setRealOnlineCount] = useState(onlineCount);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [hasUnseenBelow, setHasUnseenBelow] = useState(false);
  const [highlightedMsgId, setHighlightedMsgId] = useState<string | null>(null);

  // Completed archive state
  const [completedMessages, setCompletedMessages] = useState<SignalChatMessage[]>([]);
  const [completedHasMore, setCompletedHasMore] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);
  const [completedSearch, setCompletedSearch] = useState('');
  const [selectedCompleted, setSelectedCompleted] = useState<SignalChatMessage | null>(null);

  // Fluctuating Estimated Community Membership figure (45,670 - 78,900)
  const [estimatedMembers, setEstimatedMembers] = useState<number>(() => 53204);
  const estimatedTargetRef = useRef<number>(53204);

  // Admin Composer state
  const [composerText, setComposerText] = useState('');
  const [composerType, setComposerType] = useState<SignalChatMessageType>('signal');
  const [composerPinned, setComposerPinned] = useState(false);
  const [composerPush, setComposerPush] = useState(true);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [composerError, setComposerError] = useState<string | null>(null);

  // Admin Drafts & Publish Confirmation state
  const [draftMessages, setDraftMessages] = useState<SignalChatMessage[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [publishingDraftId, setPublishingDraftId] = useState<string | null>(null);
  const [publishConfirmation, setPublishConfirmation] = useState<{
    messageId: string;
    label: string;
    pushJob: PushJobSummary | null;
  } | null>(null);
  const [pushSubscribed, setPushSubscribed] = useState(false);

  // Message editing / archiving / deleting / lightbox state
  const [editingMsgId, setEditingMsgId] = useState<string | null>(null);
  const [editDraftText, setEditDraftText] = useState('');
  const [editDraftType, setEditDraftType] = useState<SignalChatMessageType>('update');
  const [editDraftImageUrl, setEditDraftImageUrl] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [completingMsg, setCompletingMsg] = useState<SignalChatMessage | null>(null);
  const [completeSummary, setCompleteSummary] = useState('');
  const [submittingComplete, setSubmittingComplete] = useState(false);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [reactionNotice, setReactionNotice] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const viewerKeyRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const handledDeepLinkRef = useRef<string | null>(null);

  useEffect(() => {
    setRealOnlineCount(onlineCount);
  }, [onlineCount]);

  // Smooth periodic animation for Estimated Community Activity (45,670 - 78,900)
  useEffect(() => {
    let rafId = 0;
    let current = estimatedTargetRef.current;

    const animateTo = (target: number) => {
      const start = current;
      const startTime = performance.now();
      const duration = 1200;

      const step = (now: number) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        const value = Math.round(start + (target - start) * eased);
        current = value;
        setEstimatedMembers(value);
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        }
      };

      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(step);
    };

    const interval = window.setInterval(() => {
      const delta = Math.round((Math.random() - 0.48) * 1450);
      const next = Math.max(45670, Math.min(78900, estimatedTargetRef.current + delta));
      estimatedTargetRef.current = next;
      animateTo(next);
    }, 5200);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const scrollToBottom = useCallback((smooth = true) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto',
    });
    setHasUnseenBelow(false);
    setShowScrollBottomBtn(false);
  }, []);

  // Ensure persistent anonymous visitor identifier is initialized on open
  useEffect(() => {
    getOrCreateVisitorId();
  }, []);

  // Load initial Active chat messages
  const fetchActiveMessages = useCallback(
    async (keepScrollPosition = false) => {
      try {
        const res = await apiFetch<{
          messages: SignalChatMessage[];
          pinned: SignalChatMessage[];
          has_more: boolean;
          counts: { active: number; completed: number };
          online_count: number;
          viewer_key?: string | null;
        }>('/api/signals/messages?status=active&limit=40');
        if (res.viewer_key) viewerKeyRef.current = res.viewer_key;
        setActiveMessages(res.messages);
        setPinnedMessages(res.pinned);
        setActiveHasMore(res.has_more);
        setCompletedCount(res.counts.completed);
        if (typeof res.online_count === 'number') {
          setRealOnlineCount(res.online_count);
        }
        if (!keepScrollPosition) {
          requestAnimationFrame(() => scrollToBottom(false));
        }
      } catch {
        // handled cleanly via empty/offline state
      } finally {
        setActiveLoading(false);
      }
    },
    [scrollToBottom]
  );

  // Load Completed archive messages
  const fetchCompletedMessages = useCallback(async (searchTerm = '') => {
    setCompletedLoading(true);
    try {
      const qs = new URLSearchParams({ status: 'completed', limit: '30' });
      if (searchTerm.trim()) qs.set('search', searchTerm.trim());
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
        counts: { active: number; completed: number };
        viewer_key?: string | null;
      }>(`/api/signals/messages?${qs.toString()}`);
      if (res.viewer_key) viewerKeyRef.current = res.viewer_key;
      setCompletedMessages(res.messages);
      setCompletedHasMore(res.has_more);
      setCompletedCount(res.counts.completed);
    } catch {
      // ignore
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  const fetchDraftMessages = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const res = await apiFetch<{ messages: SignalChatMessage[] }>(
        '/api/signals/messages?status=draft&limit=50'
      );
      setDraftMessages(res.messages);
    } catch {
      // ignore
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchActiveMessages(false);
  }, [fetchActiveMessages]);

  useEffect(() => {
    if (isAdmin) {
      fetchDraftMessages();
    } else {
      setDraftMessages([]);
    }
  }, [isAdmin, fetchDraftMessages]);

  // Refresh push subscription indicator when page loads or modal closes
  useEffect(() => {
    getCurrentPushSubscription()
      .then((sub) => setPushSubscribed(Boolean(sub)))
      .catch(() => setPushSubscribed(false));
  }, [showNotifModal]);

  // Keep push confirmation counts updated live via WebSocket
  useEffect(() => {
    return subscribePushJobEvents((job) => {
      setPublishConfirmation((cur) => {
        if (!cur || !cur.pushJob || cur.pushJob.id !== job.id) return cur;
        return { ...cur, pushJob: job };
      });
    });
  }, [subscribePushJobEvents]);

  // Poll briefly while any push deliveries are still queued/retrying
  useEffect(() => {
    const jobId = publishConfirmation?.pushJob?.id;
    const queued = publishConfirmation?.pushJob?.queued_count ?? 0;
    if (!isAdmin || !jobId || queued <= 0) return;

    const timer = window.setInterval(() => {
      apiFetch<{ job: PushJobSummary }>(`/api/admin/push-jobs/${jobId}`)
        .then((res) => {
          setPublishConfirmation((cur) =>
            cur?.pushJob?.id === jobId ? { ...cur, pushJob: res.job } : cur
          );
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [isAdmin, publishConfirmation?.pushJob?.id, publishConfirmation?.pushJob?.queued_count]);

  useEffect(() => {
    const curId = user?.id ?? null;
    if (prevUserIdRef.current === undefined) {
      prevUserIdRef.current = curId;
      return;
    }
    if (prevUserIdRef.current !== curId) {
      prevUserIdRef.current = curId;
      fetchActiveMessages(true);
      if (view === 'completed') fetchCompletedMessages(completedSearch);
    }
  }, [user?.id, view, completedSearch, fetchActiveMessages, fetchCompletedMessages]);

  useEffect(() => {
    if (view === 'completed') {
      fetchCompletedMessages(completedSearch);
    }
  }, [view, completedSearch, fetchCompletedMessages]);

  // Real-time WebSocket subscription for Signal Chat
  useEffect(() => {
    const unsubscribe = subscribeSignalChatEvents((event: SignalChatWsEvent) => {
      switch (event.type) {
        case 'reconnected': {
          fetchActiveMessages(true);
          if (view === 'completed') fetchCompletedMessages(completedSearch);
          break;
        }
        case 'created': {
          const incoming = event.message;
          if (incoming.status === 'active') {
            setActiveMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
            );
            if (incoming.pinned) {
              setPinnedMessages((prev) =>
                prev.some((m) => m.id === incoming.id) ? prev : [incoming, ...prev]
              );
            }
            if (isNearBottomRef.current) {
              requestAnimationFrame(() => scrollToBottom(true));
            } else {
              setHasUnseenBelow(true);
            }
          }
          break;
        }
        case 'updated': {
          const updated = event.message;
          if (updated.status === 'active') {
            setActiveMessages((prev) => {
              const exists = prev.some((m) => m.id === updated.id);
              return exists
                ? prev.map((m) =>
                    m.id === updated.id ? { ...updated, user_reaction: m.user_reaction } : m
                  )
                : [...prev, updated].sort((a, b) => a.created_at.localeCompare(b.created_at));
            });
            setCompletedMessages((prev) => prev.filter((m) => m.id !== updated.id));
            setPinnedMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== updated.id);
              return updated.pinned ? [updated, ...filtered] : filtered;
            });
          } else {
            setActiveMessages((prev) => prev.filter((m) => m.id !== updated.id));
            setPinnedMessages((prev) => prev.filter((m) => m.id !== updated.id));
            setCompletedMessages((prev) => {
              const filtered = prev.filter((m) => m.id !== updated.id);
              return [updated, ...filtered];
            });
          }
          setSelectedCompleted((cur) => (cur?.id === updated.id ? updated : cur));
          break;
        }
        case 'deleted': {
          setActiveMessages((prev) => prev.filter((m) => m.id !== event.id));
          setPinnedMessages((prev) => prev.filter((m) => m.id !== event.id));
          setCompletedMessages((prev) => prev.filter((m) => m.id !== event.id));
          setSelectedCompleted((cur) => (cur?.id === event.id ? null : cur));
          break;
        }
        case 'reacted': {
          const isSelfActor = Boolean(viewerKeyRef.current && event.viewer_key === viewerKeyRef.current);
          const applyReaction = (m: SignalChatMessage): SignalChatMessage => {
            if (m.id !== event.message_id) return m;
            return {
              ...m,
              reactions: event.reactions,
              user_reaction: isSelfActor ? event.reaction : m.user_reaction,
            };
          };
          setActiveMessages((prev) => prev.map(applyReaction));
          setCompletedMessages((prev) => prev.map(applyReaction));
          setSelectedCompleted((cur) => (cur ? applyReaction(cur) : cur));
          break;
        }
      }
    });

    return unsubscribe;
  }, [
    subscribeSignalChatEvents,
    fetchActiveMessages,
    fetchCompletedMessages,
    completedSearch,
    view,
    scrollToBottom,
  ]);

  const handleLoadOlderActive = useCallback(async () => {
    if (loadingOlder || !activeHasMore || activeMessages.length === 0) return;
    const oldest = activeMessages[0];
    const el = scrollContainerRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const prevTop = el?.scrollTop || 0;

    setLoadingOlder(true);
    try {
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
      }>(
        `/api/signals/messages?status=active&limit=40&before=${encodeURIComponent(
          oldest.created_at
        )}`
      );
      setActiveMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const older = res.messages.filter((m) => !existingIds.has(m.id));
        return [...older, ...prev];
      });
      setActiveHasMore(res.has_more);

      requestAnimationFrame(() => {
        if (el) {
          const diff = el.scrollHeight - prevHeight;
          el.scrollTop = prevTop + diff;
        }
      });
    } catch {
      // ignore
    } finally {
      setLoadingOlder(false);
    }
  }, [loadingOlder, activeHasMore, activeMessages]);

  const handleScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    const nearBottom = distanceFromBottom < 120;
    isNearBottomRef.current = nearBottom;
    setShowScrollBottomBtn(!nearBottom);
    if (nearBottom) {
      setHasUnseenBelow(false);
    }

    // Automatically load older messages when scrolling upward near the top
    if (el.scrollTop < 80 && activeHasMore && !loadingOlder) {
      handleLoadOlderActive();
    }
  };

  const handleLoadMoreCompleted = async () => {
    if (loadingMoreCompleted || completedMessages.length === 0) return;
    const oldest = completedMessages[completedMessages.length - 1];
    const cursor = oldest.completed_at || oldest.created_at;
    setLoadingMoreCompleted(true);
    try {
      const qs = new URLSearchParams({
        status: 'completed',
        limit: '30',
        before: cursor,
      });
      if (completedSearch.trim()) qs.set('search', completedSearch.trim());
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
      }>(`/api/signals/messages?${qs.toString()}`);
      setCompletedMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        return [...prev, ...res.messages.filter((m) => !existingIds.has(m.id))];
      });
      setCompletedHasMore(res.has_more);
    } catch {
      // ignore
    } finally {
      setLoadingMoreCompleted(false);
    }
  };

  // Handle Image Selection & Upload in Composer
  const handleSelectImage = async (file: File | undefined) => {
    if (!file) return;
    setComposerError(null);
    const localPreview = URL.createObjectURL(file);
    setAttachmentPreview(localPreview);
    setAttachmentName(file.name);
    setUploadingImage(true);
    try {
      const uploaded = await uploadMediaFile(file);
      setAttachmentUrl(uploaded.url);
      setAttachmentName(uploaded.original_name);
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Image upload failed.');
      setAttachmentPreview(null);
      setAttachmentUrl(null);
      setAttachmentName(null);
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelAttachment = () => {
    if (attachmentPreview) URL.revokeObjectURL(attachmentPreview);
    setAttachmentPreview(null);
    setAttachmentUrl(null);
    setAttachmentName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSendMessage = async (e?: React.FormEvent, asDraft = false) => {
    if (e) e.preventDefault();
    if (!isAdmin || sendingMessage || savingDraft || uploadingImage) return;
    if (!composerText.trim() && !attachmentUrl) {
      setComposerError('Type a message or attach an image.');
      return;
    }

    if (asDraft) setSavingDraft(true);
    else setSendingMessage(true);
    setComposerError(null);
    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const res = await apiFetch<{ message: SignalChatMessage; push_job?: PushJobSummary | null }>(
        '/api/signals/messages',
        {
          method: 'POST',
          body: JSON.stringify({
            content: composerText.trim(),
            image_url: attachmentUrl,
            image_name: attachmentName,
            message_type: composerType,
            status: asDraft ? 'draft' : 'active',
            pinned: !asDraft && composerPinned,
            send_push: asDraft ? false : composerPush,
            client_request_id: requestId,
          }),
        }
      );

      if (res.message.status === 'draft') {
        setDraftMessages((prev) => [res.message, ...prev]);
        setShowDrafts(true);
      } else {
        setActiveMessages((prev) =>
          prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
        );
        if (res.message.pinned) {
          setPinnedMessages((prev) =>
            prev.some((m) => m.id === res.message.id) ? prev : [res.message, ...prev]
          );
        }
        setPublishConfirmation({
          messageId: res.message.id,
          label: 'Published publicly to Signals Channel',
          pushJob: res.push_job || null,
        });
      }

      setComposerText('');
      setComposerPinned(false);
      handleCancelAttachment();
      if (!asDraft) {
        requestAnimationFrame(() => {
          scrollToBottom(true);
          composerInputRef.current?.focus();
        });
      }
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Unable to publish message.');
    } finally {
      setSendingMessage(false);
      setSavingDraft(false);
    }
  };

  const handlePublishDraft = async (draft: SignalChatMessage) => {
    if (!isAdmin || publishingDraftId) return;
    setPublishingDraftId(draft.id);
    setComposerError(null);
    try {
      const res = await apiFetch<{ message: SignalChatMessage; push_job?: PushJobSummary | null }>(
        `/api/signals/messages/${draft.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status: 'active', send_push: true }),
        }
      );
      setDraftMessages((prev) => prev.filter((d) => d.id !== draft.id));
      setActiveMessages((prev) =>
        prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
      );
      setPublishConfirmation({
        messageId: res.message.id,
        label: 'Draft published publicly to Signals Channel',
        pushJob: res.push_job || null,
      });
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Unable to publish draft.');
    } finally {
      setPublishingDraftId(null);
    }
  };

  const handleReact = async (msg: SignalChatMessage, reaction: SignalReactionType) => {
    const previousReaction = msg.user_reaction;
    const nextReaction: SignalReactionType | null = previousReaction === reaction ? null : reaction;

    const applyOptimistic = (m: SignalChatMessage): SignalChatMessage => {
      if (m.id !== msg.id) return m;
      const counts = { ...emptyReactions(), ...m.reactions };
      if (previousReaction && counts[previousReaction] !== undefined) {
        counts[previousReaction] = Math.max(0, counts[previousReaction] - 1);
      }
      if (nextReaction && counts[nextReaction] !== undefined) {
        counts[nextReaction] += 1;
      }
      return { ...m, reactions: counts, user_reaction: nextReaction };
    };

    setActiveMessages((prev) => prev.map(applyOptimistic));
    setCompletedMessages((prev) => prev.map(applyOptimistic));
    setSelectedCompleted((cur) => (cur ? applyOptimistic(cur) : cur));

    try {
      const res = await apiFetch<{
        message_id: string;
        reactions: SignalReactionsMap;
        user_reaction: SignalReactionType | null;
        viewer_key?: string;
      }>(`/api/signals/messages/${msg.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      });

      if (res.viewer_key) viewerKeyRef.current = res.viewer_key;

      const reconcile = (m: SignalChatMessage): SignalChatMessage =>
        m.id === res.message_id
          ? { ...m, reactions: res.reactions, user_reaction: res.user_reaction }
          : m;
      setActiveMessages((prev) => prev.map(reconcile));
      setCompletedMessages((prev) => prev.map(reconcile));
      setSelectedCompleted((cur) => (cur ? reconcile(cur) : cur));
    } catch (err) {
      setActiveMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      setCompletedMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      setSelectedCompleted((cur) => (cur?.id === msg.id ? msg : cur));
      if (err instanceof Error && err.message) {
        setReactionNotice(err.message);
        setTimeout(() => setReactionNotice(null), 3000);
      }
    }
  };

  // Admin Edit / Pin / Complete / Delete handlers
  const handleStartEdit = (msg: SignalChatMessage) => {
    setEditingMsgId(msg.id);
    setEditDraftText(msg.content);
    setEditDraftType(msg.message_type);
    setEditDraftImageUrl(msg.image_url || null);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (msgId: string) => {
    if (!editDraftText.trim() && !editDraftImageUrl) return;
    setSavingEdit(true);
    try {
      const res = await apiFetch<{ message: SignalChatMessage }>(`/api/signals/messages/${msgId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          content: editDraftText.trim(),
          message_type: editDraftType,
          image_url: editDraftImageUrl,
        }),
      });
      setActiveMessages((prev) => prev.map((m) => (m.id === msgId ? res.message : m)));
      setPinnedMessages((prev) => prev.map((m) => (m.id === msgId ? res.message : m)));
      setCompletedMessages((prev) => prev.map((m) => (m.id === msgId ? res.message : m)));
      setSelectedCompleted((cur) => (cur?.id === msgId ? res.message : cur));
      setEditingMsgId(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleTogglePin = async (msg: SignalChatMessage) => {
    const res = await apiFetch<{ message: SignalChatMessage }>(`/api/signals/messages/${msg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !msg.pinned }),
    });
    setActiveMessages((prev) => prev.map((m) => (m.id === msg.id ? res.message : m)));
    setPinnedMessages((prev) => {
      const filtered = prev.filter((m) => m.id !== msg.id);
      return res.message.pinned ? [res.message, ...filtered] : filtered;
    });
  };

  const handleMarkCompleted = async () => {
    if (!completingMsg) return;
    setSubmittingComplete(true);
    try {
      const res = await apiFetch<{ message: SignalChatMessage }>(
        `/api/signals/messages/${completingMsg.id}`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            status: 'completed',
            completed_summary: completeSummary.trim() || null,
          }),
        }
      );
      setActiveMessages((prev) => prev.filter((m) => m.id !== completingMsg.id));
      setPinnedMessages((prev) => prev.filter((m) => m.id !== completingMsg.id));
      setCompletedMessages((prev) => [res.message, ...prev.filter((m) => m.id !== res.message.id)]);
      setCompletedCount((c) => c + 1);
      setCompletingMsg(null);
      setCompleteSummary('');
    } finally {
      setSubmittingComplete(false);
    }
  };

  const handleRestoreToActive = async (msg: SignalChatMessage) => {
    const res = await apiFetch<{ message: SignalChatMessage }>(`/api/signals/messages/${msg.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: 'active' }),
    });
    setCompletedMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setSelectedCompleted(null);
    setActiveMessages((prev) =>
      [...prev.filter((m) => m.id !== res.message.id), res.message].sort((a, b) =>
        a.created_at.localeCompare(b.created_at)
      )
    );
    setCompletedCount((c) => Math.max(0, c - 1));
    setView('chat');
  };

  const handleDeleteMessage = async (msgId: string) => {
    await apiFetch(`/api/signals/messages/${msgId}`, { method: 'DELETE' });
    setActiveMessages((prev) => prev.filter((m) => m.id !== msgId));
    setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
    setDraftMessages((prev) => prev.filter((m) => m.id !== msgId));
    setCompletedMessages((prev) => prev.filter((m) => m.id !== msgId));
    setSelectedCompleted((cur) => (cur?.id === msgId ? null : cur));
    setConfirmDeleteId(null);
  };

  const jumpToMessage = useCallback((msgId: string) => {
    const node = messageRefs.current.get(msgId);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedMsgId(msgId);
      setTimeout(() => setHighlightedMsgId((cur) => (cur === msgId ? null : cur)), 2400);
    }
  }, []);

  const focusSignalMessageById = useCallback(
    async (msgId: string) => {
      if (!msgId) return;
      const inActive = activeMessages.some((m) => m.id === msgId);
      if (inActive) {
        setView('chat');
        requestAnimationFrame(() => jumpToMessage(msgId));
        return;
      }

      try {
        const res = await apiFetch<{ message: SignalChatMessage }>(
          `/api/signals/messages/${encodeURIComponent(msgId)}`
        );
        if (res.message.status === 'completed') {
          setView('completed');
          setSelectedCompleted(res.message);
        } else if (res.message.status === 'active') {
          setView('chat');
          setActiveMessages((prev) =>
            prev.some((m) => m.id === res.message.id)
              ? prev
              : [...prev, res.message].sort((a, b) => a.created_at.localeCompare(b.created_at))
          );
          requestAnimationFrame(() => {
            setTimeout(() => jumpToMessage(msgId), 60);
          });
        }
      } catch {
        // ignore unknown/deleted target id
      }
    },
    [activeMessages, jumpToMessage]
  );

  // Handle deep-linked ?message=<id> from push notifications or direct URLs
  useEffect(() => {
    if (activeLoading) return;
    const params = new URLSearchParams(window.location.search);
    const targetId = params.get('message');
    if (targetId && handledDeepLinkRef.current !== targetId) {
      handledDeepLinkRef.current = targetId;
      focusSignalMessageById(targetId);
    }
  }, [activeLoading, focusSignalMessageById]);

  useEffect(() => {
    const onLocationOrHighlight = (evt: Event) => {
      const customDetail = (evt as CustomEvent<{ messageId?: string }>).detail;
      const params = new URLSearchParams(window.location.search);
      const targetId = customDetail?.messageId || params.get('message');
      if (targetId) {
        handledDeepLinkRef.current = targetId;
        focusSignalMessageById(targetId);
      }
    };
    window.addEventListener('mfx:locationchange', onLocationOrHighlight);
    window.addEventListener('mfx:highlight-signal-message', onLocationOrHighlight);
    return () => {
      window.removeEventListener('mfx:locationchange', onLocationOrHighlight);
      window.removeEventListener('mfx:highlight-signal-message', onLocationOrHighlight);
    };
  }, [focusSignalMessageById]);

  // Group Active messages with day separators
  const activeWithDividers = useMemo(() => {
    const items: Array<
      | { kind: 'day'; key: string; label: string }
      | { kind: 'msg'; key: string; msg: SignalChatMessage }
    > = [];
    let lastDay = '';
    for (const msg of activeMessages) {
      const dayLabel = formatDayHeading(msg.created_at);
      if (dayLabel && dayLabel !== lastDay) {
        items.push({ kind: 'day', key: `day-${msg.id}`, label: dayLabel });
        lastDay = dayLabel;
      }
      items.push({ kind: 'msg', key: msg.id, msg });
    }
    return items;
  }, [activeMessages]);

  const latestPinned = pinnedMessages[0] || null;

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden bg-[#E9EEF3] dark:bg-[#0B111E]">
      {/* LIVE CHAT CHANNEL VIEW (DEFAULT) */}
      {view === 'chat' && (
        <>
          {/* Compact Telegram-Style Channel Header */}
          <header className="px-3 sm:px-5 h-14 border-b border-slate-200 dark:border-slate-800/90 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-2 shrink-0 z-20">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#881337] text-white flex items-center justify-center font-display font-bold text-xs shrink-0 overflow-hidden">
                {!avatarFailed ? (
                  <img
                    src="/pwa-192x192.png"
                    alt="MeridianFX"
                    onError={() => setAvatarFailed(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>MFX</span>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1 min-w-0">
                  <h1 className="text-sm sm:text-[15px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                    MeridianFX Signal Channel
                  </h1>
                  <BadgeCheck
                    className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0"
                    aria-label="Verified channel"
                  />
                </div>
                <p
                  className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs text-[#15803D] dark:text-emerald-400 font-semibold truncate leading-tight tabular-nums"
                  title="Estimated community activity"
                >
                  <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <span>
                    {estimatedMembers.toLocaleString()} active now
                  </span>
                </p>
              </div>
            </div>

            {/* Channel Header Toolbar: Push Alerts + Info */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowNotifModal(true)}
                aria-label={pushSubscribed ? 'Push notifications active' : 'Enable push notifications'}
                title={pushSubscribed ? 'Push alerts enabled on this device' : 'Enable real-time push alerts'}
                className={`relative min-h-[38px] px-2.5 flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  pushSubscribed
                    ? 'text-[#15803D] dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/30 hover:bg-emerald-100/80'
                    : 'text-[#881337] dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 hover:bg-rose-100/70'
                }`}
              >
                {pushSubscribed ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                <span className="hidden sm:inline">
                  {pushSubscribed ? 'Alerts On' : 'Get Alerts'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowChannelInfo(true)}
                aria-label="Channel info and settings"
                title="Channel info & settings"
                className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg text-slate-500 hover:text-[#881337] hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Compact Pinned Announcement Strip */}
          {latestPinned && (
            <button
              type="button"
              onClick={() => jumpToMessage(latestPinned.id)}
              className="w-full px-3.5 sm:px-5 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111A2B]/95 backdrop-blur-xs flex items-center justify-between gap-3 text-left hover:bg-rose-50/60 dark:hover:bg-rose-950/20 transition-colors shrink-0 z-10"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-0.5 h-5 rounded-full bg-[#881337] dark:bg-rose-400 shrink-0" />
                <Pin className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400 shrink-0" />
                <div className="min-w-0 flex items-baseline gap-1.5">
                  <span className="text-[11px] font-bold text-[#881337] dark:text-rose-400 shrink-0">
                    Pinned Message
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate">
                    {latestPinned.content || latestPinned.image_name || 'Pinned chart update'}
                  </span>
                </div>
              </div>
              {pinnedMessages.length > 1 && (
                <span className="text-[11px] font-mono text-slate-400 shrink-0">
                  +{pinnedMessages.length - 1}
                </span>
              )}
            </button>
          )}

          {/* Rate limit / transient reaction notice */}
          {reactionNotice && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shrink-0">
              <span>{reactionNotice}</span>
              <button
                type="button"
                onClick={() => setReactionNotice(null)}
                className="font-bold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Full-Screen Scrollable Conversation Area */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-5 lg:px-8 py-3 sm:py-4 space-y-2.5"
            >
              <div className="mx-auto max-w-3xl space-y-2.5">
                {loadingOlder && (
                  <div className="flex justify-center py-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/85 dark:bg-slate-800/90 px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-300 shadow-xs">
                      <Loader2 className="w-3 h-3 animate-spin text-[#881337]" />
                      Loading older messages...
                    </span>
                  </div>
                )}

                {activeHasMore && !loadingOlder && (
                  <div className="flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={handleLoadOlderActive}
                      className="rounded-full bg-white/80 dark:bg-slate-800/80 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#881337] shadow-xs transition-colors"
                    >
                      Scroll up or tap for older messages
                    </button>
                  </div>
                )}

                {activeLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 rounded-full bg-white dark:bg-[#151E2E] px-4 py-2 text-xs text-slate-500 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[#881337]" />
                      <span>Connecting to channel...</span>
                    </div>
                  </div>
                ) : activeWithDividers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="rounded-2xl bg-white/95 dark:bg-[#151E2E] px-6 py-6 max-w-sm shadow-xs space-y-2">
                      <MessageSquareText className="w-7 h-7 text-[#881337] dark:text-rose-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        MeridianFX Signal Channel
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        {isAdmin
                          ? 'Publish your first real-time message, trading setup, or chart image using the composer below.'
                          : 'Live trading signals, chart analysis, and instant desk broadcasts appear here automatically.'}
                      </p>
                    </div>
                  </div>
                ) : (
                  activeWithDividers.map((item) => {
                    if (item.kind === 'day') {
                      return (
                        <div key={item.key} className="flex justify-center py-1.5 sticky top-1 z-10 pointer-events-none">
                          <span className="rounded-full bg-slate-900/15 dark:bg-slate-800/90 backdrop-blur-xs px-3 py-0.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const msg = item.msg;
                    const isEditing = editingMsgId === msg.id;
                    const isConfirmingDelete = confirmDeleteId === msg.id;
                    const isHighlighted = highlightedMsgId === msg.id;

                    return (
                      <div
                        key={item.key}
                        ref={(el) => {
                          if (el) messageRefs.current.set(msg.id, el);
                          else messageRefs.current.delete(msg.id);
                        }}
                        className="flex justify-start"
                      >
                        <div
                          className={`w-full max-w-[94%] sm:max-w-[82%] lg:max-w-[660px] rounded-2xl rounded-tl-xs px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-[0_1px_2px_rgba(15,23,42,0.06)] transition-all ${
                            isHighlighted
                              ? 'bg-rose-50 dark:bg-rose-950/40 ring-2 ring-[#881337]'
                              : msg.pinned
                                ? 'bg-white dark:bg-[#151E2E] ring-1 ring-[#881337]/30 dark:ring-rose-500/35'
                                : 'bg-white dark:bg-[#151E2E]'
                          }`}
                        >
                          {/* Compact Sender Line + Admin Controls */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-[#881337] dark:text-rose-400">
                                {msg.author_name || 'MeridianFX'}
                              </span>
                              <span className="text-[11px] font-medium text-[#15803D] dark:text-emerald-400">
                                · {MESSAGE_TYPE_LABELS[msg.message_type] || 'Update'}
                              </span>
                              {isAdmin && (
                                <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                                  · Published
                                </span>
                              )}
                              {msg.pinned && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#881337] dark:text-rose-400">
                                  · <Pin className="w-3 h-3" /> Pinned
                                </span>
                              )}
                            </div>

                            {isAdmin && !isEditing && (
                              <div className="flex items-center gap-0.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(msg)}
                                  title={msg.pinned ? 'Unpin message' : 'Pin message'}
                                  aria-label={msg.pinned ? 'Unpin message' : 'Pin message'}
                                  className="p-1.5 rounded-md text-slate-400 hover:text-[#881337] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  {msg.pinned ? (
                                    <PinOff className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400" />
                                  ) : (
                                    <Pin className="w-3.5 h-3.5" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleStartEdit(msg)}
                                  title="Edit message"
                                  aria-label="Edit message"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCompletingMsg(msg);
                                    setCompleteSummary('');
                                  }}
                                  title="Move to Completed Updates"
                                  aria-label="Move to Completed Updates"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-[#15803D] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setConfirmDeleteId(isConfirmingDelete ? null : msg.id)
                                  }
                                  title="Delete message"
                                  aria-label="Delete message"
                                  className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Delete Confirmation Inline Bar */}
                          {isAdmin && isConfirmingDelete && (
                            <div className="mb-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 px-3 py-2 flex items-center justify-between gap-2 text-xs">
                              <span className="text-red-700 dark:text-red-300 font-medium">
                                Delete this message?
                              </span>
                              <div className="flex items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2.5 py-1 rounded border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="px-2.5 py-1 rounded bg-red-600 text-white font-semibold hover:bg-red-700"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Edit Mode vs Message Content */}
                          {isEditing ? (
                            <div className="space-y-2 py-1">
                              <select
                                value={editDraftType}
                                onChange={(e) =>
                                  setEditDraftType(e.target.value as SignalChatMessageType)
                                }
                                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white"
                              >
                                <option value="signal">Trading Signal</option>
                                <option value="update">Market Update</option>
                                <option value="analysis">Chart Analysis</option>
                                <option value="announcement">Announcement</option>
                              </select>

                              <textarea
                                rows={3}
                                value={editDraftText}
                                onChange={(e) => setEditDraftText(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                              />

                              {editDraftImageUrl && (
                                <div className="flex items-center justify-between gap-2 rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs">
                                  <span className="truncate text-slate-600 dark:text-slate-300">
                                    Image attachment kept
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setEditDraftImageUrl(null)}
                                    className="text-red-600 hover:underline shrink-0"
                                  >
                                    Remove
                                  </button>
                                </div>
                              )}

                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() => setEditingMsgId(null)}
                                  className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300"
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  disabled={savingEdit}
                                  onClick={() => handleSaveEdit(msg.id)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#881337] px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{savingEdit ? 'Saving...' : 'Save'}</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              {msg.image_url && (
                                <div className={msg.content ? 'mb-2.5' : 'mb-1'}>
                                  <ChatImageAttachment
                                    src={msg.image_url}
                                    alt={msg.image_name || 'Trading chart attachment'}
                                    onOpen={setLightboxUrl}
                                  />
                                </div>
                              )}

                              {msg.content && (
                                <p className="text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">
                                  {renderMessageText(msg.content)}
                                </p>
                              )}
                            </>
                          )}

                          {/* Telegram-Style 5-Emoji Reaction Row + Timestamp */}
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 pt-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {REACTION_OPTIONS.map((opt) => {
                                const count = msg.reactions?.[opt.key] ?? 0;
                                const active = msg.user_reaction === opt.key;
                                return (
                                  <button
                                    key={opt.key}
                                    type="button"
                                    onClick={() => handleReact(msg, opt.key)}
                                    aria-pressed={active}
                                    aria-label={`${opt.label} (${count})`}
                                    title={opt.label}
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors min-h-[30px] ${
                                      active
                                        ? opt.activeClass
                                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <span aria-hidden="true">{opt.emoji}</span>
                                    <span className="font-mono text-[11px] tabular-nums">{count}</span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0 ml-auto">
                              {msg.edited_at && <span className="font-sans">edited</span>}
                              <time dateTime={msg.created_at}>{formatChatTime(msg.created_at)}</time>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Floating Scroll to Latest Button */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                aria-label="Scroll to latest messages"
                className="absolute bottom-3 right-3 sm:right-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#151E2E] text-[#881337] dark:text-rose-400 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold shadow-md hover:bg-slate-50 transition-transform active:scale-95"
              >
                <ArrowDown className="w-4 h-4" />
                {hasUnseenBelow && <span>New</span>}
              </button>
            )}
          </div>

          {/* Fixed Bottom Composer (Admin Only) */}
          {isAdmin && (
            <form
              onSubmit={(e) => handleSendMessage(e, false)}
              className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] px-3 sm:px-5 py-2.5 space-y-2 shrink-0 z-20"
            >
              <div className="mx-auto max-w-3xl space-y-2">
                {/* Post-Publish Public & Push Delivery Confirmation Banner */}
                {publishConfirmation && (
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/90 dark:bg-emerald-950/30 px-3 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="space-y-0.5 min-w-0">
                      <p className="font-bold text-[#15803D] dark:text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>{publishConfirmation.label}</span>
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 font-mono tabular-nums">
                        {publishConfirmation.pushJob
                          ? `Push queued: ${publishConfirmation.pushJob.queued_count} · Delivered: ${publishConfirmation.pushJob.delivered_count} · Failures: ${publishConfirmation.pushJob.failed_count} (Targeted: ${publishConfirmation.pushJob.total_targeted})`
                          : 'Push notification skipped for this post.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPublishConfirmation(null)}
                      className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0"
                      aria-label="Dismiss publish confirmation"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Admin Drafts Strip */}
                {showDrafts && draftMessages.length > 0 && (
                  <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-2.5 space-y-2 max-h-44 overflow-y-auto">
                    <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                      <span>Private Admin Drafts ({draftMessages.length}) — not visible publicly</span>
                      <button
                        type="button"
                        onClick={() => setShowDrafts(false)}
                        className="underline font-semibold"
                      >
                        Hide
                      </button>
                    </div>
                    {draftMessages.map((draft) => (
                      <div
                        key={draft.id}
                        className="rounded-lg bg-white dark:bg-slate-900 border border-amber-200/70 dark:border-slate-800 px-3 py-2 flex items-center justify-between gap-2 text-xs"
                      >
                        <div className="min-w-0">
                          <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400 mr-1.5">
                            [Draft · {MESSAGE_TYPE_LABELS[draft.message_type]}]
                          </span>
                          <span className="text-slate-700 dark:text-slate-200 truncate block">
                            {draft.content || draft.image_name || 'Image attachment'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            disabled={publishingDraftId === draft.id}
                            onClick={() => handlePublishDraft(draft)}
                            className="rounded-md bg-[#15803D] px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
                          >
                            {publishingDraftId === draft.id ? 'Publishing...' : 'Publish & Notify'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMessage(draft.id)}
                            className="p-1 text-slate-400 hover:text-red-600"
                            aria-label="Delete draft"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Compact Composer Controls Strip */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={composerType}
                      onChange={(e) => setComposerType(e.target.value as SignalChatMessageType)}
                      aria-label="Message type"
                      className="rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200"
                    >
                      <option value="signal">Trading Signal</option>
                      <option value="update">Market Update</option>
                      <option value="analysis">Chart Analysis</option>
                      <option value="announcement">Announcement</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => setComposerPinned((v) => !v)}
                      className={`inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-semibold transition-colors ${
                        composerPinned
                          ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      <Pin className="w-3 h-3" />
                      <span>{composerPinned ? 'Pinned' : 'Pin'}</span>
                    </button>

                    {draftMessages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowDrafts((s) => !s)}
                        className="inline-flex items-center gap-1 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-2 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300"
                      >
                        <span>Drafts ({draftMessages.length})</span>
                      </button>
                    )}
                  </div>

                  <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={composerPush}
                      onChange={(e) => setComposerPush(e.target.checked)}
                      className="accent-[#881337] w-3.5 h-3.5"
                    />
                    <span>Auto Push Alert</span>
                  </label>
                </div>

                {/* Image Preview Strip */}
                {(attachmentPreview || attachmentUrl) && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={attachmentPreview || attachmentUrl || ''}
                        alt="Attachment preview"
                        className="w-11 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                          {attachmentName || 'Chart screenshot'}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {uploadingImage ? 'Uploading...' : 'Ready to send'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleCancelAttachment}
                      className="p-2 rounded-lg text-slate-500 hover:text-red-600 shrink-0"
                      aria-label="Remove attachment"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {composerError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {composerError}
                  </p>
                )}

                {/* Input Bar */}
                <div className="flex items-end gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleSelectImage(e.target.files?.[0])}
                  />

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage || sendingMessage || savingDraft}
                    title="Attach image or chart screenshot"
                    aria-label="Attach image"
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-200 hover:text-[#881337] disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <ImagePlus className="w-5 h-5" />
                    )}
                  </button>

                  <textarea
                    ref={composerInputRef}
                    rows={1}
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                        e.preventDefault();
                        handleSendMessage(undefined, false);
                      }
                    }}
                    placeholder="Broadcast message, signal, or market update..."
                    className="flex-1 min-h-[44px] max-h-28 resize-y rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                  />

                  <button
                    type="button"
                    disabled={
                      sendingMessage || savingDraft || uploadingImage || (!composerText.trim() && !attachmentUrl)
                    }
                    onClick={() => handleSendMessage(undefined, true)}
                    title="Save privately as draft without publishing"
                    className="min-h-[44px] px-2.5 sm:px-3 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {savingDraft ? 'Saving...' : 'Draft'}
                  </button>

                  <button
                    type="submit"
                    disabled={
                      sendingMessage || savingDraft || uploadingImage || (!composerText.trim() && !attachmentUrl)
                    }
                    aria-label="Publish live message"
                    className="min-h-[44px] min-w-[44px] sm:px-4 rounded-xl bg-[#881337] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:bg-[#6B0F2B] disabled:opacity-50 shrink-0 transition-colors"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    <span className="hidden sm:inline">Publish</span>
                  </button>
                </div>
              </div>
            </form>
          )}
        </>
      )}

      {/* COMPLETED UPDATES ARCHIVE VIEW (INSIDE CHANNEL) */}
      {view === 'completed' && (
        <div className="flex-1 min-h-0 flex flex-col bg-[#F4F6F9] dark:bg-[#090D16]">
          <header className="px-3 sm:px-5 h-14 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setView('chat')}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#881337] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 min-h-[38px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Chat</span>
              </button>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">
                |
              </span>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                Completed Updates
              </h2>
            </div>

            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums shrink-0">
              {completedCount} archived
            </span>
          </header>

          <div className="flex-1 overflow-y-auto px-3 sm:px-5 lg:px-8 py-4 space-y-4">
            <div className="mx-auto max-w-4xl space-y-4">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={completedSearch}
                  onChange={(e) => setCompletedSearch(e.target.value)}
                  placeholder="Search completed trading setups or updates..."
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] pl-10 pr-4 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                />
              </div>

              {completedLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#881337]" />
                    <span>Loading completed updates...</span>
                  </div>
                </div>
              ) : completedMessages.length === 0 ? (
                <div className="rounded-2xl bg-white dark:bg-[#111827] p-10 text-center shadow-xs">
                  <Archive className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                    No completed updates yet
                  </p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Concluded trading setups archived by the administrator appear here chronologically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pb-4">
                  {completedMessages.map((msg) => (
                    <article
                      key={msg.id}
                      onClick={() => setSelectedCompleted(msg)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCompleted(msg);
                        }
                      }}
                      className="cursor-pointer rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800 p-4 space-y-2.5 hover:border-[#881337]/50 transition-colors flex flex-col justify-between shadow-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-semibold text-[#15803D] dark:text-emerald-400 inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{MESSAGE_TYPE_LABELS[msg.message_type]}</span>
                          </span>
                          <span className="font-mono text-[11px] text-slate-400 tabular-nums shrink-0">
                            {formatLocalDateTime(msg.completed_at || msg.created_at)}
                          </span>
                        </div>

                        {msg.completed_summary && (
                          <p className="text-xs font-semibold text-[#881337] dark:text-rose-400">
                            Outcome: {msg.completed_summary}
                          </p>
                        )}

                        {msg.content && (
                          <p className="text-sm text-slate-700 dark:text-slate-200 line-clamp-3 whitespace-pre-wrap break-words leading-relaxed">
                            {msg.content}
                          </p>
                        )}

                        {msg.image_url && (
                          <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 h-36">
                            <img
                              src={msg.image_url}
                              alt={msg.image_name || 'Archived chart'}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                          {REACTION_OPTIONS.map((opt) => (
                            <span key={opt.key} title={opt.label}>
                              {opt.emoji} {msg.reactions?.[opt.key] ?? 0}
                            </span>
                          ))}
                        </div>
                        <span className="font-semibold text-[#881337] dark:text-rose-400 shrink-0">
                          Open details
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {completedHasMore && (
                <div className="flex justify-center pb-6">
                  <button
                    type="button"
                    onClick={handleLoadMoreCompleted}
                    disabled={loadingMoreCompleted}
                    className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:border-[#881337]/50 disabled:opacity-60"
                  >
                    {loadingMoreCompleted ? 'Loading...' : 'Load older completed updates'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Channel Info & Quick Settings Modal */}
      {showChannelInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowChannelInfo(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-[#881337] text-white flex items-center justify-center font-display font-bold text-sm overflow-hidden shrink-0">
                  {!avatarFailed ? (
                    <img src="/pwa-192x192.png" alt="MeridianFX" className="w-full h-full object-cover" />
                  ) : (
                    'MFX'
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      MeridianFX Signal Channel
                    </h3>
                    <BadgeCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Verified Broadcast Channel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChannelInfo(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white"
                aria-label="Close channel info"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-900/80 p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Estimated Activity</span>
                <span className="font-mono font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                  {estimatedMembers.toLocaleString()} active now
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Live Connected Devices</span>
                <span className="font-mono font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                  {realOnlineCount} online · {wsConnected ? 'Live Sync' : 'Reconnecting'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 dark:text-slate-400">Completed Updates Archive</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                  {completedCount} items
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setShowChannelInfo(false);
                  setView('completed');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-semibold text-slate-700 dark:text-slate-200 hover:border-[#881337]/50"
              >
                <Archive className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400" />
                <span>Completed Archive</span>
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-semibold text-slate-700 dark:text-slate-200"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowChannelInfo(false);
                  setShowNotifModal(true);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-semibold text-slate-700 dark:text-slate-200 hover:border-[#15803D]/50"
              >
                <BellRing className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
                <span>Push Alerts Setup</span>
              </button>

              {user && (
                <button
                  type="button"
                  onClick={() => {
                    setShowChannelInfo(false);
                    navigate('/notifications');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 py-2.5 font-semibold text-slate-700 dark:text-slate-200"
                >
                  <Bell className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
                  <span>Alerts {unreadCount > 0 ? `(${unreadCount})` : ''}</span>
                </button>
              )}

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => {
                    setShowChannelInfo(false);
                    navigate('/admin');
                  }}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#881337] text-white py-2.5 font-semibold hover:bg-[#6B0F2B]"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>Admin Desk</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Detail Modal */}
      {selectedCompleted && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4"
          onClick={() => setSelectedCompleted(null)}
        >
          <div
            className="w-full max-w-2xl max-h-[88vh] overflow-y-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 sm:p-6 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Completed {MESSAGE_TYPE_LABELS[selectedCompleted.message_type]}</span>
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Posted {formatLocalDateTime(selectedCompleted.created_at)} · Archived{' '}
                  {formatLocalDateTime(selectedCompleted.completed_at || selectedCompleted.created_at)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompleted(null)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white"
                aria-label="Close detail view"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedCompleted.completed_summary && (
              <div className="rounded-xl bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
                <strong className="text-[#15803D] dark:text-emerald-400">Outcome Summary:</strong>{' '}
                {selectedCompleted.completed_summary}
              </div>
            )}

            {selectedCompleted.image_url && (
              <ChatImageAttachment
                src={selectedCompleted.image_url}
                alt={selectedCompleted.image_name || 'Archived signal chart'}
                onOpen={setLightboxUrl}
              />
            )}

            {selectedCompleted.content && (
              <p className="text-sm sm:text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">
                {renderMessageText(selectedCompleted.content)}
              </p>
            )}

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {REACTION_OPTIONS.map((opt) => {
                  const count = selectedCompleted.reactions?.[opt.key] ?? 0;
                  const active = selectedCompleted.user_reaction === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => handleReact(selectedCompleted, opt.key)}
                      aria-pressed={active}
                      aria-label={`${opt.label} (${count})`}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? opt.activeClass
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span aria-hidden="true">{opt.emoji}</span>
                      <span className="font-mono tabular-nums">{count}</span>
                    </button>
                  );
                })}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreToActive(selectedCompleted)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore to Chat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMessage(selectedCompleted.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Archive Confirmation Modal */}
      {completingMsg && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4"
          onClick={() => setCompletingMsg(null)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Move Setup to Completed Updates
              </h3>
              <button
                type="button"
                onClick={() => setCompletingMsg(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Moves this update out of the live chat stream into the Completed Updates archive.
            </p>
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Outcome / Summary Note (optional)
              </label>
              <input
                type="text"
                value={completeSummary}
                onChange={(e) => setCompleteSummary(e.target.value)}
                placeholder="e.g. TP1 & TP2 reached (+85 pips), position closed."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setCompletingMsg(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingComplete}
                onClick={handleMarkCompleted}
                className="rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60"
              >
                {submittingComplete ? 'Moving...' : 'Move to Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Chart Image Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            onClick={() => setLightboxUrl(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Close image preview"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Expanded chart attachment"
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[88vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
