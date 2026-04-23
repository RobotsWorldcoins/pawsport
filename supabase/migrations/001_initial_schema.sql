-- ============================================================
-- PAWSPORT — Full Schema v1.0
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- ============================================================
-- USERS
-- ============================================================
create table public.users (
  id           uuid references auth.users(id) on delete cascade primary key,
  email        text unique not null,
  full_name    text not null default '',
  avatar_url   text,
  subscription_tier text not null default 'free'
    check (subscription_tier in ('free','premium','premium_pro')),
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- DOGS
-- ============================================================
create table public.dogs (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid references public.users(id) on delete cascade not null,
  name             text not null,
  breed            text not null default '',
  age_months       integer not null default 12,
  weight_kg        numeric(5,2) default 0,
  city             text not null default 'lisbon',
  personality_tags text[] default '{}',
  avatar_url       text,
  xp               integer not null default 0,
  level            integer not null default 1,
  tier             text not null default 'Puppy',
  streak_days      integer not null default 0,
  last_checkin     date,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index idx_dogs_owner on public.dogs(owner_id);
create index idx_dogs_level on public.dogs(level desc);
create index idx_dogs_xp on public.dogs(xp desc);

-- ============================================================
-- DOG STATS (Arena)
-- ============================================================
create table public.dog_stats (
  id                    uuid primary key default gen_random_uuid(),
  dog_id                uuid references public.dogs(id) on delete cascade not null unique,
  hp                    integer not null default 50 check (hp between 1 and 200),
  power                 integer not null default 50 check (power between 1 and 200),
  defense               integer not null default 50 check (defense between 1 and 200),
  agility               integer not null default 50 check (agility between 1 and 200),
  speed                 integer not null default 50 check (speed between 1 and 200),
  instinct              integer not null default 50 check (instinct between 1 and 200),
  focus                 integer not null default 50 check (focus between 1 and 200),
  charm                 integer not null default 50 check (charm between 1 and 200),
  stat_points_available integer not null default 0,
  updated_at            timestamptz not null default now()
);

-- ============================================================
-- LOCATIONS
-- ============================================================
create table public.locations (
  id              uuid primary key default gen_random_uuid(),
  google_place_id text unique,
  name            text not null,
  category        text not null,
  lat             numeric(10,7) not null,
  lng             numeric(10,7) not null,
  address         text default '',
  city            text not null default 'lisbon',
  country         text not null default 'PT',
  rating          numeric(3,1),
  photos          text[] default '{}',
  filter_tags     text[] default '{}',
  is_verified     boolean not null default false,
  checkin_count   integer not null default 0,
  created_at      timestamptz not null default now()
);

create index idx_locations_category on public.locations(category);
create index idx_locations_city on public.locations(city);
create index idx_locations_lat_lng on public.locations(lat, lng);
create index idx_locations_rating on public.locations(rating desc);

-- ============================================================
-- CHECK-INS
-- ============================================================
create table public.checkins (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid references public.dogs(id) on delete cascade not null,
  location_id uuid references public.locations(id) on delete cascade not null,
  xp_earned   integer not null default 0,
  photo_url   text,
  note        text,
  created_at  timestamptz not null default now()
);

create index idx_checkins_dog on public.checkins(dog_id);
create index idx_checkins_location on public.checkins(location_id);
create index idx_checkins_created on public.checkins(created_at desc);

-- Increment location check-in count
create or replace function public.increment_checkin_count()
returns trigger language plpgsql as $$
begin
  update public.locations set checkin_count = checkin_count + 1 where id = new.location_id;
  return new;
end;
$$;
create trigger after_checkin_insert
  after insert on public.checkins
  for each row execute procedure public.increment_checkin_count();

-- ============================================================
-- XP LOGS
-- ============================================================
create table public.xp_logs (
  id           uuid primary key default gen_random_uuid(),
  dog_id       uuid references public.dogs(id) on delete cascade not null,
  xp_amount    integer not null,
  multiplier   numeric(4,2) not null default 1,
  source       text not null,
  reference_id uuid,
  created_at   timestamptz not null default now()
);

create index idx_xp_logs_dog on public.xp_logs(dog_id);
create index idx_xp_logs_created on public.xp_logs(created_at desc);

-- ============================================================
-- BADGES
-- ============================================================
create table public.badges (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  name        text not null,
  description text not null default '',
  icon        text not null default '🏅',
  category    text not null
    check (category in ('city','country','continent','location','event','streak','ranking','champion')),
  rarity      text not null default 'common'
    check (rarity in ('common','rare','epic','legendary')),
  xp_reward   integer not null default 25,
  created_at  timestamptz not null default now()
);

create table public.dog_badges (
  id         uuid primary key default gen_random_uuid(),
  dog_id     uuid references public.dogs(id) on delete cascade not null,
  badge_id   uuid references public.badges(id) on delete cascade not null,
  earned_at  timestamptz not null default now(),
  unique(dog_id, badge_id)
);

create index idx_dog_badges_dog on public.dog_badges(dog_id);

-- ============================================================
-- COMPETITIONS
-- ============================================================
create table public.competitions (
  id               uuid primary key default gen_random_uuid(),
  title            text not null,
  category         text not null,
  description      text default '',
  start_date       date not null,
  end_date         date not null,
  status           text not null default 'upcoming'
    check (status in ('upcoming','active','ended')),
  prize_xp         integer not null default 200,
  winner_badge_id  uuid references public.badges(id),
  created_at       timestamptz not null default now()
);

create table public.competition_entries (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  dog_id         uuid references public.dogs(id) on delete cascade not null,
  photo_url      text,
  votes          integer not null default 0,
  rank           integer,
  created_at     timestamptz not null default now(),
  unique(competition_id, dog_id)
);

create index idx_comp_entries_competition on public.competition_entries(competition_id);
create index idx_comp_entries_votes on public.competition_entries(votes desc);

-- ============================================================
-- ARENA RESULTS
-- ============================================================
create table public.arena_results (
  id         uuid primary key default gen_random_uuid(),
  arena_type text not null check (arena_type in ('agility','sprint','show')),
  dog_id     uuid references public.dogs(id) on delete cascade not null,
  score      integer not null default 0,
  rank       integer,
  season     text not null default to_char(now(), 'YYYY-MM'),
  created_at timestamptz not null default now(),
  unique(arena_type, dog_id, season)
);

create index idx_arena_type_season on public.arena_results(arena_type, season, score desc);

-- ============================================================
-- SOCIAL POSTS
-- ============================================================
create table public.social_posts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references public.users(id) on delete cascade not null,
  dog_id        uuid references public.dogs(id) on delete set null,
  content       text not null default '',
  image_url     text,
  post_type     text not null default 'regular'
    check (post_type in ('regular','checkin','badge','competition')),
  likes_count   integer not null default 0,
  comments_count integer not null default 0,
  created_at    timestamptz not null default now()
);

create index idx_posts_user on public.social_posts(user_id);
create index idx_posts_created on public.social_posts(created_at desc);

create table public.post_likes (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.social_posts(id) on delete cascade not null,
  user_id    uuid references public.users(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  unique(post_id, user_id)
);

create table public.comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid references public.social_posts(id) on delete cascade not null,
  user_id    uuid references public.users(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz not null default now()
);

create index idx_comments_post on public.comments(post_id);

-- Auto-update likes/comments counts
create or replace function public.update_post_likes_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set likes_count = likes_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set likes_count = greatest(likes_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger on_like_change
  after insert or delete on public.post_likes
  for each row execute procedure public.update_post_likes_count();

create or replace function public.update_post_comments_count()
returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.social_posts set comments_count = comments_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.social_posts set comments_count = greatest(comments_count - 1, 0) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;
create trigger on_comment_change
  after insert or delete on public.comments
  for each row execute procedure public.update_post_comments_count();

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
create table public.subscriptions (
  id                     uuid primary key default gen_random_uuid(),
  user_id                uuid references public.users(id) on delete cascade not null unique,
  stripe_subscription_id text unique not null,
  stripe_customer_id     text not null,
  tier                   text not null check (tier in ('premium','premium_pro')),
  status                 text not null default 'active'
    check (status in ('active','cancelled','past_due','trialing')),
  current_period_end     timestamptz not null,
  cancel_at_period_end   boolean not null default false,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

create index idx_subscriptions_user on public.subscriptions(user_id);
create index idx_subscriptions_stripe on public.subscriptions(stripe_subscription_id);

-- Sync subscription tier to user
create or replace function public.sync_subscription_tier()
returns trigger language plpgsql security definer as $$
begin
  if new.status = 'active' or new.status = 'trialing' then
    update public.users set subscription_tier = new.tier where id = new.user_id;
  else
    update public.users set subscription_tier = 'free' where id = new.user_id;
  end if;
  return new;
end;
$$;
create trigger on_subscription_change
  after insert or update on public.subscriptions
  for each row execute procedure public.sync_subscription_tier();

-- ============================================================
-- BUSINESSES (future-ready)
-- ============================================================
create table public.businesses (
  id           uuid primary key default gen_random_uuid(),
  location_id  uuid references public.locations(id) on delete cascade,
  owner_id     uuid references public.users(id) on delete set null,
  name         text not null,
  type         text not null check (type in ('vet','trainer','grooming','cafe','hotel','park')),
  phone        text,
  website      text,
  email        text,
  description  text,
  is_premium   boolean not null default false,
  is_verified  boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ============================================================
-- MISSIONS
-- ============================================================
create table public.missions (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  description text not null,
  icon        text not null default '🎯',
  type        text not null check (type in ('checkin','event','badge','streak','social')),
  target      integer not null default 1,
  xp_reward   integer not null default 50,
  is_premium  boolean not null default false,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

create table public.dog_missions (
  id          uuid primary key default gen_random_uuid(),
  dog_id      uuid references public.dogs(id) on delete cascade not null,
  mission_id  uuid references public.missions(id) on delete cascade not null,
  progress    integer not null default 0,
  completed   boolean not null default false,
  completed_at timestamptz,
  created_at  timestamptz not null default now(),
  unique(dog_id, mission_id)
);

-- ============================================================
-- VOTE RATE LIMITING (anti-exploit)
-- ============================================================
create table public.competition_votes (
  id             uuid primary key default gen_random_uuid(),
  competition_id uuid references public.competitions(id) on delete cascade not null,
  entry_id       uuid references public.competition_entries(id) on delete cascade not null,
  voter_id       uuid references public.users(id) on delete cascade not null,
  created_at     timestamptz not null default now(),
  unique(competition_id, voter_id)  -- one vote per competition per user
);
