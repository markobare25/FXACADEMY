import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  KeyRound,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  UserX,
  X,
} from 'lucide-react';
import { formatLocalDateTime, getOrCreateVisitorId } from '../../lib/api';
import {
  adminApiFetch,
  getAdminAccessToken,
  refreshAdminSession,
} from '../../lib/adminApi';
import type { AdminMembersPayload, User } from '../../types';

interface AdminMembersPanelProps {
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
  onGlobalRefresh?: () => Promise<void>;
}

type MemberFilter = 'all' | 'active' | 'suspended' | 'expired';

interface IssuedCredentialReceipt {
  title: string;
  name: string;
  username: string;
  email: string;
  temporaryPassword: string;
  expiresAt?: string | null;
}

function generateClientTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnopqrstuvwxyz';
  const digits = '23456789';
  const symbols = '!@#$%&*';
  const all = upper + lower + digits + symbols;
  const pick = (pool: string) => pool[Math.floor(Math.random() * pool.length)];
  const chars = [
    pick(upper),
    pick(upper),
    pick(lower),
    pick(lower),
    pick(lower),
    pick(digits),
    pick(digits),
    pick(symbols),
  ];
  while (chars.length < 12) {
    chars.push(pick(all));
  }
  for (let i = chars.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join('');
}

function isMemberExpired(u: User): boolean {
  if (u.role === 'admin' || !u.membership_expires_at) return false;
  const parsed = Date.parse(u.membership_expires_at);
  return !Number.isNaN(parsed) && parsed <= Date.now();
}

function getEffectiveState(u: User): 'active' | 'suspended' | 'expired' {
  if (u.status === 'suspended') return 'suspended';
  if (isMemberExpired(u)) return 'expired';
  return 'active';
}

