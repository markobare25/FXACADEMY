import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Globe,
  KeyRound,
  Mail,
  MessageSquare,
  Phone,
  RefreshCw,
  Search,
  UserPlus,
  X,
  XCircle,
} from 'lucide-react';
import { adminApiFetch } from '../../lib/adminApi';
import { formatLocalDateTime } from '../../lib/api';
import type {
  MembershipApplication,
  MembershipApplicationStatus,
  User,
} from '../../types';

interface AdminApplicationsPanelProps {
  onNotify: (msg: string) => void;
  onError: (msg: string) => void;
  onGlobalRefresh: () => Promise<void>;
  liveTick?: number;
}

interface ApplicationsResponse {
  summary: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  applications: MembershipApplication[];
}

export const AdminApplicationsPanel: React.FC<AdminApplicationsPanelProps> = ({
  onNotify,
  onError,
  onGlobalRefresh,
  liveTick = 0,
}) => {
  const [data, setData] = useState<ApplicationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | MembershipApplicationStatus>('all');
  const [search, setSearch] = useState('');
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);

  // Create Member Modal State
  const [creatingFor, setCreatingFor] = useState<MembershipApplication | null>(null);
  const [memberForm, setMemberForm] = useState({
    username: '',
    email: '',
    password: '',
    membership_expires_at: '',
    membership_notes: '',
  });
  const [submittingMember, setSubmittingMember] = useState(false);

  // One-time Credentials Receipt
  const [receipt, setReceipt] = useState<{
    reference_code: string;
    member: User;
    temporary_password: string;
  } | null>(null);

  const loadApplications = useCallback(async () => {
    try {
      const res = await adminApiFetch<ApplicationsResponse>('/api/admin/applications');
      setData(res);
      setNoteDrafts((prev) => {
        const next = { ...prev };
        for (const app of res.applications) {
          if (next[app.id] === undefined) {
            next[app.id] = app.admin_notes || '';
          }
        }
        return next;
      });
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to load membership applications.');
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    loadApplications();
  }, [loadApplications, liveTick]);

  const filtered = useMemo(() => {
    const list = data?.applications || [];
    const q = search.trim().toLowerCase();
    return list.filter((app) => {
      if (filter !== 'all' && app.status !== filter) return false;
      if (!q) return true;
      return (
        app.full_name.toLowerCase().includes(q) ||
        app.email.toLowerCase().includes(q) ||
        app.phone.toLowerCase().includes(q) ||
        app.country.toLowerCase().includes(q) ||
        app.reference_code.toLowerCase().includes(q) ||
        app.message.toLowerCase().includes(q)
      );
    });
  }, [data, filter, search]);

  const handleUpdateApplication = async (
    id: string,
    patch: { status?: MembershipApplicationStatus; admin_notes?: string | null },
    okMessage: string
  ) => {
    setBusyId(id);
    try {
      await adminApiFetch<{ application: MembershipApplication }>(`/api/admin/applications/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      onNotify(okMessage);
      await Promise.all([loadApplications(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to update application.');
    } finally {
      setBusyId(null);
    }
  };

  const openCreateMember = (app: MembershipApplication) => {
    const suggestedUsername =
      app.full_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '.')
        .replace(/^\.+|\.+$/g, '')
        .slice(0, 20) || app.email.split('@')[0].replace(/[^a-z0-9._-]/g, '');

    setCreatingFor(app);
    setMemberForm({
      username: suggestedUsername,
      email: app.email,
      password: '',
      membership_expires_at: '',
      membership_notes: `Approved from ${app.reference_code} (${app.country})`,
    });
  };

  const handleCreateMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creatingFor) return;
    setSubmittingMember(true);
    try {
      const payload: Record<string, unknown> = {
        username: memberForm.username.trim() || undefined,
        email: memberForm.email.trim() || undefined,
        membership_notes: memberForm.membership_notes.trim() || null,
      };
      if (memberForm.password.trim()) {
        payload.password = memberForm.password.trim();
      }
      if (memberForm.membership_expires_at.trim()) {
        payload.membership_expires_at = new Date(
          `${memberForm.membership_expires_at.trim()}T23:59:59.000Z`
        ).toISOString();
      }

      const res = await adminApiFetch<{
        application: MembershipApplication;
        member: User;
        temporary_password: string;
      }>(`/api/admin/applications/${creatingFor.id}/create-member`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setReceipt({
        reference_code: creatingFor.reference_code,
        member: res.member,
        temporary_password: res.temporary_password,
      });
      setCreatingFor(null);
      onNotify(`Premium Member account created for ${res.member.name}.`);
      await Promise.all([loadApplications(), onGlobalRefresh()]);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Failed to create premium member account.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const copyText = (text: string, label: string) => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(
        () => onNotify(`${label} copied to clipboard.`),
        () => onNotify(`${label}: ${text}`)
      );
    } else {
      onNotify(`${label}: ${text}`);
    }
  };

  const summary = data?.summary || { total: 0, pending: 0, approved: 0, rejected: 0 };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
          <p className="text-[11px] font-medium text-slate-500">Total Applications</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {summary.total}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-4">
          <p className="text-[11px] font-medium text-amber-700 dark:text-amber-300">Pending Review</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-amber-700 dark:text-amber-300">
            {summary.pending}
          </p>
        </div>
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 p-4">
          <p className="text-[11px] font-medium text-[#15803D] dark:text-emerald-400">Approved</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#15803D] dark:text-emerald-400">
            {summary.approved}
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-4">
          <p className="text-[11px] font-medium text-[#881337] dark:text-rose-400">Declined</p>
          <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#881337] dark:text-rose-400">
            {summary.rejected}
          </p>
        </div>
      </div>

      {/* One-time Credentials Receipt */}
      {receipt && (
        <div className="rounded-2xl border-2 border-emerald-500/40 bg-emerald-50/90 dark:bg-emerald-950/30 p-5 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2 text-[#15803D] dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
              <div>
                <h3 className="text-sm font-bold">
                  Premium Member Credentials Issued ({receipt.reference_code})
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Share these sign-in details securely with {receipt.member.name}. The password will not be shown again.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setReceipt(null)}
              className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Member Sign-In URL</p>
              <p className="mt-1 font-mono text-slate-900 dark:text-white break-all">
                {`${window.location.origin}/profile`}
              </p>
              <button
                type="button"
                onClick={() => copyText(`${window.location.origin}/profile`, 'Member Sign-In URL')}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy Link
              </button>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Email</p>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-white break-all">
                {receipt.member.email}
              </p>
              <button
                type="button"
                onClick={() => copyText(receipt.member.email, 'Email')}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy Email
              </button>
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Username</p>
              <p className="mt-1 font-mono font-semibold text-slate-900 dark:text-white">
                {receipt.member.username || '—'}
              </p>
              {receipt.member.username && (
                <button
                  type="button"
                  onClick={() => copyText(receipt.member.username || '', 'Username')}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
                >
                  <Copy className="w-3 h-3" /> Copy Username
                </button>
              )}
            </div>
            <div className="rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/50 p-3">
              <p className="text-[10px] uppercase font-bold text-slate-400">Temporary Password</p>
              <p className="mt-1 font-mono font-bold text-[#881337] dark:text-rose-300 select-all">
                {receipt.temporary_password}
              </p>
              <button
                type="button"
                onClick={() => copyText(receipt.temporary_password, 'Password')}
                className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D] dark:text-emerald-400 hover:underline"
              >
                <Copy className="w-3 h-3" /> Copy Password
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((statusKey) => (
            <button
              key={statusKey}
              type="button"
              onClick={() => setFilter(statusKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                filter === statusKey
                  ? 'bg-[#881337] text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {statusKey}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ref, email, country..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs"
            />
          </div>
          <button
            type="button"
            onClick={loadApplications}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Create Member Modal / Drawer */}
      {creatingFor && (
        <form
          onSubmit={handleCreateMemberSubmit}
          className="rounded-2xl border-2 border-[#881337]/40 bg-white dark:bg-[#111827] p-5 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <span>Create Premium Member Account for {creatingFor.full_name}</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Application {creatingFor.reference_code} will automatically be marked Approved and linked to this member.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setCreatingFor(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Member Email
              </label>
              <input
                type="email"
                required
                value={memberForm.email}
                onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Username
              </label>
              <input
                type="text"
                required
                value={memberForm.username}
                onChange={(e) => setMemberForm({ ...memberForm, username: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Temporary Password (optional auto)
              </label>
              <input
                type="text"
                placeholder="Leave blank to auto-generate"
                value={memberForm.password}
                onChange={(e) => setMemberForm({ ...memberForm, password: e.target.value })}
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
                Membership Expiry (optional)
              </label>
              <input
                type="date"
                value={memberForm.membership_expires_at}
                onChange={(e) =>
                  setMemberForm({ ...memberForm, membership_expires_at: e.target.value })
                }
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1">
              Membership Notes
            </label>
            <input
              type="text"
              value={memberForm.membership_notes}
              onChange={(e) => setMemberForm({ ...memberForm, membership_notes: e.target.value })}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreatingFor(null)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingMember}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-bold text-white hover:bg-[#166534] disabled:opacity-60"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{submittingMember ? 'Creating Account...' : 'Create & Issue Credentials'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-xs text-slate-500">
          Loading membership applications...
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-xs text-slate-500">
          No membership applications match the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((app) => {
            const isBusy = busyId === app.id;
            const statusClasses =
              app.status === 'approved'
                ? 'bg-emerald-50 text-[#15803D] border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-400 dark:border-emerald-800/60'
                : app.status === 'rejected'
                  ? 'bg-rose-50 text-[#881337] border-rose-200 dark:bg-rose-500/15 dark:text-rose-400 dark:border-rose-800/60'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';

            return (
              <div
                key={app.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-[#881337] dark:text-rose-400">
                        {app.reference_code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${statusClasses}`}
                      >
                        {app.status}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Preferred: {app.preferred_contact}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        · {formatLocalDateTime(app.created_at)}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {app.full_name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <a
                        href={`mailto:${app.email}`}
                        className="inline-flex items-center gap-1 hover:text-[#881337] dark:hover:text-rose-400"
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.email}</span>
                      </a>
                      <a
                        href={`tel:${app.phone}`}
                        className="inline-flex items-center gap-1 font-mono hover:text-[#881337] dark:hover:text-rose-400"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.phone}</span>
                      </a>
                      <span className="inline-flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.country}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {!app.member_user_id ? (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() => openCreateMember(app)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60"
                      >
                        <UserPlus className="w-3.5 h-3.5" />
                        <span>Approve &amp; Create Member</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1.5 text-xs font-semibold text-[#15803D] dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>
                          Account Active (@{app.member_username || 'member'} · {app.member_status || 'active'})
                        </span>
                      </span>
                    )}

                    {app.status !== 'approved' && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleUpdateApplication(
                            app.id,
                            { status: 'approved' },
                            `Marked ${app.reference_code} approved.`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 dark:border-emerald-800 px-2.5 py-1.5 text-xs font-semibold text-[#15803D] dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 disabled:opacity-60"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Only</span>
                      </button>
                    )}

                    {app.status !== 'rejected' && !app.member_user_id && (
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={() =>
                          handleUpdateApplication(
                            app.id,
                            { status: 'rejected' },
                            `Marked ${app.reference_code} declined.`
                          )
                        }
                        className="inline-flex items-center gap-1 rounded-lg border border-rose-300 dark:border-rose-800 px-2.5 py-1.5 text-xs font-semibold text-[#881337] dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 disabled:opacity-60"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Decline</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-100 dark:border-slate-800 p-3.5">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    <span>Applicant Enquiry</span>
                  </p>
                  <p className="text-xs text-slate-700 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {app.message}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    placeholder="Internal review notes..."
                    value={noteDrafts[app.id] ?? ''}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))
                    }
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs"
                  />
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() =>
                      handleUpdateApplication(
                        app.id,
                        { admin_notes: noteDrafts[app.id] ?? '' },
                        `Saved review note for ${app.reference_code}.`
                      )
                    }
                    className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    Save Note
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
