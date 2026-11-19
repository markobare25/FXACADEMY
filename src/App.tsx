import React from 'react';
import { PlatformProvider, usePlatform } from './context/PlatformContext';
import { Layout } from './components/Layout';
import { NotificationPromptModal } from './components/NotificationPromptModal';
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

const RouteView: React.FC = () => {
  const { route, user, showNotifModal, setShowNotifModal } = usePlatform();

  const renderPage = () => {
    switch (route) {
      case '/':
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
        return <DashboardPage />;
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
        return <NotificationsPage />;
      case '/profile':
        return <ProfilePage />;
      case '/legal':
        return <LegalPage />;
      case '/admin':
        return <AdminPage />;
      default:
        return <HomePage />;
    }
  };

  return (
    <>
      <Layout>{renderPage()}</Layout>
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
