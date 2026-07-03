/**
 * Bottom Tab Navigator Helper Functions
 * Tab icons and labels configuration
 */

import React from 'react';
import { Text } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

/**
 * Get tab label based on route name
 */
export const getTabLabel = (routeName) => {
  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'BrowseTab':
      return 'Browse';
    case 'MyClassesTab':
      return 'My Classes';
    case 'ProfileTab':
      return 'Profile';
    default:
      return '';
  }
};

/**
 * Get tab icon based on route name
 */
export const getTabIcon = (routeName, focused, tintColor) => {
  const iconSize = 24;
  const iconColor = focused ? '#667eea' : '#999';

  switch (routeName) {
    case 'HomeTab':
      return (
        <MaterialCommunityIcons
          name={focused ? 'home' : 'home-outline'}
          size={iconSize}
          color={iconColor}
        />
      );
    case 'BrowseTab':
      return (
        <MaterialCommunityIcons
          name={focused ? 'magnify' : 'magnify'}
          size={iconSize}
          color={iconColor}
        />
      );
    case 'MyClassesTab':
      return (
        <MaterialCommunityIcons
          name={focused ? 'bookmark' : 'bookmark-outline'}
          size={iconSize}
          color={iconColor}
        />
      );
    case 'ProfileTab':
      return (
        <MaterialCommunityIcons
          name={focused ? 'account' : 'account-outline'}
          size={iconSize}
          color={iconColor}
        />
      );
    default:
      return null;
  }
};

/**
 * Tab badge component for unread counts
 */
export const TabBadge = ({ count, style }) => {
  if (!count || count === 0) return null;

  return (
    <View
      style={[
        {
          position: 'absolute',
          right: -8,
          top: -3,
          backgroundColor: '#ef4444',
          borderRadius: 10,
          width: 20,
          height: 20,
          justifyContent: 'center',
          alignItems: 'center',
        },
        style,
      ]}
    >
      <Text
        style={{
          color: '#fff',
          fontSize: 10,
          fontWeight: '700',
        }}
      >
        {count > 99 ? '99+' : count}
      </Text>
    </View>
  );
};

/**
 * Tab bar options configuration
 */
export const tabBarOptions = {
  tabBarActiveTintColor: '#667eea',
  tabBarInactiveTintColor: '#999',
  tabBarShowLabel: true,
  tabBarLabelStyle: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: -5,
  },
  tabBarStyle: {
    backgroundColor: '#fff',
    borderTopColor: '#f0f0f0',
    borderTopWidth: 1,
    paddingBottom: 5,
    height: 60,
    paddingTop: 5,
  },
  headerShown: false,
};

/**
 * Screen options for stack navigators
 */
export const stackScreenOptions = {
  headerTintColor: '#667eea',
  headerTitleStyle: {
    fontWeight: '600',
    fontSize: 16,
  },
  headerBackTitleVisible: true,
  cardStyleInterpolator: ({ current, layouts }) => {
    return {
      cardStyle: {
        opacity: current.progress,
      },
    };
  },
};

/**
 * Navigation linking configuration for deep links
 */
export const navigationLinking = {
  prefixes: ['edutalk://', 'https://edutalk.app', 'https://app.edutalk.com'],
  config: {
    screens: {
      HomeTab: {
        screens: {
          HomeScreen: 'home',
          ClassDetails: 'class/:classId',
          LiveStream: 'stream/:streamId',
        },
      },
      BrowseTab: {
        screens: {
          Browse: 'browse',
          Search: 'search',
          ClassDetails: 'class/:classId',
        },
      },
      MyClassesTab: {
        screens: {
          MyClasses: 'my-classes',
          ClassDetails: 'class/:classId',
        },
      },
      ProfileTab: {
        screens: {
          ProfileScreen: 'profile',
          EditProfile: 'profile/edit',
          Settings: 'settings',
          Notifications: 'notifications',
        },
      },
      NotFound: '*',
    },
  },
};

/**
 * Color scheme
 */
export const colors = {
  primary: '#667eea',
  primaryDark: '#5568d3',
  secondary: '#f093fb',
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  background: '#f9fafb',
  surface: '#fff',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  disabled: '#d1d5db',
};

/**
 * Typography
 */
export const typography = {
  h1: {
    fontSize: 28,
    fontWeight: '700',
    lineHeight: 34,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 30,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 26,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
  },
  body1: {
    fontSize: 16,
    fontWeight: '400',
    lineHeight: 22,
  },
  body2: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    lineHeight: 16,
  },
  button: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
};

/**
 * Spacing scale
 */
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  2xl: 32,
};

/**
 * Border radius
 */
export const borderRadius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

/**
 * Shadows
 */
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
};

export default {
  getTabLabel,
  getTabIcon,
  TabBadge,
  tabBarOptions,
  stackScreenOptions,
  navigationLinking,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
};
