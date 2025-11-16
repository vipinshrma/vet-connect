module.exports = {
  dependencies: {
    // Exclude react-native-worklets from Android autolinking
    // We only need it for the Babel plugin, not the native module
    // react-native-reanimated already provides the native worklets functionality
    'react-native-worklets': {
      platforms: {
        android: null, // Exclude from Android autolinking completely
      },
    },
  },
};

