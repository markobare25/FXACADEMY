export type UserRole = 'user' | 'moderator' | 'admin';

export interface NotificationPreferences {
  signals: boolean;
  signal_updates: boolean;
  market_updates: boolean;
  academy: boolean;
  economic_calendar: boolean;
  announcements: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'suspended';
  email_verified: boolean;
  avatar_url?: string | null;
  bio?: string | null;
  timezone?: string;
  notification_prefs: NotificationPreferences;
  watchlist: string[];
  created_at: string;
  last_login_at?: string | null;
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
  created_by: string;
  created_at: string;
  updated_at: string;
  updates?: SignalUpdateEntry[];
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
  author_name: string;
  reactions: Record<string, number>;
  user_reacted?: string[];
  bookmarked?: boolean;
  created_at: string;
  updated_at: string;
}

export type CourseLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation?: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  video_url?: string | null;
  pdf_url?: string | null;
  image_url?: string | null;
  duration_minutes: number;
  order_index: number;
  quiz: QuizQuestion[];
  completed?: boolean;
  bookmarked?: boolean;
  quiz_score?: number | null;
  created_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: CourseLevel;
  cover_image_url?: string | null;
  enrolled?: boolean;
  completed_lessons?: number;
  total_lessons?: number;
  lessons?: Lesson[];
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
