import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Colors, FontSize, FontWeight } from '../theme';
import { useAppStore } from '../store';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import CreateDogScreen from '../screens/auth/CreateDogScreen';

// Main screens
import HomeScreen from '../screens/home/HomeScreen';
import MapScreen from '../screens/map/MapScreen';
import ArenaScreen from '../screens/arena/ArenaScreen';
import SocialScreen from '../screens/social/SocialScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Detail screens
import LocationDetailScreen from '../screens/map/LocationDetailScreen';
import CheckinScreen from '../screens/map/CheckinScreen';
import BadgeDetailScreen from '../screens/profile/BadgeDetailScreen';
import CompetitionScreen from '../screens/competitions/CompetitionScreen';
import PremiumScreen from '../screens/premium/PremiumScreen';
import PostDetailScreen from '../screens/social/PostDetailScreen';
import ReferralScreen from '../screens/profile/ReferralScreen';

// Legal screens
import TermsOfServiceScreen from '../screens/legal/TermsOfServiceScreen';
import PrivacyPolicyScreen from '../screens/legal/PrivacyPolicyScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: Record<string, string> = {
    Home: '🏠', Map: '🗺️', Arena: '⚔️', Social: '🐾', Profile: '🐶',
  };
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconActive]}>
      <Text style={tabStyles.iconText}>{icons[name]}</Text>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: tabStyles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={80} tint="light" style={StyleSheet.absoluteFill} />
          ) : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
        ),
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: tabStyles.label,
        tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Map" component={MapScreen} />
      <Tab.Screen name="Arena" component={ArenaScreen} />
      <Tab.Screen name="Social" component={SocialScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, activeDog } = useAppStore();

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        ) : !activeDog ? (
          <>
            <Stack.Screen name="CreateDog" component={CreateDogScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="LocationDetail" component={LocationDetailScreen} />
            <Stack.Screen name="Checkin" component={CheckinScreen} />
            <Stack.Screen name="BadgeDetail" component={BadgeDetailScreen} />
            <Stack.Screen name="Competition" component={CompetitionScreen} />
            <Stack.Screen name="Premium" component={PremiumScreen} options={{ animation: 'slide_from_bottom' }} />
            <Stack.Screen name="PostDetail" component={PostDetailScreen} />
            <Stack.Screen name="Referral" component={ReferralScreen} />
            <Stack.Screen name="TermsOfService" component={TermsOfServiceScreen} />
            <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const tabStyles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingBottom: Platform.OS === 'ios' ? 20 : 8,
    elevation: 0,
    backgroundColor: 'transparent',
    borderTopColor: Colors.border,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.semibold,
    marginTop: -2,
  },
  iconWrap: {
    width: 40, height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  iconActive: { backgroundColor: `${Colors.primary}18` },
  iconText: { fontSize: 20 },
});
