# 🚀 VetConnect Build Commands Reference

This file contains all build commands for Android and iOS development and deployment.

---

## 📱 **ANDROID BUILD COMMANDS**

### **Local Development**

#### **Clean Build**
```bash
# Navigate to android directory
cd android

# Clean the build
./gradlew clean

# Or from project root
cd android && ./gradlew clean && cd ..
```

#### **Assemble APK**

**Debug APK:**
```bash
cd android && ./gradlew assembleDebug && cd ..
```
**Output:** `android/app/build/outputs/apk/debug/app-debug.apk`

**Release APK:**
```bash
cd android && ./gradlew assembleRelease && cd ..
```
**Output:** `android/app/build/outputs/apk/release/app-release.apk`

**Clean and Assemble:**
```bash
cd android && ./gradlew clean assembleDebug && cd ..
cd android && ./gradlew clean assembleRelease && cd ..
```

#### **Build AAB (Android App Bundle) for Play Store**

**Debug AAB:**
```bash
cd android && ./gradlew bundleDebug && cd ..
```

**Release AAB:**
```bash
cd android && ./gradlew bundleRelease && cd ..
```
**Output:** `android/app/build/outputs/bundle/release/app-release.aab`

**Clean and Bundle:**
```bash
cd android && ./gradlew clean bundleRelease && cd ..
```

#### **Install APK to Connected Device**
```bash
cd android && ./gradlew installDebug && cd ..
cd android && ./gradlew installRelease && cd ..
```

#### **Run on Android Device/Emulator (Expo)**
```bash
# Start Expo and run on Android
npm start
# Then press 'a' for Android

# Or directly run Android
npm run android

# Or using Expo CLI
npx expo run:android
```

#### **Generate Signed Release APK**
```bash
cd android && ./gradlew assembleRelease && cd ..
```
*Note: Requires signing configuration in `android/app/build.gradle`*

---

### **EAS Build (Expo Application Services)**

#### **Build for Android**

**Development Build:**
```bash
eas build --platform android --profile development
```

**Preview Build (APK):**
```bash
eas build --platform android --profile preview
```

**Production Build (AAB for Play Store):**
```bash
eas build --platform android --profile production
```

**Build with specific profile:**
```bash
eas build --platform android --profile <profile-name>
```

#### **Build Commands with Options**

**Build for specific Android build variant:**
```bash
eas build --platform android --profile production --local
```

**Build and submit to Play Store:**
```bash
eas build --platform android --profile production --auto-submit
```

**View build status:**
```bash
eas build:list --platform android
```

**Download build:**
```bash
eas build:download
```

**Cancel build:**
```bash
eas build:cancel
```

---

## 🍎 **iOS BUILD COMMANDS**

### **Local Development**

#### **Clean Build**
```bash
# Navigate to ios directory
cd ios

# Clean derived data and build folder
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean Pods (if using CocoaPods)
cd ios && pod deintegrate && pod install && cd ..

# Or using Xcode
# Product > Clean Build Folder (Shift + Cmd + K)
```

#### **Install Pods**
```bash
cd ios && pod install && cd ..

# Update pods to latest versions
cd ios && pod update && cd ..

# Install specific pod
cd ios && pod install --repo-update && cd ..
```

#### **Build iOS App (Xcode)**
```bash
# Open Xcode project
open ios/VetConnect.xcworkspace

# Or using xcodebuild command line
cd ios
xcodebuild -workspace VetConnect.xcworkspace \
  -scheme VetConnect \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build
```

#### **Build for Simulator**
```bash
cd ios
xcodebuild -workspace VetConnect.xcworkspace \
  -scheme VetConnect \
  -configuration Debug \
  -sdk iphonesimulator \
  -derivedDataPath build \
  BUILD_DIR=build
```

#### **Build for Device**
```bash
cd ios
xcodebuild -workspace VetConnect.xcworkspace \
  -scheme VetConnect \
  -configuration Release \
  -sdk iphoneos \
  -derivedDataPath build
```

#### **Archive for App Store**
```bash
cd ios
xcodebuild -workspace VetConnect.xcworkspace \
  -scheme VetConnect \
  -configuration Release \
  -archivePath build/VetConnect.xcarchive \
  archive
```

#### **Export IPA**
```bash
# Use Xcode Organizer (Window > Organizer) or:
cd ios
xcodebuild -exportArchive \
  -archivePath build/VetConnect.xcarchive \
  -exportPath build/ipa \
  -exportOptionsPlist ExportOptions.plist
```

