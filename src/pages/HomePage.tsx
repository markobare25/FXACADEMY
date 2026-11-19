import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BellRing,
  BookOpen,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  Radio,
  ShieldAlert,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { PWAInstallButton } from '../components/PWAInstallButton';
import { apiFetch, formatLocalDateTime, formatRelativeTime } from '../lib/api';

export const HomePage: React.FC = () => {
  const {
    user,
    settings,
    stats,
    signals,
    updates,
    courses,
    navigate,
    setShowNotifModal,
  } = usePlatform();

  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [contactLoading, setContactLoading] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    setContactError(null);
    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify(contactForm),
      });
      setContactSent(true);
      setContactForm({ name: '', email: '', subject: '', message: '' });
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send message.');
    } finally {
      setContactLoading(false);
    }
  };

  return (
    <div className="space-y-20">
      {/* Hero Split Section */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pt-10 lg:pt-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-semibold text-[#881337] dark:text-rose-400 tracking-wide">
              Forex Signals · Live Intelligence · Trading Academy
            </p>
            <h1
              className="mt-3 text-3xl sm:text-4xl lg:text-[46px] font-bold tracking-tight text-slate-900 dark:text-white leading-[1.12]"
              style={{ textWrap: 'balance' }}
            >
              {settings.hero_title}
            </h1>
            <p className="mt-5 text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl">
              {settings.hero_subtitle}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              {user ? (
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
                >
                  <span>Open Trader Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-5 py-3 text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors min-h-[44px]"
                  >
                    <span>Create Free Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-5 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 hover:border-[#881337]/40 hover:bg-rose-50/40 dark:hover:bg-slate-800 transition-colors min-h-[44px]"
                  >
                    Sign In
                  </button>
                </>
              )}

              <PWAInstallButton variant="outline" label="Install App" />

              <button
                type="button"
                onClick={() => setShowNotifModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-50/70 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 transition-colors min-h-[44px]"
              >
                <BellRing className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                <span>Enable Alerts</span>
              </button>
            </div>

            <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
              Trading involves substantial risk of loss. All signals are educational setups—no guaranteed returns.
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative h-full min-h-[280px] lg:min-h-[420px] rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white shadow-sm">
              <img
                src="/src/assets/images/hero_light_trading_1795086732029.jpg"
                alt="Bright institutional London Forex trading office with live green and maroon candlestick charts"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 p-5 bg-white/92 dark:bg-[#090D16]/90 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                    Synchronized Terminal
                  </p>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    Instant WebSocket & Push Signal Delivery
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/markets')}
                  className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] transition-colors"
                >
                  View Live Charts
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Column Genuine Database Activity Strip */}
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] rounded-2xl p-6">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Published Signals</p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-[#881337] dark:text-rose-400">
              {stats.total_signals}
            </p>
            <p className="mt-0.5 text-xs text-emerald-700 dark:text-emerald-400">
              {stats.active_signals} active · {stats.completed_signals} completed
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Market Updates</p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.total_updates}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Real-time briefings
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Academy Curriculum</p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
              {stats.total_lessons}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              Across {stats.total_courses} structured courses
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Registered Members</p>
            <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
              {stats.total_users}
            </p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {stats.community_posts} community discussions
            </p>
          </div>
        </div>
      </section>

      {/* Latest Live Trading Signals Preview */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Latest Trading Signals
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
              Transparent educational setups with defined invalidation and multi-tier targets.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/signals')}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#881337] dark:text-rose-400 hover:underline whitespace-nowrap shrink-0"
          >
            <span>Open Full Signal Feed</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {signals.slice(0, 3).map((sig) => {
            const isBuy = sig.direction === 'BUY';
            return (
              <article
                key={sig.id}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                      {sig.pair}
                    </h3>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-bold ${
                        isBuy
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-[#9F1239] dark:text-rose-400'
                      }`}
                    >
                      {isBuy ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                      {sig.direction}
                    </span>
                  </div>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    {sig.classification} · {sig.timeframe} · {sig.status} · {formatRelativeTime(sig.created_at)}
                  </p>

                  <div className="mt-4 grid grid-cols-3 gap-3 border-t border-slate-100 dark:border-slate-800 pt-3 text-xs">
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Entry</span>
                      <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                        {sig.entry_price}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">Stop Loss</span>
                      <span className="font-mono font-semibold text-[#9F1239] dark:text-rose-400 tabular-nums">
                        {sig.stop_loss}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-500 dark:text-slate-400 block">TP1</span>
                      <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                        {sig.tp1}
                      </span>
                    </div>
                  </div>

                  <p className="mt-3 text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {sig.analysis}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500 dark:text-slate-400">
                    R:R {sig.risk_reward}
                  </span>
                  <button
                    type="button"
                    onClick={() => navigate('/signals')}
                    className="font-semibold text-[#881337] dark:text-rose-400 hover:underline"
                  >
                    Inspect Setup
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Live Updates & Academy Split */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Live Market Updates Preview */}
          <div className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-[#881337] dark:text-rose-400" />
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Live Market Updates
                </h2>
              </div>
              <button
                type="button"
                onClick={() => navigate('/updates')}
                className="text-xs font-semibold text-[#881337] dark:text-rose-400 hover:underline"
              >
                All Updates
              </button>
            </div>

            <div className="mt-5 divide-y divide-slate-100 dark:divide-slate-800">
              {updates.slice(0, 3).map((upd) => (
                <div key={upd.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {upd.pinned ? 'Pinned · ' : ''}
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      {upd.category}
                    </span>{' '}
                    · {formatLocalDateTime(upd.created_at)}
                  </p>
                  <h3 className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                    {upd.title}
                  </h3>
                  <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300 line-clamp-2">
                    {upd.content}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Trading Academy Highlight */}
          <div className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden flex flex-col shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
            <div className="h-44 bg-slate-100 overflow-hidden">
              <img
                src="/src/assets/images/academy_forex_cover_1795085836938.jpg"
                alt="Forex Trading Academy study material"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                  <BookOpen className="w-4 h-4" />
                  <span>Structured Forex Trading Academy</span>
                </div>
                <h2 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">
                  From Pip Mechanics to Institutional Macro
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {courses.length} structured courses covering candlestick price action, risk engineering, Gold volatility, and quizzes with offline study support.
                </p>
              </div>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => navigate('/academy')}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 transition-colors"
                >
                  <span>Browse Curriculum</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About & Contact Us Section */}
      <section id="about" className="mx-auto max-w-7xl px-4 sm:px-6 pb-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 border-t border-slate-200 dark:border-slate-800 pt-14">
          <div className="lg:col-span-5 space-y-5">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              About {settings.brand_name}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {settings.about_text}
            </p>
            <div className="space-y-2.5 pt-2 text-sm text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                <span>{settings.contact_email}</span>
              </div>
              {settings.contact_phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                  <span>{settings.contact_phone}</span>
                </div>
              )}
              {settings.contact_address && (
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                  <span>{settings.contact_address}</span>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-[#881337]/25 bg-rose-50/70 dark:bg-rose-950/20 p-4 text-xs text-slate-700 dark:text-slate-300">
              <div className="flex items-center gap-2 font-semibold text-[#881337] dark:text-rose-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Risk & Educational Disclosure</span>
              </div>
              <p className="mt-1.5 leading-relaxed">
                Spot Forex, CFDs, commodities, and cryptocurrencies are leveraged instruments carrying significant risk of capital loss. No past educational setup guarantees future outcomes.
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Contact Desk & Support
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Questions about membership, signal methodology, or educational access? Send a direct inquiry.
              </p>

              <form onSubmit={handleContactSubmit} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={contactForm.name}
                      onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                      placeholder="Alex Mercer"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={contactForm.email}
                      onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                      placeholder="alex@example.com"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    required
                    value={contactForm.subject}
                    onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                    placeholder="Academy curriculum or signal inquiry"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={contactForm.message}
                    onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                    placeholder="Write your inquiry..."
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                  />
                </div>

                {contactError && (
                  <p className="text-xs font-medium text-red-700 dark:text-red-400">{contactError}</p>
                )}
                {contactSent && (
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Message received by our desk. We will respond via email.</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={contactLoading}
                  className="rounded-lg bg-[#881337] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 transition-colors min-h-[44px]"
                >
                  {contactLoading ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
