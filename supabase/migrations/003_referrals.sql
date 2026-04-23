-- ============================================================
-- Migration 003: Referral System
-- ============================================================

CREATE TABLE IF NOT EXISTS referrals (
  id               uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_code    text NOT NULL,
  referrer_user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  referred_user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  referred_dog_id  uuid REFERENCES dogs(id)  ON DELETE SET NULL,
  created_at       timestamptz DEFAULT now() NOT NULL,

  -- One referral per invited user
  CONSTRAINT referrals_referred_user_unique UNIQUE (referred_user_id)
);

-- Index for fast lookups by referrer code (leaderboard, stats)
CREATE INDEX IF NOT EXISTS referrals_referrer_code_idx ON referrals (referrer_code);

-- Index for fast self-check ("have I already been referred?")
CREATE INDEX IF NOT EXISTS referrals_referred_user_idx ON referrals (referred_user_id);

-- ── Row Level Security ───────────────────────────────────────
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- Anyone can read referral rows (needed for code validation)
CREATE POLICY "referrals_read_all"
  ON referrals FOR SELECT
  USING (true);

-- Only the invited user can insert their own referral row
CREATE POLICY "referrals_insert_own"
  ON referrals FOR INSERT
  WITH CHECK (auth.uid() = referred_user_id);

-- No updates or deletes allowed (referrals are permanent records)
