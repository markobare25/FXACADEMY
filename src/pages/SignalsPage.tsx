import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowDown,
  Check,
  CheckCircle2,
  ChevronDown,
  Edit3,
  Heart,
  ImagePlus,
  Loader2,
  Lock,
  MessageSquareText,
  Pin,
  PinOff,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  ThumbsUp,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { usePlatform, type SignalChatWsEvent } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime, uploadMediaFile } from '../lib/api';
import type {
  SignalChatMessage,
  SignalChatMessageType,
  SignalReactionType,
} from '../types';

type SignalsTab = 'active' | 'completed';

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
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/70 px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-400">
        Chart image attachment unavailable
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(src)}
      className="block w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-100 dark:bg-slate-900 focus-visible:outline-2 focus-visible:outline-[#881337]"
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
  const { user, navigate, onlineCount, wsConnected, subscribeSignalChatEvents } = usePlatform();
  const isAdmin = user?.role === 'admin';

  const [tab, setTab] = useState<SignalsTab>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') === 'completed' ? 'completed' : 'active';
  });

  useEffect(() => {
    const syncTabFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab === 'completed' || urlTab === 'active') {
        setTab(urlTab);
      }
    };
    window.addEventListener('popstate', syncTabFromUrl);
    window.addEventListener('mfx:locationchange', syncTabFromUrl);
    return () => {
      window.removeEventListener('popstate', syncTabFromUrl);
      window.removeEventListener('mfx:locationchange', syncTabFromUrl);
    };
  }, []);

  const selectTab = (next: SignalsTab) => {
    setTab(next);
    const nextUrl = `/signals?tab=${next}`;
    if (`${window.location.pathname}${window.location.search}` !== nextUrl) {
      window.history.replaceState({}, '', nextUrl);
    }
  };

  // Active chat state
  const [activeMessages, setActiveMessages] = useState<SignalChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<SignalChatMessage[]>([]);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [activeLoading, setActiveLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [realOnlineCount, setRealOnlineCount] = useState(onlineCount);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [hasUnseenBelow, setHasUnseenBelow] = useState(false);

  // Completed archive state
  const [completedMessages, setCompletedMessages] = useState<SignalChatMessage[]>([]);
  const [completedHasMore, setCompletedHasMore] = useState(false);
  const [completedLoading, setCompletedLoading] = useState(false);
  const [loadingMoreCompleted, setLoadingMoreCompleted] = useState(false);
  const [completedSearch, setCompletedSearch] = useState('');
  const [selectedCompleted, setSelectedCompleted] = useState<SignalChatMessage | null>(null);

  // Fluctuating Estimated Community Membership figure (45,670 - 78,900)
  const [estimatedMembers, setEstimatedMembers] = useState<number>(() => 54820);
  const estimatedTargetRef = useRef<number>(54820);

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
  const [composerError, setComposerError] = useState<string | null>(null);

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
  const [authHintMsg, setAuthHintMsg] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

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
  };

  // Load initial Active chat messages
  const fetchActiveMessages = useCallback(async (keepScrollPosition = false) => {
    try {
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        pinned: SignalChatMessage[];
        has_more: boolean;
        counts: { active: number; completed: number };
        online_count: number;
      }>('/api/signals/messages?status=active&limit=40');
      setActiveMessages(res.messages);
      setPinnedMessages(res.pinned);
      setActiveHasMore(res.has_more);
      setActiveCount(res.counts.active);
      setCompletedCount(res.counts.completed);
      if (typeof res.online_count === 'number') {
        setRealOnlineCount(res.online_count);
      }
      if (!keepScrollPosition) {
        requestAnimationFrame(() => scrollToBottom(false));
      }
    } catch {
      // handled gracefully via empty/offline state
    } finally {
      setActiveLoading(false);
    }
  }, [scrollToBottom]);

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
      }>(`/api/signals/messages?${qs.toString()}`);
      setCompletedMessages(res.messages);
      setCompletedHasMore(res.has_more);
      setActiveCount(res.counts.active);
      setCompletedCount(res.counts.completed);
    } catch {
      // ignore
    } finally {
      setCompletedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActiveMessages(false);
  }, [fetchActiveMessages, user?.id]);

  useEffect(() => {
    if (tab === 'completed') {
      fetchCompletedMessages(completedSearch);
    }
  }, [tab, completedSearch, fetchCompletedMessages, user?.id]);

  // Real-time WebSocket subscription for Signal Chat
  useEffect(() => {
    const unsubscribe = subscribeSignalChatEvents((event: SignalChatWsEvent) => {
      switch (event.type) {
        case 'reconnected': {
          fetchActiveMessages(true);
          if (tab === 'completed') fetchCompletedMessages(completedSearch);
          break;
        }
        case 'created': {
          const incoming = event.message;
          if (incoming.status === 'active') {
            setActiveMessages((prev) =>
              prev.some((m) => m.id === incoming.id) ? prev : [...prev, incoming]
            );
            setActiveCount((c) => c + 1);
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
              const next = exists
                ? prev.map((m) => (m.id === updated.id ? { ...updated, user_reaction: m.user_reaction } : m))
                : [...prev, updated].sort((a, b) => a.created_at.localeCompare(b.created_at));
              return next;
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
          const applyReaction = (m: SignalChatMessage): SignalChatMessage => {
            if (m.id !== event.message_id) return m;
            return {
              ...m,
              reactions: event.reactions,
              user_reaction: user && event.actor_id === user.id ? event.reaction : m.user_reaction,
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
    tab,
    scrollToBottom,
    user,
  ]);

  const handleLoadOlderActive = async () => {
    if (loadingOlder || activeMessages.length === 0) return;
    const oldest = activeMessages[0];
    const el = scrollContainerRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const prevTop = el?.scrollTop || 0;

    setLoadingOlder(true);
    try {
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
      }>(`/api/signals/messages?status=active&limit=40&before=${encodeURIComponent(oldest.created_at)}`);
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

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!isAdmin || sendingMessage || uploadingImage) return;
    if (!composerText.trim() && !attachmentUrl) {
      setComposerError('Type a message or attach a chart image.');
      return;
    }

    setSendingMessage(true);
    setComposerError(null);
    const requestId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`;

    try {
      const res = await apiFetch<{ message: SignalChatMessage }>('/api/signals/messages', {
        method: 'POST',
        body: JSON.stringify({
          content: composerText.trim(),
          image_url: attachmentUrl,
          image_name: attachmentName,
          message_type: composerType,
          pinned: composerPinned,
          send_push: composerPush,
          client_request_id: requestId,
        }),
      });
      setActiveMessages((prev) =>
        prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]
      );
      if (res.message.pinned) {
        setPinnedMessages((prev) =>
          prev.some((m) => m.id === res.message.id) ? prev : [res.message, ...prev]
        );
      }
      setComposerText('');
      setComposerPinned(false);
      handleCancelAttachment();
      requestAnimationFrame(() => scrollToBottom(true));
    } catch (err) {
      setComposerError(err instanceof Error ? err.message : 'Unable to publish message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReact = async (msg: SignalChatMessage, reaction: SignalReactionType) => {
    if (!user) {
      setAuthHintMsg('Sign in to react with ❤️ or 👍 to MeridianFX desk messages.');
      setTimeout(() => setAuthHintMsg(null), 4000);
      return;
    }

    const previousReaction = msg.user_reaction;
    const nextReaction: SignalReactionType | null = previousReaction === reaction ? null : reaction;

    // Optimistic update
    const applyOptimistic = (m: SignalChatMessage): SignalChatMessage => {
      if (m.id !== msg.id) return m;
      const counts = { ...m.reactions };
      if (previousReaction === 'love') counts.love = Math.max(0, counts.love - 1);
      if (previousReaction === 'like') counts.like = Math.max(0, counts.like - 1);
      if (nextReaction === 'love') counts.love += 1;
      if (nextReaction === 'like') counts.like += 1;
      return { ...m, reactions: counts, user_reaction: nextReaction };
    };

    setActiveMessages((prev) => prev.map(applyOptimistic));
    setCompletedMessages((prev) => prev.map(applyOptimistic));
    setSelectedCompleted((cur) => (cur ? applyOptimistic(cur) : cur));

    try {
      const res = await apiFetch<{
        message_id: string;
        reactions: { love: number; like: number };
        user_reaction: SignalReactionType | null;
      }>(`/api/signals/messages/${msg.id}/react`, {
        method: 'POST',
        body: JSON.stringify({ reaction }),
      });

      const reconcile = (m: SignalChatMessage): SignalChatMessage =>
        m.id === res.message_id
          ? { ...m, reactions: res.reactions, user_reaction: res.user_reaction }
          : m;
      setActiveMessages((prev) => prev.map(reconcile));
      setCompletedMessages((prev) => prev.map(reconcile));
      setSelectedCompleted((cur) => (cur ? reconcile(cur) : cur));
    } catch {
      // rollback on failure
      setActiveMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
      setCompletedMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
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
      setActiveCount((c) => Math.max(0, c - 1));
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
    setActiveCount((c) => c + 1);
    setCompletedCount((c) => Math.max(0, c - 1));
  };

  const handleDeleteMessage = async (msgId: string) => {
    await apiFetch(`/api/signals/messages/${msgId}`, { method: 'DELETE' });
    setActiveMessages((prev) => prev.filter((m) => m.id !== msgId));
    setPinnedMessages((prev) => prev.filter((m) => m.id !== msgId));
    setCompletedMessages((prev) => prev.filter((m) => m.id !== msgId));
    setSelectedCompleted((cur) => (cur?.id === msgId ? null : cur));
    setConfirmDeleteId(null);
  };

  const jumpToMessage = (msgId: string) => {
    const node = messageRefs.current.get(msgId);
    if (node) {
      node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // Group Active messages with day dividers
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
    <div className="flex flex-col gap-3 sm:gap-4 h-[calc(100dvh-10.75rem)] sm:h-[calc(100dvh-11.5rem)] lg:h-[calc(100vh-8.25rem)] min-h-[420px] max-w-5xl mx-auto w-full overflow-hidden">
      {/* Top Section Header & Only Two Tabs: ACTIVE | COMPLETED */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Signals Community
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time Forex trading desk channel and archived market setups
          </p>
        </div>

        {/* ONLY TWO TABS: ACTIVE & COMPLETED */}
        <div
          role="tablist"
          aria-label="Signals Sections"
          className="inline-flex items-center gap-1 p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 self-start sm:self-auto"
        >
          <button
            role="tab"
            aria-selected={tab === 'active'}
            type="button"
            onClick={() => selectTab('active')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-lg transition-colors whitespace-nowrap min-h-[40px] flex items-center gap-2 ${
              tab === 'active'
                ? 'bg-[#881337] text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>ACTIVE</span>
            <span className="font-mono text-[11px] opacity-85 tabular-nums">{activeCount}</span>
          </button>

          <button
            role="tab"
            aria-selected={tab === 'completed'}
            type="button"
            onClick={() => selectTab('completed')}
            className={`px-4 py-2 text-xs font-bold tracking-wide rounded-lg transition-colors whitespace-nowrap min-h-[40px] flex items-center gap-2 ${
              tab === 'completed'
                ? 'bg-[#881337] text-white shadow-sm'
                : 'text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <span>COMPLETED</span>
            <span className="font-mono text-[11px] opacity-85 tabular-nums">{completedCount}</span>
          </button>
        </div>
      </div>

      {/* SECTION A: ACTIVE — LIVE COMMUNITY CHAT */}
      {tab === 'active' && (
        <section className="flex-1 min-h-0 flex flex-col rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-sm">
          {/* Active Members Header */}
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#881337] text-white flex items-center justify-center font-display font-bold text-sm shrink-0">
                MFX
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                    MeridianFX Signal Channel
                  </h2>
                  <ShieldCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                </div>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-600 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{estimatedMembers.toLocaleString()} Active Members</span>
                  </span>
                  <span aria-hidden="true" className="text-slate-400">
                    ·
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Est. community activity ({realOnlineCount} live connected)
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span
                className={`font-medium ${
                  wsConnected ? 'text-[#15803D] dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {wsConnected ? 'Live Sync' : 'Reconnecting'}
              </span>
            </div>
          </div>

          {/* Pinned Announcement Strip */}
          {latestPinned && (
            <button
              type="button"
              onClick={() => jumpToMessage(latestPinned.id)}
              className="w-full px-4 py-2 border-b border-rose-200/70 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 flex items-center justify-between gap-3 text-left hover:bg-rose-100/60 dark:hover:bg-rose-950/30 transition-colors shrink-0"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Pin className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400 shrink-0" />
                <div className="min-w-0">
                  <span className="text-[11px] font-bold text-[#881337] dark:text-rose-400 mr-1.5">
                    Pinned Announcement:
                  </span>
                  <span className="text-xs text-slate-700 dark:text-slate-200 truncate">
                    {latestPinned.content || latestPinned.image_name || 'Pinned chart update'}
                  </span>
                </div>
              </div>
              {pinnedMessages.length > 1 && (
                <span className="text-[11px] font-mono text-slate-500 shrink-0">
                  +{pinnedMessages.length - 1}
                </span>
              )}
            </button>
          )}

          {/* Auth Hint for Unauthenticated Reactions */}
          {authHintMsg && (
            <div className="px-4 py-2 bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-900/40 flex items-center justify-between gap-3 text-xs text-[#881337] dark:text-rose-300 shrink-0">
              <span>{authHintMsg}</span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="font-bold underline shrink-0"
              >
                Sign In
              </button>
            </div>
          )}

          {/* Vertically Scrolling Conversation */}
          <div className="relative flex-1 min-h-0 flex flex-col bg-[#F4F6F8] dark:bg-[#090D16]">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain px-3 sm:px-5 py-4 space-y-3"
            >
              {activeHasMore && (
                <div className="flex justify-center pb-2">
                  <button
                    type="button"
                    onClick={handleLoadOlderActive}
                    disabled={loadingOlder}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] px-3.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:border-[#881337]/50 disabled:opacity-60"
                  >
                    {loadingOlder ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 rotate-180" />
                    )}
                    <span>{loadingOlder ? 'Loading older...' : 'Load older messages'}</span>
                  </button>
                </div>
              )}

              {activeLoading ? (
                <div className="h-full flex items-center justify-center py-12">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-[#881337]" />
                    <span>Synchronizing live channel...</span>
                  </div>
                </div>
              ) : activeWithDividers.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-2xl bg-[#881337]/10 text-[#881337] dark:text-rose-400 flex items-center justify-center mb-3">
                    <MessageSquareText className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    No active channel messages yet
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500 dark:text-slate-400">
                    {isAdmin
                      ? 'Use the message composer below to publish your first trading update, chart screenshot, or market signal to all members.'
                      : 'Live trading signals, chart breakdowns, and market alerts from the MeridianFX administrator will appear here instantly.'}
                  </p>
                </div>
              ) : (
                activeWithDividers.map((item) => {
                  if (item.kind === 'day') {
                    return (
                      <div key={item.key} className="flex justify-center py-1.5">
                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white/80 dark:bg-[#111827]/90 border border-slate-200/80 dark:border-slate-800 rounded-md px-2.5 py-0.5">
                          {item.label}
                        </span>
                      </div>
                    );
                  }

                  const msg = item.msg;
                  const isEditing = editingMsgId === msg.id;
                  const isConfirmingDelete = confirmDeleteId === msg.id;

                  return (
                    <div
                      key={item.key}
                      ref={(el) => {
                        if (el) messageRefs.current.set(msg.id, el);
                        else messageRefs.current.delete(msg.id);
                      }}
                      className="flex items-start gap-2.5 max-w-3xl"
                    >
                      {/* Admin Sender Avatar */}
                      <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#881337] text-white items-center justify-center text-[11px] font-bold shrink-0 mt-0.5">
                        MFX
                      </div>

                      {/* Message Bubble */}
                      <div
                        className={`flex-1 min-w-0 rounded-2xl rounded-tl-sm border p-3.5 sm:p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ${
                          msg.pinned
                            ? 'bg-white dark:bg-[#111827] border-[#881337]/40 dark:border-rose-500/40'
                            : 'bg-white dark:bg-[#111827] border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        {/* Sender Header + Admin Controls */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                            <span className="text-xs font-bold text-[#881337] dark:text-rose-400">
                              {msg.author_name || 'MeridianFX Admin'}
                            </span>
                            <span className="text-[11px] font-medium text-[#15803D] dark:text-emerald-400">
                              · Official Desk
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              · {MESSAGE_TYPE_LABELS[msg.message_type] || 'Update'}
                            </span>
                            {msg.pinned && (
                              <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#881337] dark:text-rose-400">
                                · <Pin className="w-3 h-3" /> Pinned
                              </span>
                            )}
                          </div>

                          {isAdmin && !isEditing && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => handleTogglePin(msg)}
                                title={msg.pinned ? 'Unpin announcement' : 'Pin announcement'}
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#881337] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label={msg.pinned ? 'Unpin message' : 'Pin message'}
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
                                className="p-1.5 rounded-md text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                aria-label="Edit message"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setCompletingMsg(msg);
                                  setCompleteSummary('');
                                }}
                                title="Archive to Completed"
                                className="p-1.5 rounded-md text-slate-400 hover:text-[#15803D] hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                                aria-label="Mark completed"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : msg.id)}
                                title="Delete message"
                                className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                aria-label="Delete message"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Delete Confirmation Inline Bar */}
                        {isAdmin && isConfirmingDelete && (
                          <div className="mb-3 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 px-3 py-2 flex items-center justify-between gap-2 text-xs">
                            <span className="text-red-700 dark:text-red-300 font-medium">
                              Delete this message permanently?
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

                        {/* Edit Mode vs Display Mode */}
                        {isEditing ? (
                          <div className="space-y-2.5">
                            <select
                              value={editDraftType}
                              onChange={(e) => setEditDraftType(e.target.value as SignalChatMessageType)}
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
                              <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs">
                                <span className="truncate text-slate-600 dark:text-slate-300">
                                  Attached image retained
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setEditDraftImageUrl(null)}
                                  className="text-red-600 hover:underline shrink-0"
                                >
                                  Remove image
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
                              <div className={msg.content ? 'mb-3' : 'mb-1'}>
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

                        {/* Footer: Reactions + Timestamp */}
                        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleReact(msg, 'love')}
                              aria-pressed={msg.user_reaction === 'love'}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-[34px] ${
                                msg.user_reaction === 'love'
                                  ? 'bg-rose-50 border border-[#881337]/40 text-[#881337] dark:bg-rose-500/15 dark:border-rose-400/40 dark:text-rose-300'
                                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <Heart
                                className={`w-3.5 h-3.5 ${
                                  msg.user_reaction === 'love' ? 'fill-current' : ''
                                }`}
                              />
                              <span>Love</span>
                              <span className="font-mono tabular-nums">{msg.reactions.love}</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleReact(msg, 'like')}
                              aria-pressed={msg.user_reaction === 'like'}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors min-h-[34px] ${
                                msg.user_reaction === 'like'
                                  ? 'bg-emerald-50 border border-[#15803D]/40 text-[#15803D] dark:bg-emerald-500/15 dark:border-emerald-400/40 dark:text-emerald-300'
                                  : 'bg-slate-50 border border-slate-200 text-slate-600 hover:border-slate-300 dark:bg-slate-800/70 dark:border-slate-700 dark:text-slate-300'
                              }`}
                            >
                              <ThumbsUp
                                className={`w-3.5 h-3.5 ${
                                  msg.user_reaction === 'like' ? 'fill-current' : ''
                                }`}
                              />
                              <span>Like</span>
                              <span className="font-mono tabular-nums">{msg.reactions.like}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                            {msg.edited_at && <span className="font-sans">Edited ·</span>}
                            <time dateTime={msg.created_at}>{formatChatTime(msg.created_at)}</time>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Floating Jump to Bottom Button */}
            {showScrollBottomBtn && (
              <button
                type="button"
                onClick={() => scrollToBottom(true)}
                className="absolute bottom-3 right-4 z-10 inline-flex items-center gap-1.5 rounded-full bg-[#881337] text-white px-3.5 py-2 text-xs font-semibold shadow-lg hover:bg-[#6B0F2B] transition-transform active:scale-95"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>{hasUnseenBelow ? 'New message' : 'Latest'}</span>
              </button>
            )}
          </div>

          {/* Bottom Bar: Admin Message Composer OR Member Read-Only Channel Notice */}
          {isAdmin ? (
            <form
              onSubmit={handleSendMessage}
              className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-3 sm:p-4 space-y-2.5 shrink-0"
            >
              {/* Composer Options Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={composerType}
                    onChange={(e) => setComposerType(e.target.value as SignalChatMessageType)}
                    aria-label="Message category"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-200"
                  >
                    <option value="signal">Trading Signal</option>
                    <option value="update">Market Update</option>
                    <option value="analysis">Chart Analysis</option>
                    <option value="announcement">Announcement</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setComposerPinned((v) => !v)}
                    className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors ${
                      composerPinned
                        ? 'border-[#881337] bg-rose-50 text-[#881337] dark:bg-rose-950/30 dark:text-rose-300'
                        : 'border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <Pin className="w-3.5 h-3.5" />
                    <span>{composerPinned ? 'Pinned' : 'Pin'}</span>
                  </button>
                </div>

                <label className="inline-flex items-center gap-1.5 text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={composerPush}
                    onChange={(e) => setComposerPush(e.target.checked)}
                    className="accent-[#881337] w-3.5 h-3.5"
                  />
                  <span>Notify subscribers</span>
                </label>
              </div>

              {/* Image Preview before Sending */}
              {(attachmentPreview || attachmentUrl) && (
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={attachmentPreview || attachmentUrl || ''}
                      alt="Attachment preview"
                      className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                        {attachmentName || 'Chart image'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {uploadingImage ? 'Uploading image securely...' : 'Ready to send'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelAttachment}
                    className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-slate-200/60 dark:hover:bg-slate-800 shrink-0"
                    aria-label="Cancel image attachment"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {composerError && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">{composerError}</p>
              )}

              {/* Input Row */}
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
                  disabled={uploadingImage || sendingMessage}
                  title="Attach chart or image"
                  aria-label="Attach image"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:border-[#881337] hover:text-[#881337] disabled:opacity-50 shrink-0 transition-colors"
                >
                  {uploadingImage ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <ImagePlus className="w-5 h-5" />
                  )}
                </button>

                <textarea
                  rows={1}
                  value={composerText}
                  onChange={(e) => setComposerText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && window.innerWidth >= 768) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Broadcast signal, chart analysis, or market update..."
                  className="flex-1 min-h-[44px] max-h-32 resize-y rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                />

                <button
                  type="submit"
                  disabled={
                    sendingMessage || uploadingImage || (!composerText.trim() && !attachmentUrl)
                  }
                  aria-label="Send message"
                  className="min-h-[44px] px-4 rounded-xl bg-[#881337] text-white font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 hover:bg-[#6B0F2B] disabled:opacity-50 shrink-0 transition-colors"
                >
                  {sendingMessage ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">Send</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0F172A] px-4 py-3 flex items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">
                  Only the MeridianFX administrator can publish updates. React with ❤️ or 👍 above.
                </span>
              </div>
              {!user && (
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="font-semibold text-[#881337] dark:text-rose-400 hover:underline shrink-0"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* SECTION B: COMPLETED — ARCHIVED UPDATES */}
      {tab === 'completed' && (
        <section className="flex-1 min-h-0 flex flex-col gap-4 overflow-y-auto pr-0.5">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Archived signals and completed market updates, ordered newest first. Select any item to inspect full details.
            </p>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={completedSearch}
                onChange={(e) => setCompletedSearch(e.target.value)}
                placeholder="Search completed updates..."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111827] pl-9 pr-3 py-2 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
              />
            </div>
          </div>

          {completedLoading ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-12 flex items-center justify-center">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-[#881337]" />
                <span>Loading completed archive...</span>
              </div>
            </div>
          ) : completedMessages.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-10 text-center">
              <Archive className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                No completed updates archived yet
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                When active trading updates or signals are concluded and archived by the administrator, they appear here in chronological order.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
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
                  className="cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 sm:p-5 space-y-3 hover:border-[#881337]/50 transition-colors flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-[#15803D] dark:text-emerald-400 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed · {MESSAGE_TYPE_LABELS[msg.message_type]}</span>
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
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 h-36 bg-slate-100 dark:bg-slate-900">
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

                  <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-[#881337] dark:text-rose-400" />
                        {msg.reactions.love}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <ThumbsUp className="w-3.5 h-3.5 text-[#15803D] dark:text-emerald-400" />
                        {msg.reactions.like}
                      </span>
                    </div>
                    <span className="font-semibold text-[#881337] dark:text-rose-400">
                      View details
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
                {loadingMoreCompleted ? 'Loading...' : 'Load more completed updates'}
              </button>
            </div>
          )}
        </section>
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
              <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/70 dark:bg-emerald-950/20 px-4 py-3 text-xs text-slate-800 dark:text-slate-200">
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
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleReact(selectedCompleted, 'love')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    selectedCompleted.user_reaction === 'love'
                      ? 'bg-rose-50 border border-[#881337]/40 text-[#881337] dark:bg-rose-500/15 dark:text-rose-300'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <Heart
                    className={`w-3.5 h-3.5 ${
                      selectedCompleted.user_reaction === 'love' ? 'fill-current' : ''
                    }`}
                  />
                  <span>Love</span>
                  <span className="font-mono tabular-nums">{selectedCompleted.reactions.love}</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReact(selectedCompleted, 'like')}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                    selectedCompleted.user_reaction === 'like'
                      ? 'bg-emerald-50 border border-[#15803D]/40 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-300'
                      : 'bg-slate-50 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300'
                  }`}
                >
                  <ThumbsUp
                    className={`w-3.5 h-3.5 ${
                      selectedCompleted.user_reaction === 'like' ? 'fill-current' : ''
                    }`}
                  />
                  <span>Like</span>
                  <span className="font-mono tabular-nums">{selectedCompleted.reactions.like}</span>
                </button>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRestoreToActive(selectedCompleted)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore to Active</span>
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

      {/* Archive Confirmation Modal (for moving an Active message to Completed) */}
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
                Move Update to Completed
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
              This moves the message out of the Active chat into the chronological Completed archive.
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
                {submittingComplete ? 'Archiving...' : 'Archive as Completed'}
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
