/**
 * React Native Navigation Setup
 * Tab navigation with nested stacks for React Native app
 */

import React from 'react';
import { NavigationContainer, LinkingConfiguration } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/RNAuthContext';

// Import screens
import LoginScreen from '../components/rn-LoginScreen';
import HomeScreen from '../components/rn-HomeScreen';
import BrowseClassesScreen from '../components/rn-BrowseClassesScreen';
import ProfileScreen from '../components/rn-ProfileScreen';
import LiveStreamScreen from '../components/rn-LiveStreamScreen';
import SettingsScreen from '../components/rn-SettingsScreen';
import NotificationsScreen from '../components/rn-NotificationsScreen';
import SearchScreen from '../components/rn-SearchScreen';
import MyClassesScreen from '../components/rn-MyClassesScreen';
import VideoPlayerScreen from '../components/rn-VideoPlayerScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/**
 * Auth Stack - Login/Register screens
 */
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: '#fff' },
      }}
    >
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ animationEnabled: false }}
      />
      <Stack.Screen
        name="Register"
        component={RegisterScreen}
        options={{
          title: 'Create Account',
          headerShown: true,
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="ForgotPassword"
        component={ForgotPasswordScreen}
        options={{
          title: 'Reset Password',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Home Stack - Browse classes and view details
 */
const HomeStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          title: 'EduTalk',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
        options={{
          title: 'Class Details',
        }}
      />
      <Stack.Screen
        name="LiveStream"
        component={LiveStreamScreen}
        options={{
          title: 'Live Stream',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Browse Stack - Search and filter classes
 */
const BrowseStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="Browse"
        component={BrowseClassesScreen}
        options={{
          title: 'Browse Classes',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: 'Search',
        }}
      />
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
        options={{
          title: 'Class Details',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * My Classes Stack - View enrolled classes
 */
const MyClassesStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="MyClasses"
        component={MyClassesScreen}
        options={{
          title: 'My Classes',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="ClassDetails"
        component={ClassDetailsScreen}
      />
    </Stack.Navigator>
  );
};

/**
 * Profile Stack - User profile and settings
 */
const ProfileStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen
        name="ProfileScreen"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          title: 'Edit Profile',
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
        }}
      />
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          title: 'Notifications',
        }}
      />
    </Stack.Navigator>
  );
};

/**
 * Placeholder screens (stubs)
 */
const ClassDetailsScreen = ({ route, navigation }) => {
  return null; // Placeholder
};

const EditProfileScreen = ({ route, navigation }) => {
  return null; // Placeholder
};

const RegisterScreen = ({ route, navigation }) => {
  return null; // Placeholder
};

const ForgotPasswordScreen = ({ route, navigation }) => {
  return null; // Placeholder
};

/**
 * Main App Navigator - Authenticated user
 */
const AppNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#667eea',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#f0f0f0',
          borderTopWidth: 1,
          paddingBottom: 5,
        },
        headerShown: false,
        tabBarLabel: getTabLabel(route.name),
        tabBarIcon: getTabIcon(route.name),
      })}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="BrowseTab"
        component={BrowseStack}
        options={{
          title: 'Browse',
        }}
      />
      <Tab.Screen
        name="MyClassesTab"
        component={MyClassesStack}
        options={{
          title: 'My Classes',
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};

/**
 * Root Navigator - Handles auth vs app screens
 */
const RootNavigator = () => {
  const { loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <Stack.Screen
            name="App"
            component={AppNavigator}
            options={{ animationEnabled: false }}
          />
        ) : (
          <Stack.Screen
            name="Auth"
            component={AuthStack}
            options={{ animationEnabled: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Deep Linking Configuration
 */
const linking = {
  prefixes: ['edutalk://', 'https://edutalk.app'],
  config: {
    screens: {
      App: {
        screens: {
          HomeTab: {
            screens: {
              HomeScreen: '/',
              ClassDetails: '/class/:classId',
              LiveStream: '/stream/:streamId',
            },
          },
          BrowseTab: {
            screens: {
              Browse: '/browse',
              Search: '/search/:query',
              ClassDetails: '/class/:classId',
            },
          },
          MyClassesTab: {
            screens: {
              MyClasses: '/my-classes',
              ClassDetails: '/class/:classId',
            },
          },
          ProfileTab: {
            screens: {
              ProfileScreen: '/profile',
              EditProfile: '/profile/edit',
              Settings: '/settings',
            },
          },
        },
      },
      Auth: {
        screens: {
          Login: '/login',
          Register: '/register',
          ForgotPassword: '/forgot-password',
        },
      },
    },
  },
};

/**
 * Helper function to get tab icon
 */
const getTabIcon = (routeName) => {
  switch (routeName) {
    case 'HomeTab':
      return '🏠';
    case 'BrowseTab':
      return '🎓';
    case 'MyClassesTab':
      return '📚';
    case 'ProfileTab':
      return '👤';
    default:
      return '•';
  }
};

/**
 * Helper function to get tab label
 */
const getTabLabel = (routeName) => {
  switch (routeName) {
    case 'HomeTab':
      return 'Home';
    case 'BrowseTab':
      return 'Browse';
    case 'MyClassesTab':
      return 'Classes';
    case 'ProfileTab':
      return 'Profile';
    default:
      return '';
  }
};

export default RootNavigator;
