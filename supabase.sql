-- =====================================================================
-- Tamil Minecraft Creators Showcase: database schema + security rules
-- Run this whole file once in Supabase > SQL Editor.
-- =====================================================================
create extension if not exists pgcrypto with schema extensions;

-- ---------- Admins (invisible to the API; only SQL editor can edit) ----
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;
revoke all on public.admins from anon, authenticated;

-- An admin must be listed AND have passed MFA (aal2) in this session.
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid())
     and coalesce(auth.jwt() ->> 'aal', '') = 'aal2';
$$;

-- Used only to decide whether to show the MFA enrol/verify step.
create or replace function public.admin_gate() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;

-- ---------- Creator profiles ------------------------------------------
create or replace function public.valid_links(l jsonb) returns boolean
language sql immutable as $$
  select jsonb_typeof(l) = 'array' and jsonb_array_length(l) <= 4
    and coalesce((select bool_and(
          jsonb_typeof(e) = 'object'
          and (e ->> 'url') ~ '^https://[^[:space:]"''<>]{3,200}$'
          and char_length(coalesce(e ->> 'label', '')) between 1 and 24)
        from jsonb_array_elements(l) e), true);
$$;

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null check (handle ~ '^[a-z0-9_]{3,24}$'),
  display_name  text not null check (char_length(display_name) between 2 and 40),
  channel_name  text not null check (char_length(channel_name) between 2 and 40),
  channel_url   text check (channel_url is null or channel_url ~ '^https://[^[:space:]"''<>]{3,200}$'),
  bio           text check (char_length(bio) <= 300),
  accent        text not null default '#1f7a45' check (accent ~ '^#[0-9a-fA-F]{6}$'),
  card_style    text not null default 'raised' check (card_style in ('raised','flat','outline')),
  avatar_emoji  text not null default '⛏️' check (char_length(avatar_emoji) <= 8),
  links         jsonb not null default '[]' check (public.valid_links(links)),
  is_public     boolean not null default true,
  is_hidden     boolean not null default false,   -- set by admin only
  likes         integer not null default 0,        -- changed by toggle_like only
  created_at    timestamptz not null default now()
);
alter table public.profiles enable row level security;

revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, handle, display_name, channel_name, channel_url, bio,
              accent, card_style, avatar_emoji, links, is_public) on public.profiles to authenticated;
grant update (display_name, channel_name, channel_url, bio,
              accent, card_style, avatar_emoji, links, is_public) on public.profiles to authenticated;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid());
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles for insert to authenticated
  with check (id = auth.uid() and is_hidden = false and likes = 0);
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid() and is_hidden = false) with check (id = auth.uid());

-- ---------- Certificate types (managed by admin) ----------------------
create table if not exists public.certificate_types (
  id          uuid primary key default gen_random_uuid(),
  name        text unique not null check (char_length(name) between 2 and 40),
  name_ta     text check (char_length(name_ta) <= 40),
  heading     text not null check (char_length(heading) between 2 and 80),
  heading_ta  text check (char_length(heading_ta) <= 80),
  award       text not null check (char_length(award) between 2 and 60),
  award_ta    text check (char_length(award_ta) <= 60),
  theme       text not null default 'emerald' check (theme in ('emerald','gold','diamond','netherite')),
  icon        text not null default 'star' check (icon in ('star','trophy','shield','heart','gem')),
  message     text check (char_length(message) <= 140),
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);
alter table public.certificate_types enable row level security;
revoke all on public.certificate_types from anon, authenticated;

-- ---------- Certificates (no direct API access at all) ----------------
create table if not exists public.certificates (
  id             uuid primary key default gen_random_uuid(),
  cert_code      text unique not null,      -- public ID printed on the certificate
  token_hash     text unique not null,      -- SHA-256 of the secret redeem token
  recipient_name text not null check (char_length(recipient_name) between 2 and 60),
  channel_name   text not null check (char_length(channel_name) between 2 and 60),
  award          text not null check (char_length(award) between 2 and 60),
  award_ta       text check (char_length(award_ta) <= 60),
  type_id        uuid references public.certificate_types(id) on delete set null,
  type_name      text,
  heading        text not null default 'Certificate of Achievement' check (char_length(heading) between 2 and 80),
  heading_ta     text check (char_length(heading_ta) <= 80),
  icon           text not null default 'star' check (icon in ('star','trophy','shield','heart','gem')),
  content_title  text check (char_length(content_title) <= 100),
  content_url    text check (content_url is null or content_url ~ '^https://[^[:space:]"''<>]{3,200}$'),
  message        text check (char_length(message) <= 140),
  theme          text not null default 'emerald' check (theme in ('emerald','gold','diamond','netherite')),
  status         text not null default 'unused' check (status in ('unused','redeemed','revoked')),
  issued_at      timestamptz not null default now(),
  issued_by      uuid references auth.users(id) on delete set null,
  redeemed_by    uuid references auth.users(id) on delete set null,
  redeemed_at    timestamptz
);
alter table public.certificates enable row level security;
revoke all on public.certificates from anon, authenticated;

