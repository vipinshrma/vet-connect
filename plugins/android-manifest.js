const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withCustomAndroidManifest(config) {
  // First, copy the network security config file to the Android resources
  config = withDangerousMod(config, [
    'android',
    async (config) => {
      const projectRoot = config.modRequest.platformProjectRoot;
      const xmlDir = path.join(projectRoot, 'app', 'src', 'main', 'res', 'xml');
      const xmlFile = path.join(xmlDir, 'network_security_config.xml');
      const sourceFile = path.join(config.modRequest.projectRoot, 'network_security_config.xml');

      // Create xml directory if it doesn't exist
      if (!fs.existsSync(xmlDir)) {
        fs.mkdirSync(xmlDir, { recursive: true });
      }

      // Copy the network security config file if source exists
      if (fs.existsSync(sourceFile)) {
        fs.copyFileSync(sourceFile, xmlFile);
        console.log('✅ Copied network_security_config.xml to Android resources');
      } else {
        // Create a default network security config if source doesn't exist
        const defaultConfig = `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
        <domain includeSubdomains="true">10.0.3.2</domain>
        <domain includeSubdomains="true">supabase.co</domain>
    </domain-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system"/>
            <certificates src="user"/>
        </trust-anchors>
    </base-config>
</network-security-config>`;
        fs.writeFileSync(xmlFile, defaultConfig);
        console.log('✅ Created default network_security_config.xml in Android resources');
      }

      return config;
    },
  ]);

  // Then, update the AndroidManifest.xml
  config = withAndroidManifest(config, async (config) => {
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

  return config;
};