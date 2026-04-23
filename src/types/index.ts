export type SubscriptionTier = 'free' | 'premium' | 'premium_pro';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  subscription_tier: SubscriptionTier;
  is_admin: boolean;
  created_at: string;
}

export interface Dog {
  id: string;
  owner_id: string;
  name: string;
  breed: string;
  age_months: number;
  weight_kg: number;
  city: string;
  personality_tags: string[];
  avatar_url?: string;
  xp: number;
  level: number;
  tier: string;
  streak_days: number;
  last_checkin?: string;
  created_at: string;
}

export interface DogStats {
  id: string;
  dog_id: string;
  hp: number;
  power: number;
  defense: number;
  agility: number;
  speed: number;
  instinct: number;
  focus: number;
  charm: number;
  stat_points_available: number;
  updated_at: string;
}

export interface Location {
  id: string;
  google_place_id?: string;
  name: string;
  category: string;
  lat: number;
  lng: number;
  address: string;
  city: string;
  country: string;
  rating?: number;
  photos?: string[];
  filter_tags: string[];
  is_verified: boolean;
  checkin_count: number;
  created_at: string;
}

export interface Checkin {
  id: string;
  dog_id: string;
  location_id: string;
  xp_earned: number;
  photo_url?: string;
  note?: string;
  created_at: string;
  location?: Location;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: 'city' | 'country' | 'continent' | 'location' | 'event' | 'streak' | 'ranking' | 'champion';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  xp_reward: number;
}

export interface DogBadge {
  id: string;
  dog_id: string;
  badge_id: string;
  earned_at: string;
  badge?: Badge;
}

export interface Competition {
  id: string;
  title: string;
  category: string;
  description: string;
  start_date: string;
  end_date: string;
  status: 'upcoming' | 'active' | 'ended';
  prize_xp: number;
  winner_badge_id?: string;
}

export interface CompetitionEntry {
  id: string;
  competition_id: string;
  dog_id: string;
  photo_url?: string;
  votes: number;
  rank?: number;
  created_at: string;
  dog?: Dog;
}

export interface ArenaResult {
  id: string;
  arena_type: 'agility' | 'sprint' | 'show';
  dog_id: string;
  score: number;
  rank: number;
  season: string;
  created_at: string;
  dog?: Dog;
}

export interface SocialPost {
  id: string;
  user_id: string;
  dog_id: string;
  content: string;
  image_url?: string;
  post_type: 'regular' | 'checkin' | 'badge' | 'competition';
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: User;
  dog?: Dog;
  liked_by_me?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: User;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string;
  tier: SubscriptionTier;
  status: 'active' | 'cancelled' | 'past_due';
  current_period_end: string;
  created_at: string;
}

export interface XPLog {
  id: string;
  dog_id: string;
  xp_amount: number;
  multiplier: number;
  source: string;
  reference_id?: string;
  created_at: string;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: 'checkin' | 'event' | 'badge' | 'streak' | 'social';
  target: number;
  xp_reward: number;
  is_premium: boolean;
}
