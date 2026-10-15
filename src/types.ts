/**
 * TypeScript Data Models & Interfaces for TMC Awards
 */

export interface SocialLinks {
  yt?: string | null;
  discord?: string | null;
  insta?: string | null;
  twitch?: string | null;
  x?: string | null;
}

export interface CustomLink {
  id?: string;
  title: string;
  url: string;
  platform?: string;
}

export type CardStyle = 'raised' | 'flat' | 'outline';
export type AvatarMode = 'upload' | 'url';
export type CertTheme = 'emerald' | 'gold' | 'diamond' | 'netherite';
export type CertStatus = 'unused' | 'redeemed' | 'revoked';

export interface CreatorProfile {
  id: string;
  handle: string;
  display_name: string;
  channel_name: string;
  channel_url?: string;
  bio?: string;
  avatar_image?: string;
  avatar_url?: string;
  accent: string;
  card_style: CardStyle;
  socials?: SocialLinks;
  custom_links?: CustomLink[];
  is_public: boolean;
  is_hidden?: boolean;
  likes: number;
  votes: number;
  cert_count: number;
  has_welcome?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CertificateType {
  id: string;
  name: string;
  name_ta: string;
  heading: string;
  heading_ta: string;
  award: string;
  award_ta: string;
  theme: CertTheme;
  icon: string;
  message: string;
  is_active: boolean;
  sort_order: number;
}

export interface Certificate {
  id: string;
  cert_code: string;
  token: string;
  recipient_name: string;
  channel_name: string;
  award: string;
  award_ta?: string;
  heading: string;
  heading_ta?: string;
  content_title?: string;
  content_url?: string;
  message?: string;
  theme: CertTheme;
  icon: string;
  type_name?: string;
  custom_logo_url?: string | null;
  team_members?: string | null;
  team_name?: string | null;
  issuer_signature?: string | null;
  badge_text?: string | null;
  is_team_award?: boolean;
  status: CertStatus;
  user_id: string | null;
  is_welcome?: boolean;
  issued_at: string;
}

export interface UserAccount {
  id: string;
  email: string;
  created_at: string;
  is_admin?: boolean;
  name?: string;
  discord_id?: string;
  discord_username?: string;
  discord_avatar_url?: string;
  discord_verified?: boolean;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'moderator' | 'cert_manager';
  password?: string;
  created_at: string;
  created_by?: string;
  notes?: string;
  is_active: boolean;
}

export interface AuthSession {
  user: UserAccount;
  access_token: string;
}

export interface VoteRecord {
  voter_id: string;
  profile_id: string;
  voted_at: string;
}

export type ThemeMode = 'light' | 'dark';
export type LangCode = 'en' | 'ta';

export interface SignUpPayload {
  email: string;
  password: string;
  confirmPassword?: string;
  agreedToTerms?: boolean;
}

export interface LegalPolicySection {
  id: string;
  title_en: string;
  title_ta: string;
  content_en: string;
  content_ta: string;
  items_en?: string[];
  items_ta?: string[];
}

export interface Announcement {
  id: string;
  title: string;
  message: string;
  badge?: string;
  badge_color?: string;
  link_url?: string;
  link_text?: string;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
  author?: string;
}

export interface DatabaseState {
  users: UserAccount[];
  admins: AdminUser[];
  profiles: CreatorProfile[];
  certs: Certificate[];
  types: CertificateType[];
  announcements?: Announcement[];
  likes: Record<string, string[]>;
  votes: Record<string, string>;
  session: AuthSession | null;
  isAdmin: boolean;
  serverIcon: string | null;
  adminLoginAt?: number;
}

export interface AdminResetDataResult {
  success: boolean;
  profilesCount: number;
  certsCount: number;
  message: string;
  timestamp: string;
}

export interface PreloadState {
  progress: number;
  phase: 'init' | 'loading' | 'ready' | 'dismissed';
  statusText: string;
}

export interface ScrollRevealConfig {
  threshold?: number;
  rootMargin?: string;
  staggerDelayMs?: number;
}
