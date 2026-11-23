import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Archive,
  ArrowDown,
  ArrowLeft,
  BadgeCheck,
  Bell,
  BellOff,
  CheckCircle2,
  Eye,
  Loader2,
  MessageSquareText,
  Moon,
  MoreVertical,
  Pin,
  Search,
  Sun,
  X,
  Zap,
} from 'lucide-react';
import { usePlatform, type SignalChatWsEvent } from '../context/PlatformContext';
import {
  apiFetch,
  formatLocalDateTime,
  getOrCreateVisitorId,
} from '../lib/api';
import {
  getDevicePushPreferences,
  isSignalsMuted,
  muteSignalChannelPush,
  setSignalsMutedLocal,
  unmuteSignalChannelPush,
} from '../lib/pushClient';
import type {
  SignalChatMessage,
  SignalChatMessageType,
  SignalReactionType,
  SignalReactionsMap,
} from '../types';

type ChannelView = 'chat' | 'completed';

const ACTIVE_COUNTER_MIN = 35678;
const ACTIVE_COUNTER_MAX = 98678;

const REACTION_OPTIONS: Array<{
  key: SignalReactionType;
  emoji: string;
  label: string;
  activeClass: string;
}> = [
  { key: 'love', emoji: '❤️', label: 'Love', activeClass: 'bg-[#881337] text-white' },
  { key: 'like', emoji: '🤙', label: 'Shaka', activeClass: 'bg-[#15803D] text-white' },
  { key: 'fire', emoji: '💥', label: 'Fire', activeClass: 'bg-amber-600 text-white' },
  { key: 'hundred', emoji: '💯', label: '100', activeClass: 'bg-indigo-600 text-white' },
];

function emptyReactions(): SignalReactionsMap {
  return { love: 0, like: 0, fire: 0, hundred: 0 };
}

const SIGNAL_TTL_MS = 24 * 60 * 60 * 1000;

function isWithin24HoursOrPinned(msg: SignalChatMessage): boolean {
  if (msg.is_welcome || msg.pinned) return true;
  if (msg.status !== 'active') return true;
  const createdMs = Date.parse(msg.created_at);
  if (!Number.isFinite(createdMs)) return true;
  return Date.now() - createdMs < SIGNAL_TTL_MS;
}

function sortChannelChronological(list: SignalChatMessage[]): SignalChatMessage[] {
  return [...list].sort((a, b) => {
    if (Boolean(a.is_welcome) !== Boolean(b.is_welcome)) {
      return a.is_welcome ? -1 : 1;
    }
    const ta = Date.parse(a.created_at);
    const tb = Date.parse(b.created_at);
    if (Number.isFinite(ta) && Number.isFinite(tb) && ta !== tb) {
      return ta - tb;
    }
    return a.created_at.localeCompare(b.created_at);
  });
}

