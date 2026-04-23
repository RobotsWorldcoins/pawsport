import supabase from './supabase';
import { XP_REWARDS, STREAK_MULTIPLIERS, PREMIUM_MULTIPLIERS, TIER_NAMES } from '../constants';
import type { Dog, SubscriptionTier } from '../types';

export function computeXPForLevel(level: number): number {
  // Exponential curve: ~18-24 months for normal user to reach 100
  return Math.floor(100 * Math.pow(1.15, level - 1));
}

export function computeTotalXPForLevel(level: number): number {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += computeXPForLevel(i);
  }
  return total;
}

export function getLevelFromXP(xp: number): number {
  let level = 1;
  while (level < 100 && computeTotalXPForLevel(level + 1) <= xp) {
    level++;
  }
  return level;
}

export function getTierFromLevel(level: number): string {
  return TIER_NAMES[Math.min(level, 100)] || 'Puppy';
}

export function getXPMultiplier(
  streakDays: number,
  subscriptionTier: SubscriptionTier
): number {
  let streakMult = 1;
  if (streakDays >= 365) streakMult = STREAK_MULTIPLIERS[365];
  else if (streakDays >= 30) streakMult = STREAK_MULTIPLIERS[30];
  else if (streakDays >= 7) streakMult = STREAK_MULTIPLIERS[7];

  const premiumMult = PREMIUM_MULTIPLIERS[subscriptionTier];
  return streakMult * premiumMult;
}

export async function awardXP(
  dogId: string,
  source: keyof typeof XP_REWARDS,
  referenceId?: string,
  subscriptionTier: SubscriptionTier = 'free',
  streakDays: number = 0
) {
  const baseXP = XP_REWARDS[source] || 0;
  const multiplier = getXPMultiplier(streakDays, subscriptionTier);
  const totalXP = Math.floor(baseXP * multiplier);

  const { error: logError } = await supabase.from('xp_logs').insert({
    dog_id: dogId,
    xp_amount: totalXP,
    multiplier,
    source,
    reference_id: referenceId,
  });
  if (logError) throw logError;

  const { data: dog, error: dogError } = await supabase
    .from('dogs')
    .select('xp, level')
    .eq('id', dogId)
    .maybeSingle();
  if (dogError) throw dogError;
  if (!dog) throw new Error('Dog not found');

  const newXP = (dog.xp || 0) + totalXP;
  const newLevel = getLevelFromXP(newXP);
  const newTier = getTierFromLevel(newLevel);

  const { error: updateError } = await supabase
    .from('dogs')
    .update({ xp: newXP, level: newLevel, tier: newTier })
    .eq('id', dogId);
  if (updateError) throw updateError;

  return { totalXP, multiplier, newXP, newLevel, newTier, leveledUp: newLevel > dog.level };
}

export function getXPProgressForCurrentLevel(xp: number): {
  current: number;
  needed: number;
  percentage: number;
  level: number;
} {
  const level = getLevelFromXP(xp);
  const xpAtCurrentLevel = computeTotalXPForLevel(level);
  const xpForNextLevel = computeXPForLevel(level);
  const current = xp - xpAtCurrentLevel;
  const needed = xpForNextLevel;
  const percentage = Math.min(current / needed, 1);
  return { current, needed, percentage, level };
}
