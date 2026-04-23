-- ============================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.dogs enable row level security;
alter table public.dog_stats enable row level security;
alter table public.locations enable row level security;
alter table public.checkins enable row level security;
alter table public.xp_logs enable row level security;
alter table public.badges enable row level security;
alter table public.dog_badges enable row level security;
alter table public.competitions enable row level security;
alter table public.competition_entries enable row level security;
alter table public.competition_votes enable row level security;
alter table public.arena_results enable row level security;
alter table public.social_posts enable row level security;
alter table public.post_likes enable row level security;
alter table public.comments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.businesses enable row level security;
alter table public.missions enable row level security;
alter table public.dog_missions enable row level security;

-- Helper: is current user admin?
create or replace function public.is_admin()
returns boolean language sql stable security definer as $$
  select coalesce((select is_admin from public.users where id = auth.uid()), false);
$$;

-- ============================================================
-- USERS policies
-- ============================================================
create policy "Users can read own profile"
  on public.users for select using (id = auth.uid() or is_admin());

create policy "Users can update own profile"
  on public.users for update using (id = auth.uid());

create policy "Public can read basic user info"
  on public.users for select using (true);

-- ============================================================
-- DOGS policies
-- ============================================================
create policy "Anyone can read dogs"
  on public.dogs for select using (true);

create policy "Owner can create dog"
  on public.dogs for insert with check (owner_id = auth.uid());

create policy "Owner can update dog"
  on public.dogs for update using (owner_id = auth.uid());

create policy "Owner can delete dog"
  on public.dogs for delete using (owner_id = auth.uid() or is_admin());

-- ============================================================
-- DOG STATS policies
-- ============================================================
create policy "Anyone can read dog stats"
  on public.dog_stats for select using (true);

create policy "Owner can manage dog stats"
  on public.dog_stats for all using (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
    or is_admin()
  );

-- ============================================================
-- LOCATIONS policies
-- ============================================================
create policy "Anyone can read locations"
  on public.locations for select using (true);

create policy "Authenticated can suggest locations"
  on public.locations for insert with check (auth.uid() is not null);

create policy "Admin can manage locations"
  on public.locations for all using (is_admin());

-- ============================================================
-- CHECKINS policies
-- ============================================================
create policy "Anyone can read checkins"
  on public.checkins for select using (true);

create policy "Owner can create checkin"
  on public.checkins for insert with check (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- ============================================================
-- XP LOGS policies
-- ============================================================
create policy "Owner can read own XP logs"
  on public.xp_logs for select using (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
    or is_admin()
  );

create policy "System can insert XP logs"
  on public.xp_logs for insert with check (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- ============================================================
-- BADGES policies
-- ============================================================
create policy "Anyone can read badges"
  on public.badges for select using (true);

create policy "Admin can manage badges"
  on public.badges for all using (is_admin());

create policy "Anyone can read dog badges"
  on public.dog_badges for select using (true);

create policy "System can award badges"
  on public.dog_badges for insert with check (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- ============================================================
-- COMPETITIONS policies
-- ============================================================
create policy "Anyone can read competitions"
  on public.competitions for select using (true);

create policy "Admin can manage competitions"
  on public.competitions for all using (is_admin());

create policy "Anyone can read competition entries"
  on public.competition_entries for select using (true);

create policy "Owner can enter competition"
  on public.competition_entries for insert with check (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- One vote per user per competition
create policy "Authenticated can vote once"
  on public.competition_votes for insert with check (
    auth.uid() is not null
    and voter_id = auth.uid()
    and not exists (
      select 1 from public.competition_votes
      where competition_id = competition_votes.competition_id
        and voter_id = auth.uid()
    )
  );

create policy "Anyone can read votes"
  on public.competition_votes for select using (true);

-- ============================================================
-- ARENA RESULTS policies
-- ============================================================
create policy "Anyone can read arena results"
  on public.arena_results for select using (true);

create policy "Owner can submit arena result"
  on public.arena_results for insert with check (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- ============================================================
-- SOCIAL POSTS policies
-- ============================================================
create policy "Anyone can read posts"
  on public.social_posts for select using (true);

create policy "Authenticated can create posts"
  on public.social_posts for insert with check (
    auth.uid() is not null and user_id = auth.uid()
  );

create policy "Owner can update/delete posts"
  on public.social_posts for update using (user_id = auth.uid() or is_admin());

create policy "Owner can delete posts"
  on public.social_posts for delete using (user_id = auth.uid() or is_admin());

create policy "Anyone can read likes"
  on public.post_likes for select using (true);

create policy "Authenticated can like"
  on public.post_likes for insert with check (
    auth.uid() is not null and user_id = auth.uid()
  );

create policy "User can unlike"
  on public.post_likes for delete using (user_id = auth.uid());

create policy "Anyone can read comments"
  on public.comments for select using (true);

create policy "Authenticated can comment"
  on public.comments for insert with check (
    auth.uid() is not null and user_id = auth.uid()
  );

create policy "Owner can delete comment"
  on public.comments for delete using (user_id = auth.uid() or is_admin());

-- ============================================================
-- SUBSCRIPTIONS policies
-- ============================================================
create policy "User can read own subscription"
  on public.subscriptions for select using (user_id = auth.uid() or is_admin());

-- Only service role (webhook) can write subscriptions
create policy "Service role manages subscriptions"
  on public.subscriptions for all using (is_admin());

-- ============================================================
-- MISSIONS policies
-- ============================================================
create policy "Anyone can read missions"
  on public.missions for select using (true);

create policy "Anyone can read dog missions"
  on public.dog_missions for select using (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
    or is_admin()
  );

create policy "Owner can update dog missions"
  on public.dog_missions for all using (
    dog_id in (select id from public.dogs where owner_id = auth.uid())
  );

-- ============================================================
-- BUSINESSES policies
-- ============================================================
create policy "Anyone can read businesses"
  on public.businesses for select using (true);

create policy "Admin can manage businesses"
  on public.businesses for all using (is_admin());
