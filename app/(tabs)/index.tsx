import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        accessibilityLabel="VetConnect home screen"
      >
        {/* Header Section */}
        <View className="mb-8">
          <Text 
            className="text-2xl font-inter-bold text-primary-700 mb-3"
            accessibilityRole="header"
            accessibilityLevel={1}
          >
            Welcome to VetConnect
          </Text>
          <Text 
            className="text-base font-inter text-secondary-600 leading-6"
            accessibilityRole="text"
          >
            Find the perfect veterinarian for your pet
          </Text>
        </View>
        
        {/* Phase 1 Complete Card */}
        <View 
          className="bg-primary-50 p-6 rounded-xl mb-6"
          accessibilityRole="region"
          accessibilityLabel="Project progress update"
        >
          <Text 
            className="text-lg font-inter-semibold text-primary-700 mb-4"
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Phase 1 Complete
          </Text>
          <View className="space-y-3">
            <Text 
              className="text-sm font-inter text-primary-600 leading-5"
              accessibilityRole="text"
            >
              • Project setup with TypeScript
            </Text>
            <Text 
              className="text-sm font-inter text-primary-600 leading-5"
              accessibilityRole="text"
            >
              • Redux Toolkit state management
            </Text>
            <Text 
              className="text-sm font-inter text-primary-600 leading-5"
              accessibilityRole="text"
            >
              • NativeWind styling configured
            </Text>
            <Text 
              className="text-sm font-inter text-primary-600 leading-5"
              accessibilityRole="text"
            >
              • Firebase services structure
            </Text>
            <Text 
              className="text-sm font-inter text-primary-600 leading-5"
              accessibilityRole="text"
            >
              • Location services setup
            </Text>
          </View>
        </View>

        {/* Next Phase Card */}
        <View 
          className="bg-secondary-50 p-6 rounded-xl"
          accessibilityRole="region"
          accessibilityLabel="Next development phase information"
        >
          <Text 
            className="text-lg font-inter-semibold text-secondary-700 mb-3"
            accessibilityRole="header"
            accessibilityLevel={2}
          >
            Next Phase: Authentication System
          </Text>
          <Text 
            className="text-sm font-inter text-secondary-600 leading-6"
            accessibilityRole="text"
          >
            We'll implement login, registration, and user management with Firebase Auth.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
