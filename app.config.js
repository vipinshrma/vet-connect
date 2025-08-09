// Dynamic Expo config to load environment variables for runtime usage
// Use .env with EXPO_PUBLIC_* vars or regular vars accessed via process.env here

module.exports = ({ config }) => ({
  ...config,
  expo: {
    ...(config.expo || {}),
    name: 'VetConnect',
    slug: 'VetConnect',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'vetconnect',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.VetConnect',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
      edgeToEdgeEnabled: true,
      usesCleartextTraffic: true,
      networkSecurityConfig: './network_security_config.xml',
      permissions: [
        'android.permission.ACCESS_COARSE_LOCATION',
        'android.permission.ACCESS_FINE_LOCATION',
      ],
      package: 'com.anonymous.VetConnect',
    },
    web: {
      bundler: 'metro',
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins: [
      'expo-router',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash-icon.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#ffffff',
        },
      ],
      [
        'expo-location',
        {
          locationAlwaysAndWhenInUsePermission:
            'VetConnect needs access to your location to find nearby veterinarians and show your position on the map.',
        },
      ],
      './plugins/android-manifest.js',
    ],
    experiments: {
      typedRoutes: true,
    },
    // Expose environment values to the app at runtime
    extra: {
      SUPABASE_URL: process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY:
        process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_STORAGE_BUCKET:
        process.env.SUPABASE_STORAGE_BUCKET || process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET || 'vet-connect-media',
    },
  },
});

