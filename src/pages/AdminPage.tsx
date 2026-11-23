import React, { useCallback, useEffect, useState } from 'react';
import {
  BarChart3,
  Bell,
  BookOpen,
  Database,
  Download,
  Edit3,
  KeyRound,
  LayoutDashboard,
  MessageSquareText,
  Pin,
  Radio,
  Settings as SettingsIcon,
  ShieldAlert,
  Trash2,
  TrendingUp,
  Upload,
  Users,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime, uploadMediaFile } from '../lib/api';
import { AdminAcademyManager } from '../components/admin/AdminAcademyManager';
import { AdminMembersPanel } from '../components/admin/AdminMembersPanel';
import { AdminRegistrationsPanel } from '../components/admin/AdminRegistrationsPanel';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { sendTestPushNotification } from '../lib/pushClient';
import type {
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
  | 'registrations'
  | 'signals'
  | 'updates'
  | 'notifications'
  | 'academy'
  | 'users'
  | 'settings';

interface OverviewPayload {
  stats: {
    total_signals: number;
    active_signals: number;
    completed_signals: number;
    total_updates: number;
    total_courses: number;
    total_lessons: number;
    total_users: number;
    new_registrations_7d: number;
    push_subscribers: number;
  };
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
  const { user, authLoading, settings, signals, refreshAll, navigate, subscribePushJobEvents } =
    usePlatform();
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
  const [contacts, setContacts] = useState<
    Array<{ id: string; name: string; email: string; subject: string; message: string; created_at: string }>
  >([]);
  const [toast, setToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [publishReceipt, setPublishReceipt] = useState<{
    title: string;
    signalMessageId: string | null;
    pushJob: PushJobSummary | null;
  } | null>(null);

  // Signal Form State
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

  const loadAdminData = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const [ov, reg, upd, usr, rep, cnt, diag] = await Promise.all([
        apiFetch<OverviewPayload>('/api/admin/overview'),
        apiFetch<RegistrationAnalyticsPayload>('/api/admin/registrations'),
        apiFetch<{ updates: MarketUpdate[] }>('/api/updates?includeAll=true'),
        apiFetch<{ users: User[] }>('/api/admin/users'),
        apiFetch<{ reports: typeof reports }>('/api/admin/reports'),
        apiFetch<{ messages: typeof contacts }>('/api/admin/contacts'),
        apiFetch<NonNullable<typeof pushDiagnostics>>('/api/admin/push-diagnostics'),
      ]);
      setOverview(ov);
      setRegistrations(reg);
      setAllUpdates(upd.updates);
      setUsersList(usr.users);
      setReports(rep.reports);
      setContacts(cnt.messages);
      setPushDiagnostics(diag);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin data.');
    }
  }, [user?.role]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  useEffect(() => {
    return subscribePushJobEvents((job) => {
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
    });
  }, [subscribePushJobEvents]);

  useEffect(() => {
    const jobId = publishReceipt?.pushJob?.id;
    const queued = publishReceipt?.pushJob?.queued_count ?? 0;
    if (!jobId || queued <= 0) return;

    const timer = window.setInterval(() => {
      apiFetch<{ job: PushJobSummary }>(`/api/admin/push-jobs/${jobId}`)
        .then((res) => {
          setPublishReceipt((cur) =>
            cur?.pushJob?.id === jobId ? { ...cur, pushJob: res.job } : cur
          );
        })
        .catch(() => undefined);
    }, 3000);
    return () => clearInterval(timer);
  }, [publishReceipt?.pushJob?.id, publishReceipt?.pushJob?.queued_count]);

  const notifyOk = (msg: string) => {
    setErrorMsg(null);
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  if (authLoading && !user) {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
          Verifying administrator session...
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="mx-auto max-w-lg py-12">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center space-y-4">
          <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Administrator Access Required
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This console is restricted to authorized platform administrators.
          </p>
          <button
            type="button"
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B]"
          >
            {user ? 'Return to Dashboard' : 'Sign In as Administrator'}
          </button>
        </div>
      </div>
    );
  }

  const handleUploadField = async (
    file: File | undefined,
    onDone: (url: string, origName: string) => void
  ) => {
    if (!file) return;
    try {
      const uploaded = await uploadMediaFile(file);
      onDone(uploaded.url, uploaded.original_name);
      notifyOk(`Uploaded ${uploaded.original_name}`);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Upload failed.');
    }
  };

  // --- Signal Handlers ---
  const handleSubmitSignal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSignalId) {
        const res = await apiFetch<{
          signal_message?: SignalChatMessage | null;
          push_job?: PushJobSummary | null;
        }>(`/api/signals/${editingSignalId}`, {
          method: 'PATCH',
          body: JSON.stringify(sigForm),
        });
        notifyOk('Signal updated and synced to all connected clients.');
        if (res.signal_message || res.push_job) {
          setPublishReceipt({
            title: `${sigForm.pair} status update published publicly`,
            signalMessageId: res.signal_message?.id || null,
            pushJob: res.push_job || null,
          });
        }
      } else {
        const res = await apiFetch<{
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
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save signal.');
    }
  };

  const handleQuickSignalStatus = async (sig: TradingSignal, nextStatus: SignalStatus) => {
    try {
      const res = await apiFetch<{
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
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handlePostFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpSignalId) return;
    try {
      const res = await apiFetch<{
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
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to post follow-up.');
    }
  };

  const handleDeleteSignal = async (id: string) => {
    await apiFetch(`/api/signals/${id}`, { method: 'DELETE' });
    notifyOk('Signal deleted.');
    await Promise.all([refreshAll(), loadAdminData()]);
  };

  // --- Update Handlers ---
  const handlePublishUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const isScheduled = Boolean(updForm.scheduled_at);
    try {
      const res = await apiFetch<{
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
      notifyOk(isScheduled ? 'Update scheduled.' : 'Market update published live to Updates & Signals Channel.');
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
    await apiFetch(`/api/updates/${upd.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ pinned: !upd.pinned }),
    });
    await Promise.all([refreshAll(), loadAdminData()]);
  };

  const handleDeleteUpdate = async (id: string) => {
    await apiFetch(`/api/updates/${id}`, { method: 'DELETE' });
    notifyOk('Market update deleted.');
    await Promise.all([refreshAll(), loadAdminData()]);
  };

  // --- Notification Broadcast ---
  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch<{
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
      notifyOk('Test push notification sent to this admin device.');
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
      const res = await apiFetch<{
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
      const res = await apiFetch<{ deleted: number }>('/api/admin/push-subscriptions/prune', {
        method: 'POST',
        body: JSON.stringify({ older_than_days: 0 }),
      });
      notifyOk(`Cleaned up ${res.deleted} inactive push token(s).`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to clean up push tokens.');
    }
  };

  // --- Moderation & Settings Handlers ---
  const handleReportAction = async (id: string, action: 'hide_post' | 'dismiss') => {
    await apiFetch(`/api/admin/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ action }),
    });
    notifyOk(action === 'hide_post' ? 'Post hidden and report resolved.' : 'Report dismissed.');
    await loadAdminData();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/settings', {
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
    await apiFetch('/api/admin/backup', { method: 'POST' });
    notifyOk('Database backup snapshot created.');
    await loadAdminData();
  };

  const tabs: Array<{ key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'users', label: 'Members', icon: Users },
    { key: 'registrations', label: 'Member Analytics', icon: BarChart3 },
    { key: 'signals', label: 'Signals', icon: TrendingUp },
    { key: 'updates', label: 'Updates', icon: Radio },
    { key: 'notifications', label: 'Push Alerts', icon: Bell },
    { key: 'academy', label: 'Academy', icon: BookOpen },
    { key: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Administrator Command Desk
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            All changes synchronize live across the public website, user dashboards, and installed PWAs.
          </p>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {toast && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
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

      {/* A. OVERVIEW */}
      {tab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <p className="text-xs text-slate-500">Members &amp; Admin</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {overview.stats.total_users}
              </p>
              <p className="text-[11px] text-slate-500">
                +{overview.stats.new_registrations_7d} added in last 7d
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <p className="text-xs text-slate-500">Trading Signals</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {overview.stats.total_signals}
              </p>
              <p className="text-[11px] text-slate-500">
                {overview.stats.active_signals} active · {overview.stats.completed_signals} completed
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <p className="text-xs text-slate-500">Market Updates</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {overview.stats.total_updates}
              </p>
              <p className="text-[11px] text-slate-500">Published briefings</p>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
              <p className="text-xs text-slate-500">Push Devices</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {overview.stats.push_subscribers}
              </p>
              <p className="text-[11px] text-slate-500">Active Web Push endpoints</p>
            </div>
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
                    <a
                      href={`/api/admin/backups/${encodeURIComponent(b)}`}
                      className="inline-flex items-center gap-1 text-[#881337] dark:text-rose-400 hover:underline shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  </div>
                ))}
              </div>
            </div>

            {/* System & Error Logs */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Server & API Error Monitoring
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

      {/* B. SIGNAL MANAGEMENT */}
      {tab === 'signals' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#881337]/30 bg-rose-50/70 dark:bg-rose-950/20 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#881337] text-white flex items-center justify-center shrink-0">
                <MessageSquareText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Live Signals Community Channel
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  Publish real-time messages, chart screenshots, pinned announcements, and archive completed updates directly in the Signals chat composer.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/signals?tab=active')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#881337] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] shrink-0 min-h-[42px]"
            >
              <MessageSquareText className="w-4 h-4" />
              <span>Open Live Signals Chat & Composer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSubmitSignal}
              className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3.5 h-fit"
            >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {editingSignalId ? 'Edit Trading Signal' : 'Publish New Signal'}
              </h2>
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
              onChange={(e) => setSigForm({ ...sigForm, status: e.target.value as SignalStatus })}
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
                  <span>Premium Members Only</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={sigForm.send_push}
                    onChange={(e) => setSigForm({ ...sigForm, send_push: e.target.checked })}
                    className="accent-[#881337]"
                  />
                  <span>Send Push Alert</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] min-h-[44px]"
            >
              {editingSignalId ? 'Save Signal Changes' : 'Publish Signal Live'}
            </button>
          </form>

          {/* Existing Signals Table / List */}
          <div className="lg:col-span-7 space-y-4">
            {followUpSignalId && (
              <form
                onSubmit={handlePostFollowUp}
                className="rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/70 dark:bg-rose-950/20 p-4 space-y-3"
              >
                <p className="text-xs font-bold text-[#881337] dark:text-rose-400">
                  Post Follow-Up Update & Push Alert
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={followUpStatus}
                    onChange={(e) => setFollowUpStatus(e.target.value as SignalStatus)}
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
                  >
                    {(['Active', 'Pending', 'TP Hit', 'SL Hit', 'Closed', 'Cancelled'] as const).map(
                      (st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      )
                    )}
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
                <div key={sig.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-white">
                        {sig.pair}
                      </span>
                      <span
                        className={`text-xs font-bold ${
                          sig.direction === 'BUY' ? 'text-[#15803D] dark:text-emerald-400' : 'text-[#9F1239] dark:text-rose-400'
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
            </div>
          </div>
          </div>
        </div>
      )}

      {/* C. MARKET UPDATES */}
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

      {/* D. PUSH NOTIFICATIONS */}
      {tab === 'notifications' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSendBroadcast}
              className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Compose Push & In-App Broadcast
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
                  <option value="all">All Subscribed Devices (Visitors & Registered Users)</option>
                  <option value="registered">All Registered Accounts</option>
                  <option value="verified">Email-Verified Traders Only</option>
                  <option value="admins_mods">Administrators & Moderators</option>
                  <option value="selected">Specific Selected Users</option>
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
                  <span>Respect user category subscriptions</span>
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notifForm.sound}
                    onChange={(e) => setNotifForm({ ...notifForm, sound: e.target.checked })}
                    className="w-4 h-4 accent-[#881337]"
                  />
                  <span>Play sound & vibration</span>
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
              {/* Infrastructure Readiness Card */}
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
                        Web Push (VAPID · Desktop, Android & iOS 16.4+ PWA)
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

              {/* Device Endpoints & Delivery Counters */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h2 className="text-base font-bold text-slate-900 dark:text-white">
                    Subscribed Devices & Delivery Stats
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

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase">Queued</p>
                    <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {pushDiagnostics?.summary.totals.queued ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase">Sent</p>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {pushDiagnostics?.summary.totals.delivered ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase">Confirmed</p>
                    <p className="font-mono font-bold text-[#15803D] dark:text-emerald-300">
                      {pushDiagnostics?.summary.totals.confirmed ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase">Failed</p>
                    <p className="font-mono font-bold text-red-600 dark:text-red-400">
                      {pushDiagnostics?.summary.totals.failed ?? 0}
                    </p>
                  </div>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900/70 p-2.5">
                    <p className="text-[10px] text-slate-500 uppercase">Invalid</p>
                    <p className="font-mono font-bold text-slate-600 dark:text-slate-300">
                      {pushDiagnostics?.summary.total_inactive ?? 0}
                    </p>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-48 overflow-y-auto text-xs">
                  {(pushDiagnostics?.subscriptions || []).slice(0, 25).map((sub) => (
                    <div key={sub.id} className="py-2 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {sub.user_name ? `${sub.user_name} (${sub.user_email})` : sub.device_label || 'Anonymous Device'}{' '}
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

              {/* Push Jobs & Per-Device Delivery Receipts */}
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Notification History & Delivery Logs
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
                        {job.queued_count > 0 && (
                          <span className="ml-2 text-amber-600 dark:text-amber-400">
                            {job.queued_count} queued
                          </span>
                        )}
                        {job.failed_count > 0 && (
                          <span className="ml-2 text-red-600 dark:text-red-400">
                            {job.failed_count} fail
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {(!pushDiagnostics?.jobs || pushDiagnostics.jobs.length === 0) &&
                    (!overview?.push_jobs || overview.push_jobs.length === 0) && (
                      <p className="py-3 text-xs text-slate-500">No push notifications dispatched yet.</p>
                    )}
                </div>

                {pushDiagnostics?.deliveries && pushDiagnostics.deliveries.length > 0 && (
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">
                      Recent Device Delivery Receipts
                    </p>
                    <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-44 overflow-y-auto text-[11px]">
                      {pushDiagnostics.deliveries.slice(0, 20).map((d) => (
                        <div key={d.id} className="py-1.5 flex items-center justify-between gap-2">
                          <span className="text-slate-700 dark:text-slate-300 truncate">
                            {d.device_label || d.platform} ({d.transport}) · {d.status}
                            {d.device_received_at ? ' · Received' : ''}
                            {d.opened_at ? ' · Opened' : ''}
                            {d.last_error ? ` · ${d.last_error}` : ''}
                          </span>
                          <span className="font-mono text-slate-400 shrink-0">
                            {d.status_code ?? '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* E. ACADEMY MANAGEMENT */}
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

      {/* A2. REGISTRATION ANALYTICS */}
      {tab === 'registrations' && (
        <AdminRegistrationsPanel
          analytics={registrations}
          onRefresh={loadAdminData}
          onError={setErrorMsg}
        />
      )}

      {/* F. PREMIUM MEMBERS MANAGEMENT, REPORTS & CONTACT INQUIRIES */}
      {tab === 'users' && (
        <div className="space-y-6">
          <AdminMembersPanel
            onNotify={notifyOk}
            onError={setErrorMsg}
            onGlobalRefresh={loadAdminData}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Community Moderation Queue ({reports.length})
              </h3>
              {reports.map((r) => (
                <div key={r.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-2">
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

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Contact &amp; Membership Inquiries ({contacts.length})
              </h3>
              {contacts.map((c) => (
                <div key={c.id} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs space-y-1">
                  <p className="font-semibold">
                    {c.subject} — {c.name} ({c.email})
                  </p>
                  <p className="text-slate-500">{c.message}</p>
                </div>
              ))}
              {contacts.length === 0 && <p className="text-xs text-slate-500">No inquiries yet.</p>}
            </div>
          </div>
        </div>
      )}

      {/* G. PLATFORM SETTINGS & ADMIN SECURITY */}
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
                  onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
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
                onChange={(e) => setSettingsForm({ ...settingsForm, hero_subtitle: e.target.value })}
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
                    {user.email}
                  </span>
                  . Designated administrator credentials remain fixed and protected via server
                  environment configuration (<span className="font-mono">ADMIN_PASSWORD</span> /{' '}
                  <span className="font-mono">ADMIN_RESET_KEY</span>). Premium member accounts,
                  usernames, expiry dates, and temporary password resets are managed from the{' '}
                  <button
                    type="button"
                    onClick={() => setTab('users')}
                    className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                  >
                    Members
                  </button>{' '}
                  tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
