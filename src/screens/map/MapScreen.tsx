import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Dimensions, ActivityIndicator, Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAppStore } from '../../store';
import { searchNearbyPlaces, getLocationsFromDB, distanceKm } from '../../services/maps';
import supabase from '../../services/supabase';
import { MAP_CATEGORIES, CITIES } from '../../constants';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius, Shadow } from '../../theme';
import type { Location as LocationType } from '../../types';

const { width, height } = Dimensions.get('window');
const ASPECT = width / (height * 0.55);

export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { activeDog } = useAppStore();
  const mapRef = useRef<MapView>(null);

  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('dog_park');
  const [places, setPlaces] = useState<LocationType[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<LocationType | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTags, setActiveTags] = useState<string[]>([]);

  const defaultCity = CITIES[activeDog?.city as keyof typeof CITIES] || CITIES.lisbon;
  const [region, setRegion] = useState({
    latitude: defaultCity.lat,
    longitude: defaultCity.lng,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05 / ASPECT,
  });

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        setUserLocation(coords);
        setRegion((r) => ({ ...r, ...coords }));
      }
    })();
  }, []);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    const lat = userLocation?.latitude || defaultCity.lat;
    const lng = userLocation?.longitude || defaultCity.lng;
    try {
      // Load from DB first
      const dbPlaces = await getLocationsFromDB(lat, lng, 15, selectedCategory);

      // Also fetch live from Google Places and upsert new ones
      const googlePlaces = await searchNearbyPlaces(lat, lng, selectedCategory, 8000);
      for (const gp of googlePlaces) {
        if (!gp.google_place_id) continue;
        // Upsert: insert if not exists
        await supabase
          .from('locations')
          .upsert({ ...gp, city: activeDog?.city || 'lisbon' }, { onConflict: 'google_place_id', ignoreDuplicates: true });
      }

      const allPlaces = await getLocationsFromDB(lat, lng, 15, selectedCategory);
      const filtered = activeTags.length > 0
        ? allPlaces.filter((p) => activeTags.every((t) => p.filter_tags?.includes(t)))
        : allPlaces;

      setPlaces(filtered.sort((a, b) => distanceKm(lat, lng, a.lat, a.lng) - distanceKm(lat, lng, b.lat, b.lng)));
    } catch (e) {
      console.error('Load places error:', e);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, userLocation, activeTags, activeDog?.city]);

  useEffect(() => { loadPlaces(); }, [loadPlaces]);

  const centerOnUser = () => {
    if (userLocation) {
      mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: 0.02, longitudeDelta: 0.02 / ASPECT }, 600);
    }
  };

  const markerEmoji = (cat: string) => {
    const m = MAP_CATEGORIES.find((c) => c.id === cat);
    return m?.icon || '📍';
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {places.map((place) => (
          <Marker
            key={place.id}
            coordinate={{ latitude: place.lat, longitude: place.lng }}
            onPress={() => setSelectedPlace(place)}
          >
            <View style={[
              styles.markerWrap,
              selectedPlace?.id === place.id && styles.markerSelected,
            ]}>
              <Text style={styles.markerEmoji}>{markerEmoji(place.category)}</Text>
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Top Controls */}
      <View style={[styles.topControls, { top: insets.top + 8 }]}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <Text style={styles.searchPlaceholder}>Search places...</Text>
        </View>
        <TouchableOpacity style={styles.locationBtn} onPress={centerOnUser}>
          <Text style={styles.locationBtnText}>◎</Text>
        </TouchableOpacity>
      </View>

      {/* Category Tabs */}
      <View style={[styles.categoryContainer, { top: insets.top + 64 }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {MAP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.categoryTab, selectedCategory === cat.id && styles.categoryTabActive]}
              onPress={() => setSelectedCategory(cat.id)}
            >
              <Text style={styles.categoryEmoji}>{cat.icon}</Text>
              <Text style={[styles.categoryLabel, selectedCategory === cat.id && styles.categoryLabelActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator color={Colors.primary} size="small" />
        </View>
      )}

      {/* Bottom Sheet: Place List / Detail */}
      <View style={styles.bottomSheet}>
        {selectedPlace ? (
          <PlaceDetail
            place={selectedPlace}
            onClose={() => setSelectedPlace(null)}
            onCheckin={() => navigation.navigate('Checkin', { location: selectedPlace })}
            onDetails={() => navigation.navigate('LocationDetail', { location: selectedPlace })}
            userLat={userLocation?.latitude}
            userLng={userLocation?.longitude}
          />
        ) : (
          <PlaceList
            places={places}
            loading={loading}
            onSelect={setSelectedPlace}
            userLat={userLocation?.latitude}
            userLng={userLocation?.longitude}
          />
        )}
      </View>
    </View>
  );
}

function PlaceList({ places, loading, onSelect, userLat, userLng }: any) {
  if (loading && places.length === 0) {
    return (
      <View style={listStyles.empty}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={listStyles.emptyText}>Finding places...</Text>
      </View>
    );
  }
  return (
    <ScrollView style={listStyles.list} showsVerticalScrollIndicator={false}>
      <Text style={listStyles.count}>{places.length} places nearby</Text>
      {places.map((place: LocationType) => {
        const dist = userLat && userLng ? distanceKm(userLat, userLng, place.lat, place.lng) : null;
        return (
          <TouchableOpacity key={place.id} style={listStyles.item} onPress={() => onSelect(place)}>
            <Text style={listStyles.itemEmoji}>{getCategoryEmoji(place.category)}</Text>
            <View style={listStyles.itemInfo}>
              <Text style={listStyles.itemName} numberOfLines={1}>{place.name}</Text>
              <Text style={listStyles.itemAddress} numberOfLines={1}>{place.address}</Text>
              <View style={listStyles.itemMeta}>
                {place.rating && <Text style={listStyles.itemRating}>⭐ {place.rating}</Text>}
                {dist !== null && <Text style={listStyles.itemDist}>{dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</Text>}
                {place.is_verified && <Text style={listStyles.verified}>✓ Verified</Text>}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function PlaceDetail({ place, onClose, onCheckin, onDetails, userLat, userLng }: any) {
  const dist = userLat && userLng ? distanceKm(userLat, userLng, place.lat, place.lng) : null;
  return (
    <View style={detailStyles.container}>
      <TouchableOpacity style={detailStyles.closeBtn} onPress={onClose}>
        <Text style={detailStyles.closeText}>✕</Text>
      </TouchableOpacity>
      <Text style={detailStyles.emoji}>{getCategoryEmoji(place.category)}</Text>
      <Text style={detailStyles.name}>{place.name}</Text>
      <Text style={detailStyles.address}>{place.address}</Text>
      <View style={detailStyles.metaRow}>
        {place.rating && <View style={detailStyles.chip}><Text style={detailStyles.chipText}>⭐ {place.rating}</Text></View>}
        {dist !== null && <View style={detailStyles.chip}><Text style={detailStyles.chipText}>📍 {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}</Text></View>}
        <View style={detailStyles.chip}><Text style={detailStyles.chipText}>🐾 {place.checkin_count} check-ins</Text></View>
      </View>
      {place.filter_tags?.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={detailStyles.tagsScroll}>
          {place.filter_tags.map((tag: string) => (
            <View key={tag} style={detailStyles.tagChip}>
              <Text style={detailStyles.tagText}>{tag}</Text>
            </View>
          ))}
        </ScrollView>
      )}
      <View style={detailStyles.btnRow}>
        <TouchableOpacity style={detailStyles.checkinBtn} onPress={onCheckin}>
          <Text style={detailStyles.checkinBtnText}>🐾 Check In Here</Text>
        </TouchableOpacity>
        <TouchableOpacity style={detailStyles.detailBtn} onPress={onDetails}>
          <Text style={detailStyles.detailBtnText}>Details →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getCategoryEmoji(cat: string) {
  const map: Record<string, string> = {
    dog_park: '🌳', beach: '🏖️', trail: '🥾',
    veterinarian: '🏥', trainer: '🎓', grooming: '✂️',
    cafe: '☕', hotel: '🏨', event: '🎉',
  };
  return map[cat] || '📍';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width, height: height * 0.55 },
  topControls: {
    position: 'absolute', left: Spacing.lg, right: Spacing.lg,
    flexDirection: 'row', gap: 8, zIndex: 10,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg, height: 44, ...Shadow.md,
  },
  searchIcon: { fontSize: 16 },
  searchPlaceholder: { fontSize: FontSize.md, color: Colors.textMuted },
  locationBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    ...Shadow.md,
  },
  locationBtnText: { fontSize: 22 },
  categoryContainer: {
    position: 'absolute', left: 0, right: 0, zIndex: 9,
  },
  categoryScroll: { paddingHorizontal: Spacing.lg, gap: 8 },
  categoryTab: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border, ...Shadow.sm,
  },
  categoryTabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  categoryEmoji: { fontSize: 14 },
  categoryLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  categoryLabelActive: { color: '#fff' },
  markerWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: Colors.primary, ...Shadow.md,
  },
  markerSelected: { backgroundColor: Colors.primary, transform: [{ scale: 1.2 }] },
  markerEmoji: { fontSize: 20 },
  loadingOverlay: {
    position: 'absolute', top: '30%', alignSelf: 'center',
    backgroundColor: Colors.surface, padding: Spacing.md, borderRadius: BorderRadius.md, ...Shadow.md,
  },
  bottomSheet: {
    flex: 1, backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xxl, borderTopRightRadius: BorderRadius.xxl,
    ...Shadow.lg,
  },
});

const listStyles = StyleSheet.create({
  list: { flex: 1, padding: Spacing.lg },
  count: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.md, fontWeight: FontWeight.medium },
  item: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'center',
    paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight,
  },
  itemEmoji: { fontSize: 28, width: 40, textAlign: 'center' },
  itemInfo: { flex: 1 },
  itemName: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  itemAddress: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  itemMeta: { flexDirection: 'row', gap: 8, marginTop: 4 },
  itemRating: { fontSize: FontSize.xs, color: Colors.textSecondary },
  itemDist: { fontSize: FontSize.xs, color: Colors.textSecondary },
  verified: { fontSize: FontSize.xs, color: Colors.accent, fontWeight: FontWeight.semibold },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary },
});

const detailStyles = StyleSheet.create({
  container: { flex: 1, padding: Spacing.xl, gap: Spacing.sm },
  closeBtn: { alignSelf: 'flex-end', padding: Spacing.sm },
  closeText: { fontSize: FontSize.lg, color: Colors.textSecondary },
  emoji: { fontSize: 48, textAlign: 'center' },
  name: { fontSize: FontSize.xxl, fontWeight: FontWeight.black, color: Colors.text, textAlign: 'center' },
  address: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: Colors.surfaceAlt, borderRadius: BorderRadius.full,
  },
  chipText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  tagsScroll: { marginTop: Spacing.sm },
  tagChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: `${Colors.primary}15`, borderRadius: BorderRadius.full, marginRight: 6,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.medium },
  btnRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.md },
  checkinBtn: {
    flex: 1, backgroundColor: Colors.primary, borderRadius: BorderRadius.lg,
    padding: Spacing.lg, alignItems: 'center', ...Shadow.colored(Colors.primary),
  },
  checkinBtnText: { color: '#fff', fontWeight: FontWeight.bold, fontSize: FontSize.md },
  detailBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg, borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  detailBtnText: { color: Colors.text, fontWeight: FontWeight.medium, fontSize: FontSize.md },
});
