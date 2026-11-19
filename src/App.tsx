import React from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Layout } from './components/Layout';
import { NotificationPromptModal } from './components/NotificationPromptModal';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { HomePage } from './pages/HomePage';
import {
  ForgotPasswordPage,
  LoginPage,
  RegisterPage,
  VerifyEmailPage,
} from './pages/AuthPages';
import { DashboardPage } from './pages/DashboardPage';
import { SignalsPage } from './pages/SignalsPage';
import { UpdatesPage } from './pages/UpdatesPage';
import { AcademyPage } from './pages/AcademyPage';
import { MarketsPage } from './pages/MarketsPage';
import { CalendarPage } from './pages/CalendarPage';
import { CommunityPage } from './pages/CommunityPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { LegalPage } from './pages/LegalPage';
import { AdminPage } from './pages/AdminPage';

const SessionRestoreSpinner: React.FC = () => (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] px-5 py-3 text-sm text-slate-600 dark:text-slate-300 shadow-xs">
      <span className="h-4 w-4 rounded-full border-2 border-[#881337] border-t-transparent animate-spin" />
      <span>Restoring session...</span>
    </div>
  </div>
);

const RouteView: React.FC = () => {
  const { route, user, authLoading, showNotifModal, setShowNotifModal } = usePlatform();

  const renderPage = () => {
    switch (route) {
      case '/':
        if (authLoading && !user) return <SessionRestoreSpinner />;
        return user ? <DashboardPage /> : <HomePage />;
      case '/home':
        return <HomePage />;
      case '/login':
        return <LoginPage />;
      case '/register':
        return <RegisterPage />;
      case '/verify-email':
        return <VerifyEmailPage />;
      case '/forgot-password':
        return <ForgotPasswordPage />;
      case '/dashboard':
        return authLoading && !user ? <SessionRestoreSpinner /> : <DashboardPage />;
      case '/signals':
        return <SignalsPage />;
      case '/updates':
        return <UpdatesPage />;
      case '/academy':
        return <AcademyPage />;
      case '/markets':
        return <MarketsPage />;
      case '/calendar':
        return <CalendarPage />;
      case '/community':
        return <CommunityPage />;
      case '/notifications':
        return authLoading && !user ? <SessionRestoreSpinner /> : <NotificationsPage />;
      case '/profile':
        return authLoading && !user ? <SessionRestoreSpinner /> : <ProfilePage />;
      case '/legal':
        return <LegalPage />;
      case '/admin':
        return authLoading && !user ? <SessionRestoreSpinner /> : <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <Layout>{renderPage()}</Layout>
      <PWAInstallBanner />
      <NotificationPromptModal
        open={showNotifModal}
        onClose={() => setShowNotifModal(false)}
      />
    </>
  );
};

export default function App() {
  return (
    <PlatformProvider>
      <RouteView />
    </PlatformProvider>
  );
}
