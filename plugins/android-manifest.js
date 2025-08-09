const { withAndroidManifest } = require('@expo/config-plugins');

module.exports = function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;

    // Find the application element
    const application = androidManifest.manifest.application[0];

    // Add usesCleartextTraffic attribute if it doesn't exist
    if (!application.$['android:usesCleartextTraffic']) {
      application.$['android:usesCleartextTraffic'] = 'true';
    }

    // Add networkSecurityConfig if it doesn't exist
    if (!application.$['android:networkSecurityConfig']) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }

    return config;
  });
};