import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  Edit3,
  ExternalLink,
  Eye,
  EyeOff,
  Inbox,
  KeyRound,
  LayoutDashboard,
  Lock,
  LogOut,
  Moon,
  Pin,
  Radio,
  RefreshCw,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Trash2,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { formatLocalDateTime } from '../lib/api';
import {
  adminApiFetch,
  adminUploadMediaFile,
  bootstrapAdminSessionDetailed,
  getAdminAccessToken,
  getAdminAccessTokenRemainingMs,
  getAdminAuthEpoch,
  loginAdmin,
  logoutAdmin,
  refreshAdminSession,
  refreshAdminSessionDetailed,
  subscribeAdminAuthSync,
} from '../lib/adminApi';
import { sendTestPushNotification } from '../lib/pushClient';
import { AdminAcademyManager } from '../components/admin/AdminAcademyManager';
import { AdminApplicationsPanel } from '../components/admin/AdminApplicationsPanel';
import { AdminEnquiriesPanel } from '../components/admin/AdminEnquiriesPanel';
import { AdminMembersPanel } from '../components/admin/AdminMembersPanel';
import { AdminRegistrationsPanel } from '../components/admin/AdminRegistrationsPanel';
import { AdminSignalsBroadcastStudio } from '../components/admin/AdminSignalsBroadcastStudio';
import type {
  AdminOverviewStats,
  MarketUpdate,
  MarketUpdateCategory,
  PlatformSettings,
  PushDeliveryRecord,
  PushInfrastructureStatus,
  PushJobSummary,
  PushSubscriptionSummary,
  RegistrationAnalyticsPayload,
  SignalChatMessage,
  SignalDirection,
  SignalStatus,
  TradingSignal,
  User,
} from '../types';

type AdminTab =
  | 'overview'
  | 'applications'
  | 'enquiries'
  | 'signals'
  | 'updates'
  | 'members'
  | 'registrations'
  | 'academy'
  | 'notifications'
  | 'settings';

interface OverviewPayload {
  stats: AdminOverviewStats;
  dispatch_logs: Array<{
    id: string;
    title: string;
    category: string;
    total_targeted: number;
    delivered_count: number;
    failed_count: number;
    created_at: string;
  }>;
  push_jobs?: PushJobSummary[];
  system_logs: Array<{
    id: string;
    level: string;
    source: string;
    message: string;
    created_at: string;
  }>;
  backups: string[];
  student_progress: Array<{
    id: string;
    name: string;
    email: string;
    courses_enrolled: number;
    lessons_completed: number;
    avg_quiz_score: number | null;
  }>;
}

