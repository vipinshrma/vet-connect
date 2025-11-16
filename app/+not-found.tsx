import { IconSymbol } from '@/components/ui/IconSymbol';
import { Link, Stack } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Page Not Found' }} />
      <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
        <View 
          className="flex-1 items-center justify-center px-6"
          accessible={true}
          accessibilityLabel="Page not found screen"
        >
          {/* Error Icon */}
          <View className="bg-error/10 p-6 rounded-full mb-6">
            <IconSymbol
              size={48}
              color="#ef4444"
              name="exclamationmark.triangle"
            />
          </View>

          {/* Error Message */}
          <Text 
            className="text-2xl font-inter-bold text-secondary-700 text-center mb-3"
            accessibilityRole="header"
          >
            Page Not Found
          </Text>
          
          <Text 
            className="text-base font-inter text-secondary-600 text-center leading-6 mb-8"
          >
            Sorry, the page you're looking for doesn't exist or has been moved.
          </Text>

          {/* Home Button */}
          <Link href="/" asChild>
            <TouchableOpacity
              className="bg-primary-500 px-8 py-4 rounded-xl"
              accessibilityRole="button"
              accessibilityLabel="Go to home screen"
              accessibilityHint="Returns you to the main screen"
              style={{ minHeight: 44, minWidth: 200 }}
            >
              <Text className="text-white font-inter-semibold text-base text-center">
                Go to Home
              </Text>
            </TouchableOpacity>
          </Link>

          {/* Alternative Navigation */}
          <View className="mt-6">
            <Text 
              className="text-sm font-inter text-secondary-500 text-center"
            >
              Or explore other sections of VetConnect
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </>
  );
}
