import React from 'react';
import {
  Bell,
  BookOpen,
  Calendar,
  CandlestickChart,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Moon,
  Radio,
  Sun,
  TrendingUp,
  User as UserIcon,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const {
    user,
    authLoading,
    theme,
    toggleTheme,
    route,
    navigate,
    settings,
    unreadCount,
    logout,
  } = usePlatform();
  const isOnline = useOnlineStatus();

  const isLanding = route === '/' && !user && !authLoading;
  const isSignalsRoute = route === '/signals';

  const navItems = [
    { path: user ? '/dashboard' : '/', label: user ? 'Dashboard' : 'Home', icon: user ? LayoutDashboard : Home },
    { path: '/signals', label: 'Signals', icon: TrendingUp },
    { path: '/updates', label: 'Updates', icon: Radio },
    { path: '/markets', label: 'Markets', icon: CandlestickChart },
    { path: '/calendar', label: 'Calendar', icon: Calendar },
    { path: '/academy', label: 'Academy', icon: BookOpen },
    { path: '/community', label: 'Community', icon: MessageSquare },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  const mobileBottomTabs = [
    { path: user ? '/dashboard' : '/', label: 'Home', icon: Home },
    { path: '/signals', label: 'Signals', icon: TrendingUp },
    { path: '/updates', label: 'Updates', icon: Radio },
    { path: '/academy', label: 'Academy', icon: BookOpen },
    { path: '/profile', label: 'Profile', icon: UserIcon },
  ];

  if (isLanding) {
    return (
      <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#090D16] text-slate-900 dark:text-slate-100">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#090D16]/90 backdrop-blur-md">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
            {/* Zone 1: Single text element wordmark */}
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-lg font-bold tracking-tight text-[#881337] dark:text-white whitespace-nowrap shrink-0"
            >
              {settings.brand_name}
            </button>

            {/* Zone 2: 5 concise single-line nav links */}
            <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
              <button
                type="button"
                onClick={() => navigate('/signals')}
                className="inline-flex items-center gap-1.5 hover:text-[#881337] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                <span>Signals</span>
                <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-85" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/markets')}
                className="hover:text-[#881337] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Markets
              </button>
              <button
                type="button"
                onClick={() => navigate('/updates')}
                className="hover:text-[#881337] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Updates
              </button>
              <button
                type="button"
                onClick={() => navigate('/academy')}
                className="hover:text-[#881337] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Academy
              </button>
              <button
                type="button"
                onClick={() => navigate('/community')}
                className="hover:text-[#881337] dark:hover:text-white transition-colors whitespace-nowrap shrink-0"
              >
                Community
              </button>
            </nav>

            {/* Zone 3: Highly visible INSTALL APP + Primary CTA */}
            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <PWAInstallButton variant="header" label="INSTALL APP" />
              <button
                type="button"
                onClick={() => navigate('/academy')}
                className="rounded-lg bg-[#881337] px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white hover:bg-[#6B0F2B] transition-colors whitespace-nowrap shrink-0 min-h-[38px] sm:min-h-[40px]"
              >
                Explore Academy
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-20 lg:pb-0">{children}</main>

        {/* Quiet Footer */}
        <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B101B] pb-24 lg:pb-10 pt-10 px-4 sm:px-6">
          <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <p className="font-display font-bold text-[#881337] dark:text-white">
                {settings.brand_name}
              </p>
              <p className="mt-1 max-w-xl text-xs text-slate-500 dark:text-slate-400">
                Educational Risk Disclosure: Trading Forex, commodities, and digital assets carries a high level of risk and may not be suitable for all investors. Signals and analysis published on this platform are strictly educational and informational.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-5 text-xs font-medium text-slate-600 dark:text-slate-400">
              <button type="button" onClick={() => navigate('/legal')} className="hover:text-[#881337] dark:hover:text-white">
                Terms & Risk Disclosure
              </button>
              <button type="button" onClick={() => navigate('/legal')} className="hover:text-[#881337] dark:hover:text-white">
                Privacy Policy
              </button>
              <button type="button" onClick={() => navigate('/profile')} className="hover:text-[#881337] dark:hover:text-white">
                Profile &amp; Contact
              </button>
              <button type="button" onClick={toggleTheme} className="hover:text-[#881337] dark:hover:text-white">
                {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
              </button>
            </div>
          </div>
        </footer>

        {/* Mobile Bottom Navigation */}
        <nav
          aria-label="Mobile Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-md pb-safe"
        >
          <div className="grid grid-cols-5 h-16">
            {mobileBottomTabs.map((item) => {
              const Icon = item.icon;
              const active = route === item.path;
              const isSignalsTab = item.path === '/signals';
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                    active
                      ? 'text-[#881337] dark:text-rose-400'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <div className="relative">
                    <Icon className="w-5 h-5" />
                    {isSignalsTab && (
                      <span
                        className="absolute -top-1 -right-2 flex h-2.5 w-2.5"
                        aria-hidden="true"
                      >
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#0D1321]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium mt-1 leading-none">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {!isOnline && (
          <div className="fixed bottom-20 lg:bottom-4 left-4 z-50 rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-medium text-white shadow-lg">
            Offline Mode — Displaying cached signals and academy lessons.
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex bg-[#F8F9FA] dark:bg-[#090D16] text-slate-900 dark:text-slate-100 ${
        isSignalsRoute ? 'h-[100dvh] overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#0B101B]">
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-200 dark:border-slate-800/80">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-lg font-bold tracking-tight text-[#881337] dark:text-white whitespace-nowrap"
          >
            {settings.brand_name}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className="p-2 rounded-lg text-slate-500 hover:text-[#881337] dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/70 transition-colors"
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = route === item.path;
            const isSignalsTab = item.path === '/signals';
            return (
              <button
                key={item.path}
                type="button"
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? 'bg-[#881337]/10 text-[#881337] dark:text-rose-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </span>
                {isSignalsTab && (
                  <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-85" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
              </button>
            );
          })}

          {user && (
            <button
              type="button"
              onClick={() => navigate('/notifications')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                route === '/notifications'
                  ? 'bg-[#881337]/10 text-[#881337] dark:text-rose-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <span className="flex items-center gap-3">
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </span>
              {unreadCount > 0 && (
                <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                  {unreadCount}
                </span>
              )}
            </button>
          )}
        </nav>

        {user && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-transparent p-2.5">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2.5 min-w-0 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-[#881337]/10 text-[#881337] dark:text-rose-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Premium Member
                  </p>
                </div>
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-2 rounded-lg text-slate-400 hover:text-red-600 transition-colors shrink-0"
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main Content Area */}
      <div
        className={`flex-1 lg:pl-64 flex flex-col min-w-0 ${
          isSignalsRoute ? 'h-full min-h-0 overflow-hidden' : ''
        }`}
      >
        {/* Desktop Top Utility Header */}
        <header className="hidden lg:flex sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B101B]/90 backdrop-blur-md px-8 items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {settings.brand_name} Terminal
            </span>
            <span aria-hidden="true">·</span>
            <span>Real-Time Signals & Market Intelligence</span>
          </div>

          <div className="flex items-center gap-3">
            <PWAInstallButton variant="header" label="INSTALL APP" />
          </div>
        </header>

        {/* Compact Mobile Top Bar (hidden on /signals so the Telegram channel header sits cleanly at top) */}
        {!isSignalsRoute && (
          <header className="lg:hidden sticky top-0 z-30 h-14 border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B101B]/90 backdrop-blur-md px-3.5 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-base font-bold tracking-tight text-[#881337] dark:text-white whitespace-nowrap shrink-0"
            >
              {settings.brand_name}
            </button>

            <div className="flex items-center gap-1.5 shrink-0">
              <PWAInstallButton variant="header" label="INSTALL APP" />
              {user && (
                <button
                  type="button"
                  onClick={() => navigate('/notifications')}
                  className="relative min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 text-[10px] font-mono font-bold text-[#881337]">
                      {unreadCount}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={toggleTheme}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center text-slate-600 dark:text-slate-300"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            </div>
          </header>
        )}

        <main
          className={
            isSignalsRoute
              ? 'flex-1 min-h-0 flex flex-col p-0 pb-16 lg:pb-0 w-full overflow-hidden'
              : 'flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-10 max-w-7xl w-full mx-auto'
          }
        >
          {children}
        </main>
      </div>

      {/* Mobile Fixed Bottom Navigation (Home, Signals, Updates, Academy, Profile) */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0D1321]/95 backdrop-blur-md pb-safe"
      >
        <div className="grid grid-cols-5 h-16">
          {mobileBottomTabs.map((item) => {
            const Icon = item.icon;
            const active = route === item.path;
            const isSignalsTab = item.path === '/signals';
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className={`flex flex-col items-center justify-center min-h-[44px] transition-colors ${
                  active
                    ? 'text-[#881337] dark:text-rose-400'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {isSignalsTab && (
                    <span
                      className="absolute -top-1 -right-2 flex h-2.5 w-2.5"
                      aria-hidden="true"
                    >
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-90" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 ring-2 ring-white dark:ring-[#0D1321]" />
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-medium mt-1 leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {!isOnline && (
        <div className="fixed bottom-20 lg:bottom-4 left-4 z-50 rounded-lg bg-[#881337] px-3 py-1.5 text-xs font-medium text-white shadow-lg">
          Offline Mode — Cached educational lessons & signals available.
        </div>
      )}
    </div>
  );
};