export const AdminPage: React.FC = () => {
  const { settings, signals, theme, toggleTheme, refreshAll, navigate } = usePlatform();

  // Isolated Admin Session State
  const [adminUser, setAdminUser] = useState<User | null>(null);
  const [adminAuthLoading, setAdminAuthLoading] = useState(true);
  const [bootNetworkIssue, setBootNetworkIssue] = useState(false);
  const adminUserRef = useRef<User | null>(null);
  const explicitSigningOutRef = useRef(false);
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    adminUserRef.current = adminUser;
  }, [adminUser]);

  // Dashboard State
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
  const [registrations, setRegistrations] = useState<RegistrationAnalyticsPayload | null>(null);
  const [allUpdates, setAllUpdates] = useState<MarketUpdate[]>([]);
  const [usersList, setUsersList] = useState<User[]>([]);
  const [reports, setReports] = useState<
    Array<{
      id: string;
      post_id: string | null;
      reporter_name: string;
      post_title: string | null;
      reason: string;
      status: string;
      created_at: string;
    }>
  >([]);

  // Live ticks driven by admin WebSocket notifications
  const [appsLiveTick, setAppsLiveTick] = useState(0);
  const [enquiriesLiveTick, setEnquiriesLiveTick] = useState(0);
  const [signalsLiveTick, setSignalsLiveTick] = useState(0);

  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishReceipt, setPublishReceipt] = useState<{
    title: string;
    signalMessageId: string | null;
    pushJob: PushJobSummary | null;
  } | null>(null);

  // Structured Signal Form State
  const [editingSignalId, setEditingSignalId] = useState<string | null>(null);
  const [sigForm, setSigForm] = useState({
    pair: 'EURUSD',
    direction: 'BUY' as SignalDirection,
    entry_price: '',
    stop_loss: '',
    tp1: '',
    tp2: '',
    tp3: '',
    tp4: '',
    risk_reward: '1 : 2.5',
    timeframe: 'H1',
    status: 'Active' as SignalStatus,
    classification: 'Educational' as 'Educational' | 'Verified',
    analysis: '',
    chart_image_url: '',
    admin_remarks: '',
    is_premium: false,
    send_push: true,
  });
  const [followUpSignalId, setFollowUpSignalId] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');
  const [followUpStatus, setFollowUpStatus] = useState<SignalStatus>('TP Hit');

  // Market Update Form State
  const [updForm, setUpdForm] = useState({
    title: '',
    content: '',
    category: 'Forex Update' as MarketUpdateCategory,
    pinned: false,
    is_premium: false,
    image_url: '',
    video_url: '',
    attachment_url: '',
    attachment_name: '',
    external_link: '',
    scheduled_at: '',
    send_push: true,
  });

  // Notification Broadcast Form State
  const [notifForm, setNotifForm] = useState({
    title: '',
    body: '',
    category: 'announcements',
    link_url: '/signals',
    image_url: '',
    targetMode: 'all' as 'all' | 'registered' | 'verified' | 'admins_mods' | 'selected',
    selectedUserIds: [] as string[],
    respect_prefs: true,
    sound: true,
    scheduled_at: '',
  });
  const [pushDiagnostics, setPushDiagnostics] = useState<{
    infrastructure: PushInfrastructureStatus;
    summary: {
      total_active: number;
      total_inactive: number;
      android: number;
      ios: number;
      web: number;
      desktop: number;
      by_transport: {
        web_push: number;
        fcm: number;
        apns: number;
      };
      last_sent_at: string | null;
      totals: {
        queued: number;
        delivered: number;
        confirmed: number;
        failed: number;
      };
    };
    subscriptions: PushSubscriptionSummary[];
    jobs: PushJobSummary[];
    deliveries: PushDeliveryRecord[];
  } | null>(null);
  const [testingAdminPush, setTestingAdminPush] = useState(false);
  const [testingAllPush, setTestingAllPush] = useState(false);

  // Platform Settings State
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const restoreAdminSession = useCallback(async (isInitialBoot = false) => {
    const startEpoch = getAdminAuthEpoch();
    if (isInitialBoot) {
      setAdminAuthLoading(true);
    }
    try {
      const outcome = await bootstrapAdminSessionDetailed();
      if (getAdminAuthEpoch() !== startEpoch) {
        return;
      }
      if (outcome.status === 'authenticated') {
        setBootNetworkIssue(false);
        setLoginError(null);
        if (outcome.user.role === 'admin') {
          setAdminUser((prev) =>
            prev && prev.id === outcome.user.id && prev.role === outcome.user.role
              ? prev
              : outcome.user
          );
        } else {
          setAdminUser(null);
        }
      } else if (outcome.status === 'network_error') {
        if (!adminUserRef.current) {
          setBootNetworkIssue(true);
        }
      } else {
        setBootNetworkIssue(false);
        setAdminUser(null);
      }
    } finally {
      if (isInitialBoot && getAdminAuthEpoch() === startEpoch) {
        setAdminAuthLoading(false);
      }
    }
  }, []);

  // Bootstrap isolated /admin session on mount & sync across tabs
  useEffect(() => {
    let active = true;
    void restoreAdminSession(true);

    const handleExpired = () => {
      if (!active || explicitSigningOutRef.current) return;
      setAdminUser(null);
      setOverview(null);
      setRegistrations(null);
      setBootNetworkIssue(false);
      setLoginError('Administrator session expired. Please sign in again.');
    };

    const unsubscribeSync = subscribeAdminAuthSync((eventType) => {
      if (!active) return;
      if (eventType === 'logout') {
        setAdminUser(null);
        setOverview(null);
        setRegistrations(null);
        setBootNetworkIssue(false);
        setLoginError(null);
      } else if (eventType === 'login') {
        void restoreAdminSession(false);
      }
    });

    window.addEventListener('mfx:admin-auth-expired', handleExpired);
    return () => {
      active = false;
      unsubscribeSync();
      window.removeEventListener('mfx:admin-auth-expired', handleExpired);
    };
  }, [restoreAdminSession]);

  // Retry initial boot session restoration automatically when connection returns
  useEffect(() => {
    if (!bootNetworkIssue || adminUser) return;
    const handleOnline = () => {
      void restoreAdminSession(true);
    };
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [bootNetworkIssue, adminUser, restoreAdminSession]);

  const notifyOk = useCallback((msg: string) => {
    setErrorMsg(null);
    setToast(msg);
    window.setTimeout(() => setToast(null), 4000);
  }, []);

  const adminUserId = adminUser?.id || null;
  const adminUserRole = adminUser?.role || null;

  const loadAdminData = useCallback(async () => {
    if (!adminUserId || adminUserRole !== 'admin') return;
    try {
      const [ov, reg, upd, usr, rep, diag] = await Promise.all([
        adminApiFetch<OverviewPayload>('/api/admin/overview'),
        adminApiFetch<RegistrationAnalyticsPayload>('/api/admin/registrations'),
        adminApiFetch<{ updates: MarketUpdate[] }>('/api/updates?includeAll=true'),
        adminApiFetch<{ users: User[] }>('/api/admin/users'),
        adminApiFetch<{ reports: typeof reports }>('/api/admin/reports'),
        adminApiFetch<NonNullable<typeof pushDiagnostics>>('/api/admin/push-diagnostics'),
      ]);
      setOverview(ov);
      setRegistrations(reg);
      setAllUpdates(upd.updates);
      setUsersList(usr.users);
      setReports(rep.reports);
      setPushDiagnostics(diag);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin console data.');
    }
  }, [adminUserId, adminUserRole]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  // Proactive silent token renewal & background/offline recovery (never drops session on network outage)
  useEffect(() => {
    if (!adminUserId || adminUserRole !== 'admin') return;
    let cancelled = false;
    let timerId: number | null = null;

    const scheduleRenewal = (delayMs?: number) => {
      if (cancelled) return;
      if (timerId !== null) {
        window.clearTimeout(timerId);
        timerId = null;
      }
      const remainingMs = getAdminAccessTokenRemainingMs();
      const targetDelay =
        typeof delayMs === 'number'
          ? Math.max(10_000, delayMs)
          : Math.max(20_000, remainingMs - 120_000);

      timerId = window.setTimeout(async () => {
        if (cancelled) return;
        const epochBefore = getAdminAuthEpoch();
        const res = await refreshAdminSessionDetailed();
        if (cancelled || getAdminAuthEpoch() !== epochBefore) return;

        if (res.status === 'ok') {
          setAdminUser((prev) =>
            prev && prev.id === res.user.id && prev.role === res.user.role ? prev : res.user
          );
          scheduleRenewal();
        } else if (res.status === 'network_error') {
          // Keep current session alive and retry shortly when network settles
          scheduleRenewal(30_000);
        } else {
          setAdminUser(null);
          setOverview(null);
          setRegistrations(null);
          setLoginError('Administrator session expired. Please sign in again.');
        }
      }, targetDelay);
    };

    const refreshIfNeededOnResume = async () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') return;
      if (!getAdminAccessToken() || getAdminAccessTokenRemainingMs() < 180_000) {
        const epochBefore = getAdminAuthEpoch();
        const res = await refreshAdminSessionDetailed();
        if (cancelled || getAdminAuthEpoch() !== epochBefore) return;
        if (res.status === 'ok') {
          setAdminUser((prev) =>
            prev && prev.id === res.user.id && prev.role === res.user.role ? prev : res.user
          );
          scheduleRenewal();
        } else if (res.status === 'unauthorized') {
          setAdminUser(null);
          setOverview(null);
          setRegistrations(null);
          setLoginError('Administrator session expired. Please sign in again.');
        }
      }
    };

    const handleOnline = () => {
      void refreshIfNeededOnResume().then(() => {
        if (!cancelled) {
          void loadAdminData();
        }
      });
    };

    scheduleRenewal();
    document.addEventListener('visibilitychange', refreshIfNeededOnResume);
    window.addEventListener('focus', refreshIfNeededOnResume);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      if (timerId !== null) window.clearTimeout(timerId);
      document.removeEventListener('visibilitychange', refreshIfNeededOnResume);
      window.removeEventListener('focus', refreshIfNeededOnResume);
      window.removeEventListener('online', handleOnline);
    };
  }, [adminUserId, adminUserRole, loadAdminData]);

  // Dedicated Real-Time Admin WebSocket Connection
  useEffect(() => {
    if (!adminUserId || adminUserRole !== 'admin') return;

    let ws: WebSocket | null = null;
    let closedByCleanup = false;
    let reconnectTimer: number | null = null;
    let attempt = 0;

    const connect = async () => {
      if (closedByCleanup) return;
      let token = getAdminAccessToken();
      if (!token) {
        const refreshed = await refreshAdminSession();
        token = refreshed?.token || null;
      }
      if (!token || closedByCleanup) return;

      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      ws = new WebSocket(`${proto}//${window.location.host}/ws`);

      ws.addEventListener('open', () => {
        attempt = 0;
        const activeToken = getAdminAccessToken();
        if (activeToken && ws?.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ event: 'admin:subscribe', token: activeToken }));
        }
      });

      ws.addEventListener('message', (ev) => {
        try {
          const msg = JSON.parse(String(ev.data)) as { event: string; data?: unknown };
          if (
            msg.event === 'admin:application_created' ||
            msg.event === 'admin:application_updated'
          ) {
            setAppsLiveTick((n) => n + 1);
            loadAdminData();
          } else if (
            msg.event === 'admin:support_conversation_created' ||
            msg.event === 'admin:support_message' ||
            msg.event === 'support:message' ||
            msg.event === 'support:read' ||
            msg.event === 'admin:contact_created' ||
            msg.event === 'admin:contact_updated'
          ) {
            setEnquiriesLiveTick((n) => n + 1);
            loadAdminData();
          } else if (
            msg.event === 'signals_chat:created' ||
            msg.event === 'signals_chat:updated' ||
            msg.event === 'signals_chat:deleted'
          ) {
            setSignalsLiveTick((n) => n + 1);
          } else if (msg.event === 'push:job_updated' && msg.data) {
            const job = msg.data as PushJobSummary;
            setPublishReceipt((cur) =>
              cur?.pushJob?.id === job.id ? { ...cur, pushJob: job } : cur
            );
            setOverview((cur) => {
              if (!cur?.push_jobs) return cur;
              const exists = cur.push_jobs.some((j) => j.id === job.id);
              return {
                ...cur,
                push_jobs: exists
                  ? cur.push_jobs.map((j) => (j.id === job.id ? job : j))
                  : [job, ...cur.push_jobs],
              };
            });
          }
        } catch {
          // ignore malformed frames
        }
      });

      ws.addEventListener('close', () => {
        if (closedByCleanup) return;
        const delay = Math.min(2000 * Math.pow(1.5, attempt), 15_000);
        attempt += 1;
        reconnectTimer = window.setTimeout(connect, delay);
      });
    };

    connect();
    return () => {
      closedByCleanup = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (ws && ws.readyState < 2) ws.close();
    };
  }, [adminUserId, adminUserRole, loadAdminData]);

  // Poll queued push job until finished
  useEffect(() => {
    const jobId = publishReceipt?.pushJob?.id;
    const queued = publishReceipt?.pushJob?.queued_count ?? 0;
    if (!adminUser || !jobId || queued <= 0) return;

    const timer = window.setInterval(() => {
      adminApiFetch<{ job: PushJobSummary }>(`/api/admin/push-jobs/${jobId}`)
        .then((res) => {
          setPublishReceipt((cur) =>
            cur?.pushJob?.id === jobId ? { ...cur, pushJob: res.job } : cur
          );
        })
        .catch(() => undefined);
    }, 3000);
    return () => window.clearInterval(timer);
  }, [adminUser, publishReceipt?.pushJob?.id, publishReceipt?.pushJob?.queued_count]);

  const handleAdminSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setBootNetworkIssue(false);
    setLoginSubmitting(true);
    explicitSigningOutRef.current = false;
    try {
      const res = await loginAdmin(loginIdentifier.trim(), loginPassword, rememberMe);
      setAdminUser(res.user);
      setLoginPassword('');
      setLoginError(null);
      setAdminAuthLoading(false);
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Unable to sign in to administrator console.'
      );
    } finally {
      setLoginSubmitting(false);
    }
  };

  const handleAdminSignOut = async () => {
    explicitSigningOutRef.current = true;
    try {
      await logoutAdmin();
    } finally {
      setAdminUser(null);
      setOverview(null);
      setRegistrations(null);
      setBootNetworkIssue(false);
      setLoginError(null);
      explicitSigningOutRef.current = false;
    }
  };

  // --- Admin Login Screen (Standalone) ---
  if (adminAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-8 py-7 text-center space-y-2 shadow-sm">
          <div className="w-8 h-8 rounded-full border-2 border-[#881337] border-t-transparent animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Verifying administrator session...
          </p>
        </div>
      </div>
    );
  }

  if (bootNetworkIssue && !adminUser) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-[#881337]/10 dark:bg-rose-500/15 text-[#881337] dark:text-rose-400 flex items-center justify-center mx-auto">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Restoring Administrator Connection
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Unable to reach the server while checking your saved session. Your login is not cleared—retry once connected.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              type="button"
              onClick={() => void restoreAdminSession(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#881337] py-2.5 px-4 text-xs font-bold text-white hover:bg-[#6B0F2B]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Session Check</span>
            </button>
            <button
              type="button"
              onClick={() => setBootNetworkIssue(false)}
              className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 py-2.5 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              Show Sign In Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!adminUser || adminUser.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] flex flex-col justify-between p-4 sm:p-6">
        <div className="max-w-5xl w-full mx-auto flex items-center justify-between">
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate('/');
            }}
            className="inline-flex items-center gap-2.5 text-sm font-bold text-slate-900 dark:text-white"
          >
            <img
              src={settings.logo_url}
              alt={settings.brand_name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 dark:border-slate-800"
            />
            <span>{settings.brand_name}</span>
          </a>

          <button
            type="button"
            onClick={toggleTheme}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300"
          >
            {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="w-full max-w-md mx-auto my-8">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-sm space-y-6">
            <div className="space-y-2 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#881337]/10 dark:bg-rose-500/15 text-[#881337] dark:text-rose-400 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {settings.brand_name} Admin Portal
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sign in with your designated administrator account to manage Signals, Applications, Customer Chat, Academy, and Platform Settings.
              </p>
            </div>

            {loginError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
                {loginError}
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Administrator Email or Username
                </label>
                <input
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="Enter administrator email"
                  value={loginIdentifier}
                  onChange={(e) => setLoginIdentifier(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Enter administrator password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-10 py-2.5 text-sm text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-[#881337]"
                />
                <span>Keep administrator session active (30 days)</span>
              </label>

              <button
                type="submit"
                disabled={loginSubmitting}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#881337] py-3 text-sm font-bold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[44px]"
              >
                <Lock className="w-4 h-4" />
                <span>{loginSubmitting ? 'Signing In...' : 'Sign In to Admin Portal'}</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <a
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/');
                }}
                className="text-xs font-semibold text-slate-500 hover:text-[#881337] dark:hover:text-rose-400"
              >
                &larr; Return to Public MeridianFX Website
              </a>
            </div>
          </div>
        </div>

        <p className="text-center text-[11px] text-slate-400">
          Isolated Administrator Desk · Protected by HTTP-Only Scoped Refresh Cookie
        </p>
      </div>
    );
  }

  // --- Helper Handlers ---
  const handleUploadField = async (
    file: File | undefined,
    onDone: (url: string, origName: string) => void
  ) => {
    if (!file) return;
    try {
      const uploaded = await adminUploadMediaFile(file);
      onDone(uploaded.url, uploaded.original_name);
      notifyOk(`Uploaded ${uploaded.original_name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  const handleDownloadBackup = async (filename: string) => {
    try {
      let token = getAdminAccessToken();
      if (!token) {
        const refreshed = await refreshAdminSession();
        token = refreshed?.token || null;
      }
      if (!token) throw new Error('Administrator session required to download backups.');

      let res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
        credentials: 'include',
        cache: 'no-store',
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Requested-With': 'MeridianFX-Admin',
        },
      });
      if (res.status === 401) {
        const refreshed = await refreshAdminSessionDetailed();
        if (refreshed.status === 'ok') {
          res = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, {
            credentials: 'include',
            cache: 'no-store',
            headers: {
              Authorization: `Bearer ${refreshed.token}`,
              'X-Requested-With': 'MeridianFX-Admin',
            },
          });
        }
      }
      if (!res.ok) throw new Error(`Backup download failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      notifyOk(`Downloaded ${filename}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to download backup.');
    }
  };

  // --- Structured Signal Handlers ---
  const handleSubmitSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSignalId) {
        const res = await adminApiFetch<{
          signal_message?: SignalChatMessage | null;
          push_job?: PushJobSummary | null;
        }>(`/api/signals/${editingSignalId}`, {
          method: 'PATCH',
          body: JSON.stringify(sigForm),
        });
        notifyOk('Trading signal updated and synced live.');
        if (res.signal_message || res.push_job) {
          setPublishReceipt({
            title: `${sigForm.pair} status update published publicly`,
            signalMessageId: res.signal_message?.id || null,
            pushJob: res.push_job || null,
          });
        }
      } else {
        const res = await adminApiFetch<{
          signal_message?: SignalChatMessage | null;
          push_job?: PushJobSummary | null;
        }>('/api/signals', {
          method: 'POST',
          body: JSON.stringify(sigForm),
        });
        notifyOk('New trading signal published publicly to Signals Channel.');
        setPublishReceipt({
          title: `${sigForm.direction} ${sigForm.pair} published publicly`,
          signalMessageId: res.signal_message?.id || null,
          pushJob: res.push_job || null,
        });
      }
      setEditingSignalId(null);
      setSigForm({
        pair: 'EURUSD',
        direction: 'BUY',
        entry_price: '',
        stop_loss: '',
        tp1: '',
        tp2: '',
        tp3: '',
        tp4: '',
        risk_reward: '1 : 2.5',
        timeframe: 'H1',
        status: 'Active',
        classification: 'Educational',
        analysis: '',
        chart_image_url: '',
        admin_remarks: '',
        is_premium: false,
        send_push: true,
      });
      setSignalsLiveTick((n) => n + 1);
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save signal.');
    }
  };

  const handleQuickSignalStatus = async (sig: TradingSignal, nextStatus: SignalStatus) => {
    try {
      const res = await adminApiFetch<{
        signal_message?: SignalChatMessage | null;
        push_job?: PushJobSummary | null;
      }>(`/api/signals/${sig.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, send_push: true }),
      });
      notifyOk(`${sig.pair} status updated to ${nextStatus}.`);
      setPublishReceipt({
        title: `${sig.pair} (${nextStatus}) posted publicly to Signals Channel`,
        signalMessageId: res.signal_message?.id || null,
        pushJob: res.push_job || null,
      });
      setSignalsLiveTick((n) => n + 1);
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handlePostFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpSignalId) return;
    try {
      const res = await adminApiFetch<{
        signal_message?: SignalChatMessage | null;
        push_job?: PushJobSummary | null;
      }>(`/api/signals/${followUpSignalId}/updates`, {
        method: 'POST',
        body: JSON.stringify({
          note: followUpNote,
          status: followUpStatus,
          send_push: true,
        }),
      });
      setFollowUpSignalId(null);
      setFollowUpNote('');
      notifyOk('Follow-up update published publicly.');
      setPublishReceipt({
        title: `Signal follow-up (${followUpStatus}) published publicly`,
        signalMessageId: res.signal_message?.id || null,
        pushJob: res.push_job || null,
      });
      setSignalsLiveTick((n) => n + 1);
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post follow-up.');
    }
  };

  const handleDeleteSignal = async (id: string) => {
    try {
      await adminApiFetch(`/api/signals/${id}`, { method: 'DELETE' });
      notifyOk('Signal deleted.');
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete signal.');
    }
  };

  // --- Market Update Handlers ---
  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isScheduled = Boolean(updForm.scheduled_at);
    try {
      const res = await adminApiFetch<{
        signal_message?: SignalChatMessage | null;
        push_job?: PushJobSummary | null;
      }>('/api/updates', {
        method: 'POST',
        body: JSON.stringify({
          ...updForm,
          scheduled_at: updForm.scheduled_at ? new Date(updForm.scheduled_at).toISOString() : null,
        }),
      });
      const publishedTitle = updForm.title;
      setUpdForm({
        title: '',
        content: '',
        category: 'Forex Update',
        pinned: false,
        is_premium: false,
        image_url: '',
        video_url: '',
        attachment_url: '',
        attachment_name: '',
        external_link: '',
        scheduled_at: '',
        send_push: true,
      });
      notifyOk(isScheduled ? 'Update scheduled.' : 'Market update published live.');
      if (!isScheduled) {
        setPublishReceipt({
          title: `"${publishedTitle}" published publicly`,
          signalMessageId: res.signal_message?.id || null,
          pushJob: res.push_job || null,
        });
      }
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish update.');
    }
  };

  const handleTogglePin = async (upd: MarketUpdate) => {
    try {
      await adminApiFetch(`/api/updates/${upd.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pinned: !upd.pinned }),
      });
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update pin.');
    }
  };

  const handleDeleteUpdate = async (id: string) => {
    try {
      await adminApiFetch(`/api/updates/${id}`, { method: 'DELETE' });
      notifyOk('Market update deleted.');
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete update.');
    }
  };

  // --- Notification Broadcast Handlers ---
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await adminApiFetch<{
        scheduled: boolean;
        push_job?: PushJobSummary | null;
      }>('/api/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: notifForm.title,
          body: notifForm.body,
          category: notifForm.category,
          link_url: notifForm.link_url,
          image_url: notifForm.image_url.trim() || null,
          target_group: notifForm.targetMode,
          target_user_ids:
            notifForm.targetMode === 'selected' ? notifForm.selectedUserIds : null,
          respect_prefs: notifForm.respect_prefs,
          sound: notifForm.sound,
          scheduled_at: notifForm.scheduled_at
            ? new Date(notifForm.scheduled_at).toISOString()
            : null,
        }),
      });
      const sentTitle = notifForm.title;
      setNotifForm((f) => ({ ...f, title: '', body: '', image_url: '', scheduled_at: '' }));
      notifyOk(res.scheduled ? 'Notification scheduled.' : 'Push notification queued & dispatched.');
      if (!res.scheduled && res.push_job) {
        setPublishReceipt({
          title: `Broadcast "${sentTitle}" dispatched`,
          signalMessageId: res.push_job.signal_message_id || null,
          pushJob: res.push_job,
        });
      }
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send notification.');
    }
  };

  const handleTestAdminDevicePush = async () => {
    setTestingAdminPush(true);
    setErrorMsg(null);
    try {
      await sendTestPushNotification();
      notifyOk('Test push notification sent to this device.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'No active push subscription on this device.');
    } finally {
      setTestingAdminPush(false);
    }
  };

  const handleSendTestNotificationAll = async () => {
    setTestingAllPush(true);
    setErrorMsg(null);
    try {
      const res = await adminApiFetch<{
        ok: boolean;
        targeted: number;
        delivered: number;
        confirmed: number;
        failed: number;
        push_job: PushJobSummary;
      }>('/api/admin/push/test-all', { method: 'POST', body: '{}' });
      setPublishReceipt({
        title: 'Admin Test Notification dispatched to subscribed devices',
        signalMessageId: null,
        pushJob: res.push_job,
      });
      notifyOk(
        res.targeted === 0
          ? 'Test job recorded (0 subscribed devices active yet).'
          : `Test notification sent: ${res.delivered}/${res.targeted} accepted by push gateway.`
      );
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send test notification.');
    } finally {
      setTestingAllPush(false);
    }
  };

  const handlePruneInactiveSubs = async () => {
    try {
      const res = await adminApiFetch<{ deleted: number }>('/api/admin/push-subscriptions/prune', {
        method: 'POST',
        body: JSON.stringify({ older_than_days: 0 }),
      });
      notifyOk(`Cleaned up ${res.deleted} inactive push token(s).`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clean up push tokens.');
    }
  };

  const handleReportAction = async (id: string, action: 'hide_post' | 'dismiss') => {
    try {
      await adminApiFetch(`/api/admin/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action }),
      });
      notifyOk(action === 'hide_post' ? 'Post hidden and report resolved.' : 'Report dismissed.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update report.');
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminApiFetch('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          ...settingsForm,
          push_enabled: String(settingsForm.push_enabled),
        }),
      });
      notifyOk('Platform settings saved and synchronized.');
      await refreshAll();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save settings.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      await adminApiFetch('/api/admin/backup', { method: 'POST', body: '{}' });
      notifyOk('Database backup snapshot created.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create backup.');
    }
  };

  const pendingAppsCount = overview?.stats.pending_applications ?? 0;
  const unreadEnquiriesCount = overview?.stats.unread_customer_messages ?? 0;

  const tabs: Array<{
    key: AdminTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      key: 'applications',
      label: 'Applications',
      icon: ClipboardList,
      badge: pendingAppsCount > 0 ? pendingAppsCount : undefined,
    },
    {
      key: 'enquiries',
      label: 'Customer Chat & Enquiries',
      icon: Inbox,
      badge: unreadEnquiriesCount > 0 ? unreadEnquiriesCount : undefined,
    },
    { key: 'signals', label: 'Signals Studio', icon: TrendingUp },
    { key: 'updates', label: 'Updates', icon: Radio },
    { key: 'members', label: 'Members', icon: Users },
    { key: 'registrations', label: 'Analytics', icon: BarChart3 },
    { key: 'academy', label: 'Academy', icon: BookOpen },
    { key: 'notifications', label: 'Push Alerts', icon: Bell },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      {/* Standalone Admin Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#111827]/95 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img
              src={settings.logo_url}
              alt={settings.brand_name}
              className="w-9 h-9 rounded-xl object-cover border border-slate-200 dark:border-slate-800"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                  {settings.brand_name}
                </span>
                <span className="rounded-md bg-[#881337] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                  Admin Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Signed in as <span className="font-mono">{adminUser.email}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={loadAdminData}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sync</span>
            </button>
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
              aria-label="Toggle color theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Public Website</span>
            </a>
            <button
              type="button"
              onClick={handleAdminSignOut}
              className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        {/* Navigation Strip */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-3 flex items-center gap-1.5 overflow-x-auto">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-colors ${
                  tab === t.key
                    ? 'bg-[#881337] text-white'
                    : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
                      tab === t.key
                        ? 'bg-white text-[#881337]'
                        : 'bg-[#881337] text-white'
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {toast && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {toast}
          </div>
        )}

        {publishReceipt && (
          <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/80 dark:bg-emerald-950/25 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-bold text-[#15803D] dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{publishReceipt.title}</span>
              </p>
              {publishReceipt.pushJob ? (
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  <span>Queued: {publishReceipt.pushJob.queued_count}</span>
                  <span className="text-[#15803D] dark:text-emerald-400 font-semibold">
                    Delivered: {publishReceipt.pushJob.delivered_count}
                  </span>
                  <span
                    className={
                      publishReceipt.pushJob.failed_count > 0
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : ''
                    }
                  >
                    Failures: {publishReceipt.pushJob.failed_count}
                  </span>
                  <span>Targeted: {publishReceipt.pushJob.total_targeted}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  Visible immediately in public Signals Channel (push alert not selected).
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {publishReceipt.signalMessageId && (
                <button
                  type="button"
                  onClick={() => navigate(`/signals?message=${publishReceipt.signalMessageId}`)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View in Signals</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setPublishReceipt(null)}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-300"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        )}

        {/* 1. OVERVIEW */}
        {tab === 'overview' && overview && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                type="button"
                onClick={() => setTab('applications')}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-[#881337]/50 transition-colors"
              >
                <p className="text-xs text-slate-500">Membership Applications</p>
                <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {overview.stats.total_applications}
                </p>
                <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                  {overview.stats.pending_applications} pending · {overview.stats.approved_applications} approved
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTab('enquiries')}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-[#881337]/50 transition-colors"
              >
                <p className="text-xs text-slate-500">Customer Chat &amp; Enquiries</p>
                <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {overview.stats.total_enquiries}
                </p>
                <p className="text-[11px] font-semibold text-[#881337] dark:text-rose-400">
                  {overview.stats.unread_customer_messages} unread waiting reply
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTab('members')}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-[#881337]/50 transition-colors"
              >
                <p className="text-xs text-slate-500">Active Premium Members</p>
                <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">
                  {overview.stats.active_premium_members}
                </p>
                <p className="text-[11px] text-slate-500">
                  {overview.stats.total_users} total accounts (+{overview.stats.new_registrations_7d} in 7d)
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTab('signals')}
                className="text-left rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4 hover:border-[#881337]/50 transition-colors"
              >
                <p className="text-xs text-slate-500">Signals &amp; Push Reach</p>
                <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {overview.stats.total_signals}
                </p>
                <p className="text-[11px] text-slate-500">
                  {overview.stats.active_signals} active · {overview.stats.push_subscribers} push device(s)
                </p>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backups */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                      Database Backups
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateBackup}
                    className="rounded-lg bg-[#15803D] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#166534]"
                  >
                    Create Snapshot Now
                  </button>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {overview.backups.map((b) => (
                    <div key={b} className="py-2 flex items-center justify-between gap-2">
                      <span className="font-mono text-slate-600 dark:text-slate-300 truncate">{b}</span>
                      <button
                        type="button"
                        onClick={() => handleDownloadBackup(b)}
                        className="inline-flex items-center gap-1 text-[#881337] dark:text-rose-400 hover:underline shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </button>
                    </div>
                  ))}
                  {overview.backups.length === 0 && (
                    <p className="py-2 text-slate-500">No backup snapshots yet.</p>
                  )}
                </div>
              </div>

              {/* System & Error Logs */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Server &amp; API Error Monitoring
                </h2>
                {overview.system_logs.length === 0 ? (
                  <p className="text-xs text-slate-500">Zero runtime warnings or errors logged.</p>
                ) : (
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-56 overflow-y-auto text-xs">
                    {overview.system_logs.map((l) => (
                      <div key={l.id} className="py-2">
                        <span className="font-mono font-semibold text-amber-500">[{l.level}]</span>{' '}
                        <span className="font-mono text-slate-400">{l.source}</span> — {l.message}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 2. MEMBERSHIP APPLICATIONS */}
        {tab === 'applications' && (
          <AdminApplicationsPanel
            onNotify={notifyOk}
            onError={setErrorMsg}
            onGlobalRefresh={loadAdminData}
            liveTick={appsLiveTick}
          />
        )}

        {/* 3. CUSTOMER CHAT & CONTACT ENQUIRIES */}
        {tab === 'enquiries' && (
          <AdminEnquiriesPanel
            onNotify={notifyOk}
            onError={setErrorMsg}
            onGlobalRefresh={loadAdminData}
            liveTick={enquiriesLiveTick}
          />
        )}

        {/* 4. SIGNALS STUDIO (Live Broadcast Channel + Structured Trading Signals) */}
        {tab === 'signals' && (
          <div className="space-y-8">
            <AdminSignalsBroadcastStudio
              onNotify={notifyOk}
              onError={setErrorMsg}
              onPublishReceipt={(receipt) => setPublishReceipt(receipt)}
              onOpenPublicSignals={(msgId) =>
                navigate(msgId ? `/signals?message=${msgId}` : '/signals?tab=active')
              }
              liveTick={signalsLiveTick}
            />

            {/* Structured Trading Signal Publisher & Active Setups */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Structured Trading Signal Cards
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Publish structured Entry / Stop-Loss / TP1-TP4 signal records. Active signals also mirror to the live Signals Channel feed.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <form
                  onSubmit={handleSubmitSignal}
                  className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3.5 h-fit"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingSignalId ? 'Edit Structured Signal' : 'Publish Structured Signal'}
                    </h3>
                    {editingSignalId && (
                      <button
                        type="button"
                        onClick={() => setEditingSignalId(null)}
                        className="text-xs text-slate-500 underline"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Pair (e.g. XAUUSD)"
                      value={sigForm.pair}
                      onChange={(e) => setSigForm({ ...sigForm, pair: e.target.value.toUpperCase() })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono"
                    />
                    <select
                      value={sigForm.direction}
                      onChange={(e) =>
                        setSigForm({ ...sigForm, direction: e.target.value as SignalDirection })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-semibold"
                    >
                      <option value="BUY">BUY</option>
                      <option value="SELL">SELL</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      placeholder="Entry Price"
                      value={sigForm.entry_price}
                      onChange={(e) => setSigForm({ ...sigForm, entry_price: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Stop Loss"
                      value={sigForm.stop_loss}
                      onChange={(e) => setSigForm({ ...sigForm, stop_loss: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="TP1"
                      value={sigForm.tp1}
                      onChange={(e) => setSigForm({ ...sigForm, tp1: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="TP2"
                      value={sigForm.tp2}
                      onChange={(e) => setSigForm({ ...sigForm, tp2: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="TP3"
                      value={sigForm.tp3}
                      onChange={(e) => setSigForm({ ...sigForm, tp3: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      placeholder="TP4"
                      value={sigForm.tp4}
                      onChange={(e) => setSigForm({ ...sigForm, tp4: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="R:R (1 : 3)"
                      value={sigForm.risk_reward}
                      onChange={(e) => setSigForm({ ...sigForm, risk_reward: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Timeframe"
                      value={sigForm.timeframe}
                      onChange={(e) => setSigForm({ ...sigForm, timeframe: e.target.value })}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-mono"
                    />
                    <select
                      value={sigForm.classification}
                      onChange={(e) =>
                        setSigForm({
                          ...sigForm,
                          classification: e.target.value as 'Educational' | 'Verified',
                        })
                      }
                      className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-2 text-xs"
                    >
                      <option value="Educational">Educational</option>
                      <option value="Verified">Verified</option>
                    </select>
                  </div>

                  <select
                    value={sigForm.status}
                    onChange={(e) =>
                      setSigForm({ ...sigForm, status: e.target.value as SignalStatus })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-medium"
                  >
                    {(['Active', 'Pending', 'TP Hit', 'SL Hit', 'Closed', 'Cancelled'] as const).map(
                      (st) => (
                        <option key={st} value={st}>
                          Status: {st}
                        </option>
                      )
                    )}
                  </select>

                  <textarea
                    rows={3}
                    required
                    placeholder="Technical & macro analysis explanation..."
                    value={sigForm.analysis}
                    onChange={(e) => setSigForm({ ...sigForm, analysis: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />

                  <input
                    type="text"
                    placeholder="Admin remarks / trade management instructions"
                    value={sigForm.admin_remarks}
                    onChange={(e) => setSigForm({ ...sigForm, admin_remarks: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>{sigForm.chart_image_url ? 'Chart Attached' : 'Upload Chart Image'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) =>
                          handleUploadField(e.target.files?.[0], (url) =>
                            setSigForm((f) => ({ ...f, chart_image_url: url }))
                          )
                        }
                      />
                    </label>

                    <div className="flex flex-wrap items-center gap-4">
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sigForm.is_premium}
                          onChange={(e) => setSigForm({ ...sigForm, is_premium: e.target.checked })}
                          className="accent-[#881337]"
                        />
                        <span>Premium Only</span>
                      </label>
                      <label className="inline-flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={sigForm.send_push}
                          onChange={(e) => setSigForm({ ...sigForm, send_push: e.target.checked })}
                          className="accent-[#881337]"
                        />
                        <span>Send Push</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
                  >
                    {editingSignalId ? 'Save Signal Changes' : 'Publish Structured Signal'}
                  </button>
                </form>

                <div className="lg:col-span-7 space-y-4">
                  {followUpSignalId && (
                    <form
                      onSubmit={handlePostFollowUp}
                      className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-4 space-y-3"
                    >
                      <p className="text-xs font-bold text-[#881337] dark:text-rose-400">
                        Post Follow-Up Update &amp; Push Alert
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={followUpStatus}
                          onChange={(e) => setFollowUpStatus(e.target.value as SignalStatus)}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                        >
                          {(
                            ['Active', 'Pending', 'TP Hit', 'SL Hit', 'Closed', 'Cancelled'] as const
                          ).map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        <input
                          type="text"
                          required
                          value={followUpNote}
                          onChange={(e) => setFollowUpNote(e.target.value)}
                          placeholder="e.g. TP1 hit! Move stop loss to entry."
                          className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
                        >
                          Post
                        </button>
                      </div>
                    </form>
                  )}

                  <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
                    {signals.map((sig) => (
                      <div
                        key={sig.id}
                        className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                              {sig.pair}
                            </span>
                            <span
                              className={`text-xs font-bold ${
                                sig.direction === 'BUY'
                                  ? 'text-[#15803D] dark:text-emerald-400'
                                  : 'text-[#9F1239] dark:text-rose-400'
                              }`}
                            >
                              {sig.direction}
                            </span>
                            <span className="text-xs text-slate-500">
                              · {sig.status} · {sig.timeframe}
                              {sig.is_premium ? ' · Premium' : ''}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-slate-500 mt-0.5 tabular-nums">
                            Entry {sig.entry_price} · SL {sig.stop_loss} · TP1 {sig.tp1}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleQuickSignalStatus(sig, 'TP Hit')}
                            className="rounded-md bg-emerald-50 border border-emerald-200 text-[#15803D] dark:bg-emerald-500/15 dark:border-emerald-500/30 dark:text-emerald-400 px-2.5 py-1 text-[11px] font-semibold"
                          >
                            TP Hit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleQuickSignalStatus(sig, 'SL Hit')}
                            className="rounded-md bg-rose-50 border border-rose-200 text-[#9F1239] dark:bg-rose-500/15 dark:border-rose-500/30 dark:text-rose-400 px-2.5 py-1 text-[11px] font-semibold"
                          >
                            SL Hit
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setFollowUpSignalId(sig.id);
                              setFollowUpStatus(sig.status);
                            }}
                            className="rounded-md border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-medium"
                          >
                            Follow-Up
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingSignalId(sig.id);
                              setSigForm({
                                pair: sig.pair,
                                direction: sig.direction,
                                entry_price: sig.entry_price,
                                stop_loss: sig.stop_loss,
                                tp1: sig.tp1,
                                tp2: sig.tp2 || '',
                                tp3: sig.tp3 || '',
                                tp4: sig.tp4 || '',
                                risk_reward: sig.risk_reward,
                                timeframe: sig.timeframe,
                                status: sig.status,
                                classification: sig.classification,
                                analysis: sig.analysis,
                                chart_image_url: sig.chart_image_url || '',
                                admin_remarks: sig.admin_remarks || '',
                                is_premium: Boolean(sig.is_premium),
                                send_push: true,
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-[#881337]"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSignal(sig.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {signals.length === 0 && (
                      <p className="p-5 text-xs text-slate-500">
                        No structured signal cards published yet.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. MARKET UPDATES */}
        {tab === 'updates' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handlePublishUpdate}
              className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3.5 h-fit"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Publish Market Update
              </h2>
              <input
                type="text"
                required
                placeholder="Update headline"
                value={updForm.title}
                onChange={(e) => setUpdForm({ ...updForm, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
              <select
                value={updForm.category}
                onChange={(e) =>
                  setUpdForm({ ...updForm, category: e.target.value as MarketUpdateCategory })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                {[
                  'Breaking News',
                  'Forex Update',
                  'Economic Announcement',
                  'Trading Opportunity',
                  'Gold & Crypto',
                  'Risk Warning',
                  'Daily Outlook',
                  'Session Alert',
                  'Platform Announcement',
                ].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <textarea
                rows={4}
                required
                placeholder="Write detailed market briefing..."
                value={updForm.content}
                onChange={(e) => setUpdForm({ ...updForm, content: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
              <input
                type="url"
                placeholder="Optional external link (https://...)"
                value={updForm.external_link}
                onChange={(e) => setUpdForm({ ...updForm, external_link: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Schedule Publish Time (leave blank for immediate)
                </label>
                <input
                  type="datetime-local"
                  value={updForm.scheduled_at}
                  onChange={(e) => setUpdForm({ ...updForm, scheduled_at: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{updForm.image_url ? 'Image Ready' : 'Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadField(e.target.files?.[0], (url) =>
                        setUpdForm((f) => ({ ...f, image_url: url }))
                      )
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{updForm.video_url ? 'Video Ready' : 'Video'}</span>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadField(e.target.files?.[0], (url) =>
                        setUpdForm((f) => ({ ...f, video_url: url }))
                      )
                    }
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1.5">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{updForm.attachment_url ? 'Doc Ready' : 'PDF/Doc'}</span>
                  <input
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadField(e.target.files?.[0], (url, name) =>
                        setUpdForm((f) => ({ ...f, attachment_url: url, attachment_name: name }))
                      )
                    }
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updForm.pinned}
                    onChange={(e) => setUpdForm({ ...updForm, pinned: e.target.checked })}
                    className="accent-[#881337]"
                  />
                  <span>Pin to top</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updForm.is_premium}
                    onChange={(e) => setUpdForm({ ...updForm, is_premium: e.target.checked })}
                    className="accent-[#881337]"
                  />
                  <span>Premium Members Only</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={updForm.send_push}
                    onChange={(e) => setUpdForm({ ...updForm, send_push: e.target.checked })}
                    className="accent-[#881337]"
                  />
                  <span>Send Push Alert</span>
                </label>
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
              >
                {updForm.scheduled_at ? 'Schedule Update' : 'Publish Update Live'}
              </button>
            </form>

            <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] divide-y divide-slate-100 dark:divide-slate-800">
              {allUpdates.map((u) => (
                <div key={u.id} className="p-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500">
                      {u.pinned ? 'Pinned · ' : ''}
                      {u.is_premium ? 'Premium · ' : ''}
                      {!u.published ? 'Scheduled · ' : ''}
                      {u.category} · {formatLocalDateTime(u.created_at)}
                    </p>
                    <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{u.title}</p>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                      {u.content}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(u)}
                      className={`p-2 rounded-lg ${
                        u.pinned ? 'text-[#881337] dark:text-rose-400' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title="Toggle Pin"
                    >
                      <Pin className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteUpdate(u.id)}
                      className="p-2 rounded-lg text-slate-400 hover:text-red-500"
                      title="Delete Update"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. PREMIUM MEMBERS & MODERATION */}
        {tab === 'members' && (
          <div className="space-y-6">
            <AdminMembersPanel
              onNotify={notifyOk}
              onError={setErrorMsg}
              onGlobalRefresh={loadAdminData}
            />

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Community Moderation Queue ({reports.length})
              </h3>
              {reports.map((r) => (
                <div
                  key={r.id}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2"
                >
                  <p className="font-semibold">
                    {r.post_title || 'Reported Item'} · Status: {r.status}
                  </p>
                  <p className="text-slate-500">
                    Reported by {r.reporter_name}: {r.reason}
                  </p>
                  {r.status === 'pending' && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleReportAction(r.id, 'hide_post')}
                        className="rounded bg-red-600 px-2.5 py-1 text-white font-semibold"
                      >
                        Hide Post
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReportAction(r.id, 'dismiss')}
                        className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {reports.length === 0 && <p className="text-xs text-slate-500">No community reports.</p>}
            </div>
          </div>
        )}

        {/* 7. MEMBER ANALYTICS */}
        {tab === 'registrations' && (
          <AdminRegistrationsPanel
            analytics={registrations}
            onRefresh={loadAdminData}
            onError={setErrorMsg}
          />
        )}

        {/* 8. ACADEMY CMS */}
        {tab === 'academy' && (
          <AdminAcademyManager
            studentProgress={overview?.student_progress || []}
            onNotify={notifyOk}
            onError={setErrorMsg}
            onGlobalRefresh={async () => {
              await Promise.all([refreshAll(), loadAdminData()]);
            }}
          />
        )}

        {/* 9. PUSH NOTIFICATIONS */}
        {tab === 'notifications' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSendBroadcast}
              className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Compose Push &amp; In-App Broadcast
              </h2>
              <input
                type="text"
                required
                placeholder="Notification title (e.g. London Session Liquidity Alert)"
                value={notifForm.title}
                onChange={(e) => setNotifForm({ ...notifForm, title: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
              <textarea
                rows={3}
                required
                placeholder="Alert body message..."
                value={notifForm.body}
                onChange={(e) => setNotifForm({ ...notifForm, body: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={notifForm.category}
                  onChange={(e) => setNotifForm({ ...notifForm, category: e.target.value })}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                >
                  <option value="announcements">Platform Announcements</option>
                  <option value="signals">Forex Signals</option>
                  <option value="signal_updates">Signal Updates (TP/SL)</option>
                  <option value="signal_chat">Signal Chat Channel</option>
                  <option value="market_updates">Market Updates</option>
                  <option value="academy">Academy Releases</option>
                  <option value="economic_calendar">Economic Calendar</option>
                </select>
                <input
                  type="text"
                  placeholder="Deep link (e.g. /signals or /updates)"
                  value={notifForm.link_url}
                  onChange={(e) => setNotifForm({ ...notifForm, link_url: e.target.value })}
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
                />
              </div>

              <input
                type="text"
                placeholder="Optional notification banner image URL (/uploads/...)"
                value={notifForm.image_url}
                onChange={(e) => setNotifForm({ ...notifForm, image_url: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                  Target Audience
                </label>
                <select
                  value={notifForm.targetMode}
                  onChange={(e) =>
                    setNotifForm({
                      ...notifForm,
                      targetMode: e.target.value as typeof notifForm.targetMode,
                    })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                >
                  <option value="all">All Subscribed Devices (Public Visitors &amp; Members)</option>
                  <option value="registered">All Premium Member Accounts</option>
                  <option value="verified">Verified Member Accounts Only</option>
                  <option value="admins_mods">Administrators</option>
                  <option value="selected">Specific Selected Members</option>
                </select>
              </div>

              {notifForm.targetMode === 'selected' && (
                <div className="max-h-36 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800 p-2.5 space-y-1.5 text-xs">
                  {usersList.map((u) => (
                    <label key={u.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={notifForm.selectedUserIds.includes(u.id)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...notifForm.selectedUserIds, u.id]
                            : notifForm.selectedUserIds.filter((id) => id !== u.id);
                          setNotifForm({ ...notifForm, selectedUserIds: next });
                        }}
                      />
                      <span>
                        {u.name} ({u.email})
                      </span>
                    </label>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.respect_prefs}
                    onChange={(e) =>
                      setNotifForm({ ...notifForm, respect_prefs: e.target.checked })
                    }
                    className="w-4 h-4 accent-[#881337]"
                  />
                  <span>Respect category subscriptions</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.sound}
                    onChange={(e) => setNotifForm({ ...notifForm, sound: e.target.checked })}
                    className="w-4 h-4 accent-[#881337]"
                  />
                  <span>Play sound &amp; vibration</span>
                </label>
              </div>

              <div>
                <label className="block text-[11px] text-slate-500 mb-1">
                  Schedule Delivery (optional)
                </label>
                <input
                  type="datetime-local"
                  value={notifForm.scheduled_at}
                  onChange={(e) => setNotifForm({ ...notifForm, scheduled_at: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
              >
                {notifForm.scheduled_at ? 'Schedule Notification' : 'Send Push Notification Now'}
              </button>
            </form>

            <div className="lg:col-span-6 space-y-5">
              {/* Infrastructure Readiness */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Push Notification Infrastructure
                    </h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Last notification sent:{' '}
                      {pushDiagnostics?.summary.last_sent_at
                        ? formatLocalDateTime(pushDiagnostics.summary.last_sent_at)
                        : 'No broadcasts dispatched yet'}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={testingAllPush}
                    onClick={handleSendTestNotificationAll}
                    className="rounded-lg bg-[#15803D] px-3.5 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-[#166534] disabled:opacity-60"
                  >
                    {testingAllPush ? 'Sending...' : 'SEND TEST NOTIFICATION'}
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Web Push (VAPID · Desktop, Android &amp; iOS 16.4+ PWA)
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Key source: {pushDiagnostics?.infrastructure.web_push.source || 'database'} ·{' '}
                        {pushDiagnostics?.infrastructure.web_push.public_key_prefix || 'configured'}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        pushDiagnostics?.infrastructure.web_push.ready
                          ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-rose-50 text-[#881337]'
                      }`}
                    >
                      {pushDiagnostics?.infrastructure.web_push.ready ? 'Ready' : 'Missing'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Native Android FCM Adapter
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pushDiagnostics?.infrastructure.fcm.ready
                          ? `Configured via ${pushDiagnostics.infrastructure.fcm.mode}`
                          : `Missing env: ${(pushDiagnostics?.infrastructure.fcm.missing_env || ['FIREBASE_SERVICE_ACCOUNT_JSON']).join(', ')} (Android browsers use Web Push)`}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        pushDiagnostics?.infrastructure.fcm.ready
                          ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {pushDiagnostics?.infrastructure.fcm.ready ? 'Ready' : 'Unconfigured'}
                    </span>
                  </div>

                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Native iOS APNs Adapter
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {pushDiagnostics?.infrastructure.apns.ready
                          ? `Configured (${pushDiagnostics.infrastructure.apns.environment})`
                          : `Missing env: ${(pushDiagnostics?.infrastructure.apns.missing_env || ['APNS_KEY_ID', 'APNS_TEAM_ID', 'APNS_BUNDLE_ID', 'APNS_PRIVATE_KEY']).join(', ')} (iOS PWA uses Apple Web Push)`}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0 ${
                        pushDiagnostics?.infrastructure.apns.ready
                          ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                      }`}
                    >
                      {pushDiagnostics?.infrastructure.apns.ready ? 'Ready' : 'Unconfigured'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Subscribed Devices & Stats */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Subscribed Devices &amp; Delivery Stats
                  </h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={testingAdminPush}
                      onClick={handleTestAdminDevicePush}
                      className="rounded-lg border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-[#15803D] dark:text-emerald-400 hover:bg-emerald-100 disabled:opacity-60"
                    >
                      {testingAdminPush ? 'Sending...' : 'Test My Device'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePruneInactiveSubs}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Prune Invalid ({pushDiagnostics?.summary.total_inactive ?? 0})
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[11px] text-slate-500">Subscribed Total</p>
                    <p className="mt-0.5 text-lg font-bold font-mono text-slate-900 dark:text-white">
                      {pushDiagnostics?.summary.total_active ?? overview?.stats.push_subscribers ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[11px] text-slate-500">Android</p>
                    <p className="mt-0.5 text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      {pushDiagnostics?.summary.android ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[11px] text-slate-500">iOS</p>
                    <p className="mt-0.5 text-lg font-bold font-mono text-[#881337] dark:text-rose-400">
                      {pushDiagnostics?.summary.ios ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[11px] text-slate-500">Web Browsers</p>
                    <p className="mt-0.5 text-lg font-bold font-mono text-slate-700 dark:text-slate-300">
                      {pushDiagnostics?.summary.web ?? pushDiagnostics?.summary.desktop ?? 0}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs">
                  {(pushDiagnostics?.subscriptions || []).slice(0, 25).map((sub) => (
                    <div key={sub.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {sub.user_name
                            ? `${sub.user_name} (${sub.user_email})`
                            : sub.device_label || 'Public Device'}{' '}
                          <span className="uppercase text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            {sub.platform} · {sub.transport}
                          </span>
                        </p>
                        <p className="text-[11px] text-slate-500 truncate">
                          {sub.last_error
                            ? `Error: ${sub.last_error}`
                            : sub.last_success_at
                              ? `Last delivered: ${formatLocalDateTime(sub.last_success_at)}`
                              : `Registered: ${formatLocalDateTime(sub.created_at)}`}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                          sub.active
                            ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-500/15 dark:text-emerald-400'
                            : 'bg-rose-50 text-[#881337] dark:bg-rose-500/15 dark:text-rose-400'
                        }`}
                      >
                        {sub.active ? 'Active' : 'Invalid/Off'}
                      </span>
                    </div>
                  ))}
                  {(!pushDiagnostics || pushDiagnostics.subscriptions.length === 0) && (
                    <p className="py-3 text-xs text-slate-500">No device subscriptions registered yet.</p>
                  )}
                </div>
              </div>

              {/* Recent Push Jobs */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Notification History &amp; Delivery Logs
                </h2>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-64 overflow-y-auto text-xs">
                  {((pushDiagnostics?.jobs && pushDiagnostics.jobs.length > 0
                    ? pushDiagnostics.jobs
                    : overview?.push_jobs) || []
                  ).map((job) => (
                    <div key={job.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-white truncate">
                          {job.priority === 'urgent' ? '[URGENT] ' : ''}
                          {job.title}
                        </p>
                        <p className="text-slate-500">
                          {job.category} · {job.status} · {formatLocalDateTime(job.created_at)}
                        </p>
                      </div>
                      <div className="text-right font-mono tabular-nums shrink-0 text-[11px]">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {job.delivered_count}/{job.total_targeted} sent
                        </span>
                        <span className="ml-2 text-[#15803D] dark:text-emerald-300">
                          {job.confirmed_count ?? 0} ack
                        </span>
                        {job.failed_count > 0 && (
                          <span className="ml-2 text-red-600 dark:text-red-400">
                            {job.failed_count} fail
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 10. PLATFORM SETTINGS & ADMIN SECURITY */}
        {tab === 'settings' && (
          <div className="space-y-6 max-w-3xl">
            <form
              onSubmit={handleSaveSettings}
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Platform Branding, Official Contact Details &amp; SEO
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={settingsForm.brand_name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, brand_name: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Official Business Email</label>
                  <input
                    type="email"
                    value={settingsForm.contact_email}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_email: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Official WhatsApp Number (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="+447911123456 (blank hides WhatsApp button)"
                    value={settingsForm.contact_whatsapp || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_whatsapp: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Official Phone Number</label>
                  <input
                    type="text"
                    placeholder="Optional support phone"
                    value={settingsForm.contact_phone || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_phone: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Official Location / Desk</label>
                  <input
                    type="text"
                    placeholder="City / Desk hours"
                    value={settingsForm.contact_address || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, contact_address: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <label className="inline-flex items-center gap-2 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Upload Custom Brand Logo</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleUploadField(e.target.files?.[0], (url) =>
                        setSettingsForm((f) => ({ ...f, logo_url: url }))
                      )
                    }
                  />
                </label>
                <span className="font-mono text-slate-500">{settingsForm.logo_url}</span>
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Homepage Hero Headline</label>
                <input
                  type="text"
                  value={settingsForm.hero_title}
                  onChange={(e) => setSettingsForm({ ...settingsForm, hero_title: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">Homepage Hero Subtitle</label>
                <textarea
                  rows={2}
                  value={settingsForm.hero_subtitle}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium mb-1">About Section Text</label>
                <textarea
                  rows={3}
                  value={settingsForm.about_text}
                  onChange={(e) => setSettingsForm({ ...settingsForm, about_text: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">SEO Title</label>
                  <input
                    type="text"
                    value={settingsForm.seo_title}
                    onChange={(e) => setSettingsForm({ ...settingsForm, seo_title: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">SEO Meta Description</label>
                  <input
                    type="text"
                    value={settingsForm.seo_description}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, seo_description: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={settingsForm.push_enabled}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, push_enabled: e.target.checked })
                  }
                  className="accent-[#881337]"
                />
                <span>Enable Global Push Notification Delivery</span>
              </label>

              <div>
                <button
                  type="submit"
                  className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
                >
                  Save Platform Configuration
                </button>
              </div>
            </form>

            {/* Administrator Security Policy */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-2">
              <div className="flex items-start gap-3">
                <KeyRound className="w-5 h-5 text-[#881337] dark:text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Administrator Account &amp; Access Policy
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Signed in as{' '}
                    <span className="font-mono font-semibold text-slate-900 dark:text-white">
                      {adminUser.email}
                    </span>
                    . Administrator authentication is isolated exclusively on{' '}
                    <span className="font-mono">/admin</span> and cannot be accessed through public
                    member sign-in. Premium member accounts are managed from the{' '}
                    <button
                      type="button"
                      onClick={() => setTab('members')}
                      className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                    >
                      Members
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => setTab('applications')}
                      className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                    >
                      Applications
                    </button>{' '}
                    tabs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
