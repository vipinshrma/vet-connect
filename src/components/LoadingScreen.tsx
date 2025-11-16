import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const LoadingScreen: React.FC = () => {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top', 'bottom']}>
      <View className="flex-1 justify-center items-center px-6">
        {/* Logo/Icon */}
        <View className="mb-8">
          <Text className="text-6xl text-center">🏥</Text>
        </View>
        
        {/* App Name */}
        <Text 
          className="text-2xl font-inter-bold text-primary-700 text-center mb-3"
          accessibilityRole="header"
        >
          VetConnect
        </Text>
        
        {/* Tagline */}
        <Text 
          className="text-base font-inter text-secondary-600 text-center mb-8 leading-6"
        >
          Connecting pets with caring professionals
        </Text>
        
        {/* Loading Indicator */}
        <ActivityIndicator 
          size="large" 
          color="#3b82f6" 
          accessibilityLabel="Loading"
          accessibilityRole="progressbar"
        />
        
        {/* Loading Text */}
        <Text 
          className="text-sm font-inter text-secondary-500 text-center mt-4"
        >
          Loading...
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoadingScreen;