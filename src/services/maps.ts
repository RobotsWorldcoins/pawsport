import supabase from './supabase';
import { MIN_RATING } from '../constants';
import type { Location } from '../types';

// Places API (New) — v1
const PLACES_NEW_BASE = 'https://places.googleapis.com/v1';

const TYPE_MAP: Record<string, string[]> = {
  dog_park:      ['park'],
  veterinarian:  ['veterinarian'],
  grooming:      ['beauty_salon', 'hair_salon'],
  cafe:          ['cafe', 'coffee_shop'],
  hotel:         ['lodging', 'hotel'],
  trail:         ['park', 'tourist_attraction'],
  beach:         ['beach'],
  trainer:       ['pet_store'],
  pet_store:     ['pet_store'],
};

export async function searchNearbyPlaces(
  lat: number,
  lng: number,
  category: string,
  radius: number = 5000
): Promise<Partial<Location>[]> {
  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY;
  if (!apiKey || apiKey === 'PASTE_GOOGLE_MAPS_KEY_HERE') return [];

  const includedTypes = TYPE_MAP[category] || ['point_of_interest'];

  try {
    const res = await fetch(`${PLACES_NEW_BASE}/places:searchNearby`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.location,places.rating,places.formattedAddress,places.photos,places.regularOpeningHours',
      },
      body: JSON.stringify({
        includedTypes,
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius,
          },
        },
        maxResultCount: 20,
        languageCode: 'pt',
      }),
    });

    const data = await res.json();

    if (data.error) {
      console.warn('Places API (New) error:', data.error.message);
      return [];
    }

    return (data.places || [])
      .filter((place: any) => (place.rating || 0) >= MIN_RATING)
      .map((place: any) => ({
        google_place_id: place.id,
        name: place.displayName?.text || '',
        category,
        lat: place.location?.latitude,
        lng: place.location?.longitude,
        address: place.formattedAddress,
        rating: place.rating,
        photos: place.photos?.slice(0, 1).map(
          (p: any) => `${PLACES_NEW_BASE}/${p.name}/media?maxHeightPx=400&key=${apiKey}`
        ),
        filter_tags: [],
        is_verified: false,
        checkin_count: 0,
      }));
  } catch (e) {
    console.error('Maps API error:', e);
    return [];
  }
}

export async function getLocationsFromDB(
  lat: number,
  lng: number,
  radiusKm: number = 10,
  category?: string
): Promise<Location[]> {
  let query = supabase
    .from('locations')
    .select('*')
    .gte('rating', MIN_RATING);

  if (category) query = query.eq('category', category);

  // Rough bounding box filter
  const latDelta = radiusKm / 111;
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));
  query = query
    .gte('lat', lat - latDelta)
    .lte('lat', lat + latDelta)
    .gte('lng', lng - lngDelta)
    .lte('lng', lng + lngDelta);

  const { data, error } = await query.limit(50);
  if (error) throw error;
  return data || [];
}

export function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
