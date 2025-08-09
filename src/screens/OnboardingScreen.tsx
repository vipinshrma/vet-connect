import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image,
  Dimensions,
  ScrollView 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types';
import { AppDispatch } from '../store';
import { completeOnboarding } from '../store/slices/authSlice';

type OnboardingNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;

const { width } = Dimensions.get('window');

interface OnboardingSlide {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
}

const onboardingData: OnboardingSlide[] = [
  {
    id: 1,
    title: 'Find Trusted Vets',
    subtitle: 'Near You',
    description: 'Discover qualified veterinarians in your area with ratings and reviews from other pet owners.',
    icon: '🏥',
  },
  {
    id: 2,
    title: 'Book Appointments',
    subtitle: 'Instantly',
    description: 'Schedule appointments with your preferred veterinarians at times that work for you.',
    icon: '📅',
  },
  {
    id: 3,
    title: 'Manage Pet Profiles',
    subtitle: 'All in One Place',
    description: 'Keep track of all your pets\' health records, vaccinations, and appointment history.',
    icon: '🐕',
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<OnboardingNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < onboardingData.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      handleCompleteOnboarding();
    }
  };

  const skipOnboarding = () => {
    handleCompleteOnboarding();
  };

  const handleCompleteOnboarding = () => {
    dispatch(completeOnboarding());
    navigation.navigate('Auth');
  };

  const renderSlide = (slide: OnboardingSlide) => (
    <View key={slide.id} className="flex-1 justify-center items-center px-8" style={{ width }}>
      {/* Icon */}
      <View className="mb-8">
        <Text className="text-8xl text-center">{slide.icon}</Text>
      </View>

      {/* Title */}
      <Text className="text-3xl font-bold text-gray-900 text-center mb-2">
        {slide.title}
      </Text>
      <Text className="text-3xl font-bold text-blue-600 text-center mb-6">
        {slide.subtitle}
      </Text>

      {/* Description */}
      <Text className="text-gray-600 text-center text-lg leading-6 px-4">
        {slide.description}
      </Text>
    </View>
  );

  const renderPagination = () => (
    <View className="flex-row justify-center items-center mb-8">
      {onboardingData.map((_, index) => (
        <View
          key={index}
          className={`w-3 h-3 rounded-full mx-1 ${
            index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        />
      ))}
    </View>
  );

  return (
    <View className="flex-1 bg-white">
      {/* Skip Button */}
      <View className="absolute top-12 right-6 z-10">
        <TouchableOpacity onPress={skipOnboarding}>
          <Text className="text-gray-500 font-medium">Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
          setCurrentSlide(slideIndex);
        }}
        contentOffset={{ x: currentSlide * width, y: 0 }}
      >
        {onboardingData.map(renderSlide)}
      </ScrollView>

      {/* Bottom Section */}
      <View className="pb-12 px-8">
        {/* Pagination */}
        {renderPagination()}

        {/* Action Buttons */}
        <View>
          <TouchableOpacity
            className="bg-primary-500 rounded-xl py-4 items-center w-full"
            onPress={nextSlide}
            style={{ minHeight: 56 }}
          >
            <Text className="text-white font-inter-semibold text-lg">
              {currentSlide === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>

          {currentSlide === onboardingData.length - 1 && (
            <TouchableOpacity
              className="border-2 border-primary-600 bg-white rounded-xl py-4 items-center w-full mt-4"
              onPress={handleCompleteOnboarding}
              style={{ minHeight: 56 }}
            >
              <Text className="text-primary-600 font-inter-semibold text-lg">
                I Already Have an Account
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default OnboardingScreen;