-- ============================================================
-- PAWSPORT Seed Data
-- ============================================================

-- BADGES
insert into public.badges (slug, name, description, icon, category, rarity, xp_reward) values
  -- City badges
  ('lisbon_explorer', 'Lisbon Explorer', 'Visited 5 places in Lisbon', '🏛️', 'city', 'common', 50),
  ('lisbon_master', 'Lisbon Master', 'Visited 20 places in Lisbon', '🦁', 'city', 'rare', 150),
  ('cascais_visitor', 'Cascais Visitor', 'Explored Cascais', '🌊', 'city', 'common', 50),
  ('sintra_adventurer', 'Sintra Adventurer', 'Explored the magical hills of Sintra', '🏰', 'city', 'rare', 100),
  ('porto_explorer', 'Porto Explorer', 'Discovered Porto', '🍷', 'city', 'common', 50),

  -- Location badges
  ('first_park', 'Park Lover', 'First dog park check-in', '🌳', 'location', 'common', 25),
  ('beach_buddy', 'Beach Buddy', 'First beach check-in', '🏖️', 'location', 'common', 25),
  ('trail_blazer', 'Trail Blazer', 'First trail check-in', '🥾', 'location', 'rare', 50),
  ('health_first', 'Health First', 'First vet visit', '🏥', 'location', 'common', 30),
  ('top_trainee', 'Top Trainee', 'First trainer session', '🎓', 'location', 'rare', 75),
  ('well_groomed', 'Well Groomed', 'First grooming session', '✨', 'location', 'common', 25),
  ('cafe_regular', 'Café Regular', 'First dog-friendly café', '☕', 'location', 'common', 25),

  -- Streak badges
  ('week_warrior', '7-Day Warrior', 'Checked in 7 days in a row', '🔥', 'streak', 'common', 75),
  ('monthly_champion', 'Monthly Champion', 'Checked in 30 days in a row', '🏆', 'streak', 'rare', 250),
  ('yearly_legend', 'Yearly Legend', 'Checked in 365 days in a row', '👑', 'streak', 'legendary', 1000),

  -- Ranking badges
  ('top_10', 'Top 10', 'Reached top 10 in a competition', '🥈', 'ranking', 'rare', 100),
  ('top_3', 'Podium Dog', 'Reached top 3 in a competition', '🥇', 'ranking', 'epic', 300),
  ('champion', 'Champion', 'Won a monthly competition', '🏆', 'champion', 'legendary', 500),

  -- Arena badges
  ('arena_debut', 'Arena Debut', 'First arena entry', '⚔️', 'event', 'common', 25),
  ('agility_master', 'Agility Master', 'Won the Agility Arena', '⚡', 'champion', 'epic', 400),
  ('sprint_king', 'Sprint King', 'Won the Sprint Arena', '💨', 'champion', 'epic', 400),
  ('show_star', 'Show Star', 'Won the Show Arena', '🌟', 'champion', 'epic', 400),

  -- Country / Continent
  ('portugal_pup', 'Portugal Pup', 'Visited places in 3+ Portuguese cities', '🇵🇹', 'country', 'rare', 200),
  ('europe_explorer', 'Europe Explorer', 'Visited places in 3+ European countries', '🌍', 'continent', 'legendary', 500),

  -- Event badges
  ('event_goer', 'Event Goer', 'Attended first dog event', '🎉', 'event', 'common', 50),
  ('event_enthusiast', 'Event Enthusiast', 'Attended 5 dog events', '🎊', 'event', 'rare', 150);

-- MISSIONS
insert into public.missions (title, description, icon, type, target, xp_reward, is_premium) values
  ('First Steps', 'Check in at your first location', '🐾', 'checkin', 1, 50, false),
  ('Explorer', 'Check in at 5 different locations', '🗺️', 'checkin', 5, 100, false),
  ('Adventurer', 'Check in at 10 different locations', '🧭', 'checkin', 10, 200, false),
  ('Streak Starter', 'Check in 3 days in a row', '🔥', 'streak', 3, 75, false),
  ('Week Warrior', 'Check in 7 days in a row', '⚡', 'streak', 7, 150, false),
  ('Social Butterfly', 'Make your first social post', '📱', 'social', 1, 50, false),
  ('Event Goer', 'Attend your first dog event', '🎉', 'event', 1, 100, false),
  ('Badge Hunter', 'Earn 3 badges', '🏅', 'badge', 3, 100, false),
  ('Park Hopper', 'Visit 3 different dog parks', '🌳', 'checkin', 3, 75, false),
  ('Beach Dog', 'Visit 2 beaches', '🏖️', 'checkin', 2, 75, false),
  ('Health Champion', 'Visit a vet twice', '🏥', 'checkin', 2, 100, true),
  ('Training Pro', 'Attend 3 training sessions', '🎓', 'checkin', 3, 200, true),
  ('Top Explorer', 'Check in at 25 different locations', '🏆', 'checkin', 25, 500, true);

-- COMPETITIONS (current month)
insert into public.competitions (title, category, description, start_date, end_date, status, prize_xp) values
  (
    'Cutest Dog of the Month',
    'cutest',
    'Vote for the most adorable dog in Pawsport! Share your best cute photo.',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    'active',
    500
  ),
  (
    'Top Explorer',
    'explorer',
    'Who explored the most places this month? Rankings based on check-ins.',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    'active',
    300
  ),
  (
    'Most Stylish Dog',
    'stylish',
    'Show off your dog''s best look! Community votes decide the winner.',
    date_trunc('month', current_date)::date,
    (date_trunc('month', current_date) + interval '1 month - 1 day')::date,
    'active',
    400
  );

-- SAMPLE LOCATIONS (Lisbon area)
insert into public.locations (name, category, lat, lng, address, city, country, rating, filter_tags, is_verified, checkin_count) values
  ('Parque Eduardo VII', 'dog_park', 38.7264, -9.1527, 'Parque Eduardo VII, Lisboa', 'lisbon', 'PT', 4.5, ARRAY['fenced','shaded','water available','verified'], true, 0),
  ('Parque das Nações Dog Park', 'dog_park', 38.7668, -9.0937, 'Parque das Nações, Lisboa', 'lisbon', 'PT', 4.3, ARRAY['off-leash','water available','parking','verified'], true, 0),
  ('Praia de Carcavelos', 'beach', 38.6784, -9.3402, 'Carcavelos, Cascais', 'cascais', 'PT', 4.6, ARRAY['off-leash','scenic','large-dog friendly','verified'], true, 0),
  ('Parque Natural de Sintra-Cascais', 'trail', 38.7867, -9.4267, 'Sintra', 'sintra', 'PT', 4.7, ARRAY['scenic','off-leash','shaded','safe','verified'], true, 0),
  ('Clínica Veterinária de Lisboa', 'veterinarian', 38.7223, -9.1393, 'Avenida da Liberdade, Lisboa', 'lisbon', 'PT', 4.4, ARRAY['verified','parking'], true, 0),
  ('Dog Café Lisboa', 'cafe', 38.7139, -9.1394, 'Chiado, Lisboa', 'lisbon', 'PT', 4.5, ARRAY['dog-friendly','indoor','verified'], true, 0),
  ('Praia de Miramar', 'beach', 41.0622, -8.6543, 'Vila Nova de Gaia, Porto', 'porto', 'PT', 4.2, ARRAY['scenic','off-leash'], false, 0),
  ('Parque da Cidade do Porto', 'dog_park', 41.1721, -8.6783, 'Porto', 'porto', 'PT', 4.6, ARRAY['off-leash','shaded','water available','verified'], true, 0);
