/**
 * Deep Linking Configuration for React Native
 * Handle navigation from push notifications and URLs
 */

export const linking = {
  prefixes: ['edutalk://', 'https://edutalk.app', 'https://app.edutalk.com'],
  
  config: {
    screens: {
      // Auth screens
      Login: 'login',
      Register: 'register',
      ForgotPassword: 'forgot-password',

      // Main app
      App: {
        screens: {
          // Home tab
          HomeTab: {
            screens: {
              HomeScreen: '',
              ClassDetails: 'class/:classId',
              LiveStream: 'stream/:streamId',
            },
          },

          // Browse tab
          BrowseTab: {
            screens: {
              Browse: 'browse',
              Search: 'search/:query',
              ClassDetails: 'class/:classId',
            },
          },

          // My Classes tab
          MyClassesTab: {
            screens: {
              MyClasses: 'my-classes',
              ClassDetails: 'class/:classId',
            },
          },

          // Profile tab
          ProfileTab: {
            screens: {
              ProfileScreen: 'profile',
              EditProfile: 'profile/edit',
              Settings: 'settings',
              ChangePassword: 'change-password',
              PaymentMethods: 'payment-methods',
              Support: 'support',
            },
          },
        },
      },

      NotFound: '*',
    },
  },

  /**
   * Handle deep links
   */
  async getInitialURL() {
    const url = await getInitialURL();

    if (url != null) {
      return url;
    }

    // Return the initial screen (e.g., 'HomeTab')
    return undefined;
  },

  /**
   * Listen for notifications that open the app
   */
  subscribe(listener) {
    // Listen to incoming links from deep linking
    const onReceiveURL = ({ url }) => {
      const parsedUrl = new URL(url);
      const hostname = parsedUrl.hostname;
      const pathname = parsedUrl.pathname;

      if (hostname === 'edutalk.app' || hostname === 'app.edutalk.com') {
        listener(url);
      }
    };

    // Listen to Firebase notifications
    const unsubscribeFCM = onMessageListener(({ data }) => {
      if (data?.link) {
        listener(data.link);
      }
    });

    // Subscribe to deep link events
    const subscription = Linking.addEventListener('url', onReceiveURL);

    return () => {
      subscription.remove();
      unsubscribeFCM?.();
    };
  },
};

/**
 * Get initial URL for app launch
 */
export const getInitialURL = async () => {
  // First, try to get the URL that opened the app
  try {
    const url = await Linking.getInitialURL();

    if (url != null) {
      return url;
    }
  } catch (error) {
    console.error('Failed to get initial URL:', error);
  }

  return undefined;
};

/**
 * Parse deep link and return navigation action
 */
export const parseDeepLink = (url) => {
  const parsed = new URL(url);
  const pathname = parsed.pathname;
  const params = Object.fromEntries(parsed.searchParams);

  // Parse different URL patterns
  if (pathname === '/class/:classId' || pathname.includes('/class/')) {
    const classId = pathname.split('/class/')[1];
    return {
      name: 'ClassDetails',
      params: { classId },
    };
  }

  if (pathname === '/stream/:streamId' || pathname.includes('/stream/')) {
    const streamId = pathname.split('/stream/')[1];
    return {
      name: 'LiveStream',
      params: { streamId },
    };
  }

  if (pathname.includes('/search/')) {
    const query = pathname.split('/search/')[1];
    return {
      name: 'Search',
      params: { query: decodeURIComponent(query) },
    };
  }

  if (pathname === '/profile') {
    return { name: 'ProfileScreen' };
  }

  if (pathname === '/browse') {
    return { name: 'Browse' };
  }

  return null;
};

/**
 * Generate deep link URL
 */
export const createDeepLink = (screen, params = {}) => {
  const baseUrl = 'https://app.edutalk.com';

  switch (screen) {
    case 'ClassDetails':
      return `${baseUrl}/class/${params.classId}`;
    case 'LiveStream':
      return `${baseUrl}/stream/${params.streamId}`;
    case 'Search':
      return `${baseUrl}/search/${encodeURIComponent(params.query)}`;
    case 'Profile':
      return `${baseUrl}/profile`;
    case 'Browse':
      return `${baseUrl}/browse`;
    default:
      return baseUrl;
  }
};
