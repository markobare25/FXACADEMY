import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BellRing,
  CalendarClock,
  CheckCheck,
  CheckCircle2,
  Eye,
  EyeOff,
  History,
  ImagePlus,
  KeyRound,
  Loader2,
  LogIn,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Send,
  ShieldAlert,
  ShieldCheck,
  User as UserIcon,
  X,
} from 'lucide-react';
import { usePlatform } from '../context/PlatformContext';
import { apiFetch, formatLocalDateTime } from '../lib/api';
import {
  DEFAULT_DEVICE_PREFS,
  getCurrentPushSubscription,
  sendTestPushNotification,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
} from '../lib/pushClient';
import type {
  NotificationPreferences,
  PreferredContactMethod,
  SupportConversation,
  SupportMessage,
} from '../types';

const SUPPORT_SESSION_KEY = 'mfx_support_chat_v1';

interface StoredSupportSession {
  conversation_id: string;
  reference_code: string;
  token: string;
}

function loadStoredSupportSession(): StoredSupportSession | null {
  try {
    const raw = localStorage.getItem(SUPPORT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSupportSession>;
    if (parsed.conversation_id && parsed.reference_code && parsed.token) {
      return {
        conversation_id: parsed.conversation_id,
        reference_code: parsed.reference_code,
        token: parsed.token,
      };
    }
    return null;
  } catch {
    return null;
  }
}

function saveStoredSupportSession(session: StoredSupportSession | null): void {
  try {
    if (!session) localStorage.removeItem(SUPPORT_SESSION_KEY);
    else localStorage.setItem(SUPPORT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // ignore storage errors
  }
}

export const ProfilePage: React.FC = () => {
  const {
    user,
    authLoading,
    settings,
    setUser,
    login,
    logout,
    logoutAllSessions,
    showNotifModal,
  } = usePlatform();

  // =========================================================================
  // SECTION A STATE: PREMIUM MEMBER SIGN IN & SIGNED-IN ACCOUNT MANAGEMENT
  // =========================================================================
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timezone, setTimezone] = useState(user?.timezone || 'UTC');
  const [prefs, setPrefs] = useState<NotificationPreferences>(
    user?.notification_prefs || DEFAULT_DEVICE_PREFS
  );
  const [testingPush, setTestingPush] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [activity, setActivity] = useState<
    Array<{ id: string; action: string; details: string; created_at: string }>
  >([]);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [accountMsg, setAccountMsg] = useState<string | null>(null);
  const [accountError, setAccountError] = useState<string | null>(null);

  // =========================================================================
  // SECTION B STATE: APPLY FOR PREMIUM MEMBERSHIP
  // =========================================================================
  const [appForm, setAppForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    country: '',
    preferred_contact: 'WhatsApp' as PreferredContactMethod,
    message: '',
  });
  const [appSubmitting, setAppSubmitting] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);
  const [appReceiptRef, setAppReceiptRef] = useState<string | null>(null);

  // =========================================================================
  // SECTION C STATE: CONTACT US & TWO-WAY CUSTOMER CHAT
  // =========================================================================
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);
  const [contactRef, setContactRef] = useState<string | null>(null);

  // Two-Way Customer Chat State
  const [supportSession, setSupportSession] = useState<StoredSupportSession | null>(() =>
    loadStoredSupportSession()
  );
  const [conversation, setConversation] = useState<SupportConversation | null>(null);
  const [chatMessages, setChatMessages] = useState<SupportMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [startChatForm, setStartChatForm] = useState({
    visitor_name: '',
    visitor_email: '',
    visitor_phone: '',
    initial_message: '',
  });
  const [startingChat, setStartingChat] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [pendingUploadPreview, setPendingUploadPreview] = useState<string | null>(null);
  const [uploadedAttachment, setUploadedAttachment] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const chatInputRef = useRef<HTMLInputElement | null>(null);
  const contactSectionRef = useRef<HTMLElement | null>(null);
  const supportWsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    getCurrentPushSubscription()
      .then((s) => setPushSubscribed(Boolean(s)))
      .catch(() => setPushSubscribed(false));
  }, [showNotifModal]);

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setBio(user.bio || '');
    setTimezone(user.timezone || 'UTC');
    setPrefs(user.notification_prefs);
    apiFetch<{ activity: typeof activity }>('/api/users/activity')
      .then((res) => setActivity(res.activity))
      .catch(() => undefined);
  }, [user]);

  const markVisitorMessagesRead = useCallback(async (session: StoredSupportSession) => {
    try {
      await fetch(`/api/support/conversations/${encodeURIComponent(session.conversation_id)}/read`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'MeridianFX',
          'X-Support-Token': session.token,
        },
        body: '{}',
      });
      setConversation((prev) => (prev ? { ...prev, unread_visitor: 0 } : prev));
    } catch {
      // ignore
    }
  }, []);

  const loadSupportConversation = useCallback(
    async (session: StoredSupportSession, silent = false) => {
      if (!silent) setChatLoading(true);
      try {
        const res = await fetch(
          `/api/support/conversations/${encodeURIComponent(session.conversation_id)}`,
          {
            headers: {
              'X-Requested-With': 'MeridianFX',
              'X-Support-Token': session.token,
            },
          }
        );
        if (res.status === 403 || res.status === 404) {
          saveStoredSupportSession(null);
          setSupportSession(null);
          setConversation(null);
          setChatMessages([]);
          return;
        }
        if (!res.ok) throw new Error('Unable to load customer chat history.');
        const data = (await res.json()) as {
          conversation: SupportConversation;
          messages: SupportMessage[];
        };
        setConversation(data.conversation);
        setChatMessages(data.messages);
        if (data.conversation.unread_visitor > 0) {
          markVisitorMessagesRead(session);
        }
      } catch (err) {
        if (!silent) {
          setChatError(err instanceof Error ? err.message : 'Unable to load chat.');
        }
      } finally {
        if (!silent) setChatLoading(false);
      }
    },
    [markVisitorMessagesRead]
  );

  useEffect(() => {
    if (supportSession) {
      loadSupportConversation(supportSession);
    }
  }, [supportSession, loadSupportConversation]);

  // Handle deep link ?chat=<id> from push notification click
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const chatParam = params.get('chat');
    if (chatParam && contactSectionRef.current) {
      setTimeout(() => {
        contactSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
        chatInputRef.current?.focus();
      }, 200);
    }
  }, []);

  // Scroll customer chat thread smoothly on new messages
  useEffect(() => {
    if (chatMessages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [chatMessages.length]);

  // Dedicated real-time WebSocket subscription for this visitor's Support Chat thread
  useEffect(() => {
    if (!supportSession) {
      if (supportWsRef.current) {
        supportWsRef.current.close();
        supportWsRef.current = null;
      }
      return;
    }

    let active = true;
    let pollTimer: number | null = null;
    let reconnectTimer: number | null = null;
    let wsConnectedLocally = false;

    const connectSupportWs = () => {
      if (!active) return;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      supportWsRef.current = ws;

      ws.onopen = () => {
        wsConnectedLocally = true;
        ws.send(
          JSON.stringify({
            event: 'support:subscribe',
            conversation_id: supportSession.conversation_id,
            token: supportSession.token,
          })
        );
      };

      ws.onmessage = (evt) => {
        try {
          const parsed = JSON.parse(evt.data as string) as {
            event?: string;
            data?: Record<string, unknown>;
          };
          if (parsed.event === 'support:message' && parsed.data) {
            const incomingMsg = parsed.data.message as SupportMessage;
            const incomingConv = parsed.data.conversation as SupportConversation;
            setConversation(incomingConv);
            setChatMessages((prev) =>
              prev.some((m) => m.id === incomingMsg.id) ? prev : [...prev, incomingMsg]
            );
            if (incomingMsg.sender_type === 'admin') {
              markVisitorMessagesRead(supportSession);
            }
          } else if (parsed.event === 'support:conversation_updated' && parsed.data) {
            setConversation(parsed.data as unknown as SupportConversation);
          } else if (parsed.event === 'support:read' && parsed.data?.reader === 'admin') {
            setChatMessages((prev) =>
              prev.map((m) => (m.sender_type === 'visitor' ? { ...m, read_by_admin: true } : m))
            );
          }
        } catch {
          // ignore malformed messages
        }
      };

      ws.onclose = () => {
        wsConnectedLocally = false;
        if (supportWsRef.current === ws) supportWsRef.current = null;
        if (active) {
          reconnectTimer = window.setTimeout(connectSupportWs, 4000);
        }
      };
    };

    connectSupportWs();

    // Fallback poll when serverless or WS drops
    pollTimer = window.setInterval(() => {
      if (!wsConnectedLocally && document.visibilityState === 'visible') {
        loadSupportConversation(supportSession, true);
      }
    }, 8000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      if (reconnectTimer) clearTimeout(reconnectTimer);
      supportWsRef.current?.close();
      supportWsRef.current = null;
    };
  }, [supportSession, loadSupportConversation, markVisitorMessagesRead]);

  // =========================================================================
  // HANDLERS: SECTION A
  // =========================================================================
  const handleMemberLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginLoading) return;
    setLoginError(null);
    setLoginLoading(true);
    try {
      await login(identifier, password, rememberMe);
      setPassword('');
    } catch (err) {
      setLoginError(
        err instanceof Error ? err.message : 'Invalid Premium Member credentials.'
      );
    } finally {
      setLoginLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    setAccountError(null);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, bio, timezone }),
      });
      if (res.user) setUser(res.user);
      setAccountMsg('Profile updated.');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to update profile.');
    }
  };

  const handleSavePrefs = async (next: NotificationPreferences) => {
    setPrefs(next);
    try {
      const res = await apiFetch<{ user: typeof user }>('/api/users/notifications-prefs', {
        method: 'PATCH',
        body: JSON.stringify(next),
      });
      if (res.user) setUser(res.user);
      setAccountMsg('Notification preferences saved.');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Failed to save preferences.');
    }
  };

  const handleToggleDevicePush = async () => {
    setAccountError(null);
    if (pushSubscribed) {
      await unsubscribeFromPushNotifications();
      setPushSubscribed(false);
      setAccountMsg('Push notifications disabled on this device.');
    } else {
      const res = await subscribeToPushNotifications(prefs);
      if (res.ok) {
        setPushSubscribed(true);
        setAccountMsg('Push notifications enabled on this device.');
      } else {
        setAccountError(res.error || 'Could not enable push notifications.');
      }
    }
  };

  const handleSendTestPush = async () => {
    setTestingPush(true);
    setAccountError(null);
    setAccountMsg(null);
    try {
      await sendTestPushNotification();
      setAccountMsg('Test push notification sent to this device.');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Test push delivery failed.');
    } finally {
      setTestingPush(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAccountMsg(null);
    setAccountError(null);
    try {
      await apiFetch('/api/users/password', {
        method: 'PATCH',
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setAccountMsg('Password updated successfully.');
    } catch (err) {
      setAccountError(err instanceof Error ? err.message : 'Password change failed.');
    }
  };

  // =========================================================================
  // HANDLERS: SECTION B (PREMIUM MEMBERSHIP APPLICATION)
  // =========================================================================
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (appSubmitting) return;
    setAppSubmitting(true);
    setAppError(null);
    setAppReceiptRef(null);
    try {
      const res = await apiFetch<{ reference_code: string }>('/api/applications', {
        method: 'POST',
        body: JSON.stringify({
          full_name: appForm.full_name.trim(),
          email: appForm.email.trim(),
          phone: appForm.phone.trim(),
          country: appForm.country.trim(),
          preferred_contact: appForm.preferred_contact,
          message: appForm.message.trim(),
        }),
      });
      setAppReceiptRef(res.reference_code);
      setAppForm({
        full_name: '',
        email: '',
        phone: '',
        country: '',
        preferred_contact: 'WhatsApp',
        message: '',
      });
    } catch (err) {
      setAppError(
        err instanceof Error ? err.message : 'Unable to submit membership application.'
      );
    } finally {
      setAppSubmitting(false);
    }
  };

  // =========================================================================
  // HANDLERS: SECTION C (CONTACT FORM & TWO-WAY CUSTOMER CHAT)
  // =========================================================================
  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (contactSubmitting) return;
    setContactSubmitting(true);
    setContactError(null);
    setContactRef(null);
    try {
      const res = await apiFetch<{ reference_code: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: contactForm.name.trim(),
          email: contactForm.email.trim(),
          phone: contactForm.phone.trim() || null,
          subject: contactForm.subject.trim(),
          message: contactForm.message.trim(),
        }),
      });
      setContactRef(res.reference_code);
      setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err) {
      setContactError(err instanceof Error ? err.message : 'Unable to send contact message.');
    } finally {
      setContactSubmitting(false);
    }
  };

  const uploadSupportImageForSession = async (
    session: StoredSupportSession,
    file: File
  ): Promise<{ url: string; original_name: string }> => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch('/api/support/upload', {
      method: 'POST',
      headers: {
        'X-Requested-With': 'MeridianFX',
        'X-Support-Conversation-Id': session.conversation_id,
        'X-Support-Token': session.token,
      },
      body: form,
    });
    const data = (await res.json().catch(() => ({}))) as {
      url?: string;
      original_name?: string;
      error?: string;
    };
    if (!res.ok || !data.url) {
      throw new Error(data.error || 'Image upload failed.');
    }
    return { url: data.url, original_name: data.original_name || file.name };
  };

  const handleSelectSupportImage = async (file: File | undefined) => {
    if (!file) return;
    setChatError(null);
    if (pendingUploadPreview) URL.revokeObjectURL(pendingUploadPreview);
    const previewUrl = URL.createObjectURL(file);
    setPendingUploadPreview(previewUrl);

    if (!supportSession) {
      // Queue until conversation starts
      setPendingUploadFile(file);
      return;
    }

    setUploadingImage(true);
    try {
      const uploaded = await uploadSupportImageForSession(supportSession, file);
      setUploadedAttachment({ url: uploaded.url, name: uploaded.original_name });
      setPendingUploadFile(null);
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Image upload failed.');
      URL.revokeObjectURL(previewUrl);
      setPendingUploadPreview(null);
      setPendingUploadFile(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const clearPendingImage = () => {
    if (pendingUploadPreview) URL.revokeObjectURL(pendingUploadPreview);
    setPendingUploadPreview(null);
    setPendingUploadFile(null);
    setUploadedAttachment(null);
  };

  const handleStartConversation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (startingChat || uploadingImage) return;
    setStartingChat(true);
    setChatError(null);
    try {
      const hasQueuedFile = Boolean(pendingUploadFile);
      const res = await apiFetch<{
        conversation: SupportConversation;
        messages: SupportMessage[];
        visitor_token: string;
      }>('/api/support/conversations', {
        method: 'POST',
        body: JSON.stringify({
          visitor_name: startChatForm.visitor_name.trim(),
          visitor_email: startChatForm.visitor_email.trim() || undefined,
          visitor_phone: startChatForm.visitor_phone.trim() || undefined,
          initial_message: hasQueuedFile ? '' : startChatForm.initial_message.trim(),
        }),
      });

      const nextSession: StoredSupportSession = {
        conversation_id: res.conversation.id,
        reference_code: res.conversation.reference_code,
        token: res.visitor_token,
      };
      saveStoredSupportSession(nextSession);
      setSupportSession(nextSession);
      setConversation(res.conversation);
      setChatMessages(res.messages);

      if (pendingUploadFile) {
        const uploaded = await uploadSupportImageForSession(nextSession, pendingUploadFile);
        const msgRes = await fetch(
          `/api/support/conversations/${encodeURIComponent(nextSession.conversation_id)}/messages`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Requested-With': 'MeridianFX',
              'X-Support-Token': nextSession.token,
            },
            body: JSON.stringify({
              content: startChatForm.initial_message.trim(),
              attachment_url: uploaded.url,
              attachment_name: uploaded.original_name,
            }),
          }
        );
        if (msgRes.ok) {
          const sent = (await msgRes.json()) as {
            conversation: SupportConversation;
            message: SupportMessage;
          };
          setConversation(sent.conversation);
          setChatMessages((prev) => [...prev, sent.message]);
        }
        clearPendingImage();
      }

      setStartChatForm({
        visitor_name: '',
        visitor_email: '',
        visitor_phone: '',
        initial_message: '',
      });
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Unable to start customer chat.');
    } finally {
      setStartingChat(false);
    }
  };

  const handleSendChatReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportSession || sendingReply || uploadingImage) return;
    const text = replyText.trim();
    if (!text && !uploadedAttachment) return;

    setSendingReply(true);
    setChatError(null);
    try {
      const res = await fetch(
        `/api/support/conversations/${encodeURIComponent(supportSession.conversation_id)}/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'MeridianFX',
            'X-Support-Token': supportSession.token,
          },
          body: JSON.stringify({
            content: text,
            attachment_url: uploadedAttachment?.url || null,
            attachment_name: uploadedAttachment?.name || null,
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        conversation?: SupportConversation;
        message?: SupportMessage;
        error?: string;
      };
      if (!res.ok || !data.message || !data.conversation) {
        throw new Error(data.error || 'Failed to send message.');
      }
      setConversation(data.conversation);
      setChatMessages((prev) =>
        prev.some((m) => m.id === data.message!.id) ? prev : [...prev, data.message!]
      );
      setReplyText('');
      clearPendingImage();
    } catch (err) {
      setChatError(err instanceof Error ? err.message : 'Failed to send message.');
    } finally {
      setSendingReply(false);
    }
  };

  const handleStartNewChatSession = () => {
    saveStoredSupportSession(null);
    setSupportSession(null);
    setConversation(null);
    setChatMessages([]);
    setReplyText('');
    clearPendingImage();
  };

  // =========================================================================
  // VERIFIED OFFICIAL CONTACT HELPERS (NEVER INVENTED)
  // =========================================================================
  const officialEmail = (settings.contact_email || '').trim();
  const officialWhatsapp = (settings.contact_whatsapp || '').trim();
  const whatsappDigits = officialWhatsapp.replace(/\D/g, '');
  const whatsappUrl = whatsappDigits
    ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
        `Hello ${settings.brand_name}, I have a membership or support enquiry.`
      )}`
    : null;
  const officialPhone = (settings.contact_phone || '').trim();
  const phoneDigits = officialPhone.replace(/[^\d+]/g, '');
  const mailtoUrl = officialEmail
    ? `mailto:${encodeURIComponent(officialEmail)}?subject=${encodeURIComponent(
        `${settings.brand_name} Enquiry`
      )}`
    : null;

  const membershipExpiresLabel = user?.membership_expires_at
    ? formatLocalDateTime(user.membership_expires_at)
    : 'Ongoing';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* =================================================================== */}
      {/* A. PREMIUM MEMBER SIGN IN (OR SIGNED-IN MEMBER WORKSPACE)           */}
      {/* =================================================================== */}
      {authLoading && !user ? (
        <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-8 text-center text-sm text-slate-500">
          Checking Premium Member session...
        </section>
      ) : !user ? (
        <section
          aria-labelledby="section-premium-signin"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 shadow-xs"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-5 space-y-3">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#881337] dark:text-rose-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Section A · Approved Members Only</span>
              </div>
              <h1
                id="section-premium-signin"
                className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight"
              >
                Premium Member Sign In
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                Sign in with the private email or username credentials issued to you by the {settings.brand_name} administrator.
              </p>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-3.5 text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <p className="font-semibold text-slate-900 dark:text-white">
                  Not a Premium Member yet?
                </p>
                <p>
                  Public channels, Academy courses, and live market updates require no account. Submit an application in Section B below to request approved access.
                </p>
              </div>
            </div>

            <form onSubmit={handleMemberLogin} className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Assigned Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    autoComplete="username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="member@domain.com or username"
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 pl-3.5 pr-10 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 accent-[#881337]"
                  />
                  <span>Keep me signed in on this device</span>
                </label>

                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Forgot password? Contact desk in Section C.
                </span>
              </div>

              {loginError && (
                <div className="flex items-center gap-2 rounded-lg border border-rose-200 dark:border-red-500/30 bg-rose-50 dark:bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-[#9F1239] dark:text-red-400">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[44px]"
              >
                {loginLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{loginLoading ? 'Signing In...' : 'Sign In as Premium Member'}</span>
              </button>
            </form>
          </div>
        </section>
      ) : (
        <section
          aria-labelledby="section-premium-account"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-6 shadow-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803D] dark:text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Section A · Active Premium Member</span>
              </div>
              <h1
                id="section-premium-account"
                className="mt-1 text-2xl font-bold text-slate-900 dark:text-white"
              >
                {user.name}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {user.username ? `@${user.username} · ` : ''}
                {user.email}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
              <button
                type="button"
                onClick={logoutAllSessions}
                className="rounded-lg border border-slate-300 dark:border-slate-700 px-3.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 min-h-[40px]"
              >
                Sign Out All Devices
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-4 text-xs">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Access Level</span>
              <span className="mt-1 inline-flex items-center gap-1.5 font-bold text-slate-900 dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <span>Approved Premium Member</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Membership Status</span>
              <span className="mt-1 inline-flex items-center gap-1.5 font-bold text-[#15803D] dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>{user.membership_active !== false ? 'Active' : 'Inactive'}</span>
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block">Expiry</span>
              <span className="mt-1 inline-flex items-center gap-1.5 font-mono font-semibold text-slate-900 dark:text-white">
                <CalendarClock className="w-4 h-4 text-slate-400" />
                <span>{membershipExpiresLabel}</span>
              </span>
            </div>
          </div>

          {user.needs_password_setup && (
            <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-50/70 dark:bg-amber-950/20 px-4 py-3 text-xs font-medium text-amber-800 dark:text-amber-300">
              <KeyRound className="w-4 h-4 shrink-0" />
              <span>
                You signed in with a temporary password assigned by the administrator. Please set your private password below.
              </span>
            </div>
          )}

          {accountMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{accountMsg}</span>
            </div>
          )}

          {accountError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs font-medium text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{accountError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Details */}
            <form onSubmit={handleSaveProfile} className="space-y-3.5">
              <div className="flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Member Profile Details
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Display Name"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  placeholder="Timezone (e.g. UTC)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
                />
              </div>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Trading notes or focus pairs..."
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
              <button
                type="submit"
                className="rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[38px]"
              >
                Save Profile
              </button>
            </form>

            {/* Security & Push Alerts */}
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-[#15803D] dark:text-emerald-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Member Alert Controls
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {pushSubscribed && (
                    <button
                      type="button"
                      disabled={testingPush}
                      onClick={handleSendTestPush}
                      className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {testingPush ? 'Sending...' : 'Test Push'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleToggleDevicePush}
                    className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold ${
                      pushSubscribed
                        ? 'bg-emerald-50 text-[#15803D] border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800'
                        : 'bg-[#15803D] text-white hover:bg-[#166534]'
                    }`}
                  >
                    {pushSubscribed ? 'Push Active (Disable)' : 'Enable Device Push'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {(
                  [
                    { key: 'signal_chat', label: 'Signals Channel Alerts' },
                    { key: 'market_updates', label: 'Market Updates' },
                    { key: 'academy', label: 'Academy Releases' },
                    { key: 'sound_enabled', label: 'Sound & Vibration' },
                  ] as const
                ).map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2 cursor-pointer"
                  >
                    <span className="text-slate-700 dark:text-slate-200">{item.label}</span>
                    <input
                      type="checkbox"
                      checked={prefs[item.key]}
                      onChange={(e) =>
                        handleSavePrefs({ ...prefs, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#881337]"
                    />
                  </label>
                ))}
              </div>

              <form onSubmit={handleChangePassword} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <input
                  type="password"
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Current password"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New password (8+ chars)"
                  className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-[#881337] px-3 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B]"
                >
                  Update Password
                </button>
              </form>
            </div>
          </div>

          {activity.length > 0 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-2">
                <History className="w-4 h-4 text-[#881337] dark:text-rose-400" />
                <h2 className="text-xs font-bold text-slate-900 dark:text-white">
                  Recent Member Activity
                </h2>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto text-xs">
                {activity.slice(0, 6).map((act) => (
                  <div key={act.id} className="py-2 flex items-center justify-between gap-4">
                    <span className="truncate text-slate-700 dark:text-slate-300">
                      <strong className="text-slate-900 dark:text-white">{act.action}</strong> · {act.details}
                    </span>
                    <span className="font-mono text-[11px] text-slate-400 shrink-0">
                      {formatLocalDateTime(act.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* =================================================================== */}
      {/* B. APPLY FOR PREMIUM MEMBERSHIP                                     */}
      {/* =================================================================== */}
      <section
        aria-labelledby="section-apply-membership"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-6 shadow-xs"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#881337] dark:text-rose-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Section B · Membership Application</span>
          </div>
          <h2
            id="section-apply-membership"
            className="text-2xl font-bold text-slate-900 dark:text-white"
          >
            Apply for Premium Membership
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            Submit your details below to apply for administrator-approved Premium Membership. Applications are reviewed manually — accounts and sign-in credentials are issued exclusively upon approval.
          </p>
        </div>

        <form onSubmit={handleSubmitApplication} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Full Name *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={appForm.full_name}
                onChange={(e) => setAppForm({ ...appForm, full_name: e.target.value })}
                placeholder="Daniel Mensah"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address *
              </label>
              <input
                type="email"
                required
                value={appForm.email}
                onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                placeholder="you@domain.com"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number (with country code) *
              </label>
              <input
                type="tel"
                required
                minLength={5}
                value={appForm.phone}
                onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                placeholder="+44 7700 900123"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm font-mono text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Country *
              </label>
              <input
                type="text"
                required
                minLength={2}
                value={appForm.country}
                onChange={(e) => setAppForm({ ...appForm, country: e.target.value })}
                placeholder="United Kingdom"
                className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Preferred Contact Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Email', 'WhatsApp', 'Phone Call'] as PreferredContactMethod[]).map((method) => {
                  const selected = appForm.preferred_contact === method;
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setAppForm({ ...appForm, preferred_contact: method })}
                      className={`rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors min-h-[42px] ${
                        selected
                          ? 'border-[#881337] bg-[#881337]/10 text-[#881337] dark:text-rose-300'
                          : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Message Explaining Your Membership Enquiry *
            </label>
            <textarea
              rows={3}
              required
              minLength={5}
              value={appForm.message}
              onChange={(e) => setAppForm({ ...appForm, message: e.target.value })}
              placeholder="Tell us about your trading experience, pairs you trade, and what you are looking to gain from Premium Membership..."
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3.5 py-2.5 text-base sm:text-sm text-slate-900 dark:text-white"
            />
          </div>

          {appError && (
            <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs font-medium text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{appError}</span>
            </div>
          )}

          {appReceiptRef && (
            <div className="rounded-xl border border-emerald-500/40 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 flex items-start gap-3 text-xs">
              <CheckCircle2 className="w-5 h-5 text-[#15803D] dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-[#15803D] dark:text-emerald-300">
                  Application Submitted Successfully — Reference: <span className="font-mono">{appReceiptRef}</span>
                </p>
                <p className="text-slate-600 dark:text-slate-300">
                  Your application has been sent to the {settings.brand_name} administrator. Keep your reference number handy; once approved, your private member credentials will be issued directly to you.
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Note: Applying does not create an automatic account. Only the administrator approves memberships.
            </span>
            <button
              type="submit"
              disabled={appSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#881337] px-6 py-3 text-sm font-bold tracking-wide text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[46px]"
            >
              {appSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>{appSubmitting ? 'SUBMITTING...' : 'SUBMIT APPLICATION'}</span>
            </button>
          </div>
        </form>
      </section>

      {/* =================================================================== */}
      {/* C. CONTACT US (OFFICIAL DETAILS, CONTACT FORM & TWO-WAY LIVE CHAT)  */}
      {/* =================================================================== */}
      <section
        ref={contactSectionRef}
        aria-labelledby="section-contact-us"
        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-6 sm:p-8 space-y-8 shadow-xs"
      >
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#15803D] dark:text-emerald-400">
            <MessageSquare className="w-4 h-4" />
            <span>Section C · Direct Desk &amp; Customer Support</span>
          </div>
          <h2
            id="section-contact-us"
            className="text-2xl font-bold text-slate-900 dark:text-white"
          >
            Contact Us
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 max-w-2xl">
            Reach {settings.brand_name} directly via our official desk channels, submit an enquiry form, or start a real-time two-way customer conversation below without creating an account.
          </p>
        </div>

        {/* Verified Official Contact Channels + Direct Action Buttons */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2 text-xs">
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              Official {settings.brand_name} Contact Information
            </p>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-slate-600 dark:text-slate-300">
              {officialEmail && (
                <span className="inline-flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                  <span className="font-mono">{officialEmail}</span>
                </span>
              )}
              {officialWhatsapp && (
                <span className="inline-flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#15803D] dark:text-emerald-400 shrink-0" />
                  <span className="font-mono">{officialWhatsapp}</span>
                </span>
              )}
              {officialPhone && (
                <span className="inline-flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#881337] dark:text-rose-400 shrink-0" />
                  <span className="font-mono">{officialPhone}</span>
                </span>
              )}
              {settings.contact_address && (
                <span className="inline-flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>{settings.contact_address}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            {mailtoUrl && (
              <a
                href={mailtoUrl}
                className="inline-flex items-center gap-2 rounded-lg bg-[#881337] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6B0F2B] min-h-[40px]"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Desk</span>
              </a>
            )}
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] min-h-[40px]"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>
            )}
            {phoneDigits && (
              <a
                href={`tel:${phoneDigits}`}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 min-h-[40px]"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Call Desk</span>
              </a>
            )}
          </div>
        </div>

        {/* Two-Column Split: Contact Us Form & Two-Way Live Customer Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Contact Form */}
          <form
            onSubmit={handleContactSubmit}
            className="lg:col-span-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-5 space-y-3.5"
          >
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Send a Contact Enquiry
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Saved directly to the administrator dashboard with a tracking reference.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                minLength={2}
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                placeholder="Your Name *"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
              <input
                type="email"
                required
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                placeholder="Your Email *"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                placeholder="Phone (optional)"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white"
              />
              <input
                type="text"
                required
                minLength={3}
                value={contactForm.subject}
                onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                placeholder="Subject *"
                className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <textarea
              rows={4}
              required
              minLength={10}
              value={contactForm.message}
              onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
              placeholder="How can our team assist you?"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
            />

            {contactError && (
              <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-600 dark:text-red-400">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{contactError}</span>
              </div>
            )}

            {contactRef && (
              <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-[#15803D] dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>
                  Enquiry received! Reference: <span className="font-mono font-bold">{contactRef}</span>
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={contactSubmitting}
              className="w-full rounded-lg bg-[#881337] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6B0F2B] disabled:opacity-60 min-h-[42px]"
            >
              {contactSubmitting ? 'Sending...' : 'Send Enquiry'}
            </button>
          </form>

          {/* Two-Way Customer Chat */}
          <div className="lg:col-span-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1321] overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/60 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#15803D]/15 text-[#15803D] dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    Live Two-Way Customer Chat
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    {conversation
                      ? `${conversation.reference_code} · ${conversation.status === 'resolved' ? 'Resolved (reply reopens)' : 'Connected with Desk'}`
                      : 'Direct message with MeridianFX Administration — no account needed'}
                  </p>
                </div>
              </div>

              {conversation && (
                <div className="flex items-center gap-2 shrink-0">
                  {conversation.unread_visitor > 0 && (
                    <span className="rounded-full bg-[#15803D] px-2 py-0.5 text-[10px] font-bold text-white">
                      {conversation.unread_visitor} New
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleStartNewChatSession}
                    className="text-[11px] font-medium text-slate-500 hover:text-[#881337] dark:hover:text-rose-400 underline"
                  >
                    New Chat
                  </button>
                </div>
              )}
            </div>

            {!supportSession ? (
              <form onSubmit={handleStartConversation} className="p-4 sm:p-5 space-y-3">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Enter your name and message to start a private two-way conversation. Your chat history stays available on this device across reloads.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    required
                    minLength={2}
                    value={startChatForm.visitor_name}
                    onChange={(e) =>
                      setStartChatForm({ ...startChatForm, visitor_name: e.target.value })
                    }
                    placeholder="Your Name *"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="email"
                    value={startChatForm.visitor_email}
                    onChange={(e) =>
                      setStartChatForm({ ...startChatForm, visitor_email: e.target.value })
                    }
                    placeholder="Email (optional)"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white"
                  />
                  <input
                    type="tel"
                    value={startChatForm.visitor_phone}
                    onChange={(e) =>
                      setStartChatForm({ ...startChatForm, visitor_phone: e.target.value })
                    }
                    placeholder="Phone / WhatsApp (opt.)"
                    className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>

                <textarea
                  rows={3}
                  required={!pendingUploadFile}
                  value={startChatForm.initial_message}
                  onChange={(e) =>
                    setStartChatForm({ ...startChatForm, initial_message: e.target.value })
                  }
                  placeholder="Write your message or question to MeridianFX..."
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white"
                />

                {pendingUploadPreview && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 p-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={pendingUploadPreview}
                        alt="Attachment preview"
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {pendingUploadFile?.name || 'Image attached'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearPendingImage}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {chatError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{chatError}</p>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800">
                    <ImagePlus className="w-3.5 h-3.5" />
                    <span>Attach Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSelectSupportImage(e.target.files?.[0])}
                    />
                  </label>

                  <button
                    type="submit"
                    disabled={startingChat}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#15803D] px-4 py-2 text-xs font-semibold text-white hover:bg-[#166534] disabled:opacity-60 min-h-[38px]"
                  >
                    {startingChat ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>{startingChat ? 'Starting...' : 'Start Direct Chat'}</span>
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="h-72 overflow-y-auto p-4 space-y-3 bg-slate-50/70 dark:bg-[#090D16]">
                  {chatLoading ? (
                    <div className="h-full flex items-center justify-center text-xs text-slate-500 gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-[#881337]" />
                      <span>Loading conversation...</span>
                    </div>
                  ) : chatMessages.length === 0 ? (
                    <p className="text-center text-xs text-slate-500 py-10">
                      Conversation started ({supportSession.reference_code}). Send a message below.
                    </p>
                  ) : (
                    chatMessages.map((m) => {
                      const isVisitor = m.sender_type === 'visitor';
                      return (
                        <div
                          key={m.id}
                          className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs space-y-1.5 shadow-2xs ${
                              isVisitor
                                ? 'bg-[#881337] text-white rounded-br-xs'
                                : 'bg-white dark:bg-[#151E2E] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3 text-[10px] opacity-80">
                              <span className="font-bold">
                                {isVisitor ? m.sender_name : 'MeridianFX Desk'}
                              </span>
                              <span className="font-mono tabular-nums inline-flex items-center gap-1">
                                {formatLocalDateTime(m.created_at)}
                                {isVisitor && m.read_by_admin && (
                                  <CheckCheck className="w-3 h-3 text-emerald-300" />
                                )}
                              </span>
                            </div>

                            {m.attachment_url && (
                              <button
                                type="button"
                                onClick={() => setLightboxUrl(m.attachment_url!)}
                                className="block overflow-hidden rounded-lg"
                              >
                                <img
                                  src={m.attachment_url}
                                  alt={m.attachment_name || 'Chat attachment'}
                                  className="max-h-48 rounded-lg object-cover"
                                />
                              </button>
                            )}

                            {m.content && (
                              <p className="text-xs sm:text-[13px] whitespace-pre-wrap break-words leading-relaxed">
                                {m.content}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatEndRef} />
                </div>

                {pendingUploadPreview && (
                  <div className="px-3 py-2 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={pendingUploadPreview}
                        alt="Pending upload"
                        className="w-9 h-9 rounded object-cover"
                      />
                      <span className="truncate text-slate-700 dark:text-slate-300">
                        {uploadingImage
                          ? 'Uploading image...'
                          : uploadedAttachment?.name || 'Image ready'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={clearPendingImage}
                      className="p-1 text-slate-400 hover:text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {chatError && (
                  <p className="px-3 pt-2 text-xs font-medium text-red-600 dark:text-red-400">
                    {chatError}
                  </p>
                )}

                <form
                  onSubmit={handleSendChatReply}
                  className="p-2.5 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D1321] flex items-center gap-2"
                >
                  <label
                    title="Attach image"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-[#881337] cursor-pointer shrink-0"
                  >
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleSelectSupportImage(e.target.files?.[0])}
                    />
                  </label>

                  <input
                    ref={chatInputRef}
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a message..."
                    className="flex-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#881337]"
                  />

                  <button
                    type="submit"
                    disabled={sendingReply || uploadingImage || (!replyText.trim() && !uploadedAttachment)}
                    className="min-h-[38px] px-3.5 rounded-lg bg-[#881337] text-white text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-[#6B0F2B] disabled:opacity-50 shrink-0"
                  >
                    {sendingReply ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Send</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

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
            alt="Customer chat attachment"
            className="max-w-full max-h-[88vh] rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
