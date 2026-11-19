import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  BookOpen,
  Database,
  Download,
  Edit3,
  LayoutDashboard,
  Pin,
  Radio,
  Search,
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
import type {
  MarketUpdate,
  MarketUpdateCategory,
  PlatformSettings,
  SignalDirection,
  SignalStatus,
  TradingSignal,
  User,
  UserRole,
} from '../types';

type AdminTab =
  | 'overview'
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
  const { user, settings, signals, refreshAll, navigate } = usePlatform();
  const [tab, setTab] = useState<AdminTab>('overview');
  const [overview, setOverview] = useState<OverviewPayload | null>(null);
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
    targetMode: 'all' as 'all' | 'selected',
    selectedUserIds: [] as string[],
    scheduled_at: '',
  });

  // User search
  const [userSearch, setUserSearch] = useState('');

  // Platform Settings State
  const [settingsForm, setSettingsForm] = useState<PlatformSettings>(settings);

  useEffect(() => {
    setSettingsForm(settings);
  }, [settings]);

  const loadAdminData = useCallback(async () => {
    if (user?.role !== 'admin') return;
    try {
      const [ov, upd, usr, rep, cnt] = await Promise.all([
        apiFetch<OverviewPayload>('/api/admin/overview'),
        apiFetch<{ updates: MarketUpdate[] }>('/api/updates?includeAll=true'),
        apiFetch<{ users: User[] }>('/api/admin/users'),
        apiFetch<{ reports: typeof reports }>('/api/admin/reports'),
        apiFetch<{ messages: typeof contacts }>('/api/admin/contacts'),
      ]);
      setOverview(ov);
      setAllUpdates(upd.updates);
      setUsersList(usr.users);
      setReports(rep.reports);
      setContacts(cnt.messages);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load admin data.');
    }
  }, [user?.role]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  const notifyOk = (msg: string) => {
    setErrorMsg(null);
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

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
        await apiFetch(`/api/signals/${editingSignalId}`, {
          method: 'PATCH',
          body: JSON.stringify(sigForm),
        });
        notifyOk('Signal updated and synced to all connected clients.');
      } else {
        await apiFetch('/api/signals', {
          method: 'POST',
          body: JSON.stringify(sigForm),
        });
        notifyOk('New trading signal published and pushed.');
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
        send_push: true,
      });
      await Promise.all([refreshAll(), loadAdminData()]);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save signal.');
    }
  };

  const handleQuickSignalStatus = async (sig: TradingSignal, nextStatus: SignalStatus) => {
    try {
      await apiFetch(`/api/signals/${sig.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus, send_push: true }),
      });
      notifyOk(`${sig.pair} status updated to ${nextStatus}.`);
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status.');
    }
  };

  const handlePostFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!followUpSignalId) return;
    try {
      await apiFetch(`/api/signals/${followUpSignalId}/updates`, {
        method: 'POST',
        body: JSON.stringify({
          note: followUpNote,
          status: followUpStatus,
          send_push: true,
        }),
      });
      setFollowUpSignalId(null);
      setFollowUpNote('');
      notifyOk('Follow-up update published.');
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
    try {
      await apiFetch('/api/updates', {
        method: 'POST',
        body: JSON.stringify({
          ...updForm,
          scheduled_at: updForm.scheduled_at ? new Date(updForm.scheduled_at).toISOString() : null,
        }),
      });
      setUpdForm({
        title: '',
        content: '',
        category: 'Forex Update',
        pinned: false,
        image_url: '',
        video_url: '',
        attachment_url: '',
        attachment_name: '',
        external_link: '',
        scheduled_at: '',
        send_push: true,
      });
      notifyOk(updForm.scheduled_at ? 'Update scheduled.' : 'Market update published live.');
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
      await apiFetch('/api/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify({
          title: notifForm.title,
          body: notifForm.body,
          category: notifForm.category,
          link_url: notifForm.link_url,
          target_user_ids:
            notifForm.targetMode === 'selected' ? notifForm.selectedUserIds : null,
          scheduled_at: notifForm.scheduled_at
            ? new Date(notifForm.scheduled_at).toISOString()
            : null,
        }),
      });
      setNotifForm((f) => ({ ...f, title: '', body: '', scheduled_at: '' }));
      notifyOk(notifForm.scheduled_at ? 'Notification scheduled.' : 'Push notification dispatched.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to send notification.');
    }
  };

  // --- User & Settings Handlers ---
  const handleUpdateUser = async (
    targetId: string,
    patch: { role?: UserRole; status?: 'active' | 'suspended' }
  ) => {
    try {
      await apiFetch(`/api/admin/users/${targetId}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      notifyOk('User permissions updated.');
      await loadAdminData();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Update failed.');
    }
  };

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

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const tabs: Array<{ key: AdminTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { key: 'overview', label: 'Overview', icon: LayoutDashboard },
    { key: 'signals', label: 'Signals', icon: TrendingUp },
    { key: 'updates', label: 'Updates', icon: Radio },
    { key: 'notifications', label: 'Push Alerts', icon: Bell },
    { key: 'academy', label: 'Academy', icon: BookOpen },
    { key: 'users', label: 'Users & Mod', icon: Users },
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
              <p className="text-xs text-slate-500">Total Users</p>
              <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                {overview.stats.total_users}
              </p>
              <p className="text-[11px] text-slate-500">
                +{overview.stats.new_registrations_7d} in last 7d
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

            <div className="flex items-center justify-between gap-2 text-xs">
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

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={updForm.pinned}
                  onChange={(e) => setUpdForm({ ...updForm, pinned: e.target.checked })}
                />
                <span>Pin to top</span>
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={updForm.send_push}
                  onChange={(e) => setUpdForm({ ...updForm, send_push: e.target.checked })}
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <form
            onSubmit={handleSendBroadcast}
            className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
          >
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Dispatch Push & In-App Notification
            </h2>
            <input
              type="text"
              required
              placeholder="Notification title"
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
            <div className="grid grid-cols-2 gap-3">
              <select
                value={notifForm.category}
                onChange={(e) => setNotifForm({ ...notifForm, category: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              >
                <option value="signals">Trading Signals</option>
                <option value="signal_updates">Signal Updates</option>
                <option value="market_updates">Market Updates</option>
                <option value="academy">Academy</option>
                <option value="economic_calendar">Economic Calendar</option>
                <option value="announcements">Announcements</option>
              </select>
              <input
                type="text"
                placeholder="Deep link (e.g. /signals)"
                value={notifForm.link_url}
                onChange={(e) => setNotifForm({ ...notifForm, link_url: e.target.value })}
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />
            </div>

            <div className="flex items-center gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={notifForm.targetMode === 'all'}
                  onChange={() => setNotifForm({ ...notifForm, targetMode: 'all' })}
                />
                <span>All Subscribed Users</span>
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="radio"
                  checked={notifForm.targetMode === 'selected'}
                  onChange={() => setNotifForm({ ...notifForm, targetMode: 'selected' })}
                />
                <span>Target Specific Users</span>
              </label>
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

          <div className="lg:col-span-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Delivery & Subscription Statistics
            </h2>
            <p className="text-xs text-slate-500">
              Active registered push endpoints: <strong>{overview?.stats.push_subscribers ?? 0}</strong>
            </p>
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-96 overflow-y-auto text-xs">
              {(overview?.dispatch_logs || []).map((log) => (
                <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">
                      {log.title}
                    </p>
                    <p className="text-slate-500">
                      {log.category} · {formatLocalDateTime(log.created_at)}
                    </p>
                  </div>
                  <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400 shrink-0">
                    {log.delivered_count}/{log.total_targeted} sent
                  </span>
                </div>
              ))}
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

      {/* F. USER MANAGEMENT, REPORTS & CONTACTS */}
      {tab === 'users' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Registered Users ({filteredUsers.length})
              </h2>
              <div className="relative w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Search name or email..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                    <th className="py-2 pr-4">Name</th>
                    <th className="py-2 pr-4">Email</th>
                    <th className="py-2 pr-4">Role</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 text-right">Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredUsers.map((u) => (
                    <tr key={u.id}>
                      <td className="py-2.5 pr-4 font-semibold">{u.name}</td>
                      <td className="py-2.5 pr-4 text-slate-500">{u.email}</td>
                      <td className="py-2.5 pr-4">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            handleUpdateUser(u.id, { role: e.target.value as UserRole })
                          }
                          className="rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-xs"
                        >
                          <option value="user">user</option>
                          <option value="moderator">moderator</option>
                          <option value="admin">admin</option>
                        </select>
                      </td>
                      <td className="py-2.5 pr-4">
                        <span
                          className={
                            u.status === 'active' ? 'text-emerald-500 font-semibold' : 'text-red-500 font-semibold'
                          }
                        >
                          {u.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() =>
                            handleUpdateUser(u.id, {
                              status: u.status === 'active' ? 'suspended' : 'active',
                            })
                          }
                          className="rounded border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-xs hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

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
                Contact Desk Inquiries ({contacts.length})
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

      {/* G. PLATFORM SETTINGS */}
      {tab === 'settings' && (
        <form
          onSubmit={handleSaveSettings}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 space-y-4 max-w-3xl"
        >
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Platform Branding, Content, SEO & Integrations
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
              <label className="block text-xs font-medium mb-1">Contact Email</label>
              <input
                type="email"
                value={settingsForm.contact_email}
                onChange={(e) => setSettingsForm({ ...settingsForm, contact_email: e.target.value })}
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
      )}
    </div>
  );
};
