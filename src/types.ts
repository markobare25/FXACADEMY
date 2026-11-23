export type UserRole = 'user' | 'moderator' | 'admin';

export interface NotificationPreferences {
  signals: boolean;
  signal_updates: boolean;
  signal_chat: boolean;
  market_updates: boolean;
  academy: boolean;
  economic_calendar: boolean;
  announcements: boolean;
  sound_enabled: boolean;
}

export interface PushSubscriptionSummary {
  id: string;
  user_id: string | null;
  user_name: string | null;
  user_email: string | null;
  platform: 'android' | 'ios' | 'web' | 'desktop' | string;
  transport: 'web_push' | 'fcm' | 'apns' | string;
  browser_name: string | null;
  device_label: string | null;
  active: boolean;
  sound_enabled: boolean;
  failure_count: number;
  last_error: string | null;
  last_success_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface PushInfrastructureStatus {
  web_push: {
    ready: boolean;
    source: 'env' | 'database';
    public_key_prefix: string;
    supports: string;
  };
  fcm: {
    ready: boolean;
    mode: 'service_account' | 'legacy_server_key' | 'unconfigured';
    missing_env: string[];
  };
  apns: {
    ready: boolean;
    environment: 'production' | 'sandbox' | 'unconfigured';
    missing_env: string[];
  };
}

export interface User {
  id: string;
  name: string;
  username?: string | null;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  email_verified: boolean;
  membership_expires_at?: string | null;
  membership_notes?: string | null;
  needs_password_setup?: boolean;
  membership_active?: boolean;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string;
  notification_prefs: NotificationPreferences;
  watchlist: string[];
  installed_at?: string | null;
  created_at: string;
  last_login_at?: string | null;
}

export interface AdminMembersSummary {
  total_members: number;
  active_members: number;
  suspended_members: number;
  expired_members: number;
  inactive_members: number;
}

export interface AdminMembersPayload {
  summary: AdminMembersSummary;
  members: User[];
}

export type SignalDirection = 'BUY' | 'SELL';
export type SignalStatus = 'Active' | 'Pending' | 'TP Hit' | 'SL Hit' | 'Closed' | 'Cancelled';
export type SignalClassification = 'Educational' | 'Verified';

export interface SignalUpdateEntry {
  id: string;
  signal_id: string;
  note: string;
  status_snapshot: SignalStatus;
  created_by: string;
  created_at: string;
}

export interface TradingSignal {
  id: string;
  pair: string;
  direction: SignalDirection;
  entry_price: string;
  stop_loss: string;
  tp1: string;
  tp2?: string | null;
  tp3?: string | null;
  tp4?: string | null;
  risk_reward: string;
  timeframe: string;
  status: SignalStatus;
  classification: SignalClassification;
  analysis: string;
  chart_image_url?: string | null;
  admin_remarks?: string | null;
  is_premium?: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  updates?: SignalUpdateEntry[];
}

export type SignalChatMessageType =
  | 'signal'
  | 'setup'
  | 'update'
  | 'analysis'
  | 'announcement'
  | 'news';
export type SignalChatPriority = 'normal' | 'urgent';
export type SignalChatStatus = 'draft' | 'active' | 'completed';
export type SignalReactionType = 'love' | 'like' | 'fire' | 'hundred';

export interface SignalReactionsMap {
  love: number;
  like: number;
  fire: number;
  hundred: number;
}

export interface SignalChatMessage {
  id: string;
  author_id: string;
  author_name: string;
  content: string;
  image_url?: string | null;
  image_name?: string | null;
  media_url?: string | null;
  media_type?: 'image' | 'video' | null;
  media_name?: string | null;
  message_type: SignalChatMessageType;
  priority: SignalChatPriority;
  status: SignalChatStatus;
  pinned: boolean;
  edited_at?: string | null;
  completed_at?: string | null;
  completed_summary?: string | null;
  source_type?: string | null;
  source_id?: string | null;
  is_welcome?: boolean;
  views?: number;
  created_at: string;
  reactions: SignalReactionsMap;
  user_reaction: SignalReactionType | null;
}

export interface PushJobSummary {
  id: string;
  dedup_key: string;
  signal_message_id: string | null;
  title: string;
  category: string;
  link_url: string;
  priority: SignalChatPriority;
  published_at: string;
  status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed';
  total_targeted: number;
  queued_count: number;
  delivered_count: number;
  confirmed_count: number;
  failed_count: number;
  created_at: string;
  updated_at: string;
}

export interface PushDeliveryRecord {
  id: string;
  job_id: string;
  subscription_id: string;
  platform: string;
  transport: string;
  device_label: string | null;
  status: 'queued' | 'retrying' | 'delivered' | 'failed';
  attempts: number;
  status_code: number | null;
  last_error: string | null;
  delivered_at: string | null;
  device_received_at: string | null;
  opened_at: string | null;
  updated_at: string;
}

export interface RegistrationTrendPoint {
  key: string;
  label: string;
  count: number;
}

export interface RegistrationAnalyticsPayload {
  summary: {
    total_users: number;
    active_users: number;
    suspended_users: number;
    verified_users: number;
    unverified_users: number;
    new_today: number;
    new_7d: number;
    new_30d: number;
  };
  trends: {
    daily: RegistrationTrendPoint[];
    weekly: RegistrationTrendPoint[];
    monthly: RegistrationTrendPoint[];
  };
  records: User[];
}

export type MarketUpdateCategory =
  | 'Breaking News'
  | 'Forex Update'
  | 'Economic Announcement'
  | 'Trading Opportunity'
  | 'Gold & Crypto'
  | 'Risk Warning'
  | 'Daily Outlook'
  | 'Session Alert'
  | 'Platform Announcement';

export interface MarketUpdate {
  id: string;
  title: string;
  content: string;
  category: MarketUpdateCategory;
  pinned: boolean;
  image_url?: string | null;
  video_url?: string | null;
  attachment_url?: string | null;
  attachment_name?: string | null;
  external_link?: string | null;
  scheduled_at?: string | null;
  published: boolean;
  is_premium?: boolean;
  author_name: string;
  reactions: Record<string, number>;
  user_reacted?: string[];
  bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type ContentPublishStatus = 'draft' | 'published' | 'unpublished' | 'archived' | 'scheduled';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface LessonExercise {
  title: string;
  objective: string;
  steps: string[];
  deliverable: string;
}

export interface LessonSource {
  title: string;
  url: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  category: string;
  summary: string;
  learning_objective?: string;
  introduction?: string;
  content: string;
  demonstration?: string;
  common_mistakes?: string[];
  summary_recap?: string;
  practical_exercise?: LessonExercise | null;
  visual_key?: string | null;
  video_url?: string | null;
  audio_url?: string | null;
  transcript?: string | null;
  pdf_url?: string | null;
  image_url?: string | null;
  sources?: LessonSource[];
  tags?: string[];
  duration_minutes: number;
  order_index: number;
  status?: ContentPublishStatus;
  is_premium?: boolean;
  scheduled_at?: string | null;
  published_at?: string | null;
  updated_at?: string | null;
  material_version?: number;
  needs_review?: boolean;
  needs_review_note?: string | null;
  quiz: QuizQuestion[];
  completed?: boolean;
  bookmarked?: boolean;
  quiz_score?: number | null;
  scroll_pct?: number;
  created_at: string;
}

export interface CourseAssessmentRecord {
  best_score: number;
  passed: boolean;
  attempts: number;
  completed_at: string | null;
  certificate_id: string | null;
}

export interface Course {
  id: string;
  slug?: string;
  course_number?: number;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  level_label?: string;
  prerequisites?: string;
  learning_outcomes?: string[];
  estimated_hours?: number;
  status?: ContentPublishStatus;
  is_premium?: boolean;
  cover_image_url?: string | null;
  assessment?: QuizQuestion[];
  assessment_record?: CourseAssessmentRecord | null;
  enrolled?: boolean;
  last_lesson_id?: string | null;
  completed_lessons?: number;
  total_lessons?: number;
  lessons?: Lesson[];
  created_at: string;
  updated_at?: string | null;
}

export interface AcademyResumeState {
  last_course_id: string | null;
  last_lesson_id: string | null;
  last_scroll_pct: number;
  flashcard_progress: Record<string, 'mastered' | 'review'>;
  updated_at: string | null;
}

export interface LessonVersion {
  id: string;
  lesson_id: string;
  version_number: number;
  title: string;
  content: string;
  changed_by: string;
  change_note: string;
  created_at: string;
}

export interface AcademyAuditLog {
  id: string;
  actor_id: string;
  actor_name: string;
  action: string;
  target_type: string;
  target_id: string;
  details: string;
  created_at: string;
}

export interface AcademyContentReport {
  id: string;
  user_id: string | null;
  reporter_name: string;
  lesson_id: string;
  lesson_title: string;
  reason: string;
  status: 'open' | 'resolved' | 'dismissed';
  resolution_note?: string | null;
  created_at: string;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  content: string;
  created_at: string;
}

export interface CommunityPost {
  id: string;
  user_id: string;
  author_name: string;
  author_role: UserRole;
  category: string;
  title: string;
  content: string;
  image_url?: string | null;
  likes_count: number;
  liked_by_me?: boolean;
  comments_count: number;
  comments?: CommunityComment[];
  hidden?: boolean;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string | null;
  title: string;
  body: string;
  category: string;
  link_url: string;
  is_read: boolean;
  created_at: string;
}

export interface MarketCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface MarketInstrument {
  symbol: string;
  name: string;
  category: 'Forex' | 'Commodities' | 'Indices' | 'Crypto';
  price: number | null;
  change: number | null;
  change_pct: number | null;
  status: 'live' | 'delayed' | 'unavailable';
  source: string;
  updated_at: string;
  decimals: number;
}

export interface EconomicEvent {
  id: string;
  title: string;
  country: string;
  currency: string;
  date_iso: string;
  impact: 'Low' | 'Medium' | 'High';
  forecast: string;
  previous: string;
  actual: string;
  actual_outcome?: 'better' | 'worse' | 'inline' | 'pending';
  source?: string;
  comment?: string;
}

export interface LiveNewsArticle {
  id: string;
  title: string;
  summary: string;
  full_summary: string;
  source: string;
  author?: string | null;
  published_at: string;
  url: string;
  image_url?: string | null;
  tags: string[];
  category: 'News' | 'Analysis' | 'Macro';
}

export interface PlatformSettings {
  brand_name: string;
  tagline: string;
  logo_url: string;
  hero_title: string;
  hero_subtitle: string;
  about_text: string;
  contact_email: string;
  contact_phone: string;
  contact_whatsapp: string;
  contact_address: string;
  seo_title: string;
  seo_description: string;
  push_enabled: boolean;
  market_api_provider: string;
  calendar_api_provider: string;
}

export interface PublicStats {
  total_signals: number;
  active_signals: number;
  completed_signals: number;
  total_updates: number;
  total_courses: number;
  total_lessons: number;
  total_users: number;
  community_posts: number;
}

export interface AdminOverviewStats extends PublicStats {
  new_registrations_7d: number;
  push_subscribers: number;
  total_applications: number;
  pending_applications: number;
  approved_applications: number;
  active_premium_members: number;
  unread_customer_messages: number;
  total_enquiries: number;
}

export type MembershipApplicationStatus = 'pending' | 'approved' | 'rejected';
export type PreferredContactMethod = 'Email' | 'WhatsApp' | 'Phone Call';

export interface MembershipApplication {
  id: string;
  reference_code: string;
  full_name: string;
  email: string;
  phone: string;
  country: string;
  preferred_contact: PreferredContactMethod;
  message: string;
  status: MembershipApplicationStatus;
  admin_notes?: string | null;
  reviewed_by?: string | null;
  reviewed_at?: string | null;
  member_user_id?: string | null;
  member_username?: string | null;
  member_status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface SupportConversation {
  id: string;
  reference_code: string;
  visitor_name: string;
  visitor_email?: string | null;
  visitor_phone?: string | null;
  visitor_id?: string | null;
  status: 'open' | 'resolved';
  unread_admin: number;
  unread_visitor: number;
  last_message_preview: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface SupportMessage {
  id: string;
  conversation_id: string;
  sender_type: 'visitor' | 'admin';
  sender_name: string;
  content: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  read_by_admin: boolean;
  read_by_visitor: boolean;
  created_at: string;
}

export interface ContactSubmission {
  id: string;
  reference_code?: string | null;
  name: string;
  email: string;
  phone?: string | null;
  subject: string;
  message: string;
  status: 'new' | 'reviewed' | 'replied' | string;
  admin_reply?: string | null;
  replied_at?: string | null;
  created_at: string;
}