function formatCompactCount(count: number): string {
  if (!Number.isFinite(count) || count <= 0) return '0';
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1).replace(/\.0$/, '')}K`;
  }
  return String(Math.floor(count));
}

const MESSAGE_TYPE_LABELS: Record<SignalChatMessageType, string> = {
  signal: 'Trading Signal',
  setup: 'Buy / Sell Setup',
  analysis: 'Chart Analysis',
  update: 'Market Update',
  news: 'Economic News Alert',
  announcement: 'Announcement',
};

function formatChatTime(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
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
          className="underline text-[#0284C7] dark:text-sky-400 break-all hover:opacity-80"
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
    authLoading,
    theme,
    toggleTheme,
    navigate,
    subscribeSignalChatEvents,
  } = usePlatform();

  // Default live channel view
  const [view, setView] = useState<ChannelView>('chat');

  // Header Menu
  const [showChannelMenu, setShowChannelMenu] = useState(false);

  // Smoothly fluctuating Active Now counter between 35,678 and 98,678
  const [activeNowCount, setActiveNowCount] = useState<number>(() => {
    return 54200 + Math.floor(Math.random() * 18500);
  });

  // Channel Mute / Unmute state (Unmuted by default)
  const [isMuted, setIsMuted] = useState<boolean>(() => isSignalsMuted());
  const [mutingBusy, setMutingBusy] = useState(false);

  // Active chat state
  const [activeMessages, setActiveMessages] = useState<SignalChatMessage[]>([]);
  const [pinnedMessages, setPinnedMessages] = useState<SignalChatMessage[]>([]);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [activeLoading, setActiveLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
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

  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [channelNotice, setChannelNotice] = useState<string | null>(null);
  const [avatarFailed, setAvatarFailed] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const isNearBottomRef = useRef<boolean>(true);
  const latestCreatedAtRef = useRef<string | null>(null);
  const viewerKeyRef = useRef<string | null>(null);
  const prevUserIdRef = useRef<string | null | undefined>(undefined);
  const messageRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const handledDeepLinkRef = useRef<string | null>(null);

  // Fluctuate live Active Now counter smoothly between 35,678 and 98,678
  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveNowCount((prev) => {
        const step = Math.floor((Math.random() - 0.48) * 1450);
        const next = prev + (step === 0 ? 117 : step);
        if (next < ACTIVE_COUNTER_MIN) return ACTIVE_COUNTER_MIN + Math.floor(Math.random() * 650);
        if (next > ACTIVE_COUNTER_MAX) return ACTIVE_COUNTER_MAX - Math.floor(Math.random() * 650);
        return next;
      });
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Close 3-dot header dropdown on outside click or Escape
  useEffect(() => {
    if (!showChannelMenu) return;
    const handleOutside = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setShowChannelMenu(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowChannelMenu(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showChannelMenu]);

  useEffect(() => {
    const nonWelcome = activeMessages.filter((m) => !m.is_welcome);
    if (nonWelcome.length > 0) {
      latestCreatedAtRef.current = nonWelcome[nonWelcome.length - 1].created_at;
    } else if (activeMessages.length > 0) {
      latestCreatedAtRef.current = null;
    }
  }, [activeMessages]);

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

  // Ensure persistent visitor ID and push mute status are initialized
  useEffect(() => {
    getOrCreateVisitorId();

    let cancelled = false;
    getDevicePushPreferences()
      .then((res) => {
        if (cancelled) return;
        const mutedOnServer =
          typeof res.isMuted === 'boolean'
            ? res.isMuted
            : Boolean(
                res.prefs &&
                  res.prefs.signal_chat === false &&
                  res.prefs.signals === false &&
                  res.prefs.market_updates === false
              );
        setSignalsMutedLocal(mutedOnServer);
        setIsMuted(mutedOnServer);
      })
      .catch(() => {
        // Keep local preference if offline
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load initial Active chat messages
  const fetchActiveMessages = useCallback(
    async (keepScrollPosition = false) => {
      try {
        const qs = new URLSearchParams({
          status: 'active',
          limit: '40',
        });
        const res = await apiFetch<{
          messages: SignalChatMessage[];
          pinned: SignalChatMessage[];
          has_more: boolean;
          counts: { active: number; completed: number };
          online_count: number;
          subscriber_count?: number;
          viewer_key?: string | null;
        }>(`/api/signals/messages?${qs.toString()}`, { cache: 'no-store' });
        if (res.viewer_key) viewerKeyRef.current = res.viewer_key;

        const nextMessages = sortChannelChronological(
          res.messages.filter(isWithin24HoursOrPinned)
        );
        const nextNonWelcome = nextMessages.filter((m) => !m.is_welcome);
        const nextLatestAt =
          nextNonWelcome.length > 0 ? nextNonWelcome[nextNonWelcome.length - 1].created_at : null;
        const hasNewArrival = Boolean(
          nextLatestAt &&
            latestCreatedAtRef.current &&
            nextLatestAt > latestCreatedAtRef.current
        );

        setActiveMessages(nextMessages);
        setPinnedMessages(res.pinned);
        setActiveHasMore(res.has_more);
        setCompletedCount(res.counts.completed);

        if (!keepScrollPosition) {
          requestAnimationFrame(() => scrollToBottom(false));
          window.setTimeout(() => scrollToBottom(false), 60);
        } else if (hasNewArrival) {
          if (isNearBottomRef.current) {
            requestAnimationFrame(() => scrollToBottom(true));
          } else {
            setHasUnseenBelow(true);
          }
        }
      } catch {
        // handled cleanly via empty/offline state
      } finally {
        setActiveLoading(false);
      }
    },
    [scrollToBottom]
  );

  // Delta sync missed messages after reconnection or app wake
  const syncMissedMessages = useCallback(async () => {
    const afterIso = latestCreatedAtRef.current;
    if (!afterIso) {
      await fetchActiveMessages(true);
      return;
    }
    try {
      const qs = new URLSearchParams({
        status: 'active',
        after: afterIso,
        limit: '60',
      });
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        pinned: SignalChatMessage[];
        counts: { active: number; completed: number };
        online_count: number;
        subscriber_count?: number;
        viewer_key?: string | null;
      }>(`/api/signals/messages?${qs.toString()}`, { cache: 'no-store' });

      if (res.viewer_key) viewerKeyRef.current = res.viewer_key;
      setPinnedMessages(res.pinned);
      setCompletedCount(res.counts.completed);

      const validIncoming = res.messages.filter(isWithin24HoursOrPinned);
      if (validIncoming.length > 0) {
        setActiveMessages((prev) => {
          const map = new Map(prev.filter(isWithin24HoursOrPinned).map((m) => [m.id, m]));
          for (const incoming of validIncoming) {
            map.set(incoming.id, incoming);
          }
          return sortChannelChronological(Array.from(map.values()));
        });
        if (isNearBottomRef.current) {
          requestAnimationFrame(() => scrollToBottom(true));
        } else {
          setHasUnseenBelow(true);
        }
      }
    } catch {
      // ignore transient error
    }
  }, [fetchActiveMessages, scrollToBottom]);

  // Load Completed archive messages
  const fetchCompletedMessages = useCallback(async (searchTerm = '') => {
    setCompletedLoading(true);
    try {
      const qs = new URLSearchParams({
        status: 'completed',
        limit: '30',
      });
      if (searchTerm.trim()) qs.set('search', searchTerm.trim());
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
        counts: { active: number; completed: number };
        viewer_key?: string | null;
      }>(`/api/signals/messages?${qs.toString()}`, { cache: 'no-store' });
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

  // Wait until auth resolves before initial fetch so user_reaction always matches the exact actor
  useEffect(() => {
    if (authLoading) return;
    fetchActiveMessages(false);
  }, [authLoading, fetchActiveMessages]);

  useEffect(() => {
    if (authLoading) return;
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
  }, [authLoading, user?.id, view, completedSearch, fetchActiveMessages, fetchCompletedMessages]);

  useEffect(() => {
    if (authLoading) return;
    if (view === 'completed') {
      fetchCompletedMessages(completedSearch);
    }
  }, [authLoading, view, completedSearch, fetchCompletedMessages]);

  const applySignalChannelEvent = useCallback(
    (event: SignalChatWsEvent) => {
      switch (event.type) {
        case 'reconnected': {
          syncMissedMessages();
          if (view === 'completed') fetchCompletedMessages(completedSearch);
          break;
        }
        case 'created': {
          const incoming = event.message;
          if (!isWithin24HoursOrPinned(incoming)) {
            return;
          }
          if (incoming.status === 'active') {
            setActiveMessages((prev) =>
              prev.some((m) => m.id === incoming.id)
                ? prev
                : sortChannelChronological([...prev, incoming])
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
          if (updated.status === 'active' && !isWithin24HoursOrPinned(updated)) {
            setActiveMessages((prev) => prev.filter((m) => m.id !== updated.id));
            setPinnedMessages((prev) => prev.filter((m) => m.id !== updated.id));
            return;
          }
          if (updated.status === 'active') {
            setActiveMessages((prev) => {
              const exists = prev.some((m) => m.id === updated.id);
              const next = exists
                ? prev.map((m) =>
                    m.id === updated.id ? { ...updated, user_reaction: m.user_reaction } : m
                  )
                : [...prev, updated];
              return next.sort((a, b) => {
                if (Boolean(a.is_welcome) !== Boolean(b.is_welcome)) {
                  return a.is_welcome ? -1 : 1;
                }
                return a.created_at.localeCompare(b.created_at);
              });
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
          const isSelfActor = Boolean(
            viewerKeyRef.current && event.viewer_key === viewerKeyRef.current
          );
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
    },
    [syncMissedMessages, fetchCompletedMessages, completedSearch, view, scrollToBottom]
  );

  // Real-time WebSocket subscription for Signal Chat
  useEffect(() => {
    return subscribeSignalChatEvents(applySignalChannelEvent);
  }, [subscribeSignalChatEvents, applySignalChannelEvent]);

  // Seamless Server-Sent Events (SSE) + silent background polling fallback
  useEffect(() => {
    if (authLoading) return;
    let source: EventSource | null = null;
    if (typeof EventSource !== 'undefined') {
      try {
        source = new EventSource('/api/signals/stream');
        source.addEventListener('signals_chat:created', (e) => {
          try {
            const msg = JSON.parse((e as MessageEvent).data) as SignalChatMessage;
            applySignalChannelEvent({ type: 'created', message: msg });
          } catch {
            // ignore malformed event
          }
        });
        source.addEventListener('signals_chat:updated', (e) => {
          try {
            const msg = JSON.parse((e as MessageEvent).data) as SignalChatMessage;
            applySignalChannelEvent({ type: 'updated', message: msg });
          } catch {
            // ignore malformed event
          }
        });
        source.addEventListener('signals_chat:deleted', (e) => {
          try {
            const payload = JSON.parse((e as MessageEvent).data) as { id: string };
            applySignalChannelEvent({ type: 'deleted', id: payload.id });
          } catch {
            // ignore malformed event
          }
        });
        source.addEventListener('signals_chat:reacted', (e) => {
          try {
            const payload = JSON.parse((e as MessageEvent).data) as {
              message_id: string;
              reactions: SignalReactionsMap;
              viewer_key: string;
              reaction: SignalReactionType | null;
            };
            applySignalChannelEvent({ type: 'reacted', ...payload });
          } catch {
            // ignore malformed event
          }
        });
      } catch {
        source = null;
      }
    }

    const pollTimer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      if (view === 'chat') {
        void fetchActiveMessages(true);
      }
    }, 5000);

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'hidden') return;
      if (view === 'chat') {
        void fetchActiveMessages(true);
      } else if (view === 'completed') {
        void fetchCompletedMessages(completedSearch);
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);

    return () => {
      if (source) source.close();
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
    };
  }, [authLoading, applySignalChannelEvent, fetchActiveMessages, fetchCompletedMessages, completedSearch, view]);

  // Periodically prune expired non-pinned messages (>24h) on the client
  useEffect(() => {
    const pruneTimer = window.setInterval(() => {
      setActiveMessages((prev) => {
        const filtered = prev.filter(isWithin24HoursOrPinned);
        return filtered.length === prev.length ? prev : filtered;
      });
    }, 60_000);
    return () => clearInterval(pruneTimer);
  }, []);

  const handleLoadOlderActive = useCallback(async () => {
    const firstNonWelcome = activeMessages.find((m) => !m.is_welcome);
    if (loadingOlder || !activeHasMore || !firstNonWelcome) return;
    const el = scrollContainerRef.current;
    const prevHeight = el?.scrollHeight || 0;
    const prevTop = el?.scrollTop || 0;

    setLoadingOlder(true);
    try {
      const qs = new URLSearchParams({
        status: 'active',
        limit: '40',
        before: firstNonWelcome.created_at,
      });
      const res = await apiFetch<{
        messages: SignalChatMessage[];
        has_more: boolean;
      }>(`/api/signals/messages?${qs.toString()}`, { cache: 'no-store' });
      setActiveMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const older = res.messages.filter((m) => !existingIds.has(m.id) && isWithin24HoursOrPinned(m));
        return sortChannelChronological([...older, ...prev]);
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
      }>(`/api/signals/messages?${qs.toString()}`, { cache: 'no-store' });
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

  const handleReact = async (msg: SignalChatMessage, reaction: SignalReactionType) => {
    const previousReaction = msg.user_reaction;
    const nextReaction: SignalReactionType | null =
      previousReaction === reaction ? null : reaction;

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
      }>(`/api/signals/messages/${encodeURIComponent(msg.id)}/react`, {
        method: 'POST',
        cache: 'no-store',
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
        setChannelNotice(err.message);
        setTimeout(() => setChannelNotice(null), 3500);
      }
    }
  };

  const handleToggleMute = async () => {
    if (mutingBusy) return;
    setMutingBusy(true);
    try {
      if (isMuted) {
        const res = await unmuteSignalChannelPush();
        setIsMuted(false);
        if (res.error) {
          setChannelNotice(res.error);
          setTimeout(() => setChannelNotice(null), 4500);
        }
      } else {
        await muteSignalChannelPush();
        setIsMuted(true);
      }
    } finally {
      setMutingBusy(false);
    }
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
          `/api/signals/messages/${encodeURIComponent(msgId)}`,
          { cache: 'no-store' }
        );
        if (res.message.status === 'completed') {
          setView('completed');
          setSelectedCompleted(res.message);
        } else if (res.message.status === 'active') {
          setView('chat');
          setActiveMessages((prev) =>
            prev.some((m) => m.id === res.message.id)
              ? prev
              : [...prev, res.message].sort((a, b) => {
                  if (Boolean(a.is_welcome) !== Boolean(b.is_welcome)) {
                    return a.is_welcome ? -1 : 1;
                  }
                  return a.created_at.localeCompare(b.created_at);
                })
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
      const dayLabel = msg.is_welcome ? '' : formatDayHeading(msg.created_at);
      if (dayLabel && dayLabel !== lastDay) {
        items.push({ kind: 'day', key: `day-${msg.id}`, label: dayLabel });
        lastDay = dayLabel;
      }
      items.push({ kind: 'msg', key: msg.id, msg });
    }
    return items;
  }, [activeMessages]);

  const latestPinned = pinnedMessages[0] || activeMessages.find((m) => m.pinned) || null;

  return (
    <div className="flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden telegram-wallpaper">
      {/* LIVE CHAT CHANNEL VIEW (DEFAULT) */}
      {view === 'chat' && (
        <>
          {/* Telegram-Style Channel Top Header Bar */}
          <header className="px-2 sm:px-4 h-15 border-b border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0F172A] flex items-center justify-between gap-2 shrink-0 z-30">
            <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => navigate(user ? '/dashboard' : '/')}
                aria-label="Go back"
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5 min-w-0 py-1 pr-2">
                <div className="w-10 h-10 rounded-full bg-[#881337] text-white flex items-center justify-center font-display font-bold text-xs shrink-0 overflow-hidden ring-1 ring-slate-200 dark:ring-slate-700">
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
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h1 className="text-[15px] sm:text-base font-bold text-slate-900 dark:text-white truncate leading-tight">
                      MeridianFX Signals
                    </h1>
                    <BadgeCheck
                      className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0"
                      aria-label="Verified channel"
                    />
                  </div>
                  <p className="text-xs font-semibold text-[#15803D] dark:text-emerald-400 tabular-nums truncate leading-snug">
                    {activeNowCount.toLocaleString('en-US')} Active Now
                  </p>
                </div>
              </div>
            </div>

            {/* Right Three-Dot Action Menu */}
            <div ref={menuContainerRef} className="relative flex items-center shrink-0">
              <button
                type="button"
                onClick={() => setShowChannelMenu((v) => !v)}
                aria-label="Channel menu"
                aria-expanded={showChannelMenu}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
              >
                <MoreVertical className="w-5 h-5" />
              </button>

              {showChannelMenu && (
                <div className="absolute right-0 top-12 w-56 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#111827] shadow-xl py-1.5 z-50 text-sm">

                  <button
                    type="button"
                    onClick={() => {
                      setShowChannelMenu(false);
                      setView('completed');
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center justify-between gap-2 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    <span className="flex items-center gap-2.5">
                      <Archive className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                      <span>Completed Updates</span>
                    </span>
                    <span className="text-xs font-mono text-slate-400 tabular-nums">
                      {completedCount}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowChannelMenu(false);
                      toggleTheme();
                    }}
                    className="w-full px-4 py-2.5 text-left flex items-center gap-2.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/80"
                  >
                    {theme === 'dark' ? (
                      <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600 shrink-0" />
                    )}
                    <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                  </button>
                </div>
              )}
            </div>
          </header>

          {/* Sleek Telegram-Style Pinned Message Banner */}
          {latestPinned && (
            <button
              type="button"
              onClick={() => jumpToMessage(latestPinned.id)}
              className="w-full px-3.5 sm:px-5 py-2 border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111A2B]/95 backdrop-blur-xs flex items-center justify-between gap-3 text-left hover:bg-sky-50/60 dark:hover:bg-sky-950/20 transition-colors shrink-0 z-20"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-0.5 h-7 rounded-full bg-[#0284C7] dark:bg-sky-400 shrink-0" />
                <div className="min-w-0 flex flex-col">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0284C7] dark:text-sky-400 leading-tight">
                    <Pin className="w-3 h-3 shrink-0" />
                    <span>Pinned Message</span>
                  </span>
                  <span className="text-xs text-slate-600 dark:text-slate-300 truncate leading-snug">
                    {latestPinned.content ||
                      latestPinned.media_name ||
                      latestPinned.image_name ||
                      'Pinned broadcast'}
                  </span>
                </div>
              </div>
              {pinnedMessages.length > 1 && (
                <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                  +{pinnedMessages.length - 1}
                </span>
              )}
            </button>
          )}

          {/* Transient notice banner */}
          {channelNotice && (
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-300 shrink-0 z-20">
              <span>{channelNotice}</span>
              <button
                type="button"
                onClick={() => setChannelNotice(null)}
                className="font-bold underline shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Scrollable Telegram Channel Message Feed */}
          <div className="relative flex-1 min-h-0 flex flex-col">
            <div
              ref={scrollContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto overscroll-contain px-2.5 sm:px-5 lg:px-8 py-3 sm:py-4 space-y-2.5"
            >
              <div className="mx-auto max-w-3xl space-y-2.5">
                {loadingOlder && (
                  <div className="flex justify-center py-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 px-3 py-1 text-[11px] font-medium text-slate-500 dark:text-slate-300 shadow-xs">
                      <Loader2 className="w-3 h-3 animate-spin text-[#15803D]" />
                      Loading older messages...
                    </span>
                  </div>
                )}

                {activeHasMore && !loadingOlder && (
                  <div className="flex justify-center pb-1">
                    <button
                      type="button"
                      onClick={handleLoadOlderActive}
                      className="rounded-full bg-white/85 dark:bg-slate-800/85 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:text-[#15803D] shadow-xs transition-colors"
                    >
                      Scroll up or tap for older messages
                    </button>
                  </div>
                )}

                {activeLoading || authLoading ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="flex items-center gap-2 rounded-full bg-white dark:bg-[#151E2E] px-4 py-2 text-xs text-slate-500 dark:text-slate-300 shadow-xs">
                      <Loader2 className="w-4 h-4 animate-spin text-[#15803D]" />
                      <span>Loading channel messages...</span>
                    </div>
                  </div>
                ) : activeWithDividers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                    <div className="rounded-2xl bg-white/95 dark:bg-[#151E2E] px-6 py-6 max-w-sm shadow-xs space-y-2">
                      <MessageSquareText className="w-7 h-7 text-[#881337] dark:text-rose-400 mx-auto" />
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        MeridianFX Signals
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        Live trading signals, chart analysis, and instant desk broadcasts appear here automatically.
                      </p>
                    </div>
                  </div>
                ) : (
                  activeWithDividers.map((item) => {
                    if (item.kind === 'day') {
                      return (
                        <div
                          key={item.key}
                          className="flex justify-center py-1.5 sticky top-1 z-10 pointer-events-none"
                        >
                          <span className="rounded-full bg-slate-900/20 dark:bg-slate-800/90 backdrop-blur-xs px-3 py-0.5 text-[11px] font-semibold text-white dark:text-slate-200">
                            {item.label}
                          </span>
                        </div>
                      );
                    }

                    const msg = item.msg;
                    const isHighlighted = highlightedMsgId === msg.id;
                    const viewsCount = typeof msg.views === 'number' ? msg.views : 0;

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
                          className={`w-full max-w-[94%] sm:max-w-[82%] lg:max-w-[660px] rounded-2xl rounded-tl-xs px-3.5 py-2.5 sm:px-4 sm:py-3 shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-all ${
                            isHighlighted
                              ? 'bg-sky-50 dark:bg-sky-950/40 ring-2 ring-[#0284C7]'
                              : msg.pinned
                                ? 'bg-white dark:bg-[#151E2E] ring-1 ring-[#0284C7]/25 dark:ring-sky-500/30'
                                : 'bg-white dark:bg-[#151E2E]'
                          }`}
                        >
                          {/* Telegram Channel Sender Header */}
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                              <span className="text-xs font-bold text-[#881337] dark:text-rose-400">
                                {msg.author_name || 'MeridianFX Desk'}
                              </span>
                              <span className="text-[11px] font-medium text-[#15803D] dark:text-emerald-400">
                                · {msg.is_welcome ? 'Channel Welcome' : MESSAGE_TYPE_LABELS[msg.message_type] || 'Update'}
                              </span>
                              {msg.priority === 'urgent' && (
                                <span className="inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-rose-100 text-[#881337] dark:bg-rose-950/60 dark:text-rose-300">
                                  <Zap className="w-2.5 h-2.5" /> Urgent
                                </span>
                              )}
                              {msg.pinned && (
                                <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[#0284C7] dark:text-sky-400">
                                  · <Pin className="w-3 h-3" /> Pinned
                                </span>
                              )}
                            </div>
                          </div>

                          {msg.media_type === 'video' && msg.media_url ? (
                            <div className={msg.content ? 'mb-2.5' : 'mb-1'}>
                              <video
                                src={msg.media_url}
                                controls
                                playsInline
                                preload="metadata"
                                className="w-full max-h-80 rounded-xl bg-black"
                              />
                            </div>
                          ) : msg.media_url || msg.image_url ? (
                            <div className={msg.content ? 'mb-2.5' : 'mb-1'}>
                              <ChatImageAttachment
                                src={msg.media_url || msg.image_url || ''}
                                alt={
                                  msg.media_name || msg.image_name || 'Trading chart attachment'
                                }
                                onOpen={setLightboxUrl}
                              />
                            </div>
                          ) : null}

                          {msg.content && (
                            <p className="text-[15px] text-slate-800 dark:text-slate-100 leading-relaxed whitespace-pre-wrap break-words">
                              {renderMessageText(msg.content)}
                            </p>
                          )}

                          {/* Telegram-Style 4-Emoji Reaction Row + Views & Timestamp */}
                          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 pt-1">
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
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors min-h-[30px] ${
                                      active
                                        ? opt.activeClass
                                        : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <span aria-hidden="true">{opt.emoji}</span>
                                    <span className="font-mono text-[11px] tabular-nums">
                                      {formatCompactCount(count)}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 dark:text-slate-500 tabular-nums shrink-0 ml-auto">
                              <span
                                className="inline-flex items-center gap-1"
                                title={`${viewsCount.toLocaleString('en-US')} views`}
                              >
                                <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>{formatCompactCount(viewsCount)}</span>
                              </span>
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
                className="absolute bottom-3 right-3 sm:right-5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white dark:bg-[#151E2E] text-[#0284C7] dark:text-sky-400 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs font-semibold shadow-md hover:bg-slate-50 transition-transform active:scale-95"
              >
                <ArrowDown className="w-4 h-4" />
                {hasUnseenBelow && <span>New</span>}
              </button>
            )}
          </div>

          {/* Bottom Telegram-Style Mute / Unmute Channel Bar */}
          <div className="shrink-0 border-t border-slate-200/90 dark:border-slate-800/90 bg-white dark:bg-[#0F172A] px-3 sm:px-5 py-2 z-20">
            <div className="mx-auto max-w-3xl">
              <button
                type="button"
                onClick={handleToggleMute}
                disabled={mutingBusy}
                aria-pressed={isMuted}
                className={`w-full min-h-[44px] rounded-xl px-4 py-2 text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors ${
                  isMuted
                    ? 'bg-[#0284C7]/10 text-[#0284C7] dark:bg-sky-500/15 dark:text-sky-400 hover:bg-[#0284C7]/15 dark:hover:bg-sky-500/25'
                    : 'bg-slate-100 dark:bg-slate-800/90 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                }`}
              >
                {isMuted ? (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Unmute</span>
                  </>
                ) : (
                  <>
                    <BellOff className="w-4 h-4" />
                    <span>Mute</span>
                  </>
                )}
              </button>
            </div>
          </div>
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
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#881337] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 min-h-[44px]"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Channel</span>
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
                    Concluded trading setups archived after your channel join date appear here chronologically.
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

                        {msg.media_type === 'video' && msg.media_url ? (
                          <div className="rounded-xl overflow-hidden bg-black h-36">
                            <video
                              src={msg.media_url}
                              preload="metadata"
                              muted
                              playsInline
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : msg.media_url || msg.image_url ? (
                          <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 h-36">
                            <img
                              src={msg.media_url || msg.image_url || ''}
                              alt={msg.media_name || msg.image_name || 'Archived chart'}
                              referrerPolicy="no-referrer"
                              loading="lazy"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : null}
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 text-xs text-slate-500">
                        <div className="flex flex-wrap items-center gap-2 font-mono tabular-nums">
                          {REACTION_OPTIONS.map((opt) => (
                            <span key={opt.key} title={opt.label} className="whitespace-nowrap">
                              {opt.emoji} {formatCompactCount(msg.reactions?.[opt.key] ?? 0)}
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

            {selectedCompleted.media_type === 'video' && selectedCompleted.media_url ? (
              <video
                src={selectedCompleted.media_url}
                controls
                playsInline
                preload="metadata"
                className="w-full max-h-96 rounded-xl bg-black"
              />
            ) : selectedCompleted.media_url || selectedCompleted.image_url ? (
              <ChatImageAttachment
                src={selectedCompleted.media_url || selectedCompleted.image_url || ''}
                alt={
                  selectedCompleted.media_name ||
                  selectedCompleted.image_name ||
                  'Archived signal chart'
                }
                onOpen={setLightboxUrl}
              />
            ) : null}

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
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
                        active
                          ? opt.activeClass
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200/80 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span aria-hidden="true">{opt.emoji}</span>
                      <span className="font-mono tabular-nums">
                        {formatCompactCount(count)}
                      </span>
                    </button>
                  );
                })}
              </div>

              <span className="inline-flex items-center gap-1 text-xs font-mono text-slate-400 tabular-nums">
                <Eye className="w-3.5 h-3.5" />
                <span>{formatCompactCount(selectedCompleted.views ?? 0)}</span>
              </span>
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