create table if not exists public.redeem_attempts (
  user_id uuid not null,
  at      timestamptz not null default now(),
  ok      boolean not null
);
alter table public.redeem_attempts enable row level security;
revoke all on public.redeem_attempts from anon, authenticated;
create index if not exists redeem_attempts_user_at on public.redeem_attempts (user_id, at desc);

create table if not exists public.likes (
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  primary key (user_id, profile_id)
);
alter table public.likes enable row level security;
revoke all on public.likes from anon, authenticated;

-- ---------- Public showcase view (safe columns only) ------------------
create or replace view public.public_profiles as
select p.id, p.handle, p.display_name, p.channel_name, p.channel_url,
       p.bio, p.accent, p.card_style, p.avatar_emoji, p.links, p.likes, p.created_at,
       (select count(*) from public.certificates c
         where c.redeemed_by = p.id and c.status = 'redeemed')::int as cert_count
from public.profiles p
where p.is_public and not p.is_hidden;
grant select on public.public_profiles to anon, authenticated;

-- ---------- Creator functions -----------------------------------------
create or replace function public.toggle_like(p_profile uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_liked boolean; v_likes int;
begin
  if auth.uid() is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  if not exists (select 1 from public.profiles where id = p_profile and is_public and not is_hidden) then
    raise exception 'not_found';
  end if;
  if exists (select 1 from public.likes where user_id = auth.uid() and profile_id = p_profile) then
    delete from public.likes where user_id = auth.uid() and profile_id = p_profile;
    update public.profiles set likes = greatest(likes - 1, 0) where id = p_profile returning likes into v_likes;
    v_liked := false;
  else
    insert into public.likes(user_id, profile_id) values (auth.uid(), p_profile);
    update public.profiles set likes = likes + 1 where id = p_profile returning likes into v_likes;
    v_liked := true;
  end if;
  return jsonb_build_object('liked', v_liked, 'likes', v_likes);
end $$;

create or replace function public.my_likes() returns setof uuid
language sql stable security definer set search_path = public as $$
  select profile_id from public.likes where user_id = auth.uid();
$$;

create or replace function public.redeem_certificate(p_token text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_uid uuid := auth.uid(); v_fail int; v_row public.certificates;
begin
  if v_uid is null then return jsonb_build_object('ok', false, 'error', 'sign_in_required'); end if;
  select count(*) into v_fail from public.redeem_attempts
   where user_id = v_uid and ok = false and at > now() - interval '1 hour';
  if v_fail >= 5 then return jsonb_build_object('ok', false, 'error', 'locked'); end if;

  update public.certificates
     set status = 'redeemed', redeemed_by = v_uid, redeemed_at = now()
   where token_hash = encode(digest(upper(trim(coalesce(p_token, ''))), 'sha256'), 'hex')
     and status = 'unused'
  returning * into v_row;

  if v_row.id is null then
    insert into public.redeem_attempts(user_id, ok) values (v_uid, false);
    return jsonb_build_object('ok', false, 'error', 'invalid_token');
  end if;
  insert into public.redeem_attempts(user_id, ok) values (v_uid, true);
  return jsonb_build_object('ok', true, 'cert_code', v_row.cert_code);
end $$;

create or replace function public.my_certificates()
returns table (cert_code text, recipient_name text, channel_name text, award text, award_ta text,
               heading text, heading_ta text, icon text, content_title text, message text,
               theme text, issued_at timestamptz, redeemed_at timestamptz)
language sql stable security definer set search_path = public as $$
  select c.cert_code, c.recipient_name, c.channel_name, c.award, c.award_ta, c.heading, c.heading_ta,
         c.icon, c.content_title, c.message, c.theme, c.issued_at, c.redeemed_at
  from public.certificates c
  where c.redeemed_by = auth.uid() and c.status = 'redeemed'
  order by c.redeemed_at desc;
$$;

create or replace function public.verify_certificate(p_code text)
returns table (recipient_name text, channel_name text, award text, award_ta text, heading text,
               heading_ta text, icon text, content_title text, message text, theme text,
               issued_at timestamptz, redeemed_at timestamptz, cert_code text, status text)
language sql stable security definer set search_path = public as $$
  select c.recipient_name, c.channel_name, c.award, c.award_ta, c.heading, c.heading_ta, c.icon,
         c.content_title, c.message, c.theme, c.issued_at, c.redeemed_at, c.cert_code, c.status
  from public.certificates c
  where c.cert_code = upper(trim(p_code)) and c.status in ('redeemed','revoked');
$$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'sign_in_required' using errcode = '42501'; end if;
  delete from auth.users where id = auth.uid();
end $$;

-- ---------- Admin functions (every one re-checks is_admin) ------------
create or replace function public.admin_create_certificate(
  p_recipient text, p_channel text, p_type_id uuid, p_award text, p_award_ta text,
  p_content_title text, p_content_url text, p_message text, p_theme text) returns jsonb
language plpgsql security definer set search_path = public, extensions as $$
declare v_token text; v_code text; v_id uuid; v_t public.certificate_types;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_type_id is not null then
    select * into v_t from public.certificate_types where id = p_type_id;
    if not found then raise exception 'unknown_type'; end if;
  end if;
  v_token := 'TMC-' || upper(encode(gen_random_bytes(2),'hex')) || '-' ||
             upper(encode(gen_random_bytes(2),'hex')) || '-' || upper(encode(gen_random_bytes(2),'hex'));
  v_code  := 'CERT-' || upper(encode(gen_random_bytes(4),'hex'));
  insert into public.certificates(cert_code, token_hash, recipient_name, channel_name, type_id, type_name,
         heading, heading_ta, icon, award, award_ta, content_title, content_url, message, theme, issued_by)
  values (v_code, encode(digest(v_token,'sha256'),'hex'), trim(p_recipient), trim(p_channel),
          v_t.id, v_t.name, coalesce(v_t.heading, 'Certificate of Achievement'), v_t.heading_ta,
          coalesce(v_t.icon, 'star'),
          coalesce(nullif(trim(p_award),''), v_t.award, 'Outstanding Creator'),
          coalesce(nullif(trim(p_award_ta),''), v_t.award_ta),
          nullif(trim(p_content_title),''), nullif(trim(p_content_url),''),
          coalesce(nullif(trim(p_message),''), v_t.message),
          coalesce(nullif(p_theme,''), v_t.theme, 'emerald'), auth.uid())
  returning id into v_id;
  return jsonb_build_object('id', v_id, 'token', v_token, 'cert_code', v_code);
end $$;

create or replace function public.admin_reissue_token(p_id uuid) returns text
language plpgsql security definer set search_path = public, extensions as $$
declare v_token text;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  v_token := 'TMC-' || upper(encode(gen_random_bytes(2),'hex')) || '-' ||
             upper(encode(gen_random_bytes(2),'hex')) || '-' || upper(encode(gen_random_bytes(2),'hex'));
  update public.certificates set token_hash = encode(digest(v_token,'sha256'),'hex')
   where id = p_id and status = 'unused';
  if not found then raise exception 'only_unused_tokens_can_be_reissued'; end if;
  return v_token;
end $$;

create or replace function public.admin_set_certificate_status(p_id uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_status not in ('revoked') then raise exception 'bad_status'; end if;
  update public.certificates set status = p_status where id = p_id;
end $$;

create or replace function public.admin_delete_certificate(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  delete from public.certificates where id = p_id;
end $$;

create or replace function public.admin_list_certificates()
returns table (id uuid, cert_code text, recipient_name text, channel_name text, award text, award_ta text,
               type_name text, heading text, heading_ta text, icon text, content_title text,
               content_url text, message text, theme text, status text,
               issued_at timestamptz, redeemed_at timestamptz, redeemed_by_handle text)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  return query
    select c.id, c.cert_code, c.recipient_name, c.channel_name, c.award, c.award_ta, c.type_name,
           c.heading, c.heading_ta, c.icon, c.content_title, c.content_url, c.message, c.theme,
           c.status, c.issued_at, c.redeemed_at, p.handle
    from public.certificates c left join public.profiles p on p.id = c.redeemed_by
    order by c.issued_at desc;
end $$;

create or replace function public.admin_list_profiles()
returns table (id uuid, email text, handle text, display_name text, channel_name text,
               channel_url text, bio text, is_public boolean, is_hidden boolean,
               likes integer, created_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  return query
    select p.id, u.email::text, p.handle, p.display_name, p.channel_name, p.channel_url,
           p.bio, p.is_public, p.is_hidden, p.likes, p.created_at
    from public.profiles p join auth.users u on u.id = p.id
    order by p.created_at desc;
end $$;

create or replace function public.admin_update_profile(
  p_id uuid, p_display text, p_channel text, p_bio text, p_hidden boolean) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  update public.profiles set display_name = trim(p_display), channel_name = trim(p_channel),
         bio = nullif(trim(p_bio),''), is_hidden = p_hidden
   where id = p_id;
end $$;

create or replace function public.admin_delete_profile(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  delete from auth.users where id = p_id;
end $$;

create or replace function public.admin_list_types()
returns table (id uuid, name text, name_ta text, heading text, heading_ta text, award text, award_ta text,
               theme text, icon text, message text, is_active boolean, sort_order integer)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  return query
    select t.id, t.name, t.name_ta, t.heading, t.heading_ta, t.award, t.award_ta, t.theme, t.icon,
           t.message, t.is_active, t.sort_order
    from public.certificate_types t order by t.sort_order, t.created_at;
end $$;

create or replace function public.admin_save_type(
  p_id uuid, p_name text, p_name_ta text, p_heading text, p_heading_ta text, p_award text,
  p_award_ta text, p_theme text, p_icon text, p_message text, p_active boolean) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  if p_id is null then
    insert into public.certificate_types(name, name_ta, heading, heading_ta, award, award_ta, theme, icon, message, is_active, sort_order)
    values (trim(p_name), nullif(trim(p_name_ta),''), trim(p_heading), nullif(trim(p_heading_ta),''),
            trim(p_award), nullif(trim(p_award_ta),''), p_theme, p_icon, nullif(trim(p_message),''), p_active,
            coalesce((select max(sort_order) + 1 from public.certificate_types), 0))
    returning id into v_id;
  else
    update public.certificate_types set name = trim(p_name), name_ta = nullif(trim(p_name_ta),''),
           heading = trim(p_heading), heading_ta = nullif(trim(p_heading_ta),''), award = trim(p_award),
           award_ta = nullif(trim(p_award_ta),''), theme = p_theme, icon = p_icon,
           message = nullif(trim(p_message),''), is_active = p_active
     where id = p_id returning id into v_id;
  end if;
  return v_id;
end $$;

create or replace function public.admin_delete_type(p_id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not_authorized' using errcode = '42501'; end if;
  delete from public.certificate_types where id = p_id;  -- issued certificates keep their own copy
end $$;

-- ---------- Lock down function access ---------------------------------
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname in (
      'is_admin','admin_gate','toggle_like','my_likes','redeem_certificate','my_certificates',
      'verify_certificate','delete_my_account','admin_create_certificate','admin_reissue_token',
      'admin_set_certificate_status','admin_delete_certificate','admin_list_certificates',
      'admin_list_profiles','admin_update_profile','admin_delete_profile',
      'admin_list_types','admin_save_type','admin_delete_type')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;
grant execute on function public.verify_certificate(text) to anon;


-- ---------- Starter certificate types (edit or delete in the admin page) ----
insert into public.certificate_types(name, name_ta, heading, heading_ta, award, award_ta, theme, icon, sort_order) values
 ('Achievement','சாதனை','Certificate of Achievement','சாதனைச் சான்றிதழ்','Outstanding Creator','சிறந்த படைப்பாளர்','emerald','star',0),
 ('Winner','வெற்றியாளர்','Certificate of Victory','வெற்றிச் சான்றிதழ்','Showcase Winner','காட்சியக வெற்றியாளர்','gold','trophy',1),
 ('Participation','பங்கேற்பு','Certificate of Participation','பங்கேற்புச் சான்றிதழ்','Active Participant','சிறந்த பங்கேற்பாளர்','diamond','shield',2),
 ('Appreciation','பாராட்டு','Certificate of Appreciation','பாராட்டுச் சான்றிதழ்','Valued Contributor','மதிப்புமிக்க பங்களிப்பாளர்','netherite','heart',3),
 ('Rising Star','வளரும் நட்சத்திரம்','Rising Star Certificate','வளரும் நட்சத்திரச் சான்றிதழ்','Rising Star','வளரும் நட்சத்திரம்','emerald','gem',4)
on conflict (name) do nothing;

-- =====================================================================
-- AFTER you sign up on the site and confirm your email, make yourself
-- admin by running (replace the email):
--   insert into public.admins(user_id)
--   select id from auth.users where email = 'you@example.com';
-- =====================================================================