export const AdminMembersPanel: React.FC<AdminMembersPanelProps> = ({
  onNotify,
  onError,
  onGlobalRefresh,
}) => {
  const [data, setData] = useState<AdminMembersPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<MemberFilter>('all');

  // Create Member Form
  const [creating, setCreating] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    status: 'active' as 'active' | 'suspended',
    membership_expires_at: '',
    membership_notes: '',
  });

  // One-time credential receipt (create or reset password)
  const [receipt, setReceipt] = useState<IssuedCredentialReceipt | null>(null);
  const [copiedReceipt, setCopiedReceipt] = useState(false);

  // Per-row editing states
  const [expiryEdits, setExpiryEdits] = useState<Record<string, string>>({});
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadMembers = useCallback(async () => {
    try {
      const payload = await adminApiFetch<AdminMembersPayload>('/api/admin/members');
      setData(payload);
      const nextDates: Record<string, string> = {};
      for (const m of payload.members) {
        nextDates[m.id] = m.membership_expires_at ? m.membership_expires_at.slice(0, 10) : '';
      }
      setExpiryEdits(nextDates);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load membership directory.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadMembers();
      if (onGlobalRefresh) await onGlobalRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await adminApiFetch<{ member: User; temporary_password: string }>(
        '/api/admin/members',
        {
          method: 'POST',
          body: JSON.stringify({
            name: createForm.name.trim(),
            username: createForm.username.trim().toLowerCase(),
            email: createForm.email.trim().toLowerCase(),
            password: createForm.password.trim() || undefined,
            status: createForm.status,
            membership_expires_at: createForm.membership_expires_at.trim() || null,
            membership_notes: createForm.membership_notes.trim() || null,
          }),
        }
      );

      setReceipt({
        title: 'Premium Member Account Created',
        name: res.member.name,
        username: res.member.username || createForm.username.trim().toLowerCase(),
        email: res.member.email,
        temporaryPassword: res.temporary_password,
        expiresAt: res.member.membership_expires_at || null,
      });
      setCopiedReceipt(false);

      setCreateForm({
        name: '',
        username: '',
        email: '',
        password: '',
        status: 'active',
        membership_expires_at: '',
        membership_notes: '',
      });
      onNotify(`Member "${res.member.name}" created. Copy login credentials below to send privately.`);
      await loadMembers();
      if (onGlobalRefresh) await onGlobalRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create member account.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (member: User) => {
    setBusyMemberId(member.id);
    try {
      const nextStatus = member.status === 'active' ? 'suspended' : 'active';
      await adminApiFetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      onNotify(
        nextStatus === 'active'
          ? `${member.name} activated.`
          : `${member.name} suspended and active sessions revoked.`
      );
      await loadMembers();
      if (onGlobalRefresh) await onGlobalRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update membership status.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleSaveExpiry = async (member: User, overrideDate?: string | null) => {
    setBusyMemberId(member.id);
    try {
      const rawVal = overrideDate !== undefined ? overrideDate : expiryEdits[member.id] ?? '';
      const nextExpiry = rawVal && rawVal.trim() ? rawVal.trim() : null;
      await adminApiFetch(`/api/admin/members/${member.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ membership_expires_at: nextExpiry }),
      });
      onNotify(
        nextExpiry
          ? `Expiry updated to ${nextExpiry.slice(0, 10)} for ${member.name}.`
          : `Expiry cleared (ongoing membership) for ${member.name}.`
      );
      await loadMembers();
      if (onGlobalRefresh) await onGlobalRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update expiry date.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleResetPassword = async (member: User) => {
    setBusyMemberId(member.id);
    try {
      const res = await adminApiFetch<{
        ok: boolean;
        temporary_password: string;
        member: User;
      }>(`/api/admin/members/${member.id}/reset-password`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      setReceipt({
        title: 'Member Password Reset',
        name: res.member.name,
        username: res.member.username || '—',
        email: res.member.email,
        temporaryPassword: res.temporary_password,
        expiresAt: res.member.membership_expires_at || null,
      });
      setCopiedReceipt(false);
      onNotify(`New temporary password generated for ${res.member.name}.`);
      await loadMembers();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to reset member password.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleDeleteMember = async (member: User) => {
    setBusyMemberId(member.id);
    try {
      await adminApiFetch(`/api/admin/members/${member.id}`, {
        method: 'DELETE',
      });
      setConfirmDeleteId(null);
      onNotify(`Member account "${member.name}" deleted.`);
      await loadMembers();
      if (onGlobalRefresh) await onGlobalRefresh();
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to delete member.');
    } finally {
      setBusyMemberId(null);
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      let token = getAdminAccessToken();
      if (!token) {
        const refreshed = await refreshAdminSession();
        token = refreshed?.token || null;
      }
      const headers = new Headers({
        'X-Visitor-Id': getOrCreateVisitorId(),
        'X-Requested-With': 'MeridianFX-Admin',
      });
      if (token) headers.set('Authorization', `Bearer ${token}`);
      const res = await fetch('/api/admin/members/export', {
        headers,
        credentials: 'include',
        cache: 'no-store',
      });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `meridianfx-members-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      onNotify('Membership records exported to CSV.');
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to export member CSV.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyReceipt = async () => {
    if (!receipt) return;
    const text = [
      `MeridianFX Premium Membership Login Details`,
      `Name: ${receipt.name}`,
      `Username: ${receipt.username}`,
      `Email: ${receipt.email}`,
      `Temporary Password: ${receipt.temporaryPassword}`,
      receipt.expiresAt ? `Membership Expiry: ${receipt.expiresAt.slice(0, 10)}` : 'Membership Expiry: Ongoing',
      `Sign In URL: ${window.location.origin}/profile`,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedReceipt(true);
      setTimeout(() => setCopiedReceipt(false), 2500);
    } catch {
      onError('Clipboard access unavailable. Please copy the credentials manually.');
    }
  };

  const filteredMembers = useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    return data.members.filter((m) => {
      const state = getEffectiveState(m);
      if (filter !== 'all' && state !== filter) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        (m.username || '').toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        (m.membership_notes || '').toLowerCase().includes(q)
      );
    });
  }, [data, search, filter]);

  const summary = data?.summary || {
    total_members: 0,
    active_members: 0,
    suspended_members: 0,
    expired_members: 0,
    inactive_members: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header & Global Controls */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <span>Premium Members Management</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Create approved member logins, assign temporary passwords, manage membership expiries, and suspend or remove accounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleExportCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{exporting ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Membership Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Members</span>
            <Users className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.total_members}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Admin-approved accounts</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Members</span>
            <UserCheck className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">
            {summary.active_members}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Full premium sign-in access</p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Inactive Total</span>
            <UserX className="w-4 h-4 text-amber-500" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.inactive_members}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {summary.suspended_members} suspended · {summary.expired_members} expired
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Expired Access</span>
            <KeyRound className="w-4 h-4 text-[#881337] dark:text-rose-400" />
          </div>
          <p className="mt-1.5 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.expired_members}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Needs renewal extension</p>
        </div>
      </div>

      {/* One-Time Issued Credentials Banner */}
      {receipt && (
        <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/80 dark:bg-emerald-950/25 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-[#15803D] dark:text-emerald-400">
                {receipt.title} — Send Privately to Member
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                For security, this temporary password is shown once and is never stored in plain text.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              aria-label="Close credential receipt"
              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-white dark:bg-slate-900/80 p-3.5 text-xs">
            <div>
              <p className="text-[11px] text-slate-500">Member Name</p>
              <p className="font-semibold text-slate-900 dark:text-white">{receipt.name}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Username</p>
              <p className="font-mono font-semibold text-slate-900 dark:text-white">
                {receipt.username}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Email Address</p>
              <p className="font-mono text-slate-900 dark:text-white truncate">{receipt.email}</p>
            </div>
            <div>
              <p className="text-[11px] text-slate-500">Temporary Password</p>
              <p className="font-mono font-bold text-[#881337] dark:text-rose-400 select-all">
                {receipt.temporaryPassword}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] text-slate-500">
              {receipt.expiresAt
                ? `Expiry: ${receipt.expiresAt.slice(0, 10)}`
                : 'Expiry: Ongoing until suspended or dated'}
            </p>
            <button
              type="button"
              onClick={handleCopyReceipt}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534]"
            >
              {copiedReceipt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedReceipt ? 'Copied Login Details' : 'Copy Login Details'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Split: Create Form + Roster */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Create New Premium Member Form */}
        <form
          onSubmit={handleCreateMember}
          className="xl:col-span-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-3.5"
        >
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#881337] dark:text-rose-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Create New Premium Member
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Approved members sign in using their assigned username or email and temporary password.
          </p>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              minLength={2}
              placeholder="e.g. Daniel Mensah"
              value={createForm.name}
              onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Assigned Username
              </label>
              <input
                type="text"
                required
                minLength={3}
                pattern="^[a-zA-Z0-9._-]+$"
                title="Letters, numbers, dots, underscores, or hyphens (min 3 chars)"
                placeholder="d.mensah"
                value={createForm.username}
                onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
                Initial Status
              </label>
              <select
                value={createForm.status}
                onChange={(e) =>
                  setCreateForm({
                    ...createForm,
                    status: e.target.value as 'active' | 'suspended',
                  })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 py-2 text-xs font-medium text-slate-900 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="member@domain.com"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                Temporary Password (blank = auto-generate)
              </label>
              <button
                type="button"
                onClick={() =>
                  setCreateForm((f) => ({ ...f, password: generateClientTempPassword() }))
                }
                className="text-[11px] font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                Generate Strong Password
              </button>
            </div>
            <input
              type="text"
              placeholder="Auto-generated if left blank"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Membership Expiry Date (optional)
            </label>
            <input
              type="date"
              value={createForm.membership_expires_at}
              onChange={(e) =>
                setCreateForm({ ...createForm, membership_expires_at: e.target.value })
              }
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-300 mb-1">
              Internal Admin Notes (optional)
            </label>
            <input
              type="text"
              maxLength={500}
              placeholder="e.g. Quarterly desk approval / Discord verification"
              value={createForm.membership_notes}
              onChange={(e) => setCreateForm({ ...createForm, membership_notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full rounded-lg bg-[#881337] py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[44px]"
          >
            {creating ? 'Creating Account...' : 'Create Premium Member'}
          </button>
        </form>

        {/* Member Records Table */}
        <div className="xl:col-span-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Member Accounts ({filteredMembers.length})
            </h3>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative w-full sm:w-56">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, username, email..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-9 pr-3 py-1.5 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="inline-flex items-center gap-1 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
                {(['all', 'active', 'suspended', 'expired'] as MemberFilter[]).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize transition-colors ${
                      filter === f
                        ? 'bg-[#881337] text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {loading ? (
            <p className="py-8 text-center text-xs text-slate-500">Loading member directory...</p>
          ) : filteredMembers.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">
              No premium members match the current search or filter.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMembers.map((m) => {
                const state = getEffectiveState(m);
                const isBusy = busyMemberId === m.id;
                const isConfirmingDelete = confirmDeleteId === m.id;
                const dateValue = expiryEdits[m.id] ?? '';

                return (
                  <div
                    key={m.id}
                    className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {m.name}
                        </span>
                        {m.username && (
                          <span className="font-mono text-xs text-[#881337] dark:text-rose-400">
                            @{m.username}
                          </span>
                        )}
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                            state === 'active'
                              ? 'bg-emerald-50 text-[#15803D] dark:bg-emerald-950/40 dark:text-emerald-400'
                              : state === 'expired'
                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                                : 'bg-rose-50 text-[#881337] dark:bg-rose-950/40 dark:text-rose-400'
                          }`}
                        >
                          {state === 'active'
                            ? 'Active'
                            : state === 'expired'
                              ? 'Expired'
                              : 'Suspended'}
                        </span>
                        {m.needs_password_setup && (
                          <span className="text-[11px] text-slate-500">· Temp password active</span>
                        )}
                      </div>

                      <p className="text-xs font-mono text-slate-600 dark:text-slate-300 truncate">
                        {m.email}
                      </p>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Registered: {formatLocalDateTime(m.created_at)}
                        {' · '}
                        Last sign in: {m.last_login_at ? formatLocalDateTime(m.last_login_at) : 'Never'}
                      </p>

                      {m.membership_notes && (
                        <p className="text-[11px] text-slate-500 italic">{m.membership_notes}</p>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 shrink-0">
                      {/* Expiry Date Editor */}
                      <div className="flex items-center gap-1.5">
                        <input
                          type="date"
                          aria-label={`Expiry date for ${m.name}`}
                          value={dateValue}
                          onChange={(e) =>
                            setExpiryEdits((prev) => ({ ...prev, [m.id]: e.target.value }))
                          }
                          className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-2 py-1 text-[11px] font-mono text-slate-800 dark:text-slate-200"
                        />
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleSaveExpiry(m)}
                          className="rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          Save Date
                        </button>
                        {m.membership_expires_at && (
                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() => handleSaveExpiry(m, null)}
                            title="Clear expiry date"
                            className="rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      {/* Account Actions */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleToggleStatus(m)}
                          className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-colors disabled:opacity-50 ${
                            m.status === 'active'
                              ? 'border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                              : 'border-emerald-300 dark:border-emerald-700 text-[#15803D] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                          }`}
                        >
                          {m.status === 'active' ? 'Suspend' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          disabled={isBusy}
                          onClick={() => handleResetPassword(m)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-300 dark:border-slate-700 px-2.5 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
                        >
                          <KeyRound className="w-3 h-3" />
                          <span>Reset Password</span>
                        </button>

                        {m.role !== 'admin' && (
                          isConfirmingDelete ? (
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleDeleteMember(m)}
                                className="rounded-lg bg-red-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="rounded-lg border border-slate-300 dark:border-slate-700 px-2 py-1 text-[11px]"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => setConfirmDeleteId(m.id)}
                              aria-label={`Delete ${m.name}`}
                              title="Delete Member"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
