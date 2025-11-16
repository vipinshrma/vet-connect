import { IconSymbol } from '@/components/ui/IconSymbol';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ExploreScreen() {
  const FeatureCard = ({ 
    title, 
    description, 
    iconName,
    isComingSoon = false 
  }: { 
    title: string; 
    description: string; 
    iconName: 'location.fill' | 'calendar' | 'heart.fill' | 'phone.fill' | 'star.fill' | 'video.fill';
    isComingSoon?: boolean;
  }) => (
    <TouchableOpacity
      className={`bg-white p-6 rounded-xl border border-secondary-100 mb-4 ${
        isComingSoon ? 'opacity-60' : ''
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${title} feature ${isComingSoon ? 'coming soon' : 'available'}`}
      accessibilityHint={isComingSoon ? 'This feature is not yet available' : `Learn more about ${title}`}
      disabled={isComingSoon}
      style={{ minHeight: 44 }}
    >
      <View className="flex-row items-start">
        <View className="bg-primary-50 p-3 rounded-lg mr-4">
          <IconSymbol
            size={24}
            color="#0369a1"
            name={iconName}
          />
        </View>
        <View className="flex-1">
          <View className="flex-row items-center mb-2">
            <Text className="text-lg font-inter-semibold text-secondary-700">
              {title}
            </Text>
            {isComingSoon && (
              <View className="bg-warning px-2 py-1 rounded-full ml-2">
                <Text className="text-xs font-inter-medium text-white">Coming Soon</Text>
              </View>
            )}
          </View>
          <Text className="text-sm font-inter text-secondary-600 leading-5">
            {description}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-secondary-50" edges={['top']}>
      <ScrollView 
        className="flex-1" 
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 32 }}
        accessibilityLabel="VetConnect explore screen"
      >
        {/* Header */}
        <View className="mb-8">
          <Text 
            className="text-2xl font-inter-bold text-primary-700 mb-3"
            accessibilityRole="header"
          >
            Explore VetConnect
          </Text>
          <Text 
            className="text-base font-inter text-secondary-600 leading-6"
          >
            Discover all the features designed to help you find the best veterinary care
          </Text>
        </View>

        {/* Feature Cards */}
        <View 
          accessible={true}
          accessibilityLabel="VetConnect features"
        >
          <FeatureCard
            title="Find Nearby Vets"
            description="Locate veterinarians in your area with real-time availability and ratings"
            iconName="location.fill"
            isComingSoon={true}
          />

          <FeatureCard
            title="Book Appointments"
            description="Schedule appointments with your preferred veterinarian at convenient times"
            iconName="calendar"
            isComingSoon={true}
          />

          <FeatureCard
            title="Pet Health Records"
            description="Keep track of your pet's medical history, vaccinations, and treatments"
            iconName="heart.fill"
            isComingSoon={true}
          />

          <FeatureCard
            title="Emergency Services"
            description="Quick access to emergency veterinary services when you need them most"
            iconName="phone.fill"
            isComingSoon={true}
          />

          <FeatureCard
            title="Vet Reviews & Ratings"
            description="Read reviews from other pet owners to make informed decisions"
            iconName="star.fill"
            isComingSoon={true}
          />

          <FeatureCard
            title="Telemedicine"
            description="Consult with veterinarians remotely for non-emergency concerns"
            iconName="video.fill"
            isComingSoon={true}
          />
        </View>

        {/* Development Status */}
        <View 
          className="bg-primary-50 p-6 rounded-xl mt-6"
          accessible={true}
          accessibilityLabel="Development status information"
        >
          <Text 
            className="text-lg font-inter-semibold text-primary-700 mb-3"
            accessibilityRole="header"
          >
            Development Progress
          </Text>
          <Text 
            className="text-sm font-inter text-primary-600 leading-6"
          >
            We're building VetConnect in phases. Phase 1 focused on project setup and architecture. 
            Next phases will bring authentication, vet discovery, and booking features to life.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
