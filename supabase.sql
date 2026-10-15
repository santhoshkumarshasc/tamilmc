-- ==========================================================
-- TAMIL MINECRAFT COMMUNITY (TMC AWARDS) - SUPABASE SCHEMA
-- Run this complete script in Supabase Dashboard -> SQL Editor
-- ==========================================================

-- 1. Enable UUID Extension
create extension if not exists "uuid-ossp";

-- 2. Create PROFILES Table
create table if not exists public.profiles (
  id text primary key,
  user_id text,
  handle text unique not null,
  display_name text not null,
  channel_name text not null,
  channel_url text,
  avatar_url text,
  avatar_image text,
  bio text,
  category text default 'Survival',
  likes integer default 0,
  votes integer default 0,
  cert_count integer default 1,
  has_welcome boolean default true,
  is_public boolean default true,
  is_hidden boolean default false,
  accent text default '#1f9d5e',
  card_color text default '#1f9d5e',
  card_style text default 'raised',
  socials jsonb default '{}'::jsonb,
  social_links jsonb default '[]'::jsonb,
  custom_links jsonb default '[]'::jsonb,
  discord_username text,
  discord_id text,
  discord_verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Public Profiles View (for showcase)
create or replace view public.public_profiles as
select * from public.profiles
where is_public = true and is_hidden = false;

-- 3. Create CERTIFICATES Table
create table if not exists public.certs (
  id text primary key,
  cert_code text unique not null,
  token text unique not null,
  recipient_name text not null,
  channel_name text not null,
  award text not null,
  award_ta text,
  heading text not null,
  heading_ta text,
  content_title text,
  content_url text,
  message text,
  theme text default 'emerald',
  icon text default 'shield',
  type_name text default 'Community Award',
  status text default 'redeemed', -- 'unused', 'redeemed', 'revoked'
  user_id text,
  is_welcome boolean default false,
  is_team_award boolean default false,
  team_name text,
  team_members text,
  issuer_signature text default 'TMC Awards Committee',
  badge_text text,
  custom_logo_url text,
  issued_at timestamptz default now()
);

-- 4. Create CERTIFICATE TYPES Table
create table if not exists public.types (
  id text primary key,
  name text not null,
  name_ta text,
  heading text not null,
  heading_ta text,
  award text not null,
  award_ta text,
  theme text default 'emerald',
  icon text default 'star',
  message text,
  is_active boolean default true,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- 5. Create ADMINS Table
create table if not exists public.admins (
  id text primary key,
  email text unique not null,
  name text not null,
  role text default 'super_admin',
  password text default 'ADMINOFTMC',
  notes text,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 6. Create VOTES Table (1 Person = 1 Vote enforcement)
create table if not exists public.votes (
  voter_id text primary key,
  profile_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

-- 7. Create LIKES Table
create table if not exists public.likes (
  voter_id text not null,
  profile_id text not null references public.profiles(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (voter_id, profile_id)
);

-- 8. Row Level Security (RLS) Configuration
alter table public.profiles enable row level security;
alter table public.certs enable row level security;
alter table public.types enable row level security;
alter table public.admins enable row level security;
alter table public.votes enable row level security;
alter table public.likes enable row level security;

-- Read policies (Allow public reads for showcase)
create policy "Allow public read profiles" on public.profiles for select using (true);
create policy "Allow public read certs" on public.certs for select using (true);
create policy "Allow public read types" on public.types for select using (true);
create policy "Allow public read votes" on public.votes for select using (true);
create policy "Allow public read likes" on public.likes for select using (true);

-- Insert & Update policies
create policy "Allow public insert profiles" on public.profiles for insert with check (true);
create policy "Allow public update profiles" on public.profiles for update using (true);
create policy "Allow public insert certs" on public.certs for insert with check (true);
create policy "Allow public update certs" on public.certs for update using (true);

-- 9. Insert Starter Seed Data
insert into public.admins (id, email, name, role, password) values
  ('admin-lead-0', 'gitsmesk@gmail.com', 'SK (Lead Admin)', 'super_admin', 'ADMINOFTMC'),
  ('admin-lead-1', 'santhoshkumarshasc@gmail.com', 'Santhosh (Lead Admin)', 'super_admin', 'ADMINOFTMC'),
  ('admin-lead-2', 'admin@tmcawards.org', 'TMC Awards Operations', 'super_admin', 'ADMINOFTMC'),
  ('admin-lead-3', 'ogisbacktamil@gmail.com', 'TMC Admin (Owner)', 'super_admin', 'ADMINOFTMC')
on conflict (email) do nothing;

insert into public.types (id, name, name_ta, heading, heading_ta, award, award_ta, theme, icon, message, sort_order) values
  ('type-welcome', 'Welcome Member', 'வரவேற்பு உறுப்பினர்', 'Community Welcome Certificate', 'சமூக வரவேற்புச் சான்றிதழ்', 'Welcome to Tamil MC Community', 'தமிழ் MC சமூக வரவேற்பு', 'emerald', 'shield', 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.', 0),
  ('type-1', 'Achievement', 'சாதனை', 'Certificate of Achievement', 'சாதனைச் சான்றிதழ்', 'Outstanding Creator', 'சிறந்த படைப்பாளர்', 'emerald', 'star', 'Honouring outstanding creativity in Tamil Minecraft builds and videos.', 1),
  ('type-2', 'Winner', 'வெற்றியாளர்', 'Certificate of Victory', 'வெற்றிச் சான்றிதழ்', 'Best Creator Award', 'சிறந்த படைப்பாளர் விருது', 'gold', 'trophy', 'Winner of the TMC Awards Best Creator community poll.', 2),
  ('type-3', 'Participation', 'பங்கேற்பு', 'Certificate of Participation', 'பங்கேற்புச் சான்றிதழ்', 'Active Participant', 'சிறந்த பங்கேற்பாளர்', 'diamond', 'shield', 'For active participation in the Tamil Minecraft Community Event.', 3),
  ('type-4', 'Appreciation', 'பாராட்டு', 'Certificate of Appreciation', 'பாராட்டுச் சான்றிதழ்', 'Valued Contributor', 'மதிப்புமிக்க பங்களிப்பாளர்', 'netherite', 'heart', 'In recognition of outstanding dedication and leadership in the community.', 4),
  ('type-5', 'Rising Star', 'வளரும் நட்சத்திரம்', 'Rising Star Certificate', 'வளரும் நட்சத்திரச் சான்றிதழ்', 'Rising Star Creator', 'வளரும் நட்சத்திரப் படைப்பாளர்', 'emerald', 'gem', 'Recognising one of the most promising new Tamil Minecraft creators.', 5)
on conflict (id) do nothing;

insert into public.profiles (id, handle, display_name, channel_name, channel_url, avatar_url, avatar_image, bio, category, likes, votes, cert_count, accent, card_color, card_style, socials) values
  ('creator-santhosh', 'santhosh_tmc', 'Santhosh (TMC)', 'Tamil Minecraft Official', 'https://youtube.com/@tamilmc', '/logo.png', '/logo.png', 'Lead Administrator of Tamil Minecraft Community. Building the biggest Tamil Minecraft SMP network & creator showcase.', 'Survival', 48, 35, 2, '#1f9d5e', '#1f9d5e', 'raised', '{"yt":"https://youtube.com/@tamilmc","discord":"https://discord.gg/tmc"}'::jsonb),
  ('creator-dravid', 'dravid_crafter', 'Dravid Crafter', 'Tamil SMP Crafters', 'https://youtube.com', 'https://cdn.discordapp.com/embed/avatars/0.png', 'https://cdn.discordapp.com/embed/avatars/0.png', 'Tamil Minecraft Hardcore survival streamer. Mega castles, Nether highways, and ancient debris mining.', 'Survival', 34, 22, 1, '#1b8fd6', '#1b8fd6', 'raised', '{"yt":"https://youtube.com"}'::jsonb),
  ('creator-kavi', 'kavi_redstone', 'Kavi Redstone', 'Kavi Gaming Tamil', 'https://youtube.com', 'https://cdn.discordapp.com/embed/avatars/1.png', 'https://cdn.discordapp.com/embed/avatars/1.png', 'Redstone engineer & automation specialist. 100% efficient farms and flying machines in Tamil.', 'Redstone', 29, 18, 1, '#e0a81f', '#e0a81f', 'raised', '{"yt":"https://youtube.com"}'::jsonb),
  ('creator-arun', 'arun_pvp', 'Arun PvP', 'Arun MC Tamil', 'https://youtube.com', 'https://cdn.discordapp.com/embed/avatars/2.png', 'https://cdn.discordapp.com/embed/avatars/2.png', 'Competitive Bedwars, Skywars & Custom SMP PvP arena tournaments in Tamil.', 'PvP', 25, 15, 1, '#a855f7', '#a855f7', 'raised', '{"yt":"https://youtube.com"}'::jsonb)
on conflict (id) do nothing;

insert into public.certs (id, cert_code, token, recipient_name, channel_name, award, award_ta, heading, heading_ta, content_title, content_url, message, theme, icon, type_name, status, user_id, is_welcome) values
  ('cert-starter-1', 'CERT-TMC-WINNER-2026', 'TMC-WINNER-2026-PRO', 'Santhosh (TMC)', 'Tamil Minecraft Official', 'Best Creator Award', 'சிறந்த படைப்பாளர் விருது', 'Certificate of Victory', 'வெற்றிச் சான்றிதழ்', 'TMC Community SMP Season 3', 'https://youtube.com/@tamilmc', 'Winner of the TMC Awards Best Creator community poll for outstanding Tamil gaming content.', 'gold', 'trophy', 'Winner', 'redeemed', 'creator-santhosh', false),
  ('cert-starter-welcome-santhosh', 'CERT-TMC-WELCOME-SK01', 'TMC-WELCOME-SK01', 'Santhosh (TMC)', 'Tamil Minecraft Official', 'Welcome to Tamil MC Community', 'தமிழ் MC சமூக வரவேற்பு', 'Community Welcome Certificate', 'சமூக வரவேற்புச் சான்றிதழ்', 'Official Member of TMC Awards', 'https://youtube.com/@tamilmc', 'Welcome to the Tamil Minecraft community! Official certified creator of TMC Awards.', 'emerald', 'shield', 'Community Welcome', 'redeemed', 'creator-santhosh', true)
on conflict (id) do nothing;
