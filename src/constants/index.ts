export const APP_CONFIG = {
  name: 'Pawsport',
  version: '1.0.0',
  supportEmail: 'support@pawsport.app',
  website: 'https://pawsport.app',
};

export const CITIES = {
  lisbon: { name: 'Lisbon', lat: 38.7169, lng: -9.1399, country: 'PT' },
  cascais: { name: 'Cascais', lat: 38.6979, lng: -9.4215, country: 'PT' },
  sintra: { name: 'Sintra', lat: 38.7978, lng: -9.3896, country: 'PT' },
  porto: { name: 'Porto', lat: 41.1579, lng: -8.6291, country: 'PT' },
};

export const MAP_CATEGORIES = [
  { id: 'dog_park', label: 'Dog Parks', icon: '🌳', googleType: 'park' },
  { id: 'trail', label: 'Trails', icon: '🥾', googleType: 'natural_feature' },
  { id: 'beach', label: 'Beaches', icon: '🏖️', googleType: 'natural_feature' },
  { id: 'veterinarian', label: 'Veterinarians', icon: '🏥', googleType: 'veterinary_care' },
  { id: 'trainer', label: 'Trainers', icon: '🎓', googleType: 'pet_store' },
  { id: 'grooming', label: 'Grooming', icon: '✂️', googleType: 'beauty_salon' },
  { id: 'cafe', label: 'Dog Cafes', icon: '☕', googleType: 'cafe' },
  { id: 'hotel', label: 'Dog Hotels', icon: '🏨', googleType: 'lodging' },
  { id: 'event', label: 'Events', icon: '🎉', googleType: 'event' },
];

export const FILTER_TAGS = [
  'fenced', 'off-leash', 'shaded', 'water available', 'small-dog friendly',
  'large-dog friendly', 'parking', 'night lighting', 'scenic', 'safe',
  'clean', 'low crowd', 'indoor', 'outdoor', 'puppy-friendly', 'senior-friendly', 'verified',
];

export const PERSONALITY_TAGS = [
  'playful', 'energetic', 'calm', 'friendly', 'curious', 'goofy',
  'brave', 'lazy', 'social', 'shy', 'cuddly', 'clever', 'explorer',
  'water-lover', 'foodie', 'elegant', 'chaotic',
];

export const XP_REWARDS = {
  daily_checkin: 5,
  park: 10,
  trail: 10,
  beach: 10,
  veterinarian: 20,
  trainer: 30,
  event: 50,
  badge_unlock: 25,
  competition_entry: 15,
  competition_win: 100,
  arena_win: 75,
  streak_7: 50,
  streak_30: 200,
  streak_365: 1000,
};

export const STREAK_MULTIPLIERS = {
  7: 1.5,
  30: 2,
  365: 3,
};

export const PREMIUM_MULTIPLIERS = {
  free: 1,
  premium: 2,
  premium_pro: 3,
};

export const TIER_NAMES = [
  '', 'Puppy', 'Puppy', 'Puppy', 'Puppy', 'Puppy',
  'Puppy', 'Puppy', 'Puppy', 'Puppy', 'Puppy',
  'Junior', 'Junior', 'Junior', 'Junior', 'Junior',
  'Junior', 'Junior', 'Junior', 'Junior', 'Junior',
  'Explorer', 'Explorer', 'Explorer', 'Explorer', 'Explorer',
  'Explorer', 'Explorer', 'Explorer', 'Explorer', 'Explorer',
  'Adventurer', 'Adventurer', 'Adventurer', 'Adventurer', 'Adventurer',
  'Adventurer', 'Adventurer', 'Adventurer', 'Adventurer', 'Adventurer',
  'Tracker', 'Tracker', 'Tracker', 'Tracker', 'Tracker',
  'Tracker', 'Tracker', 'Tracker', 'Tracker', 'Tracker',
  'Challenger', 'Challenger', 'Challenger', 'Challenger', 'Challenger',
  'Challenger', 'Challenger', 'Challenger', 'Challenger', 'Challenger',
  'Champion', 'Champion', 'Champion', 'Champion', 'Champion',
  'Champion', 'Champion', 'Champion', 'Champion', 'Champion',
  'Elite', 'Elite', 'Elite', 'Elite', 'Elite',
  'Elite', 'Elite', 'Elite', 'Elite', 'Elite',
  'Legend', 'Legend', 'Legend', 'Legend', 'Legend',
  'Legend', 'Legend', 'Legend', 'Legend', 'Legend',
  'Mythic Dog', 'Mythic Dog', 'Mythic Dog', 'Mythic Dog', 'Mythic Dog',
  'Mythic Dog', 'Mythic Dog', 'Mythic Dog', 'Mythic Dog', 'Mythic Dog',
];

export const ARENA_STATS = {
  hp: { label: 'HP', icon: '❤️', color: '#EF4444' },
  power: { label: 'Power', icon: '💥', color: '#F59E0B' },
  defense: { label: 'Defense', icon: '🛡️', color: '#3B82F6' },
  agility: { label: 'Agility', icon: '⚡', color: '#10B981' },
  speed: { label: 'Speed', icon: '💨', color: '#06B6D4' },
  instinct: { label: 'Instinct', icon: '🔮', color: '#8B5CF6' },
  focus: { label: 'Focus', icon: '🎯', color: '#EC4899' },
  charm: { label: 'Charm', icon: '✨', color: '#FFD700' },
};

export const MIN_RATING = 3.5;