#### **Run on iOS Simulator/Device (Expo)**
```bash
# Start Expo and run on iOS
npm start
# Then press 'i' for iOS

# Or directly run iOS
npm run ios

# Run on specific simulator
npx expo run:ios --simulator="iPhone 15 Pro"

# Run on connected device
npx expo run:ios --device
```

---

### **EAS Build (Expo Application Services)**

#### **Build for iOS**

**Development Build:**
```bash
eas build --platform ios --profile development
```

**Preview Build (Ad Hoc):**
```bash
eas build --platform ios --profile preview
```

**Production Build (App Store):**
```bash
eas build --platform ios --profile production
```

**Build with specific profile:**
```bash
eas build --platform ios --profile <profile-name>
```

#### **Build Commands with Options**

**Build for iOS locally:**
```bash
eas build --platform ios --profile production --local
```
*Note: Requires macOS and Xcode*

**Build and submit to App Store:**
```bash
eas build --platform ios --profile production --auto-submit
```

**View build status:**
```bash
eas build:list --platform ios
```

**Download build:**
```bash
eas build:download
```

**Cancel build:**
```bash
eas build:cancel
```

---

## 🔄 **UNIVERSAL COMMANDS (Both Platforms)**

### **Clean Everything**
```bash
# Clean Android
cd android && ./gradlew clean && cd ..

# Clean iOS
cd ios && rm -rf build && cd ..
rm -rf ~/Library/Developer/Xcode/DerivedData

# Clean Expo cache
npx expo start --clear

# Clean node modules (if needed)
rm -rf node_modules
npm install
# or
yarn install
```

### **EAS Build for Both Platforms**

**Build for both Android and iOS:**
```bash
eas build --platform all --profile production
```

**Build for both (preview):**
```bash
eas build --platform all --profile preview
```

### **Expo Commands**

**Start development server:**
```bash
npm start
# or
npx expo start
```

**Start with cleared cache:**
```bash
npx expo start --clear
```

**Start in production mode:**
```bash
npx expo start --no-dev --minify
```

### **Update and Sync**

**Update Expo SDK:**
```bash
npx expo install --fix
```

**Sync native code:**
```bash
npx expo prebuild --clean
```

**Regenerate native projects:**
```bash
npx expo prebuild
```

---

## 📦 **USEFUL NPM SCRIPTS**

From `package.json`:
```bash
# Start Expo development server
npm start

# Run on Android
npm run android

# Run on iOS
npm run ios

# Run on Web
npm run web

# Lint code
npm run lint
```

---

## 🔐 **SIGNING & DEPLOYMENT**

### **Android Signing**

**Generate keystore:**
```bash
cd android/app
keytool -genkeypair -v -storetype PKCS12 \
  -keystore release.keystore \
  -alias release-key \
  -keyalg RSA -keysize 2048 -validity 10000
```

**View keystore info:**
```bash
keytool -list -v -keystore android/app/release.keystore
```

### **iOS Signing**

**View provisioning profiles:**
```bash
open ~/Library/MobileDevice/Provisioning\ Profiles/
```

**Check certificates:**
```bash
security find-identity -v -p codesigning
```

---

## 🐛 **DEBUGGING COMMANDS**

### **Android Logs**
```bash
# View all logs
adb logcat

# View React Native logs
adb logcat *:S ReactNative:V ReactNativeJS:V

# View specific app logs
adb logcat | grep VetConnect

# Clear logs
adb logcat -c
```

### **iOS Logs**
```bash
# View device logs in Xcode
# Window > Devices and Simulators > Select Device > View Device Logs

# Or using Console.app
# Applications > Utilities > Console
```

### **Metro Bundler Logs**
```bash
# Start with verbose logging
npm start -- --verbose
```

---

## 📝 **NOTES**

- **Local builds require:**
  - Android: Android Studio, JDK, Android SDK
  - iOS: macOS, Xcode, CocoaPods

- **EAS builds:**
  - Android: Builds in cloud (Linux)
  - iOS: Builds in cloud (macOS) or locally on macOS

- **Development builds** include Expo Dev Client
- **Production builds** are standalone apps without Expo Go

---

## 🔗 **Quick Reference Links**

- [Expo EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Gradle Plugin](https://developer.android.com/studio/build)
- [Xcode Build System](https://developer.apple.com/xcode/)
- [React Native Build Documentation](https://reactnative.dev/docs/signed-apk-android)

---

*Last Updated: January 2025*

